/**
 * Queued LATEST FOLLOW / LATEST SUB smoked-glass events.
 * Idle: backlight + occasional sweep. Event: indicator → sweep → clean reveal → ~2s settle.
 * No scramble/retype. Demo previews never overwrite stored names.
 */

export type SocialKind = "follow" | "sub";

type Job = {
  kind: SocialKind;
  name: string;
  /** If set, restore this name after demo settle (demo does not persist). */
  restoreTo?: string;
};

export class SocialReadoutAnim {
  private stage: HTMLElement;
  private queue: Job[] = [];
  private busy = false;
  private reduced = false;
  private osReduce =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  private timers: number[] = [];
  private idleTimers: number[] = [];

  constructor(stage: HTMLElement, reducedMotion = false) {
    this.stage = stage;
    this.setReducedMotion(reducedMotion);
    document.addEventListener("visibilitychange", this.onVis);
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on || this.osReduce;
    this.clearIdle();
    if (!this.reduced) this.scheduleIdleSweeps();
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
    this.clearIdle();
    this.queue = [];
  }

  private onVis = (): void => {
    if (document.hidden) return;
    this.clearIdle();
    if (!this.reduced) this.scheduleIdleSweeps();
  };

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

  private clearIdle(): void {
    for (const t of this.idleTimers) window.clearTimeout(t);
    this.idleTimers = [];
  }

  /** Occasional idle amber sweep without changing the name. */
  private scheduleIdleSweeps(): void {
    const arm = (kind: SocialKind, base: number, span: number) => {
      const delay = base + Math.random() * span;
      this.idleTimers.push(
        window.setTimeout(() => {
          if (this.reduced || document.hidden || this.busy) {
            arm(kind, base, span);
            return;
          }
          const el = this.root(kind);
          if (el && !el.hidden && !el.dataset.socialFx) {
            el.dataset.socialFx = "sweep";
            this.idleTimers.push(
              window.setTimeout(() => {
                if (el.dataset.socialFx === "sweep") delete el.dataset.socialFx;
              }, 420),
            );
          }
          arm(kind, base, span);
        }, delay),
      );
    };
    arm("follow", 4500, 6500);
    arm("sub", 5500, 7500);
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

    if (this.reduced) {
      nameEl.textContent = job.name;
      if (job.restoreTo !== undefined) {
        return this.wait(400).then(() => {
          nameEl.textContent = job.restoreTo || "";
        });
      }
      return Promise.resolve();
    }

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
        }, 520),
      );

      this.timers.push(
        window.setTimeout(() => {
          el.dataset.socialFx = "settle";
        }, 780),
      );

      // ~2s settle hold
      this.timers.push(
        window.setTimeout(() => {
          delete el.dataset.socialFx;
          if (job.restoreTo !== undefined) {
            nameEl.textContent = job.restoreTo;
          }
          resolve();
        }, 780 + 2000),
      );
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => {
      this.timers.push(window.setTimeout(r, ms));
    });
  }
}
