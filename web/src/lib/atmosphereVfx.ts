import type { AtmosphereSettings, AtmosphereIntensity } from "../../../shared/settings.ts";

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  life: number;
  /** Rare amber ember vs ash/dust */
  ember: boolean;
  band: "top" | "bot";
};

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
  /* Amped but clipped to bars — dust/ash/embers/sparks/lamp; no gameplay fog */
  low: { dust: 16, smokeMin: 9000, smokeSpan: 11000, sparkMin: 9000, sparkSpan: 12000, lampMin: 3500, lampSpan: 5000 },
  medium: { dust: 28, smokeMin: 5000, smokeSpan: 7000, sparkMin: 5500, sparkSpan: 8000, lampMin: 2200, lampSpan: 3400 },
  high: { dust: 40, smokeMin: 3200, smokeSpan: 4500, sparkMin: 3500, sparkSpan: 5000, lampMin: 1400, lampSpan: 2200 },
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

  private barBands(): { topH: number; botH: number; w: number; h: number } {
    const w = this.canvas?.width || 800;
    const h = this.canvas?.height || 400;
    const stage = this.stage.getBoundingClientRect();
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    const bot = this.stage.querySelector<HTMLElement>("#uw-bottom");
    const topH =
      top && top.dataset.hidden !== "true"
        ? Math.max(8, Math.round(top.getBoundingClientRect().height))
        : Math.round(h * 0.12);
    const botH =
      bot && bot.dataset.hidden !== "true"
        ? Math.max(8, Math.round(bot.getBoundingClientRect().height))
        : Math.round(h * 0.12);
    void stage;
    return { topH: Math.min(topH, h * 0.22), botH: Math.min(botH, h * 0.22), w, h };
  }

  private spawnDust(randomLife = false): Dust {
    const { topH, botH, w, h } = this.barBands();
    // Footer slightly more atmospheric (~60% bottom / 40% top)
    const band: "top" | "bot" = Math.random() < 0.4 ? "top" : "bot";
    const ember = Math.random() < 0.22;
    let x: number;
    let y: number;
    if (band === "top") {
      // Bias near lamp / center-right lights
      x = Math.random() < 0.55 ? w * (0.5 + Math.random() * 0.2) : Math.random() * w;
      y = Math.random() * Math.max(6, topH - 2);
    } else {
      x = Math.random() < 0.35 ? w * (0.02 + Math.random() * 0.18) : Math.random() * w;
      y = h - Math.random() * Math.max(6, botH - 2);
    }
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * (ember ? 0.06 : 0.09),
      vy: (Math.random() - 0.5) * (ember ? 0.03 : 0.035) - (ember ? 0.01 : 0),
      r: ember ? 1 + Math.random() * 1.7 : 0.6 + Math.random() * 1.4,
      a: ember ? 0.35 + Math.random() * 0.42 : 0.16 + Math.random() * 0.28,
      life: randomLife ? Math.random() : 0,
      ember,
      band,
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
    const { topH, botH, w, h } = this.barBands();
    ctx.clearRect(0, 0, w, h);
    // Hard clip — never draw into gameplay hole
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, topH);
    ctx.rect(0, h - botH, w, botH);
    ctx.clip();
    for (const p of this.dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt * 0.00008;
      if (p.x < -4) p.x = w + 4;
      if (p.x > w + 4) p.x = -4;
      const inTop = p.y >= 0 && p.y <= topH;
      const inBot = p.y >= h - botH && p.y <= h;
      if (!inTop && !inBot) Object.assign(p, this.spawnDust(true));
      const fade = 0.55 + 0.45 * Math.sin(p.life * Math.PI * 2);
      ctx.beginPath();
      ctx.fillStyle = p.ember
        ? `rgba(200,136,58,${p.a * fade})`
        : `rgba(170,160,140,${p.a * fade * 0.75})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
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
    // Prefer footer (more atmospheric); occasionally top near lamp
    const bottom = this.stage.querySelector<HTMLElement>("#uw-bottom");
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    const preferFooter = Math.random() < 0.7;
    const bar =
      preferFooter && bottom && bottom.dataset.hidden !== "true"
        ? bottom
        : top && top.dataset.hidden !== "true"
          ? top
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
    // Rare local sparks near lights — prefer top lamp / footer vent side
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    const bottom = this.stage.querySelector<HTMLElement>("#uw-bottom");
    const pickTop = Math.random() < 0.55;
    const bar =
      pickTop && top && top.dataset.hidden !== "true"
        ? top
        : bottom && bottom.dataset.hidden !== "true"
          ? bottom
          : [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].find(
              (b) => b.dataset.hidden !== "true",
            );
    if (!bar) return;
    bar.dataset.sparks = pickTop ? "r" : "l";
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
