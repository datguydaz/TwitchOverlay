/**
 * Funny operator reactions.
 * Raid / bits / giftbomb / idle / coffee → dedicated bottom-bar OPS TERMINAL.
 * Repeat name stays on the follower plate (it's a follow).
 * Demos never persist. Red only while wrong text is visible.
 */
import type { OperatorReactionsSettings } from "../../../shared/settings.ts";
import { DEFAULT_OPERATOR_REACTIONS } from "../../../shared/settings.ts";
import type { OperatorReactionKind } from "../../../shared/protocol.ts";
import { makeDistinctWrongName } from "./operatorTypos.ts";

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
  /**
   * Dashboard "Reveal speed" (1–2.5). Applied only to the correct-reveal
   * phase (final name, amounts, green hold). Fumbles stay at 1×.
   */
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

  /** Pre-scale hold after the green ✓ punchline (~9.6s at default 1.75× reveal). */
  private punchlineHoldMs(): number {
    return 5500;
  }

  private setHeader(text: string): void {
    const mode = this.termMode();
    if (mode) mode.textContent = text;
  }

  /** Funds punchline — each piece once. */
  private fundsResultLine(job: ReactionJob): string {
    const amount = job.amount ?? 500;
    const currency =
      job.currency || (job.reaction === "bits" ? "bits" : "USD");
    const label = formatAmount(amount, currency);
    const cur = (currency || "").toUpperCase();
    if (job.reaction === "bits" || cur === "BITS" || cur === "BIT") {
      return `${label} ✓`;
    }
    return `${label} DONATED ✓`;
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

  /**
   * @param pace `fumble` = 1× (name typos, erase, ERR).
   *             `reveal` = eventAnimScale (correct name / amount / ✓ hold).
   */
  private wait(
    ms: number,
    pace: "fumble" | "reveal" = "reveal",
  ): Promise<void> {
    const mul = pace === "fumble" ? 1 : this.animScale;
    const scaled = Math.max(1, Math.round(ms * mul));
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
    opts?: { hard?: boolean; careful?: boolean; pace?: "fumble" | "reveal" },
  ): Promise<void> {
    const pace =
      opts?.pace ??
      (opts?.hard ? "fumble" : opts?.careful ? "reveal" : "reveal");
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
      await this.wait(base, pace);
    }
  }

  private async backspaceTo(
    getText: () => string,
    setText: (t: string) => void,
    targetLen: number,
    opts?: { hard?: boolean; pace?: "fumble" | "reveal" },
  ): Promise<void> {
    const pace = opts?.pace ?? "fumble";
    this.hooks.onArmType?.();
    let cur = getText();
    while (cur.length > targetLen) {
      cur = cur.slice(0, -1);
      setText(cur);
      this.hooks.onBackspace?.({ hard: opts?.hard });
      await this.wait(
        opts?.hard ? randMs(36, 55) : randMs(65, 105),
        pace,
      );
    }
  }

  /**
   * Name fumble at 1×: type a distinct wrong spelling, ERR, erase,
   * then carefully retype the correct name at reveal pace.
   * Red only while the wrong text is on screen.
   */
  private async fumbleThenRevealName(correct: string): Promise<void> {
    const wrong = makeDistinctWrongName(correct);
    this.setCursor(true);
    // Type wrong first; red only once wrong text is on screen
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => {
        this.setMain(t);
        if (t.length === 1) this.setScreenStatus("error");
      },
      wrong,
      { careful: false, pace: "fumble" },
    );
    this.setSub("ERR", "error");
    await this.wait(randMs(700, 1100), "fumble");
    // Red off the moment erase begins
    this.setScreenStatus(null);
    this.setSub(null);
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: false, pace: "fumble" },
    );
    await this.wait(randMs(160, 260), "fumble");
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      correct,
      { careful: true, pace: "reveal" },
    );
    this.setCursor(false);
  }

  private async playReducedTerminal(job: ReactionJob): Promise<void> {
    this.openTerminal(job.reaction);
    if (job.reaction === "raid") {
      this.setMain(clampName(job.name || "RAIDER"));
      this.setSub(`${job.viewers || 12} HOSTILES INCOMING`, "ok");
    } else if (job.reaction === "bits" || job.reaction === "donation") {
      const who = clampName(job.name || "ANONYMOUS", 14);
      this.setHeader("INCOMING FUNDS");
      this.setMain(who);
      this.setSub(this.fundsResultLine(job), "ok");
      this.setScreenStatus("ok");
    } else if (job.reaction === "giftbomb") {
      const who = clampName(job.name || "ANONYMOUS", 14);
      const count = Math.max(5, Math.round(job.count || 5));
      this.setMain(who);
      this.setSub(`×${count} SUBS GIFTED ✓`, "ok");
      this.setScreenStatus("ok");
    } else if (job.reaction === "idle") {
      this.setMain("zzz");
    } else if (job.reaction === "coffee") {
      this.setMain("COFFEE SPILL");
    }
    await this.wait(this.punchlineHoldMs(), "reveal");
    this.closeTerminal();
  }

  /** Raid: name typo → correct name → HOSTILES count-up (always correct). */
  private async playRaid(job: ReactionJob): Promise<void> {
    const name = clampName(job.name || "RAIDER", 16);
    const viewers = Math.max(1, Math.min(9999, Math.round(job.viewers || 12)));
    this.openTerminal("raid");
    this.setAlarm(true);

    await this.fumbleThenRevealName(name);
    this.setScreenStatus("ok");
    this.hooks.onTypeDone?.();

    const steps = Math.min(viewers, 40);
    const step = Math.max(1, Math.ceil(viewers / steps));
    for (let n = step; n <= viewers; n += step) {
      const show = Math.min(n, viewers);
      this.setSub(`${show} HOSTILES INCOMING`, "neutral");
      this.hooks.onAlarmClick?.();
      await this.wait(show < 8 ? 140 : show < 30 ? 85 : 48, "reveal");
    }
    this.setSub(`${viewers} HOSTILES INCOMING`, "ok");
    this.setAlarm(false);
    await this.wait(this.punchlineHoldMs(), "reveal");
    this.closeTerminal();
  }

  /**
   * Bits/donation: name typo → ERR → correct name (reveal), then amount
   * typed correctly once (no amount miscount / identical retype).
   */
  private async playBits(job: ReactionJob): Promise<void> {
    const who = clampName(job.name || "ANONYMOUS", 14);
    const result = this.fundsResultLine(job);

    this.openTerminal(job.reaction);
    this.setHeader("INCOMING FUNDS");

    await this.fumbleThenRevealName(who);
    this.setScreenStatus("ok");
    await this.wait(randMs(220, 360), "reveal");

    let built = "";
    for (const ch of [...result]) {
      built += ch;
      this.setSub(built, "ok");
      if (ch !== " " && ch !== "✓") this.hooks.onCalcClack?.();
      await this.wait(randMs(95, 155), "reveal");
    }
    this.setStamp(null);
    this.hooks.onTypeDone?.();
    await this.wait(this.punchlineHoldMs(), "reveal");
    this.closeTerminal();
  }

  /** Gift bomb: name typo → correct name → ×N SUBS GIFTED ✓ (once). */
  private async playGiftBomb(job: ReactionJob): Promise<void> {
    const count = Math.max(5, Math.round(job.count || 5));
    const who = clampName(job.name || "ANONYMOUS", 14);
    this.openTerminal("giftbomb");

    await this.fumbleThenRevealName(who);
    this.setSub(`×${count} SUBS GIFTED ✓`, "ok");
    this.setScreenStatus("ok");
    this.hooks.onTypeDone?.();
    await this.wait(this.punchlineHoldMs(), "reveal");
    this.closeTerminal();
  }

  /** Idle: blink cursor, type bored line, delete — never keeps it. */
  private async playIdle(_job: ReactionJob): Promise<void> {
    const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]!;
    this.openTerminal("idle");
    this.setCursor(true);
    await this.wait(randMs(700, 1200), "fumble");
    await this.typeInto(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      line,
      { careful: true, pace: "fumble" },
    );
    await this.wait(randMs(1100, 1800), "fumble");
    await this.backspaceTo(
      () => this.termMain()?.textContent || "",
      (t) => this.setMain(t),
      0,
      { hard: false, pace: "fumble" },
    );
    this.setCursor(false);
    await this.wait(400, "fumble");
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
      { careful: true, pace: "reveal" },
    );
    await this.wait(randMs(800, 1200), "reveal");
    await this.backspaceTo(
      () => nameEl.textContent || "",
      (t) => {
        nameEl.textContent = t;
      },
      name.length,
      { hard: false, pace: "fumble" },
    );
    root.dataset.status = "ok";
    this.hooks.onTypeDone?.();
    await this.wait(randMs(900, 1400), "reveal");
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
    await this.wait(this.punchlineHoldMs(), "reveal");
    this.closeTerminal();
  }
}
