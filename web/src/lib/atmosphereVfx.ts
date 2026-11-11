import type { AtmosphereSettings, AtmosphereIntensity } from "../../../shared/settings.ts";

type Dust = { x: number; y: number; vx: number; vy: number; r: number; a: number; life: number };

const INTENSITY: Record<
  AtmosphereIntensity,
  { dust: number; smokeMin: number; smokeSpan: number; sparkMin: number; sparkSpan: number; flickerMin: number; flickerSpan: number }
> = {
  low: { dust: 10, smokeMin: 48000, smokeSpan: 42000, sparkMin: 32000, sparkSpan: 32000, flickerMin: 9000, flickerSpan: 14000 },
  medium: { dust: 18, smokeMin: 28000, smokeSpan: 28000, sparkMin: 28000, sparkSpan: 22000, flickerMin: 6000, flickerSpan: 10000 },
  high: { dust: 28, smokeMin: 16000, smokeSpan: 20000, sparkMin: 20000, sparkSpan: 18000, flickerMin: 4000, flickerSpan: 7000 },
};

/**
 * Scoped bunker-frame atmosphere — only touches #uw-stage descendants.
 * Pauses when hidden; no audio; center gameplay hole stays clear.
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
    if (this.cfg.flicker) this.scheduleFlicker();
    if (this.cfg.smoke) this.scheduleSmoke();
    if (this.cfg.sparks) this.scheduleSparks();
  }

  /** Brief edge brighten on follow/sub panels (simulated or live name change). */
  pulseSocial(kind: "follow" | "sub"): void {
    if (!this.cfg.enabled) return;
    const id = kind === "follow" ? "#uw-follower" : "#uw-subscriber";
    const el = this.stage.querySelector<HTMLElement>(id);
    if (!el || el.hidden) return;
    el.classList.remove("uw-social-activate");
    void el.offsetWidth;
    el.classList.add("uw-social-activate");
    window.setTimeout(() => el.classList.remove("uw-social-activate"), 900);
  }

  /** Dashboard preview buttons. */
  preview(kind: "flicker" | "smoke" | "sparks" | "follow" | "sub"): void {
    if (kind === "follow" || kind === "sub") {
      this.pulseSocial(kind);
      return;
    }
    if (kind === "flicker") this.triggerFlicker();
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
    for (const bar of this.stage.querySelectorAll<HTMLElement>(".uw-bar")) {
      if (!bar.querySelector(".uw-atm")) {
        const atm = document.createElement("div");
        atm.className = "uw-atm";
        atm.setAttribute("aria-hidden", "true");
        atm.innerHTML = `
          <canvas class="uw-atm-dust" width="1" height="1"></canvas>
          <div class="uw-atm-flicker"></div>
          <div class="uw-atm-smoke"><span></span><span></span></div>
          <div class="uw-atm-sparks"><i></i><i></i><i></i><i></i></div>
          <div class="uw-atm-leds"><span></span><span></span><span></span></div>
        `;
        bar.insertBefore(atm, bar.firstChild);
      }
      if (!bar.querySelector(".uw-wear")) {
        const wear = document.createElement("div");
        wear.className = "uw-wear";
        wear.setAttribute("aria-hidden", "true");
        wear.innerHTML = `
          <span class="uw-chip uw-chip-a"></span>
          <span class="uw-chip uw-chip-b"></span>
          <span class="uw-scratch uw-scratch-a"></span>
          <span class="uw-scratch uw-scratch-b"></span>
          <span class="uw-grime uw-grime-l"></span>
          <span class="uw-grime uw-grime-r"></span>
          <span class="uw-blood"></span>
          <span class="uw-rust"></span>
          <span class="uw-vent"></span>
        `;
        bar.insertBefore(wear, bar.firstChild);
      }
    }
    // One shared dust canvas on stage (covers both bars, transparent center)
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
    // Bias to top/bottom band edges — keep center hole clear
    const band = Math.random() < 0.55 ? "top" : "bottom";
    const y =
      band === "top"
        ? Math.random() * Math.max(8, h * 0.14)
        : h - Math.random() * Math.max(8, h * 0.14);
    return {
      x: Math.random() * w,
      y,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.05,
      r: 0.6 + Math.random() * 1.4,
      a: 0.08 + Math.random() * 0.18,
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
    const topBand = h * 0.145;
    const botBand = h * 0.145;
    for (const p of this.dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt * 0.00008;
      if (p.x < -4) p.x = w + 4;
      if (p.x > w + 4) p.x = -4;
      // Clamp into edge bands (never mid canvas)
      if (p.y > topBand && p.y < h - botBand) {
        p.y = Math.random() < 0.5 ? Math.random() * topBand : h - Math.random() * botBand;
      }
      const fade = 0.55 + 0.45 * Math.sin(p.life * Math.PI * 2);
      ctx.beginPath();
      ctx.fillStyle = `rgba(196,181,154,${p.a * fade})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private scheduleFlicker(): void {
    const spec = INTENSITY[this.cfg.intensity];
    const delay = spec.flickerMin + Math.random() * spec.flickerSpan;
    this.timers.push(
      window.setTimeout(() => {
        if (this.disposed || this.stage.dataset.atm !== "on" || !this.cfg.flicker) return;
        this.triggerFlicker();
        this.scheduleFlicker();
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

  private triggerFlicker(): void {
    const bars = [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].filter(
      (b) => b.dataset.hidden !== "true",
    );
    const bar = bars[Math.floor(Math.random() * Math.max(1, bars.length))];
    if (!bar) return;
    const el = bar.querySelector(".uw-atm-flicker");
    if (!el) return;
    // Local patch — randomize position within bar (not full-screen)
    const x = 8 + Math.random() * 84;
    const y = 10 + Math.random() * 70;
    (el as HTMLElement).style.setProperty("--fx", `${x}%`);
    (el as HTMLElement).style.setProperty("--fy", `${y}%`);
    bar.dataset.flicker = "1";
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.flicker;
      }, 180 + Math.random() * 160),
    );
  }

  private triggerSmoke(): void {
    const bars = [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].filter(
      (b) => b.dataset.hidden !== "true",
    );
    const bar = bars[Math.floor(Math.random() * Math.max(1, bars.length))];
    if (!bar) return;
    bar.dataset.smoke = "1";
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.smoke;
      }, 2600),
    );
  }

  private triggerSparks(): void {
    const bars = [...this.stage.querySelectorAll<HTMLElement>(".uw-bar")].filter(
      (b) => b.dataset.hidden !== "true",
    );
    const bar = bars[Math.floor(Math.random() * Math.max(1, bars.length))];
    if (!bar) return;
    const corner = Math.random() < 0.5 ? "l" : "r";
    bar.dataset.sparks = corner;
    this.timers.push(
      window.setTimeout(() => {
        delete bar.dataset.sparks;
      }, 420),
    );
  }

  private clearTransient(): void {
    this.stage.querySelectorAll<HTMLElement>(".uw-bar").forEach((b) => {
      delete b.dataset.flicker;
      delete b.dataset.smoke;
      delete b.dataset.sparks;
      delete b.dataset.glitch;
    });
  }

  private clearTimers(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
  }
}
