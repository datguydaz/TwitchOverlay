import type { AtmosphereIntensity, TextEffectsSettings } from "../../../shared/settings.ts";
import type { AtmPreviewKind } from "../../../shared/protocol.ts";

type Target =
  | "id"
  | "op"
  | "follow-label"
  | "follow-name"
  | "sub-label"
  | "sub-name"
  | "hold"
  | "status";

const INTENSITY: Record<
  AtmosphereIntensity,
  { dipMin: number; dipSpan: number; sweepMin: number; sweepSpan: number; opMin: number; opSpan: number; holdMin: number; holdSpan: number }
> = {
  low: { dipMin: 9000, dipSpan: 14000, sweepMin: 18000, sweepSpan: 22000, opMin: 2800, opSpan: 4200, holdMin: 12000, holdSpan: 16000 },
  medium: { dipMin: 6000, dipSpan: 10000, sweepMin: 12000, sweepSpan: 16000, opMin: 1800, opSpan: 3200, holdMin: 8000, holdSpan: 12000 },
  high: { dipMin: 4000, dipSpan: 7000, sweepMin: 8000, sweepSpan: 11000, opMin: 1200, opSpan: 2200, holdMin: 5000, holdSpan: 8000 },
};

const ELECTRONIC: Target[] = ["follow-label", "follow-name", "sub-label", "sub-name", "status"];
const SIGN: Target[] = ["id", "op", "hold", ...ELECTRONIC];

/**
 * Worn electrical-sign text life — opacity/transform only; glow layer separate.
 * Independent timings; does not drive ambient atmosphere VFX.
 */
export class TextLifeVfx {
  private stage: HTMLElement;
  private cfg: TextEffectsSettings;
  private timers: number[] = [];
  private disposed = false;
  private osReduce =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(stage: HTMLElement, cfg: TextEffectsSettings) {
    this.stage = stage;
    this.cfg = { ...cfg };
    this.applyConfig(cfg);
    document.addEventListener("visibilitychange", this.onVis);
  }

  applyConfig(cfg: TextEffectsSettings): void {
    this.cfg = { ...cfg };
    const motionOff = this.cfg.reducedMotion || this.osReduce || document.hidden;
    const on = this.cfg.enabled && !motionOff;
    this.stage.dataset.textFx = on ? "on" : "off";
    this.stage.dataset.textFxIntensity = this.cfg.intensity;
    this.clearTimers();
    this.clearTransient();
    if (!on) return;
    this.scheduleDip();
    this.scheduleSweep();
    this.scheduleOp();
    this.scheduleHold();
    this.scheduleGhost();
  }

  pulseSocial(kind: "follow" | "sub"): void {
    if (this.stage.dataset.textFx !== "on") return;
    const label = kind === "follow" ? "follow-label" : "sub-label";
    const name = kind === "follow" ? "follow-name" : "sub-name";
    this.pulse(label, "activate", 820);
    this.pulse(name, "activate", 820);
  }

  preview(kind: AtmPreviewKind): void {
    if (kind === "follow" || kind === "sub") {
      this.pulseSocial(kind);
      return;
    }
    if (kind === "text-dip") this.triggerDip();
    else if (kind === "text-sweep") this.triggerSweep();
    else if (kind === "text-op") this.triggerOp(true);
    else if (kind === "text-hold") this.triggerHold();
  }

  dispose(): void {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearTimers();
    this.clearTransient();
  }

  private onVis = (): void => {
    if (this.disposed) return;
    this.applyConfig(this.cfg);
  };

  private el(target: Target): HTMLElement | null {
    return this.stage.querySelector<HTMLElement>(`[data-text-fx="${target}"]`);
  }

  private pulse(target: Target, state: string, ms: number): void {
    const el = this.el(target);
    if (!el) return;
    el.dataset.fx = state;
    this.timers.push(
      window.setTimeout(() => {
        if (el.dataset.fx === state) delete el.dataset.fx;
      }, ms),
    );
  }

  private scheduleDip(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.dipMin + Math.random() * spec.dipSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.textFx !== "on") return;
        this.triggerDip();
        this.scheduleDip();
      }, delay),
    );
  }

  private scheduleSweep(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.sweepMin + Math.random() * spec.sweepSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.textFx !== "on") return;
        this.triggerSweep();
        this.scheduleSweep();
      }, delay),
    );
  }

  private scheduleOp(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.opMin + Math.random() * spec.opSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.textFx !== "on") return;
        this.triggerOp(false);
        this.scheduleOp();
      }, delay),
    );
  }

  private scheduleHold(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.holdMin + Math.random() * spec.holdSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.textFx !== "on") return;
        this.triggerHold();
        this.scheduleHold();
      }, delay),
    );
  }

  private scheduleGhost(): void {
    const delay = 14000 + Math.random() * 18000;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.textFx !== "on") return;
        const t = ELECTRONIC[(Math.random() * ELECTRONIC.length) | 0];
        this.pulse(t, "ghost", 700);
        this.scheduleGhost();
      }, delay),
    );
  }

  private triggerDip(): void {
    const pool = SIGN.filter((t) => t !== "op");
    const n = 1 + ((Math.random() * 2) | 0);
    for (let i = 0; i < n; i++) {
      const t = pool[(Math.random() * pool.length) | 0];
      const hold = 180 + Math.random() * 420;
      this.pulse(t, "dip", hold);
      this.timers.push(
        window.setTimeout(() => {
          this.pulse(t, "recover", 650 + Math.random() * 400);
        }, hold),
      );
    }
  }

  private triggerSweep(): void {
    const t = SIGN[(Math.random() * SIGN.length) | 0];
    this.pulse(t, "sweep", 900 + Math.random() * 400);
  }

  private triggerOp(force: boolean): void {
    const mode = force || Math.random() < 0.55 ? "flutter" : "pulse";
    this.pulse("op", mode, mode === "flutter" ? 520 : 900);
  }

  private triggerHold(): void {
    // Painted plate lit by faulty nearby light — illumination only
    this.pulse("hold", "lit-dip", 220 + Math.random() * 280);
    this.timers.push(
      window.setTimeout(() => {
        this.pulse("hold", "lit-recover", 800 + Math.random() * 500);
      }, 240),
    );
  }

  private clearTransient(): void {
    this.stage.querySelectorAll<HTMLElement>("[data-text-fx]").forEach((el) => {
      delete el.dataset.fx;
    });
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
