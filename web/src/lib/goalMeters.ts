import type { GoalsSettings, GoalMeterSettings } from "../../../shared/settings.ts";
import type { AtmPreviewKind } from "../../../shared/protocol.ts";

export type GoalKind = "follow" | "sub";

const SEGMENTS = 16;

type Applied = { current: number; target: number; completed: boolean };

/**
 * Footer follower/sub goal meters — segmented amber fill, leading blink, rare sweep.
 * Preview paths never mutate configured totals. Dedupes by applied snapshot + event ids.
 */
export class GoalMeters {
  private stage: HTMLElement;
  private cfg: GoalsSettings;
  private timers: number[] = [];
  private disposed = false;
  private applied: Record<GoalKind, Applied> = {
    follow: { current: -1, target: -1, completed: false },
    sub: { current: -1, target: -1, completed: false },
  };
  private seenEvents = new Set<string>();
  private osReduce =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  private reduced = false;

  constructor(stage: HTMLElement, cfg: GoalsSettings, reducedMotion = false) {
    this.stage = stage;
    this.cfg = structuredClone(cfg);
    this.reduced = reducedMotion;
    this.ensureDom();
    this.applyConfig(cfg, reducedMotion);
    document.addEventListener("visibilitychange", this.onVis);
  }

  applyConfig(cfg: GoalsSettings, reducedMotion = this.reduced): void {
    this.cfg = structuredClone(cfg);
    this.reduced = reducedMotion;
    const motionOff = this.reduced || this.osReduce || document.hidden;
    this.stage.dataset.goalsFx = motionOff ? "off" : "on";
    this.clearTimers();
    this.render("follow", cfg.follower, { animate: true });
    this.render("sub", cfg.subscriber, { animate: true });
    if (!motionOff) {
      this.scheduleSweep("follow", 0);
      this.scheduleSweep("sub", 4000);
    }
  }

  /** Labeled dashboard preview — does not change settings totals. */
  preview(kind: AtmPreviewKind): void {
    if (kind === "goal-follow-inc") this.previewInc("follow");
    else if (kind === "goal-sub-inc") this.previewInc("sub");
    else if (kind === "goal-follow-complete") this.previewComplete("follow");
    else if (kind === "goal-sub-complete") this.previewComplete("sub");
  }

  /** Future platform bridge — dedupe by event id. */
  ingestEvent(id: string, kind: GoalKind, delta = 1): void {
    if (!id || this.seenEvents.has(id)) return;
    this.seenEvents.add(id);
    if (this.seenEvents.size > 400) {
      const first = this.seenEvents.values().next().value;
      if (first) this.seenEvents.delete(first);
    }
    const key = kind === "follow" ? "follower" : "subscriber";
    const g = this.cfg[key];
    if (!g.enabled || g.platform === "manual") return;
    // Live bridge would update server totals; until then ignore non-manual ingest.
    void delta;
  }

  dispose(): void {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearTimers();
  }

  private onVis = (): void => {
    if (this.disposed) return;
    this.applyConfig(this.cfg, this.reduced);
  };

  private root(kind: GoalKind): HTMLElement | null {
    return this.stage.querySelector<HTMLElement>(
      kind === "follow" ? "#uw-goal-follow" : "#uw-goal-sub",
    );
  }

  private ensureDom(): void {
    for (const kind of ["follow", "sub"] as GoalKind[]) {
      const el = this.root(kind);
      if (!el) continue;
      const track = el.querySelector(".uw-goal-track");
      if (!track || track.children.length === SEGMENTS) continue;
      track.innerHTML = "";
      for (let i = 0; i < SEGMENTS; i++) {
        const s = document.createElement("i");
        s.className = "uw-goal-seg";
        track.appendChild(s);
      }
    }
  }

  private meterOf(kind: GoalKind): GoalMeterSettings {
    return kind === "follow" ? this.cfg.follower : this.cfg.subscriber;
  }

  private render(
    kind: GoalKind,
    g: GoalMeterSettings,
    opts: { animate: boolean; preview?: boolean },
  ): void {
    const el = this.root(kind);
    if (!el) return;
    el.hidden = !g.enabled;
    if (!g.enabled) return;

    const prev = this.applied[kind];
    const target = Math.max(1, g.target);
    const current = Math.max(0, g.current);
    const pctTrue = Math.round((current / target) * 100);
    const pctVisual = Math.min(100, pctTrue);
    const filled = Math.round((pctVisual / 100) * SEGMENTS);
    const completed = g.completed || current >= target;

    const title = el.querySelector(".uw-goal-title");
    const curEl = el.querySelector(".uw-goal-cur");
    const tgtEl = el.querySelector(".uw-goal-tgt");
    const pctEl = el.querySelector(".uw-goal-pct");
    const stEl = el.querySelector(".uw-goal-status");
    const track = el.querySelector(".uw-goal-track");
    if (title) title.textContent = g.title;
    if (tgtEl) tgtEl.textContent = String(target);
    if (pctEl) pctEl.textContent = `${pctVisual}%`;

    const platformNote =
      g.platform === "manual" ? "MANUAL" : g.platform === "twitch" ? "TWITCH*" : "KICK*";

    if (track) {
      const segs = [...track.querySelectorAll<HTMLElement>(".uw-goal-seg")];
      segs.forEach((seg, i) => {
        seg.classList.toggle("is-filled", i < filled);
        seg.classList.toggle("is-leading", i === filled - 1 && filled > 0 && !completed);
      });
    }

    const increased = prev.current >= 0 && current > prev.current && !opts.preview;
    const newlyComplete =
      !opts.preview &&
      prev.current >= 0 &&
      !prev.completed &&
      completed &&
      current >= target;

    if (curEl) {
      if (opts.animate && increased && this.stage.dataset.goalsFx === "on") {
        this.animateDigits(curEl as HTMLElement, prev.current, current);
      } else {
        curEl.textContent = String(current);
      }
    }

    if (stEl) {
      if (completed) {
        stEl.textContent =
          el.dataset.state === "celebrate" ? "OBJECTIVE COMPLETE" : "OBJECTIVE COMPLETE";
      } else {
        stEl.textContent = `${platformNote} // IN PROGRESS`;
      }
    }

    if (newlyComplete && this.stage.dataset.goalsFx === "on") {
      this.celebrate(kind);
    } else if (completed && el.dataset.state !== "celebrate") {
      el.dataset.state = "complete";
    } else if (!completed) {
      if (el.dataset.state !== "celebrate") el.dataset.state = "active";
    }

    if (increased && this.stage.dataset.goalsFx === "on") {
      el.classList.remove("uw-goal-bump");
      void el.offsetWidth;
      el.classList.add("uw-goal-bump");
      this.timers.push(
        window.setTimeout(() => el.classList.remove("uw-goal-bump"), 700),
      );
    }

    if (!opts.preview) {
      this.applied[kind] = { current, target, completed };
    }
  }

  private animateDigits(el: HTMLElement, from: number, to: number): void {
    const start = performance.now();
    const dur = 480;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const v = Math.round(from + (to - from) * p);
      el.textContent = String(v);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  private celebrate(kind: GoalKind): void {
    const el = this.root(kind);
    if (!el) return;
    el.dataset.state = "celebrate";
    const st = el.querySelector(".uw-goal-status");
    if (st) st.textContent = "OBJECTIVE COMPLETE";
    const ms = 3500 + Math.random() * 1500;
    this.timers.push(
      window.setTimeout(() => {
        if (el.dataset.state === "celebrate") el.dataset.state = "complete";
      }, ms),
    );
  }

  private previewInc(kind: GoalKind): void {
    const g = structuredClone(this.meterOf(kind));
    const el = this.root(kind);
    if (!el || !g.enabled) return;
    const shown = this.applied[kind].current >= 0 ? this.applied[kind].current : g.current;
    g.current = shown + 1;
    g.completed = false;
    this.render(kind, g, { animate: true, preview: true });
    el.classList.remove("uw-goal-bump");
    void el.offsetWidth;
    el.classList.add("uw-goal-bump");
    this.timers.push(
      window.setTimeout(() => {
        el.classList.remove("uw-goal-bump");
        this.render(kind, this.meterOf(kind), { animate: false, preview: false });
      }, 900),
    );
  }

  private previewComplete(kind: GoalKind): void {
    const el = this.root(kind);
    if (!el || !this.meterOf(kind).enabled) return;
    const g = structuredClone(this.meterOf(kind));
    g.current = Math.max(g.current, g.target);
    g.completed = true;
    this.render(kind, g, { animate: true, preview: true });
    el.dataset.state = "celebrate";
    const st = el.querySelector(".uw-goal-status");
    if (st) st.textContent = "OBJECTIVE COMPLETE";
    this.timers.push(
      window.setTimeout(() => {
        this.render(kind, this.meterOf(kind), { animate: false, preview: false });
      }, 4200),
    );
  }

  private scheduleSweep(kind: GoalKind, extraDelay: number): void {
    const delay = extraDelay + 8000 + Math.random() * 7000;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.goalsFx !== "on") return;
        const el = this.root(kind);
        if (el && !el.hidden && el.dataset.state !== "celebrate") {
          el.classList.remove("uw-goal-sweeping");
          void el.offsetWidth;
          el.classList.add("uw-goal-sweeping");
          this.timers.push(
            window.setTimeout(() => el.classList.remove("uw-goal-sweeping"), 900),
          );
        }
        this.scheduleSweep(kind, 0);
      }, delay),
    );
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
