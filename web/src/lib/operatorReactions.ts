/**
 * Funny operator reactions.
 * Raid / bits / giftbomb / idle / coffee → dedicated bottom-bar OPS TERMINAL.
 * Repeat name stays on the follower plate (it's a follow).
 * Demos never persist. Red only while wrong text is visible.
 */
import type { OperatorReactionsSettings } from "../../../shared/settings.ts";
import { DEFAULT_OPERATOR_REACTIONS } from "../../../shared/settings.ts";
import type { OperatorReactionKind } from "../../../shared/protocol.ts";

export type ReactionSfxHooks = {
  onArmType?: () => void;
  onTypeChar?: (ch: string, opts?: { hard?: boolean }) => void;
  onBackspace?: (opts?: { hard?: boolean }) => void;
  onAlarmClick?: () => void;
  onCalcClack?: () => void;
  onSigh?: () => void;
  onCoffeeSplash?: () => void;
  onTableSmash?: () => void;
  onTypeDone?: () => void;
};

type ReactionJob = {
  reaction: OperatorReactionKind;
  name?: string;
  amount?: number;
  currency?: string;
  viewers?: number;
  count?: number;
  demo?: boolean;
  restoreFollow?: string;
};

function randMs(a: number, b: number): number {
  return a + Math.floor(Math.random() * (b - a + 1));
}

function clampName(n: string, max = 18): string {
  return String(n || "").trim().slice(0, max);
}

const IDLE_LINES = ["zzz", "anyone there", "...", "afk?", "hello?", "ping"];

function formatAmount(amount: number, currency?: string): string {
  const cur = (currency || "").toUpperCase();
  if (cur === "BITS" || cur === "BIT") return `${Math.round(amount)} BITS`;
  const sym = cur === "EUR" ? "€" : cur === "GBP" ? "£" : "$";
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${sym}?`;
  return n >= 100 && Number.isInteger(n) ? `${sym}${n}` : `${sym}${n.toFixed(2)}`;
}

const MODE_LABEL: Record<string, string> = {
  raid: "RAID",
  bits: "BITS",
  donation: "DONATION",
  giftbomb: "GIFTS",
  idle: "IDLE",
  coffee: "HAZARD",
};

export class OperatorReactions {
  private stage: HTMLElement;
  private cfg: OperatorReactionsSettings = { ...DEFAULT_OPERATOR_REACTIONS };
  private hooks: ReactionSfxHooks;
  private queue: ReactionJob[] = [];
  private busy = false;
  private reduced = false;
  private timers: number[] = [];
  private idleTimer: number | null = null;
  private lastActivity = performance.now();
  /** Dashboard eventAnimScale (1–2.5). Applied inside wait(). */
  private animScale = 1.75;

  constructor(stage: HTMLElement, hooks: ReactionSfxHooks = {}) {
    this.stage = stage;
    this.hooks = hooks;
  }

  setConfig(cfg: OperatorReactionsSettings): void {
    this.cfg = { ...DEFAULT_OPERATOR_REACTIONS, ...cfg };
    this.bumpActivity();
  }

  setAnimScale(scale: number): void {
    const n = Number(scale);
    this.animScale = Number.isFinite(n)
      ? Math.max(1, Math.min(2.5, n))
      : 1.75;
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on;
  }

  /** Wall-clock hold after the punchline before retract (~9.6s at default 1.75×). */
  private punchlineHoldMs(): number {
    return 5500;
  }

  bumpActivity(): void {
    this.lastActivity = performance.now();
    this.armIdle();
  }

  enqueue(job: Omit<ReactionJob, "restoreFollow">): void {
    if (!this.enabled(job.reaction)) return;
    const fol = this.followNameEl();
    this.queue.push({
      ...job,
      restoreFollow:
        job.demo && job.reaction === "repeat" ? fol?.textContent || "" : undefined,
    });
    this.bumpActivity();
    void this.kick();
  }

  demo(
    reaction: OperatorReactionKind,
    opts?: {
      name?: string;
      amount?: number;
      currency?: string;
      viewers?: number;
      count?: number;
    },
  ): void {
    this.enqueue({
      reaction,
      name: opts?.name || this.defaultDemoName(reaction),
      amount: opts?.amount,
      currency: opts?.currency,
      viewers: opts?.viewers,
      count: opts?.count,
      demo: true,
    });
  }

  dispose(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    this.queue = [];
    if (this.idleTimer != null) window.clearTimeout(this.idleTimer);
    this.closeTerminal(true);
  }

  private enabled(kind: OperatorReactionKind): boolean {
    switch (kind) {
      case "raid":
        return this.cfg.raids !== false;
      case "bits":
      case "donation":
        return this.cfg.bits !== false;
      case "giftbomb":
        return this.cfg.giftBombs !== false;
      case "idle":
        return this.cfg.idle !== false;
      case "repeat":
        return this.cfg.repeatName !== false;
      case "coffee":
        return this.cfg.coffee !== false;
      default:
        return false;
    }
  }

  private defaultDemoName(kind: OperatorReactionKind): string {
    switch (kind) {
      case "raid":
        return "RAID_BOSS";
      case "bits":
      case "donation":
        return "TIPPER";
      case "giftbomb":
        return "GIFTER";
      case "repeat":
        return "LORMIN";
      case "coffee":
        return "CHAT";
      default:
        return "OPS";
    }
  }

  private armIdle(): void {
    if (this.idleTimer != null) window.clearTimeout(this.idleTimer);
    this.idleTimer = null;
    if (!this.cfg.idle) return;
    const delay = this.cfg.idleDelayMs || DEFAULT_OPERATOR_REACTIONS.idleDelayMs;
    this.idleTimer = window.setTimeout(() => {
      this.idleTimer = null;
      if (document.hidden || this.busy || this.queue.length) {
        this.armIdle();
        return;
      }
      const quiet = performance.now() - this.lastActivity;
      if (quiet < delay * 0.9) {
        this.armIdle();
        return;
      }
      if (Math.random() > 0.35) {
        this.armIdle();
        return;
      }
      this.enqueue({ reaction: "idle", demo: true });
    }, delay);
  }

  private bottom(): HTMLElement | null {
    return this.stage.querySelector("#uw-bottom");
  }

  private terminal(): HTMLElement | null {
    return this.stage.querySelector("#smk-op-terminal");
  }

  private termMain(): HTMLElement | null {
    return this.stage.querySelector("#smk-op-term-main");
  }

  private termSub(): HTMLElement | null {
    return this.stage.querySelector("#smk-op-term-sub");
  }

  private termStamp(): HTMLElement | null {
    return this.stage.querySelector("#smk-op-term-stamp");
  }

  private termMode(): HTMLElement | null {
    return this.stage.querySelector("#smk-op-term-mode");
  }

  private termScreen(): HTMLElement | null {
    return this.terminal()?.querySelector(".smk-op-term-screen") ?? null;
  }

  private followRoot(): HTMLElement | null {
    return this.stage.querySelector("#uw-follower");
  }

  private followNameEl(): HTMLElement | null {
    return this.stage.querySelector("#uw-follower-name");
  }

  private wait(ms: number): Promise<void> {
    const scaled = Math.max(1, Math.round(ms * this.animScale));
    return new Promise((resolve) => {
      this.timers.push(window.setTimeout(resolve, scaled));
    });
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
      try {
        await this.play(job);
      } catch (e) {
        console.warn("[reactions]", e);
      }
    }
    this.busy = false;
    this.bumpActivity();
  }

  private async play(job: ReactionJob): Promise<void> {
    if (job.reaction === "repeat") {
      await this.playRepeat(job);
      return;
    }
    if (this.reduced) {
      await this.playReducedTerminal(job);
      return;
    }
    switch (job.reaction) {
      case "raid":
        await this.playRaid(job);
        break;
      case "bits":
      case "donation":
        await this.playBits(job);
        break;
      case "giftbomb":
        await this.playGiftBomb(job);
        break;
      case "idle":
        await this.playIdle(job);
        break;
      case "coffee":
        await this.playCoffee(job);
        break;
    }
  }

  private openTerminal(kind: OperatorReactionKind): void {
    const term = this.terminal();
    const bottom = this.bottom();
    if (!term) return;
    term.dataset.open = "1";
    term.dataset.kind = kind;
    term.setAttribute("aria-hidden", "false");
    delete term.dataset.alarm;
    delete term.dataset.cursor;
    if (bottom) bottom.dataset.opTerm = "1";
    this.stage.dataset.opTerm = "1";
    const mode = this.termMode();
    if (mode) mode.textContent = MODE_LABEL[kind] || "OPS";
    this.setMain("");
    this.setSub(null);
    this.setStamp(null);
    this.setScreenStatus(null);
  }

  private closeTerminal(instant = false): void {
    const term = this.terminal();
    const bottom = this.bottom();
    if (term) {
      if (instant) term.style.transition = "none";
      term.dataset.open = "0";
      term.setAttribute("aria-hidden", "true");
      delete term.dataset.kind;
      delete term.dataset.alarm;
      delete term.dataset.cursor;
      if (instant) {
        // Force reflow then restore transition
        void term.offsetWidth;
        term.style.transition = "";
      }
    }
    if (bottom) delete bottom.dataset.opTerm;
    delete this.stage.dataset.opTerm;
    this.setMain("");
    this.setSub(null);
    this.setStamp(null);
    this.setScreenStatus(null);
    const mode = this.termMode();
    if (mode) mode.textContent = "";
  }

  private setMain(text: string): void {
    const el = this.termMain();
    if (el) el.textContent = text;
  }

  private setSub(
    text: string | null,
    tone: "neutral" | "error" | "ok" | null = "neutral",
  ): void {
    const el = this.termSub();
    if (!el) return;
    if (!text) {
      el.textContent = "";
      delete el.dataset.tone;
      return;
    }
    el.textContent = text;
    if (tone && tone !== "neutral") el.dataset.tone = tone;
    else delete el.dataset.tone;
  }

  private setStamp(text: string | null): void {
    const el = this.termStamp();
    if (!el) return;
    if (!text) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = text;
  }

  private setScreenStatus(status: "error" | "ok" | null): void {
    const screen = this.termScreen();
    if (!screen) return;
    if (status) screen.dataset.status = status;
    else delete screen.dataset.status;
  }

  private setCursor(on: boolean): void {
    const term = this.terminal();
    if (!term) return;
    if (on) term.dataset.cursor = "1";
    else delete term.dataset.cursor;
  }

  private setAlarm(on: boolean): void {
    const term = this.terminal();
    if (!term) return;
    if (on) term.dataset.alarm = "1";
    else delete term.dataset.alarm;
  }

  private async typeInto(
    getText: () => string,
    setText: (t: string) => void,
    text: string,
    opts?: { hard?: boolean; careful?: boolean },
  ): Promise<void> {
    this.hooks.onArmType?.();
    const chars = [...text];
    let built = getText();
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      built += ch;
      setText(built);
      this.hooks.onTypeChar?.(ch, { hard: opts?.hard });
      const base = opts?.careful
        ? randMs(160, 230)
        : opts?.hard
          ? randMs(36, 58)
          : randMs(110, 175);
      await this.wait(base);
    }
  }

  private async backspaceTo(
    getText: () => string,
    setText: (t: string) => void,
    targetLen: number,
    opts?: { hard?: boolean },
  ): Promise<void> {
    this.hooks.onArmType?.();
    let cur = getText();
    while (cur.length > targetLen) {
      cur = cur.slice(0, -1);
      setText(cur);
      this.hooks.onBackspace?.({ hard: opts?.hard });
      await this.wait(opts?.hard ? randMs(36, 55) : randMs(65, 105));
    }
  }

  private async playReducedTerminal(job: ReactionJob): Promise<void> {
    this.openTerminal(job.reaction);
    if (job.reaction === "raid") {
      this.setMain(clampName(job.name || "RAIDER"));
      this.setSub(`INCOMING: ${job.viewers || 12} HOSTILES`, "ok");
    } else if (job.reaction === "bits" || job.reaction === "donation") {
      const who = clampName(job.name || "ANONYMOUS", 14);
      const label = formatAmount(
        job.amount ?? 500,
        job.currency || (job.reaction === "bits" ? "bits" : "USD"),
      );
      this.setMain(`${who} // ${label}`);
      this.setScreenStatus("ok");
      this.setStamp(`✓ ${label} // ${who}`);
    } else if (job.reaction === "giftbomb") {
      const who = clampName(job.name || "ANONYMOUS", 14);
      this.setMain(`MULTIPLE CONTACTS ×${job.count || 5}`);
      this.setSub(`GIFTER // ${who}`, "ok");
    } else if (job.reaction === "idle") {
      this.setMain("zzz");
    } else if (job.reaction === "coffee") {
      this.setMain("COFFEE SPILL");
    }
    await this.wait(this.punchlineHoldMs());
    this.closeTerminal();
  }

  /** Raid: panic type raider, correct, HOSTILES count-up + alarm lamp. */
  private async playRaid(job: ReactionJob): Promise<void> {
    const name = clampName(job.name || "RAIDER", 16);
    const viewers = Math.max(1, Math.min(9999, Math.round(job.viewers || 12)));
    this.openTerminal("raid");
    this.setCursor(true);
    this.setAlarm(true);
    this.setScreenStatus("error");

    const smashLen = 10 + Math.floor(Math.random() * 6);
    const smash = "asdfqwerzxcv".slice(0, smashLen);
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      smash,
      { hard: true },
    );
    this.hooks.onTableSmash?.();
    await this.wait(randMs(480, 720));
    this.setScreenStatus(null);
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: true },
    );
    await this.wait(randMs(180, 280));

    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      name,
      { careful: true },
    );
    this.setScreenStatus("ok");
    this.hooks.onTypeDone?.();
    this.setCursor(false);

    const steps = Math.min(viewers, 40);
    const step = Math.max(1, Math.ceil(viewers / steps));
    for (let n = step; n <= viewers; n += step) {
      const show = Math.min(n, viewers);
      this.setSub(`INCOMING: ${show} HOSTILES`, "neutral");
      this.hooks.onAlarmClick?.();
      await this.wait(show < 8 ? 95 : show < 30 ? 55 : 32);
    }
    this.setSub(`${name} // ${viewers} HOSTILES`, "ok");
    this.setAlarm(false);
    await this.wait(this.punchlineHoldMs());
    this.closeTerminal();
  }

  /** Bits/donation: name intro, calculator, one ERR, recount, green stamp with name. */
  private async playBits(job: ReactionJob): Promise<void> {
    const who = clampName(job.name || "ANONYMOUS", 14);
    const amount = job.amount ?? 500;
    const label = formatAmount(
      amount,
      job.currency || (job.reaction === "bits" ? "bits" : "USD"),
    );
    const wrong = formatAmount(
      job.reaction === "bits" ? Math.max(1, amount - 7) : amount * 0.9,
      job.currency || (job.reaction === "bits" ? "bits" : "USD"),
    );
    this.openTerminal(job.reaction);
    this.setCursor(true);

    // Operator types the sender first
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      `INCOMING FUNDS // ${who}`,
      { careful: true },
    );
    this.setSub(`FROM // ${who}`, "neutral");
    await this.wait(randMs(400, 650));
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: false },
    );
    await this.wait(randMs(120, 200));

    this.setSub("CALC…", "neutral");
    for (const ch of wrong.replace(/\s/g, "")) {
      this.setMain((this.termMain()?.textContent || "") + ch);
      this.hooks.onCalcClack?.();
      await this.wait(randMs(70, 120));
    }
    this.setScreenStatus("error");
    this.setSub(`ERR // ${who}`, "error");
    await this.wait(randMs(800, 1200));
    this.setScreenStatus(null);
    this.setSub("RECALC…", "neutral");
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: false },
    );
    await this.wait(randMs(180, 280));

    this.setMain("");
    const finalLine = `${who} // ${label}`;
    for (const ch of [...finalLine]) {
      this.setMain((this.termMain()?.textContent || "") + ch);
      if (ch !== " " && ch !== "/") this.hooks.onCalcClack?.();
      await this.wait(randMs(55, 100));
    }
    this.setCursor(false);
    this.setScreenStatus("ok");
    this.setSub(`FROM // ${who}`, "ok");
    this.setStamp(`✓ ${label} // ${who}`);
    this.hooks.onTypeDone?.();
    await this.wait(this.punchlineHoldMs());
    this.closeTerminal();
  }

  /** Gift bomb: give up typing, slam MULTIPLE CONTACTS ×N + gifter. */
  private async playGiftBomb(job: ReactionJob): Promise<void> {
    const count = Math.max(5, Math.round(job.count || 5));
    const who = clampName(job.name || "ANONYMOUS", 14);
    this.openTerminal("giftbomb");
    this.setCursor(true);
    this.setScreenStatus("error");
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      "aaa",
      { hard: true },
    );
    await this.wait(randMs(350, 520));
    this.setScreenStatus(null);
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: true },
    );
    this.setCursor(false);
    this.hooks.onSigh?.();
    this.hooks.onTableSmash?.();
    this.setMain(`MULTIPLE CONTACTS ×${count}`);
    this.setSub(`GIFTER // ${who}`, "ok");
    this.setScreenStatus("ok");
    await this.wait(this.punchlineHoldMs());
    this.closeTerminal();
  }

  /** Idle: blink cursor, type bored line, delete — never keeps it. */
  private async playIdle(_job: ReactionJob): Promise<void> {
    const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]!;
    this.openTerminal("idle");
    this.setCursor(true);
    await this.wait(randMs(700, 1200));
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      line,
      { careful: true },
    );
    await this.wait(randMs(1100, 1800));
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: false },
    );
    this.setCursor(false);
    await this.wait(400);
    this.closeTerminal();
  }

  /** Repeat follower — stays on follower plate only. */
  private async playRepeat(job: ReactionJob): Promise<void> {
    const root = this.followRoot();
    const nameEl = this.followNameEl();
    if (!root || !nameEl) return;
    const name = clampName(job.name || "SOMEONE", 14);
    const restore = job.demo ? job.restoreFollow ?? "" : name;

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    await this.typeInto(
      () => nameEl.textContent || "",
      (t) => {
        nameEl.textContent = t;
      },
      `${name} AGAIN?`,
      { careful: true },
    );
    await this.wait(randMs(800, 1200));
    await this.backspaceTo(
      () => nameEl.textContent || "",
      (t) => {
        nameEl.textContent = t;
      },
      name.length,
      { hard: false },
    );
    root.dataset.status = "ok";
    this.hooks.onTypeDone?.();
    await this.wait(randMs(900, 1400));
    delete root.dataset.status;
    delete root.dataset.socialFx;
    nameEl.textContent = restore || name;
  }

  /** Coffee spill: terminal glitch + splash. */
  private async playCoffee(_job: ReactionJob): Promise<void> {
    this.openTerminal("coffee");
    this.hooks.onCoffeeSplash?.();
    this.setMain("COFFEE SPILL");
    this.setSub("MUG DOWN — WIPE CONSOLE", "neutral");
    await this.wait(this.punchlineHoldMs());
    this.closeTerminal();
  }
}
