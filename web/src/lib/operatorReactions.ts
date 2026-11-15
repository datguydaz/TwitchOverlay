/**
 * Funny operator plate reactions: raid / bits / giftbomb / idle / repeat / coffee.
 * Never persists names — demos always restore. Red only while wrong text is visible.
 */
import type { OperatorReactionsSettings } from "../../../shared/settings.ts";
import { DEFAULT_OPERATOR_REACTIONS } from "../../../shared/settings.ts";
import type { OperatorReactionKind } from "../../../shared/protocol.ts";

export type ReactionSfxHooks = {
  /** Arm typewriter layer once before a typing sequence. */
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
  restoreSub?: string;
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

  constructor(stage: HTMLElement, hooks: ReactionSfxHooks = {}) {
    this.stage = stage;
    this.hooks = hooks;
  }

  setConfig(cfg: OperatorReactionsSettings): void {
    this.cfg = { ...DEFAULT_OPERATOR_REACTIONS, ...cfg };
    this.bumpActivity();
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on;
  }

  bumpActivity(): void {
    this.lastActivity = performance.now();
    this.armIdle();
  }

  /** Enqueue a live or demo reaction. */
  enqueue(job: Omit<ReactionJob, "restoreFollow" | "restoreSub">): void {
    if (!this.enabled(job.reaction)) return;
    const fol = this.nameEl("follow");
    const sub = this.nameEl("sub");
    this.queue.push({
      ...job,
      restoreFollow: job.demo ? fol?.textContent || "" : undefined,
      restoreSub: job.demo ? sub?.textContent || "" : undefined,
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
    this.clearCoffee();
    this.clearReactHosts();
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
      // Rare: only ~35% of idle firings actually type something
      if (Math.random() > 0.35) {
        this.armIdle();
        return;
      }
      this.enqueue({ reaction: "idle", demo: true });
    }, delay);
  }

  private root(kind: "follow" | "sub"): HTMLElement | null {
    return this.stage.querySelector(
      kind === "follow" ? "#uw-follower" : "#uw-subscriber",
    );
  }

  private nameEl(kind: "follow" | "sub"): HTMLElement | null {
    return this.stage.querySelector(
      kind === "follow" ? "#uw-follower-name" : "#uw-subscriber-name",
    );
  }

  private reactLine(kind: "follow" | "sub"): HTMLElement | null {
    return this.root(kind)?.querySelector(".smk-react-line") ?? null;
  }

  private setStatus(el: HTMLElement, status: "error" | "ok" | null): void {
    if (status) el.dataset.status = status;
    else delete el.dataset.status;
  }

  private setReact(
    kind: "follow" | "sub",
    text: string | null,
    tone: "neutral" | "error" | "ok" | null = "neutral",
  ): void {
    const root = this.root(kind);
    const line = this.reactLine(kind);
    if (!root || !line) return;
    if (!text) {
      delete root.dataset.react;
      line.textContent = "";
      return;
    }
    root.dataset.react = tone || "neutral";
    line.textContent = text;
  }

  private clearReactHosts(): void {
    this.setReact("follow", null, null);
    this.setReact("sub", null, null);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.timers.push(window.setTimeout(resolve, Math.max(0, ms)));
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
    if (this.reduced) {
      await this.playReduced(job);
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
      case "repeat":
        await this.playRepeat(job);
        break;
      case "coffee":
        await this.playCoffee(job);
        break;
    }
  }

  private async playReduced(job: ReactionJob): Promise<void> {
    if (job.reaction === "raid" && job.name) {
      const el = this.nameEl("follow");
      if (el) el.textContent = clampName(job.name);
    }
    if ((job.reaction === "bits" || job.reaction === "donation") && job.amount != null) {
      this.setReact("sub", formatAmount(job.amount, job.currency), "ok");
      await this.wait(800);
      this.setReact("sub", null, null);
    }
    if (job.reaction === "giftbomb") {
      this.setReact("sub", `MULTIPLE CONTACTS ×${job.count || 5}`, "ok");
      await this.wait(900);
      this.setReact("sub", null, null);
    }
    this.restoreDemo(job);
  }

  private restoreDemo(job: ReactionJob): void {
    if (!job.demo) return;
    const fol = this.nameEl("follow");
    const sub = this.nameEl("sub");
    if (fol && job.restoreFollow !== undefined) fol.textContent = job.restoreFollow;
    if (sub && job.restoreSub !== undefined) sub.textContent = job.restoreSub;
  }

  private async typeInto(
    nameEl: HTMLElement,
    text: string,
    opts?: { hard?: boolean; careful?: boolean },
  ): Promise<void> {
    this.hooks.onArmType?.();
    const chars = [...text];
    let built = nameEl.textContent || "";
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]!;
      built += ch;
      nameEl.textContent = built;
      this.hooks.onTypeChar?.(ch, { hard: opts?.hard });
      const base = opts?.careful ? randMs(140, 200) : opts?.hard ? randMs(28, 48) : randMs(90, 150);
      await this.wait(base);
    }
  }

  private async backspaceTo(
    nameEl: HTMLElement,
    targetLen: number,
    opts?: { hard?: boolean },
  ): Promise<void> {
    this.hooks.onArmType?.();
    let cur = nameEl.textContent || "";
    while (cur.length > targetLen) {
      cur = cur.slice(0, -1);
      nameEl.textContent = cur;
      this.hooks.onBackspace?.({ hard: opts?.hard });
      await this.wait(opts?.hard ? randMs(28, 45) : randMs(50, 85));
    }
  }

  private async backspaceAll(nameEl: HTMLElement, hard = false): Promise<void> {
    await this.backspaceTo(nameEl, 0, { hard });
  }

  /** Raid: panic keysmash raider name, then correct + INCOMING count-up. */
  private async playRaid(job: ReactionJob): Promise<void> {
    const root = this.root("follow");
    const nameEl = this.nameEl("follow");
    if (!root || !nameEl) return;
    const name = clampName(job.name || "RAIDER", 16);
    const viewers = Math.max(1, Math.min(9999, Math.round(job.viewers || 12)));
    const restore = nameEl.textContent || "";

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    this.setStatus(root, null);

    // Panic smash
    this.setStatus(root, "error");
    const smashLen = 10 + Math.floor(Math.random() * 6);
    const smash = "asdfqwerzxcv".slice(0, smashLen);
    await this.typeInto(nameEl, smash, { hard: true });
    this.hooks.onTableSmash?.();
    await this.wait(randMs(280, 420));
    this.setStatus(root, null);
    await this.backspaceAll(nameEl, true);
    await this.wait(randMs(120, 200));

    // Correct name
    await this.typeInto(nameEl, name, { careful: true });
    this.setStatus(root, "ok");
    this.hooks.onTypeDone?.();

    // Count-up hostiles (neutral/ok — not "wrong text", so no red).
    // Large raids step so we stay CPU-light and under ~2s.
    const steps = Math.min(viewers, 40);
    const step = Math.max(1, Math.ceil(viewers / steps));
    for (let n = step; n <= viewers; n += step) {
      const show = Math.min(n, viewers);
      this.setReact("follow", `INCOMING: ${show} HOSTILES`, "neutral");
      this.hooks.onAlarmClick?.();
      await this.wait(show < 8 ? 70 : show < 30 ? 40 : 22);
    }
    this.setReact("follow", `INCOMING: ${viewers} HOSTILES`, "ok");
    await this.wait(900);
    this.setStatus(root, null);
    this.setReact("follow", null, null);
    delete root.dataset.socialFx;

    if (job.demo) nameEl.textContent = restore;
    else nameEl.textContent = name;
  }

  /** Bits/donation: calculator clacks, one ERR, recount, green stamp. */
  private async playBits(job: ReactionJob): Promise<void> {
    const root = this.root("sub");
    const nameEl = this.nameEl("sub");
    if (!root || !nameEl) return;
    const amount = job.amount ?? 500;
    const label = formatAmount(amount, job.currency || (job.reaction === "bits" ? "bits" : "USD"));
    const wrong = formatAmount(
      job.reaction === "bits" ? Math.max(1, amount - 7) : amount * 0.9,
      job.currency || (job.reaction === "bits" ? "bits" : "USD"),
    );
    const restore = nameEl.textContent || "";

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    this.setReact("sub", "CALC…", "neutral");

    // First count (will be "wrong")
    for (const ch of wrong.replace(/\s/g, "")) {
      nameEl.textContent = (nameEl.textContent || "") + ch;
      this.hooks.onCalcClack?.();
      await this.wait(randMs(55, 95));
    }
    this.setStatus(root, "error");
    this.setReact("sub", "ERR", "error");
    await this.wait(randMs(420, 620));
    this.setStatus(root, null);
    this.setReact("sub", "RECALC…", "neutral");
    await this.backspaceAll(nameEl, false);
    await this.wait(randMs(100, 180));

    // Correct count
    nameEl.textContent = "";
    for (const ch of label.replace(/\s/g, "")) {
      nameEl.textContent = (nameEl.textContent || "") + ch;
      this.hooks.onCalcClack?.();
      await this.wait(randMs(55, 95));
    }
    this.setStatus(root, "ok");
    this.setReact("sub", `✓ ${label}`, "ok");
    this.hooks.onTypeDone?.();
    await this.wait(1100);
    this.setStatus(root, null);
    this.setReact("sub", null, null);
    delete root.dataset.socialFx;

    // Bits/donations never overwrite the real sub name plate
    nameEl.textContent = restore;
  }

  /** Gift bomb: give up, slam MULTIPLE CONTACTS ×N. */
  private async playGiftBomb(job: ReactionJob): Promise<void> {
    const root = this.root("sub");
    const nameEl = this.nameEl("sub");
    if (!root || !nameEl) return;
    const count = Math.max(5, Math.round(job.count || 5));
    const restore = nameEl.textContent || "";

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    this.setStatus(root, "error");
    await this.typeInto(nameEl, "aaa", { hard: true });
    await this.wait(200);
    this.setStatus(root, null);
    await this.backspaceAll(nameEl, true);
    this.hooks.onSigh?.();
    this.hooks.onTableSmash?.();
    nameEl.textContent = `×${count}`;
    this.setReact("sub", `MULTIPLE CONTACTS ×${count}`, "ok");
    this.setStatus(root, "ok");
    await this.wait(1400);
    this.setStatus(root, null);
    this.setReact("sub", null, null);
    delete root.dataset.socialFx;

    // Gift bomb never overwrites the saved sub name
    nameEl.textContent = restore;
  }

  /** Idle: blink then type bored line and delete — never keeps it. */
  private async playIdle(job: ReactionJob): Promise<void> {
    const root = this.root("follow");
    const nameEl = this.nameEl("follow");
    if (!root || !nameEl) return;
    const restore = job.restoreFollow ?? nameEl.textContent ?? "";
    const line = IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)]!;

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    // Cursor blink beat
    await this.wait(randMs(600, 1100));
    await this.typeInto(nameEl, line, { careful: true });
    await this.wait(randMs(700, 1200));
    await this.backspaceAll(nameEl, false);
    delete root.dataset.socialFx;
    nameEl.textContent = restore;
  }

  /** Repeat follower: type "NAME AGAIN?" then delete " AGAIN?". */
  private async playRepeat(job: ReactionJob): Promise<void> {
    const root = this.root("follow");
    const nameEl = this.nameEl("follow");
    if (!root || !nameEl) return;
    const name = clampName(job.name || "SOMEONE", 14);
    const restore = job.demo ? job.restoreFollow ?? "" : name;

    root.dataset.socialFx = "type";
    nameEl.textContent = "";
    await this.typeInto(nameEl, `${name} AGAIN?`, { careful: true });
    this.setReact("follow", "SEEN THIS ONE…", "neutral");
    await this.wait(randMs(500, 780));
    // Delete " AGAIN?"
    const keep = name.length;
    await this.backspaceTo(nameEl, keep, { hard: false });
    this.setStatus(root, "ok");
    this.hooks.onTypeDone?.();
    await this.wait(500);
    this.setStatus(root, null);
    this.setReact("follow", null, null);
    delete root.dataset.socialFx;
    nameEl.textContent = restore || name;
  }

  /** Coffee spill: brief plate glitch + splash SFX. */
  private async playCoffee(_job: ReactionJob): Promise<void> {
    this.hooks.onCoffeeSplash?.();
    this.stage.dataset.coffeeSpill = "1";
    const fol = this.root("follow");
    const sub = this.root("sub");
    fol?.classList.add("smk-coffee-glitch");
    sub?.classList.add("smk-coffee-glitch");
    this.setReact("follow", "COFFEE SPILL", "neutral");
    await this.wait(720);
    this.clearCoffee();
    this.setReact("follow", null, null);
  }

  private clearCoffee(): void {
    delete this.stage.dataset.coffeeSpill;
    this.root("follow")?.classList.remove("smk-coffee-glitch");
    this.root("sub")?.classList.remove("smk-coffee-glitch");
  }
}
