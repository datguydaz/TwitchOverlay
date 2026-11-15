/**
 * JS-driven idle breath + head life.
 *
 * Why not CSS infinite loops: after hours (and especially after OBS pauses the
 * Browser Source → document.hidden), long-running CSS animation currentTime
 * drifts into float-precision noise and can produce a visible "spasm" when the
 * tab resumes. Here phase stays wrapped in a small range and dt is hard-capped.
 */

export type IdleMotionOptions = {
  breathEl: SVGElement | null;
  headEl: SVGElement | null;
  /** When true, skip motion (prefers-reduced-motion). */
  reducedMotion?: boolean;
};

type HeadPhase =
  | { kind: "rest"; until: number }
  | { kind: "anticipate"; fromYaw: number; fromPitch: number; toYaw: number; toPitch: number; t0: number; dur: number }
  | { kind: "turn"; fromYaw: number; fromPitch: number; toYaw: number; toPitch: number; t0: number; dur: number }
  | { kind: "hold"; yaw: number; pitch: number; until: number }
  | { kind: "return"; fromYaw: number; fromPitch: number; t0: number; dur: number };

const MAX_DT_MS = 48;
const BREATH_Y_PX = 1.55;
const HEAD_YAW_MAX = 2.05;
const HEAD_PITCH_MAX = 0.55;
const MICRO_YAW = 0.18;
const MICRO_PITCH = 0.12;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function wrap01(t: number): number {
  const x = t % 1;
  return x < 0 ? x + 1 : x;
}

/** Smoothstep 0..1 */
function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

/** Softer ease with slight anticipation overshoot on the way in (small). */
function easeInOutAnticipation(t: number): number {
  const x = clamp(t, 0, 1);
  // smooth hermite with mild ease
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

export class IdleMotion {
  private breathEl: SVGElement | null;
  private headEl: SVGElement | null;
  private reducedMotion: boolean;
  private raf: number | null = null;
  private lastTs = 0;
  private running = false;
  private disposed = false;

  /** Breath phase in [0,1); periodMs varies slowly. */
  private breathPhase = 0;
  private breathPeriodMs = 5600;
  private breathPeriodTarget = 5600;
  private breathPeriodRetargetAt = 0;

  private head: HeadPhase = { kind: "rest", until: 0 };
  private yaw = 0;
  private pitch = 0;
  private microT = 0;
  private nowMs = 0;

  /** Test/accelerated-run hook: multiply simulated time. */
  timeScale = 1;

  constructor(opts: IdleMotionOptions) {
    this.breathEl = opts.breathEl;
    this.headEl = opts.headEl;
    this.reducedMotion = !!opts.reducedMotion;
  }

  start(): void {
    if (this.disposed || this.running) return;
    if (this.reducedMotion) {
      this.write(0, 0, 0);
      return;
    }
    this.running = true;
    this.lastTs = 0;
    this.nowMs = performance.now();
    this.breathPeriodRetargetAt = this.nowMs + rand(8000, 16000);
    this.head = { kind: "rest", until: this.nowMs + rand(1800, 4200) };
    this.kick();
  }

  stop(): void {
    this.running = false;
    if (this.raf != null) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.lastTs = 0;
  }

  /** Pause without resetting phase — used on document.hidden. */
  pause(): void {
    this.stop();
  }

  /** Resume from last phase — no catch-up jump. */
  resume(): void {
    if (this.disposed || this.reducedMotion) return;
    this.lastTs = 0;
    if (!this.running) {
      this.running = true;
      this.kick();
    }
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
    this.breathEl = null;
    this.headEl = null;
  }

  /**
   * Advance simulation by ms (for accelerated long-run tests).
   * Caps each internal step so spasms cannot appear from huge dt.
   */
  advanceForTest(ms: number): void {
    let left = Math.max(0, ms);
    while (left > 0) {
      const step = Math.min(left, MAX_DT_MS);
      this.step(step);
      left -= step;
    }
    this.writeTransforms();
  }

  /** Snapshot for accelerated-run assertions. */
  sample(): { yaw: number; pitch: number; breathY: number; breathPhase: number } {
    return {
      yaw: this.yaw,
      pitch: this.pitch,
      breathY: this.breathY(),
      breathPhase: this.breathPhase,
    };
  }

  private kick(): void {
    if (this.raf != null || !this.running || this.disposed) return;
    const tick = (ts: number) => {
      this.raf = null;
      if (!this.running || this.disposed) return;
      if (document.hidden) {
        this.lastTs = 0;
        this.raf = requestAnimationFrame(tick);
        return;
      }
      if (this.lastTs === 0) {
        this.lastTs = ts;
        this.raf = requestAnimationFrame(tick);
        return;
      }
      let dt = (ts - this.lastTs) * this.timeScale;
      this.lastTs = ts;
      // Hard cap — never apply a multi-second catch-up after OBS pause / tab sleep.
      if (!Number.isFinite(dt) || dt < 0) dt = 0;
      if (dt > MAX_DT_MS) dt = MAX_DT_MS;
      this.step(dt);
      this.writeTransforms();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  private step(dt: number): void {
    this.nowMs += dt;
    this.stepBreath(dt);
    this.stepHead(dt);
    this.microT += dt * 0.0011;
  }

  private stepBreath(dt: number): void {
    if (this.nowMs >= this.breathPeriodRetargetAt) {
      this.breathPeriodTarget = rand(4800, 7200);
      this.breathPeriodRetargetAt = this.nowMs + rand(9000, 18000);
    }
    // Ease period toward target (variable rhythm without hard jumps).
    this.breathPeriodMs += (this.breathPeriodTarget - this.breathPeriodMs) * Math.min(1, dt / 4000);
    this.breathPeriodMs = clamp(this.breathPeriodMs, 4200, 7800);
    this.breathPhase = wrap01(this.breathPhase + dt / this.breathPeriodMs);
  }

  private breathY(): number {
    // Calm chest rise: sine with slightly longer inhale (phase warp).
    const p = this.breathPhase;
    const warped = p < 0.55 ? (p / 0.55) * 0.5 : 0.5 + ((p - 0.55) / 0.45) * 0.5;
    const wave = Math.sin(warped * Math.PI * 2);
    // Map [-1,1] → [0, -BREATH_Y_PX] (up on inhale)
    return ((wave - 1) * 0.5) * BREATH_Y_PX;
  }

  private stepHead(dt: number): void {
    const h = this.head;
    switch (h.kind) {
      case "rest": {
        // Micro-movements while resting.
        const mYaw = Math.sin(this.microT * 1.7) * MICRO_YAW + Math.sin(this.microT * 0.37) * 0.06;
        const mPitch =
          Math.sin(this.microT * 1.15) * MICRO_PITCH + Math.sin(this.microT * 0.51) * 0.05;
        this.yaw += (mYaw - this.yaw) * Math.min(1, dt / 420);
        this.pitch += (mPitch - this.pitch) * Math.min(1, dt / 420);
        if (this.nowMs >= h.until) this.beginGlance();
        break;
      }
      case "anticipate": {
        const u = easeInOutAnticipation((this.nowMs - h.t0) / h.dur);
        // Small opposite nudge before the real turn.
        const ant = 1 - Math.abs(u * 2 - 1);
        this.yaw = h.fromYaw + (h.fromYaw - h.toYaw) * 0.12 * ant;
        this.pitch = h.fromPitch + (h.fromPitch - h.toPitch) * 0.1 * ant;
        if (this.nowMs >= h.t0 + h.dur) {
          this.head = {
            kind: "turn",
            fromYaw: this.yaw,
            fromPitch: this.pitch,
            toYaw: h.toYaw,
            toPitch: h.toPitch,
            t0: this.nowMs,
            dur: rand(520, 920),
          };
        }
        break;
      }
      case "turn": {
        const u = easeInOutAnticipation((this.nowMs - h.t0) / h.dur);
        this.yaw = h.fromYaw + (h.toYaw - h.fromYaw) * u;
        this.pitch = h.fromPitch + (h.toPitch - h.fromPitch) * u;
        if (this.nowMs >= h.t0 + h.dur) {
          this.yaw = h.toYaw;
          this.pitch = h.toPitch;
          this.head = {
            kind: "hold",
            yaw: h.toYaw,
            pitch: h.toPitch,
            until: this.nowMs + rand(700, 2200),
          };
        }
        break;
      }
      case "hold": {
        // Tiny settle noise on hold (glance hold).
        const settle =
          Math.sin(this.microT * 3.1) * 0.05 + Math.sin(this.microT * 0.9) * 0.03;
        this.yaw = h.yaw + settle;
        this.pitch = h.pitch + settle * 0.4;
        if (this.nowMs >= h.until) {
          this.head = {
            kind: "return",
            fromYaw: this.yaw,
            fromPitch: this.pitch,
            t0: this.nowMs,
            dur: rand(600, 1100),
          };
        }
        break;
      }
      case "return": {
        const u = smoothstep((this.nowMs - h.t0) / h.dur);
        this.yaw = h.fromYaw + (0 - h.fromYaw) * u;
        this.pitch = h.fromPitch + (0 - h.fromPitch) * u;
        if (this.nowMs >= h.t0 + h.dur) {
          this.yaw = 0;
          this.pitch = 0;
          this.head = { kind: "rest", until: this.nowMs + rand(2200, 6500) };
        }
        break;
      }
      default: {
        const _never: never = h;
        void _never;
        this.head = { kind: "rest", until: this.nowMs + 3000 };
      }
    }
    this.yaw = clamp(this.yaw, -HEAD_YAW_MAX, HEAD_YAW_MAX);
    this.pitch = clamp(this.pitch, -HEAD_PITCH_MAX, HEAD_PITCH_MAX);
  }

  private beginGlance(): void {
    const side = Math.random() < 0.5 ? -1 : 1;
    const toYaw = side * rand(0.7, HEAD_YAW_MAX);
    const toPitch = rand(-HEAD_PITCH_MAX, HEAD_PITCH_MAX * 0.6);
    this.head = {
      kind: "anticipate",
      fromYaw: this.yaw,
      fromPitch: this.pitch,
      toYaw,
      toPitch,
      t0: this.nowMs,
      dur: rand(140, 260),
    };
  }

  private writeTransforms(): void {
    this.write(this.breathY(), this.yaw, this.pitch);
  }

  private write(breathY: number, yaw: number, pitch: number): void {
    if (this.breathEl) {
      this.breathEl.style.transform = `translate3d(0, ${breathY.toFixed(3)}px, 0)`;
    }
    if (this.headEl) {
      // pitch as tiny vertical translate + rotate for turn
      const y = (pitch * 1.2).toFixed(3);
      this.headEl.style.transform = `translate3d(0, ${y}px, 0) rotate(${yaw.toFixed(3)}deg)`;
    }
  }
}
