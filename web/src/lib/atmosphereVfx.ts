import type { AtmosphereSettings, AtmosphereIntensity } from "../../../shared/settings.ts";

type Dust = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number };

const INTENSITY: Record<
  AtmosphereIntensity,
  {
    dust: number;
    smokeMin: number;
    smokeSpan: number;
    sparkMin: number;
    sparkSpan: number;
    lampMin: number;
    lampSpan: number;
  }
> = {
  /* Quiet dark: sparse dust in light, rare sparks, lamp flutter — no strobe */
  low: { dust: 5, smokeMin: 40000, smokeSpan: 40000, sparkMin: 28000, sparkSpan: 32000, lampMin: 7000, lampSpan: 10000 },
  medium: { dust: 9, smokeMin: 28000, smokeSpan: 28000, sparkMin: 18000, sparkSpan: 22000, lampMin: 4500, lampSpan: 7000 },
  high: { dust: 14, smokeMin: 18000, smokeSpan: 20000, sparkMin: 11000, sparkSpan: 14000, lampMin: 3000, lampSpan: 4500 },
};

/**
 * Console atmosphere — lamp, vent wisp, corner sparks, edge dust.
 * Scoped to #uw-stage; pauses when hidden; no audio.
 */
export class AtmosphereVfx {
  private stage: HTMLElement;
  private cfg: AtmosphereSettings;
  private dust: Dust[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private raf: number | null = null;
  private lastTs = 0;
  private timers: number[] = [];
  private disposed = false;
  private osReduce =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(stage: HTMLElement, cfg: AtmosphereSettings) {
    this.stage = stage;
    this.cfg = { ...cfg };
    this.ensureLayers();
    this.applyConfig(cfg);
    document.addEventListener("visibilitychange", this.onVis);
  }

  applyConfig(cfg: AtmosphereSettings): void {
    this.cfg = { ...cfg };
    const motionOff = this.cfg.reducedMotion || this.osReduce || document.hidden;
    const on = this.cfg.enabled && !motionOff;
    this.stage.dataset.atm = on ? "on" : "off";
    this.stage.dataset.atmIntensity = this.cfg.intensity;
    this.stage.dataset.atmDust = this.cfg.dust && on ? "1" : "0";
    this.stage.dataset.atmSmoke = this.cfg.smoke && on ? "1" : "0";
    this.stage.dataset.atmSparks = this.cfg.sparks && on ? "1" : "0";
    this.stage.dataset.atmFlicker = this.cfg.flicker && on ? "1" : "0";
    this.clearTimers();
    if (!on) {
      this.stopLoop();
      this.clearDust();
      this.clearTransient();
      return;
    }
    this.bootDust();
    this.startLoop();
    if (this.cfg.flicker) this.scheduleLamp();
    if (this.cfg.smoke) this.scheduleSmoke();
    if (this.cfg.sparks) this.scheduleSparks();
  }

  pulseSocial(kind: "follow" | "sub"): void {
    const id = kind === "follow" ? "#uw-follower" : "#uw-subscriber";
    const el = this.stage.querySelector<HTMLElement>(id);
    if (!el || el.hidden) return;
    el.classList.remove("uw-social-activate");
    void el.offsetWidth;
    el.classList.add("uw-social-activate");
    window.setTimeout(() => el.classList.remove("uw-social-activate"), 900);
  }

  preview(kind: "flicker" | "smoke" | "sparks" | "follow" | "sub"): void {
    if (kind === "follow" || kind === "sub") {
      this.pulseSocial(kind);
      return;
    }
    if (kind === "flicker") this.triggerLamp();
    else if (kind === "smoke") this.triggerSmoke();
    else if (kind === "sparks") this.triggerSparks();
  }

  dispose(): void {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearTimers();
    this.stopLoop();
    this.clearTransient();
  }

  private onVis = (): void => {
    if (this.disposed) return;
    this.applyConfig(this.cfg);
  };

  private ensureLayers(): void {
    let canvas = this.stage.querySelector<HTMLCanvasElement>("#uw-atm-dust-shared");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "uw-atm-dust-shared";
      canvas.className = "uw-atm-dust-shared";
      canvas.setAttribute("aria-hidden", "true");
      this.stage.appendChild(canvas);
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }

  private bootDust(): void {
    if (!this.cfg.dust || !this.canvas) {
      this.clearDust();
      return;
    }
    const n = INTENSITY[this.cfg.intensity].dust;
    this.dust = [];
    for (let i = 0; i < n; i++) this.dust.push(this.spawnDust(true));
  }

  private spawnDust(randomLife = false): Dust {
    const w = this.canvas?.width || 800;
    const h = this.canvas?.height || 400;
    // Prefer near lamp glow in top bar (center-right of top band) + footer vent left
    const zone = Math.random();
    let x: number;
    let y: number;
    if (zone < 0.55) {
      // top lamp area (~55–70% across top band)
      x = w * (0.52 + Math.random() * 0.16);
      y = Math.random() * Math.max(10, h * 0.12);
    } else if (zone < 0.8) {
      x = Math.random() * w;
      y = Math.random() * Math.max(8, h * 0.1);
    } else {
      x = w * (0.04 + Math.random() * 0.12);
      y = h - Math.random() * Math.max(8, h * 0.12);
    }
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.04,
      r: 0.5 + Math.random() * 1.2,
      a: 0.1 + Math.random() * 0.22,
      life: randomLife ? Math.random() : 0,
    };
  }

  private clearDust(): void {
    this.dust = [];
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private startLoop(): void {
    if (this.raf != null) return;
    this.lastTs = performance.now();
    const tick = (ts: number) => {
      if (this.disposed || this.stage.dataset.atm !== "on") {
        this.raf = null;
        return;
      }
      const dt = Math.min(40, ts - this.lastTs);
      this.lastTs = ts;
      this.resizeCanvas();
      this.stepDust(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.raf != null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const r = this.stage.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.cfg.dust) this.bootDust();
    }
  }

  private stepDust(dt: number): void {
    if (!this.ctx || !this.canvas || !this.cfg.dust) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const topBand = h * 0.14;
    const botBand = h * 0.14;
    for (const p of this.dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt * 0.00008;
      if (p.x < -4) p.x = w + 4;
      if (p.x > w + 4) p.x = -4;
      if (p.y > topBand && p.y < h - botBand) {
        Object.assign(p, this.spawnDust(true));
      }
      const fade = 0.55 + 0.45 * Math.sin(p.life * Math.PI * 2);
      ctx.beginPath();
      ctx.fillStyle = `rgba(200,170,120,${p.a * fade * 0.85})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private scheduleLamp(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.lampMin + Math.random() * spec.lampSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on" || !this.cfg.flicker) return;
        this.triggerLamp();
        this.scheduleLamp();
      }, delay),
    );
  }

  private scheduleSmoke(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.smokeMin + Math.random() * spec.smokeSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on" || !this.cfg.smoke) return;
        this.triggerSmoke();
        this.scheduleSmoke();
      }, delay),
    );
  }

  private scheduleSparks(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.sparkMin + Math.random() * spec.sparkSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on" || !this.cfg.sparks) return;
        this.triggerSparks();
        this.scheduleSparks();
      }, delay),
    );
  }

  private triggerLamp(): void {
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    if (!top || top.dataset.hidden === "true") return;
    top.dataset.lamp = "dim";
    const dimHold = 180 + Math.random() * 420;
    const recoverMs = 700 + Math.random() * 500;
    this.timers.push(
      window.setTimeout(() => {
        top.dataset.lamp = "recover";
        this.timers.push(
          window.setTimeout(() => {
            delete top.dataset.lamp;
          }, recoverMs),
        );
      }, dimHold),
    );
  }

  private triggerSmoke(): void {
    const bottom = this.stage.querySelector<HTMLElement>("#uw-bottom");
    const bar =
      bottom && bottom.dataset.hidden !== "true"
        ? bottom
        : this.stage.querySelector<HTMLElement>(".uw-bar:not([data-hidden='true'])");
    if (!bar) return;
    bar.dataset.smoke = "1";
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.smoke;
      }, 2500),
    );
  }

  private triggerSparks(): void {
    const bars = [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].filter(
      (b) => b.dataset.hidden !== "true",
    );
    const bar = bars[Math.floor(Math.random() * Math.max(1, bars.length))];
    if (!bar) return;
    bar.dataset.sparks = Math.random() < 0.5 ? "l" : "r";
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.sparks;
      }, 420),
    );
  }

  private clearTransient(): void {
    this.stage.querySelectorAll<HTMLElement>(".uw-bar").forEach((b) => {
      delete b.dataset.lamp;
      delete b.dataset.smoke;
      delete b.dataset.sparks;
      delete b.dataset.flicker;
    });
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
