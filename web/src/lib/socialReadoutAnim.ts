/**
 * Queued LATEST FOLLOW / LATEST SUB smoked-glass events.
 * Smoke: acquire/surge → type-in (optional decrypt) → NEW → settle (+ plate VFX).
 * Demo previews never overwrite stored names.
 */

export type SocialKind = "follow" | "sub";

export type SocialReadoutAnimHooks = {
  /** Fired once when a follow/sub anim actually starts (type-in/NEW path). */
  onEventStart?: (kind: SocialKind) => void;
  /** Each character during smoke type-in (for typewriter SFX). */
  onTypeChar?: (kind: SocialKind, char: string) => void;
  /** After type-in finishes (carriage-return / bell). */
  onTypeDone?: (kind: SocialKind) => void;
};

type Job = {
  kind: SocialKind;
  name: string;
  /** If set, restore this name after demo settle (demo does not persist). */
  restoreTo?: string;
};

const SCRAMBLE = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#@$%&*";

function scrambleChar(): string {
  return SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)] || "#";
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
    this.queue.push({ kind, name: sampleName, restoreTo });
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

  /**
   * Smoke type-in:
   * Follow — acquire → tune → type (ghost/bloom) → NEW → settle (~2s feel).
   * Sub — surge+CRT → decrypt type → stamp/NEW (bell) → settle + lingering ember.
   */
  private async playSmoke(job: Job, el: HTMLElement, nameEl: HTMLElement): Promise<void> {
    const badge = this.newBadge(job.kind);
    const ghost = this.ghostEl(job.kind);
    const isSub = job.kind === "sub";
    const newMs = isSub ? 1000 : 380;
    const settleMs = isSub ? 900 : 480;

    nameEl.textContent = "";
    nameEl.style.opacity = "";
    if (ghost) {
      ghost.textContent = "";
      ghost.classList.remove("on");
    }

    if (isSub) {
      this.setStageSurge(true);
      this.stage.dataset.helmFlash = "1";
      el.dataset.socialFx = "surge";
      await this.wait(320);
      el.dataset.socialFx = "crt";
      await this.wait(180);
      delete this.stage.dataset.helmFlash;
    } else {
      el.dataset.socialFx = "acquire";
      await this.wait(260);
      el.dataset.socialFx = "tune";
      await this.wait(160);
    }

    el.dataset.socialFx = "type";
    const chars = [...job.name];
    let built = "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      if (isSub) {
        // Decrypt: 2 glyph flashes then resolve (synced to clacks)
        for (let s = 0; s < 2; s++) {
          nameEl.textContent = built + scrambleChar();
          await this.wait(16 + Math.floor(Math.random() * 10));
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
      this.hooks.onTypeChar?.(job.kind, ch);
      el.classList.remove("smk-spark-tick");
      void el.offsetWidth;
      el.classList.add("smk-spark-tick");
      await this.wait(22 + Math.floor(Math.random() * 28));
    }
    // Bell / carriage — align sub surge peak + stamp slam with this beat
    this.hooks.onTypeDone?.(job.kind);
    this.fitName(nameEl);
    if (ghost) {
      ghost.textContent = built;
      ghost.classList.add("on");
    }

    el.dataset.socialFx = "new";
    badge?.classList.add("on");
    if (isSub) {
      el.dataset.typeMark = "1";
      el.classList.add("smk-stamp-slam");
    }
    await this.wait(newMs);
    el.classList.remove("smk-stamp-slam", "smk-spark-tick");

    el.dataset.socialFx = "settle";
    await this.wait(settleMs);

    delete el.dataset.socialFx;
    badge?.classList.remove("on");
    if (ghost) {
      ghost.classList.remove("on");
      ghost.textContent = "";
    }
    this.setStageSurge(false);
    delete this.stage.dataset.helmFlash;

    if (isSub) {
      // Lingering ember glow ~10s (idle cost: CSS only, no timers after one timeout)
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
