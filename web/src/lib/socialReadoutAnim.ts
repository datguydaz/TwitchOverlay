/**
 * Queued LATEST FOLLOW / LATEST SUB smoked-glass events.
 * Smoke: acquire/surge → human type-in (optional operator typo) → NEW → settle.
 * Demo previews never overwrite stored names.
 */

import type { OperatorTypoSettings, SubTypoStyle } from "../../../shared/settings.ts";
import { DEFAULT_OPERATOR_TYPOS } from "../../../shared/settings.ts";
import {
  makeRagePlan,
  makeWrongName,
  nameTooLongForTypo,
} from "./operatorTypos.ts";

export type SocialKind = "follow" | "sub";

export type TypeCharOpts = { hard?: boolean };

export type SocialReadoutAnimHooks = {
  /** Fired once when a follow/sub anim actually starts (type-in/NEW path). */
  onEventStart?: (kind: SocialKind) => void;
  /** Each character during smoke type-in (for typewriter SFX). */
  onTypeChar?: (kind: SocialKind, char: string, opts?: TypeCharOpts) => void;
  /** Soft backspace click during typo correction. */
  onBackspace?: (kind: SocialKind, opts?: { fast?: boolean }) => void;
  /** After correct type-in finishes (carriage-return / bell). */
  onTypeDone?: (kind: SocialKind) => void;
};

type Job = {
  kind: SocialKind;
  name: string;
  /** If set, restore this name after demo settle (demo does not persist). */
  restoreTo?: string;
  /** Labeled demos force a typo when typos are enabled (so demos show the gag). */
  forceTypo?: boolean;
  /** Sub demos force rage when typos enabled. */
  forceRage?: boolean;
};

const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&*";
/** Whole smoke event soft cap (intro + type + NEW + settle). Rage needs ~6.5s. */
const TOTAL_CAP_MS = 6500;

function scrambleChar(): string {
  return SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)] || "#";
}

function randMs(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export class SocialReadoutAnim {
  private stage: HTMLElement;
  private queue: Job[] = [];
  private busy = false;
  private reduced = false;
  private osReduce =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  private timers: number[] = [];
  private hooks: SocialReadoutAnimHooks;
  private emberTimer: number | null = null;
  private typoCfg: OperatorTypoSettings = { ...DEFAULT_OPERATOR_TYPOS };
  /** URL `?typos=0|1` override — null = use settings. */
  private urlTypos: boolean | null = null;

  constructor(
    stage: HTMLElement,
    reducedMotion = false,
    hooks: SocialReadoutAnimHooks = {},
  ) {
    this.stage = stage;
    this.hooks = hooks;
    this.setReducedMotion(reducedMotion);
    document.addEventListener("visibilitychange", this.onVis);
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on || this.osReduce;
  }

  setTypoConfig(cfg: OperatorTypoSettings): void {
    const styleRaw = String(cfg.subStyle || "mixed").toLowerCase();
    const subStyle: SubTypoStyle =
      styleRaw === "rage" || styleRaw === "normal" ? styleRaw : "mixed";
    this.typoCfg = {
      enabled: cfg.enabled !== false,
      chance: Math.max(0, Math.min(1, Number(cfg.chance) || 0)),
      subStyle,
    };
  }

  applyUrlParams(params: URLSearchParams): void {
    const raw = (params.get("typos") || "").trim().toLowerCase();
    if (raw === "0" || raw === "off" || raw === "false" || raw === "no") {
      this.urlTypos = false;
    } else if (raw === "1" || raw === "on" || raw === "true" || raw === "yes") {
      this.urlTypos = true;
    }
  }

  typosEnabled(): boolean {
    if (this.urlTypos != null) return this.urlTypos;
    return this.typoCfg.enabled !== false;
  }

  /** Real stored-name change — queues event animation. */
  enqueue(kind: SocialKind, name: string): void {
    const n = (name || "").trim();
    if (!n) return;
    this.queue.push({ kind, name: n });
    void this.kick();
  }

  /**
   * Labeled dashboard demo — shows a sample name with full anim, then restores
   * the previous stored name without writing settings.
   */
  demo(kind: SocialKind, sampleName: string): void {
    const el = this.root(kind);
    const nameEl = this.nameEl(kind);
    if (!el || !nameEl) return;
    const restoreTo = nameEl.textContent || "";
    const typosOn = this.typosEnabled();
    this.queue.push({
      kind,
      name: sampleName,
      restoreTo,
      forceTypo: typosOn,
      // ?demo=sub always shows rage when typos are on
      forceRage: typosOn && kind === "sub",
    });
    void this.kick();
  }

  dispose(): void {
    document.removeEventListener("visibilitychange", this.onVis);
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    this.queue = [];
    if (this.emberTimer != null) window.clearTimeout(this.emberTimer);
    this.clearStageSurge();
  }

  private onVis = (): void => {
    if (document.hidden) return;
  };

  private isSmoke(): boolean {
    return this.stage.dataset.variant === "smoke-flare";
  }

  private root(kind: SocialKind): HTMLElement | null {
    return this.stage.querySelector<HTMLElement>(
      kind === "follow" ? "#uw-follower" : "#uw-subscriber",
    );
  }

  private nameEl(kind: SocialKind): HTMLElement | null {
    return this.stage.querySelector<HTMLElement>(
      kind === "follow" ? "#uw-follower-name" : "#uw-subscriber-name",
    );
  }

  private ghostEl(kind: SocialKind): HTMLElement | null {
    return this.root(kind)?.querySelector<HTMLElement>(".smk-type-ghost") ?? null;
  }

  private newBadge(kind: SocialKind): HTMLElement | null {
    return this.root(kind)?.querySelector<HTMLElement>(".smk-new") ?? null;
  }

  private setStageSurge(on: boolean): void {
    if (on) this.stage.dataset.barSurge = "1";
    else delete this.stage.dataset.barSurge;
  }

  private clearStageSurge(): void {
    delete this.stage.dataset.barSurge;
    delete this.stage.dataset.helmFlash;
  }

  private async kick(): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    while (this.queue.length) {
      if (document.hidden) {
        await this.wait(400);
        continue;
      }
      const job = this.queue.shift()!;
      await this.play(job);
    }
    this.busy = false;
  }

  private play(job: Job): Promise<void> {
    const el = this.root(job.kind);
    const nameEl = this.nameEl(job.kind);
    if (!el || !nameEl) return Promise.resolve();

    this.hooks.onEventStart?.(job.kind);

    if (this.reduced) {
      nameEl.textContent = job.name;
      this.hooks.onTypeDone?.(job.kind);
      if (job.restoreTo !== undefined) {
        return this.wait(400).then(() => {
          nameEl.textContent = job.restoreTo || "";
        });
      }
      return Promise.resolve();
    }

    if (this.isSmoke()) return this.playSmoke(job, el, nameEl);
    return this.playDefault(job, el, nameEl);
  }

  private playDefault(job: Job, el: HTMLElement, nameEl: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      el.dataset.socialFx = "ind";
      nameEl.style.opacity = "0";

      this.timers.push(
        window.setTimeout(() => {
          el.dataset.socialFx = "sweep";
        }, 180),
      );

      this.timers.push(
        window.setTimeout(() => {
          nameEl.textContent = job.name;
          el.dataset.socialFx = "reveal";
          nameEl.style.opacity = "";
          this.hooks.onTypeDone?.(job.kind);
        }, 520),
      );

      this.timers.push(
        window.setTimeout(() => {
          el.dataset.socialFx = "settle";
        }, 780),
      );

      this.timers.push(
        window.setTimeout(() => {
          delete el.dataset.socialFx;
          if (job.restoreTo !== undefined) {
            nameEl.textContent = job.restoreTo;
          }
          resolve();
        }, 780 + 2600),
      );
    });
  }

  private shouldTypo(job: Job): boolean {
    if (!this.typosEnabled()) return false;
    if (nameTooLongForTypo(job.name)) return false;
    if (job.forceTypo) return true;
    return Math.random() < this.typoCfg.chance;
  }

  /** Human key delay: 110–170ms + hesitation near the end. */
  private charDelay(i: number, len: number, isSub: boolean): number {
    let ms = randMs(110, 170);
    if (i >= len - 2 && len >= 4) ms += randMs(70, 140);
    if (isSub) ms += randMs(8, 24);
    return ms;
  }

  private backspaceDelay(isSub: boolean): number {
    return isSub ? randMs(70, 110) : randMs(55, 95);
  }

  /** Prefer rage for sub when style says so (~60% in mixed). */
  private wantSubRage(job: Job): boolean {
    if (job.kind !== "sub") return false;
    if (job.forceRage) return true;
    const style = this.typoCfg.subStyle || "mixed";
    if (style === "rage") return true;
    if (style === "normal") return false;
    return Math.random() < 0.6;
  }

  /**
   * Smoke type-in:
   * Follow — acquire → tune → type (± typo) → NEW → settle.
   * Sub — surge+CRT → type (± normal typo or rage smash) → stamp/NEW → settle.
   */
  private async playSmoke(job: Job, el: HTMLElement, nameEl: HTMLElement): Promise<void> {
    const t0 = performance.now();
    const badge = this.newBadge(job.kind);
    const ghost = this.ghostEl(job.kind);
    const isSub = job.kind === "sub";
    let newMs = isSub ? 640 : 320;
    let settleMs = isSub ? 520 : 360;

    nameEl.textContent = "";
    nameEl.style.opacity = "";
    nameEl.style.fontSize = "";
    if (ghost) {
      ghost.textContent = "";
      ghost.classList.remove("on");
    }

    if (isSub) {
      this.setStageSurge(true);
      this.stage.dataset.helmFlash = "1";
      el.dataset.socialFx = "surge";
      await this.wait(260);
      el.dataset.socialFx = "crt";
      await this.wait(140);
      delete this.stage.dataset.helmFlash;
    } else {
      el.dataset.socialFx = "acquire";
      await this.wait(220);
      el.dataset.socialFx = "tune";
      await this.wait(140);
    }

    el.dataset.socialFx = "type";

    const doTypo = this.shouldTypo(job);
    let didTypo = false;

    if (doTypo && isSub && this.wantSubRage(job)) {
      const rage = makeRagePlan(job.name);
      if (rage) {
        didTypo = true;
        await this.playRage(job.kind, el, nameEl, ghost, rage.prefix, rage.smash);
      }
    }

    if (doTypo && !didTypo) {
      const plan = makeWrongName(job.name, { dramatic: isSub });
      if (plan) {
        didTypo = true;
        await this.typeString(job.kind, el, nameEl, ghost, plan.wrong, {
          decrypt: isSub,
        });

        el.dataset.typo = "hesitate";
        if (isSub && Math.random() < 0.65) {
          const base = nameEl.textContent || "";
          nameEl.textContent = `${base}...`;
          await this.wait(randMs(280, 420));
          nameEl.textContent = base;
          await this.wait(randMs(220, 380));
        } else {
          await this.wait(isSub ? randMs(520, 780) : randMs(400, 700));
        }
        delete el.dataset.typo;

        await this.backspaceAll(job.kind, el, nameEl, ghost, isSub, false);
        await this.wait(randMs(80, 160));
      }
    }

    // Correct name — carefully after rage; bell only after this
    await this.typeString(job.kind, el, nameEl, ghost, job.name, {
      decrypt: isSub && !didTypo,
      careful: didTypo && isSub,
    });

    this.hooks.onTypeDone?.(job.kind);
    this.fitName(nameEl);
    if (ghost) {
      ghost.textContent = job.name;
      ghost.classList.add("on");
    }

    const used = performance.now() - t0;
    const remain = TOTAL_CAP_MS - used;
    if (remain < newMs + settleMs) {
      const scale = Math.max(0.3, remain / Math.max(1, newMs + settleMs));
      newMs = Math.floor(newMs * scale);
      settleMs = Math.floor(settleMs * scale);
    }

    el.dataset.socialFx = "new";
    badge?.classList.add("on");
    if (isSub) {
      el.dataset.typeMark = "1";
      el.classList.add("smk-stamp-slam");
    }
    await this.wait(Math.max(160, newMs));
    el.classList.remove("smk-stamp-slam", "smk-spark-tick");

    el.dataset.socialFx = "settle";
    await this.wait(Math.max(140, settleMs));

    delete el.dataset.socialFx;
    delete el.dataset.typo;
    delete el.dataset.rageBurst;
    badge?.classList.remove("on");
    if (ghost) {
      ghost.classList.remove("on");
      ghost.textContent = "";
    }
    this.setStageSurge(false);
    delete this.stage.dataset.helmFlash;

    if (isSub) {
      el.dataset.ember = "1";
      if (this.emberTimer != null) window.clearTimeout(this.emberTimer);
      this.emberTimer = window.setTimeout(() => {
        delete el.dataset.ember;
        this.emberTimer = null;
      }, 10_000);
    } else {
      delete el.dataset.typeMark;
      delete el.dataset.ember;
    }

    if (job.restoreTo !== undefined) {
      nameEl.textContent = job.restoreTo;
      if (isSub) {
        delete el.dataset.typeMark;
        delete el.dataset.ember;
      }
    }
    this.fitName(nameEl);
  }

  /** Sub rage: prefix → frantic smash → stop → fast wipe → composed pause. */
  private async playRage(
    kind: SocialKind,
    el: HTMLElement,
    nameEl: HTMLElement,
    ghost: HTMLElement | null,
    prefix: string,
    smash: string,
  ): Promise<void> {
    el.dataset.typo = "rage";
    // Prefix carefully (correct letters)
    await this.typeString(kind, el, nameEl, ghost, prefix, {
      decrypt: false,
      careful: true,
    });

    // Frantic keysmash — hard clacks + escalating shake
    const chars = [...smash];
    let built = nameEl.textContent || "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      built += ch;
      nameEl.textContent = built;
      this.hooks.onTypeChar?.(kind, ch, { hard: true });
      const burst = 1 + Math.min(3, Math.floor(i / 4));
      el.dataset.rageBurst = String(burst);
      el.classList.remove("smk-spark-tick");
      void el.offsetWidth;
      el.classList.add("smk-spark-tick");
      await this.wait(randMs(35, 60));
    }

    // Dead stop — cursor blinks
    el.dataset.typo = "rage-stop";
    delete el.dataset.rageBurst;
    await this.wait(randMs(600, 900));

    // Fast accelerating backspace wipe
    el.dataset.typo = "rage-wipe";
    await this.backspaceAll(kind, el, nameEl, ghost, true, true);
    delete el.dataset.typo;

    // Composed pause before careful retype
    el.dataset.typo = "hesitate";
    await this.wait(randMs(220, 380));
    delete el.dataset.typo;
  }

  private async typeString(
    kind: SocialKind,
    el: HTMLElement,
    nameEl: HTMLElement,
    ghost: HTMLElement | null,
    text: string,
    opts: { decrypt?: boolean; careful?: boolean; hard?: boolean },
  ): Promise<void> {
    const isSub = kind === "sub";
    const chars = [...text];
    let built = nameEl.textContent || "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      if (opts.decrypt) {
        for (let s = 0; s < 2; s++) {
          nameEl.textContent = built + scrambleChar();
          await this.wait(14 + Math.floor(Math.random() * 10));
        }
      }
      if (ghost && built) {
        ghost.textContent = built;
        ghost.classList.remove("on");
        void ghost.offsetWidth;
        ghost.classList.add("on");
      }
      built += ch;
      nameEl.textContent = built;
      this.hooks.onTypeChar?.(kind, ch, { hard: !!opts.hard });
      el.classList.remove("smk-spark-tick");
      void el.offsetWidth;
      el.classList.add("smk-spark-tick");
      if (opts.careful) {
        let ms = randMs(130, 190);
        if (i >= chars.length - 2 && chars.length >= 3) ms += randMs(90, 160);
        await this.wait(ms);
      } else if (opts.hard) {
        await this.wait(randMs(35, 60));
      } else {
        await this.wait(this.charDelay(i, chars.length, isSub));
      }
    }
  }

  private async backspaceAll(
    kind: SocialKind,
    el: HTMLElement,
    nameEl: HTMLElement,
    ghost: HTMLElement | null,
    isSub: boolean,
    accelerating: boolean,
  ): Promise<void> {
    let built = nameEl.textContent || "";
    let step = 0;
    const total = built.length;
    while (built.length) {
      built = built.slice(0, -1);
      nameEl.textContent = built;
      if (ghost) {
        ghost.textContent = built;
        if (!built) ghost.classList.remove("on");
      }
      this.hooks.onBackspace?.(kind, { fast: accelerating });
      el.classList.remove("smk-spark-tick");
      void el.offsetWidth;
      el.classList.add("smk-spark-tick");
      if (accelerating) {
        // Start ~55ms, ramp down to ~12ms
        const t = total <= 1 ? 1 : step / (total - 1);
        const ms = Math.max(12, Math.round(55 - t * 43));
        await this.wait(ms);
      } else {
        await this.wait(this.backspaceDelay(isSub));
      }
      step += 1;
    }
    nameEl.textContent = "";
    if (ghost) {
      ghost.textContent = "";
      ghost.classList.remove("on");
    }
  }

  /** Shrink long handles to the radio-screen width (preserves ?names= style). */
  private fitName(nameEl: HTMLElement): void {
    const parent = nameEl.parentElement;
    if (!parent) return;
    nameEl.style.fontSize = "";
    const base = Number.parseFloat(getComputedStyle(nameEl).fontSize) || 28;
    let size = base;
    const min = Math.max(13, base * 0.42);
    const maxW = Math.max(40, parent.clientWidth - 12);
    let guard = 0;
    while (nameEl.scrollWidth > maxW && size > min && guard++ < 60) {
      size -= 0.75;
      nameEl.style.fontSize = `${size}px`;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => {
      this.timers.push(window.setTimeout(r, ms));
    });
  }
}
