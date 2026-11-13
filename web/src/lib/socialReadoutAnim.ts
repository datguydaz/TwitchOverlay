/**
 * Queued LATEST FOLLOW / LATEST SUB smoked-glass events.
 * Default: indicator → sweep → clean name reveal → settle.
 * Smoke variant: static burst → type-in → red NEW flash → settle.
 * Demo previews never overwrite stored names.
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

  constructor(stage: HTMLElement, reducedMotion = false) {
    this.stage = stage;
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

  private newBadge(kind: SocialKind): HTMLElement | null {
    return this.root(kind)?.querySelector<HTMLElement>(".smk-new") ?? null;
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

  /** Smoke: static burst → type-in → NEW flash → settle. */
  private async playSmoke(job: Job, el: HTMLElement, nameEl: HTMLElement): Promise<void> {
    const badge = this.newBadge(job.kind);
    el.dataset.socialFx = "static";
    nameEl.textContent = "";
    nameEl.style.opacity = "";
    await this.wait(180);

    el.dataset.socialFx = "type";
    const chars = [...job.name];
    let built = "";
    for (const ch of chars) {
      built += ch;
      nameEl.textContent = built;
      await this.wait(22 + Math.floor(Math.random() * 28));
    }

    el.dataset.socialFx = "new";
    badge?.classList.add("on");
    await this.wait(1100);

    el.dataset.socialFx = "settle";
    await this.wait(1400);

    delete el.dataset.socialFx;
    badge?.classList.remove("on");
    if (job.restoreTo !== undefined) {
      nameEl.textContent = job.restoreTo;
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => {
      this.timers.push(window.setTimeout(r, ms));
    });
  }
}
