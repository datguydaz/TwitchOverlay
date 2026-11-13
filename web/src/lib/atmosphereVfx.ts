import type { AtmosphereSettings, AtmosphereIntensity } from "../../../shared/settings.ts";

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  a: number;
  life: number;
  /** Amber ember vs ash/dust — rain removed entirely */
  ember: boolean;
  /** Hot spark pop along the footer ember rail */
  hot: boolean;
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
  /* Richer bar life — dust/ash/embers/sparks (no rain); clipped to letterbox only */
  low: { dust: 40, smokeMin: 7000, smokeSpan: 9000, sparkMin: 7000, sparkSpan: 10000, lampMin: 3200, lampSpan: 4500 },
  medium: { dust: 72, smokeMin: 3800, smokeSpan: 5200, sparkMin: 4000, sparkSpan: 6000, lampMin: 1800, lampSpan: 2800 },
  high: { dust: 108, smokeMin: 2400, smokeSpan: 3400, sparkMin: 2400, sparkSpan: 3800, lampMin: 1100, lampSpan: 1800 },
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
    this.scheduleJitter();
    this.scheduleFooterPulse();
    this.scheduleHeaderPulse();
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
    // Prefer footer ember-rail life; top keeps side-corridor beat (no rain anywhere)
    const band: "top" | "bot" = Math.random() < 0.34 ? "top" : "bot";
    const hot = band === "bot" && Math.random() < 0.14;
    const ember = hot || (band === "bot" ? Math.random() < 0.62 : Math.random() < 0.38);
    let x: number;
    let y: number;
    if (band === "top") {
      // Bias embers into side corridors so DATGUYDAZ / social wells stay readable
      const side = Math.random();
      if (side < 0.42) x = w * (0.04 + Math.random() * 0.22);
      else if (side < 0.84) x = w * (0.74 + Math.random() * 0.22);
      else x = w * (0.38 + Math.random() * 0.24);
      y = Math.random() * Math.max(6, topH - 2);
    } else {
      x = Math.random() * w;
      // Cluster near the amber rail (top seam of footer)
      const railBias = hot || Math.random() < 0.7;
      y = railBias
        ? h - botH + 2 + Math.random() * Math.max(4, botH * 0.28)
        : h - Math.random() * Math.max(6, botH - 2);
    }
    return {
      x,
      y,
      vx: hot
        ? (Math.random() - 0.5) * 0.18
        : (Math.random() - 0.5) * (ember ? 0.07 : 0.1),
      vy: hot
        ? -0.04 - Math.random() * 0.06
        : (Math.random() - 0.5) * (ember ? 0.035 : 0.04) - (ember ? 0.018 : 0),
      r: hot ? 1.6 + Math.random() * 2.2 : ember ? 1.15 + Math.random() * 2.0 : 0.65 + Math.random() * 1.4,
      a: hot ? 0.7 + Math.random() * 0.3 : ember ? 0.45 + Math.random() * 0.45 : 0.16 + Math.random() * 0.28,
      life: randomLife ? Math.random() : 0,
      ember,
      hot,
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
      // ultrawide-smoke variant: mono white/gray dust (no amber)
      const mono = this.stage.dataset.variant === "smoke-flare";
      if (p.hot) {
        // Occasional hot pop along the ember rail
        const a = Math.min(1, p.a * fade * 1.15);
        ctx.beginPath();
        ctx.fillStyle = mono ? `rgba(255,255,255,${a})` : `rgba(255,200,110,${a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = mono
          ? `rgba(220,220,220,${a * 0.45})`
          : `rgba(255,230,160,${a * 0.45})`;
        ctx.arc(p.x, p.y, p.r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        if (p.life > 0.55) Object.assign(p, this.spawnDust(true));
      } else {
        ctx.beginPath();
        ctx.fillStyle = mono
          ? p.ember
            ? `rgba(230,230,230,${p.a * fade})`
            : `rgba(160,160,160,${p.a * fade * 0.8})`
          : p.ember
            ? `rgba(200,136,58,${p.a * fade})`
            : `rgba(170,160,140,${p.a * fade * 0.8})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  private scheduleJitter(): void {
    const delay = 4200 + Math.random() * 7000;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on") return;
        this.triggerJitter();
        this.scheduleJitter();
      }, delay),
    );
  }

  private triggerJitter(): void {
    const bars = [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].filter(
      (b) => b.dataset.hidden !== "true",
    );
    if (!bars.length) return;
    const bar = bars[(Math.random() * bars.length) | 0];
    bar.dataset.jitter = "1";
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.jitter;
      }, 140 + Math.random() * 180),
    );
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
    // Balanced spark pops — top + footer share the cinematic beat
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    const bottom = this.stage.querySelector<HTMLElement>("#uw-bottom");
    const pickTop = Math.random() < 0.48;
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

  private scheduleFooterPulse(): void {
    const delay = 3200 + Math.random() * 4800;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on") return;
        this.triggerFooterPulse();
        this.scheduleFooterPulse();
      }, delay),
    );
  }

  private triggerFooterPulse(): void {
    const bottom = this.stage.querySelector<HTMLElement>("#uw-bottom");
    if (!bottom || bottom.dataset.hidden === "true") return;
    bottom.dataset.footerPulse = "1";
    // Soft scan stutter + rail hot pop along the ember line
    bottom.dataset.scanStutter = "1";
    if (Math.random() < 0.7) {
      bottom.dataset.railPop = String(1 + ((Math.random() * 5) | 0));
      this.timers.push(
        window.setTimeout(() => {
          delete bottom.dataset.railPop;
        }, 320),
      );
    }
    if (Math.random() < 0.5) {
      bottom.dataset.sparks = Math.random() < 0.55 ? "l" : "r";
      this.timers.push(
        window.setTimeout(() => {
          delete bottom.dataset.sparks;
        }, 380),
      );
    }
    this.timers.push(
      window.setTimeout(() => {
        delete bottom.dataset.footerPulse;
        delete bottom.dataset.scanStutter;
      }, 420 + Math.random() * 280),
    );
  }

  private scheduleHeaderPulse(): void {
    const delay = 3600 + Math.random() * 5200;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on") return;
        this.triggerHeaderPulse();
        this.scheduleHeaderPulse();
      }, delay),
    );
  }

  private triggerHeaderPulse(): void {
    const top = this.stage.querySelector<HTMLElement>("#uw-top");
    if (!top || top.dataset.hidden === "true") return;
    top.dataset.headerPulse = "1";
    // Side spark — keep energy at edges, away from nameplate
    if (Math.random() < 0.6) {
      top.dataset.sparks = Math.random() < 0.5 ? "l" : "r";
      this.timers.push(
        window.setTimeout(() => {
          delete top.dataset.sparks;
        }, 360),
      );
    }
    this.timers.push(
      window.setTimeout(() => {
        delete top.dataset.headerPulse;
      }, 400 + Math.random() * 260),
    );
  }

  private clearTransient(): void {
    this.stage.querySelectorAll<HTMLElement>(".uw-bar").forEach((b) => {
      delete b.dataset.lamp;
      delete b.dataset.smoke;
      delete b.dataset.sparks;
      delete b.dataset.flicker;
      delete b.dataset.jitter;
      delete b.dataset.footerPulse;
      delete b.dataset.headerPulse;
      delete b.dataset.scanStutter;
      delete b.dataset.railPop;
    });
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
