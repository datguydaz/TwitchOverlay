/**
 * JS-driven idle breath + head + torso sway.
 *
 * CSS infinite loops spasmed after long OBS pauses; this keeps phase wrapped and
 * hard-caps dt so hide/resume never catch up into a jump.
 */

export type IdleMotionOptions = {
  breathEl: SVGElement | null;
  headEl: SVGElement | null;
  /** When true, skip motion (prefers-reduced-motion). */
  reducedMotion?: boolean;
  /** Motion amount multiplier (dashboard Avatar motion). Default ~1.35 alive. */
  amount?: number;
};

type GlanceKind = "side" | "desk" | "screen" | "soft";

type HeadPhase =
  | { kind: "rest"; until: number }
  | {
      kind: "anticipate";
      fromYaw: number;
      fromPitch: number;
      toYaw: number;
      toPitch: number;
      t0: number;
      dur: number;
    }
  | {
      kind: "turn";
      fromYaw: number;
      fromPitch: number;
      toYaw: number;
      toPitch: number;
      t0: number;
      dur: number;
    }
  | { kind: "hold"; yaw: number; pitch: number; until: number }
  | {
      kind: "return";
      fromYaw: number;
      fromPitch: number;
      toYaw: number;
      toPitch: number;
      t0: number;
      dur: number;
    };

const MAX_DT_MS = 48;

/** Base amplitudes at amount=1 (alive default is higher via dashboard). */
const BREATH_Y_BASE = 3.1;
const HEAD_YAW_BASE = 3.6;
const HEAD_PITCH_BASE = 1.35;
const MICRO_YAW_BASE = 0.42;
const MICRO_PITCH_BASE = 0.28;
const SWAY_X_BASE = 1.35;
const SWAY_ROT_BASE = 1.05;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function wrap01(t: number): number {
  const x = t % 1;
  return x < 0 ? x + 1 : x;
}

function smoothstep(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function easeInOut(t: number): number {
  const x = clamp(t, 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function rand(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

export class IdleMotion {
  private breathEl: SVGElement | null;
  private headEl: SVGElement | null;
  private reducedMotion: boolean;
  private amount = 1.35;
  private raf: number | null = null;
  private lastTs = 0;
  private running = false;
  private disposed = false;

  private breathPhase = 0;
  private breathPeriodMs = 5200;
  private breathPeriodTarget = 5200;
  private breathPeriodRetargetAt = 0;

  private swayPhase = rand(0, 1);
  private swayPeriodMs = 7800;
  private swayPeriodTarget = 7800;
  private swayPeriodRetargetAt = 0;

  private head: HeadPhase = { kind: "rest", until: 0 };
  private yaw = 0;
  private pitch = 0;
  private microT = 0;
  private nowMs = 0;
  private lastGlance: GlanceKind = "soft";

  timeScale = 1;

  constructor(opts: IdleMotionOptions) {
    this.breathEl = opts.breathEl;
    this.headEl = opts.headEl;
    this.reducedMotion = !!opts.reducedMotion;
    if (Number.isFinite(opts.amount)) this.setAmount(Number(opts.amount));
  }

  /** Dashboard Avatar motion slider (0.2–2). */
  setAmount(value: number): void {
    this.amount = clamp(Number(value) || 1.35, 0.2, 2);
  }

  start(): void {
    if (this.disposed || this.running) return;
    if (this.reducedMotion) {
      this.write(0, 0, 0, 0, 0);
      return;
    }
    this.running = true;
    this.lastTs = 0;
    this.nowMs = performance.now();
    this.breathPeriodRetargetAt = this.nowMs + rand(6000, 12000);
    this.swayPeriodRetargetAt = this.nowMs + rand(7000, 14000);
    this.head = { kind: "rest", until: this.nowMs + rand(900, 2200) };
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

  pause(): void {
    this.stop();
  }

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

  advanceForTest(ms: number): void {
    let left = Math.max(0, ms);
    while (left > 0) {
      const step = Math.min(left, MAX_DT_MS);
      this.step(step);
      left -= step;
    }
    this.writeTransforms();
  }

  sample(): {
    yaw: number;
    pitch: number;
    breathY: number;
    breathPhase: number;
    swayX: number;
    swayRot: number;
  } {
    return {
      yaw: this.yaw,
      pitch: this.pitch,
      breathY: this.breathY(),
      breathPhase: this.breathPhase,
      swayX: this.swayX(),
      swayRot: this.swayRot(),
    };
  }

  private a(): number {
    return this.amount;
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
    this.stepSway(dt);
    this.stepHead(dt);
    this.microT += dt * 0.00135;
  }

  private stepBreath(dt: number): void {
    if (this.nowMs >= this.breathPeriodRetargetAt) {
      this.breathPeriodTarget = rand(4200, 6400);
      this.breathPeriodRetargetAt = this.nowMs + rand(7000, 14000);
    }
    this.breathPeriodMs +=
      (this.breathPeriodTarget - this.breathPeriodMs) * Math.min(1, dt / 3800);
    this.breathPeriodMs = clamp(this.breathPeriodMs, 3800, 7200);
    this.breathPhase = wrap01(this.breathPhase + dt / this.breathPeriodMs);
  }

  private stepSway(dt: number): void {
    if (this.nowMs >= this.swayPeriodRetargetAt) {
      this.swayPeriodTarget = rand(6200, 11000);
      this.swayPeriodRetargetAt = this.nowMs + rand(8000, 16000);
    }
    this.swayPeriodMs +=
      (this.swayPeriodTarget - this.swayPeriodMs) * Math.min(1, dt / 5000);
    this.swayPeriodMs = clamp(this.swayPeriodMs, 5500, 12000);
    this.swayPhase = wrap01(this.swayPhase + dt / this.swayPeriodMs);
  }

  private breathY(): number {
    const p = this.breathPhase;
    const warped = p < 0.55 ? (p / 0.55) * 0.5 : 0.5 + ((p - 0.55) / 0.45) * 0.5;
    const wave = Math.sin(warped * Math.PI * 2);
    return ((wave - 1) * 0.5) * BREATH_Y_BASE * this.a();
  }

  private swayX(): number {
    const w =
      Math.sin(this.swayPhase * Math.PI * 2) * 0.72 +
      Math.sin(this.swayPhase * Math.PI * 2 * 0.37 + 1.1) * 0.28;
    return w * SWAY_X_BASE * this.a();
  }

  private swayRot(): number {
    const w =
      Math.sin(this.swayPhase * Math.PI * 2 + 0.6) * 0.7 +
      Math.sin(this.swayPhase * Math.PI * 2 * 0.51 + 2.2) * 0.3;
    return w * SWAY_ROT_BASE * this.a();
  }

  private stepHead(dt: number): void {
    const yawMax = HEAD_YAW_BASE * this.a();
    const pitchMax = HEAD_PITCH_BASE * this.a();
    const microYaw = MICRO_YAW_BASE * this.a();
    const microPitch = MICRO_PITCH_BASE * this.a();
    const h = this.head;

    switch (h.kind) {
      case "rest": {
        const mYaw =
          Math.sin(this.microT * 1.55) * microYaw +
          Math.sin(this.microT * 0.41) * microYaw * 0.35;
        const mPitch =
          Math.sin(this.microT * 1.05) * microPitch +
          Math.sin(this.microT * 0.57) * microPitch * 0.3;
        this.yaw += (mYaw - this.yaw) * Math.min(1, dt / 380);
        this.pitch += (mPitch - this.pitch) * Math.min(1, dt / 380);
        if (this.nowMs >= h.until) this.beginGlance();
        break;
      }
      case "anticipate": {
        const u = easeInOut((this.nowMs - h.t0) / h.dur);
        const ant = 1 - Math.abs(u * 2 - 1);
        this.yaw = h.fromYaw + (h.fromYaw - h.toYaw) * 0.14 * ant;
        this.pitch = h.fromPitch + (h.fromPitch - h.toPitch) * 0.12 * ant;
        if (this.nowMs >= h.t0 + h.dur) {
          this.head = {
            kind: "turn",
            fromYaw: this.yaw,
            fromPitch: this.pitch,
            toYaw: h.toYaw,
            toPitch: h.toPitch,
            t0: this.nowMs,
            dur: rand(480, 880),
          };
        }
        break;
      }
      case "turn": {
        const u = easeInOut((this.nowMs - h.t0) / h.dur);
        this.yaw = h.fromYaw + (h.toYaw - h.fromYaw) * u;
        this.pitch = h.fromPitch + (h.toPitch - h.fromPitch) * u;
        if (this.nowMs >= h.t0 + h.dur) {
          this.yaw = h.toYaw;
          this.pitch = h.toPitch;
          this.head = {
            kind: "hold",
            yaw: h.toYaw,
            pitch: h.toPitch,
            until: this.nowMs + rand(550, 1800),
          };
        }
        break;
      }
      case "hold": {
        const settle =
          Math.sin(this.microT * 2.7) * 0.08 * this.a() +
          Math.sin(this.microT * 0.85) * 0.05 * this.a();
        this.yaw = h.yaw + settle;
        this.pitch = h.pitch + settle * 0.45;
        if (this.nowMs >= h.until) {
          // Sometimes chain into another glance instead of fully resetting (less robotic).
          if (Math.random() < 0.32) {
            this.beginGlance(true);
          } else {
            this.head = {
              kind: "return",
              fromYaw: this.yaw,
              fromPitch: this.pitch,
              toYaw: rand(-0.25, 0.25) * this.a(),
              toPitch: rand(-0.12, 0.12) * this.a(),
              t0: this.nowMs,
              dur: rand(520, 980),
            };
          }
        }
        break;
      }
      case "return": {
        const u = smoothstep((this.nowMs - h.t0) / h.dur);
        this.yaw = h.fromYaw + (h.toYaw - h.fromYaw) * u;
        this.pitch = h.fromPitch + (h.toPitch - h.fromPitch) * u;
        if (this.nowMs >= h.t0 + h.dur) {
          this.yaw = h.toYaw;
          this.pitch = h.toPitch;
          this.head = { kind: "rest", until: this.nowMs + rand(700, 2600) };
        }
        break;
      }
      default: {
        const _never: never = h;
        void _never;
        this.head = { kind: "rest", until: this.nowMs + 2000 };
      }
    }

    this.yaw = clamp(this.yaw, -yawMax, yawMax);
    this.pitch = clamp(this.pitch, -pitchMax, pitchMax);
  }

  private beginGlance(fromHold = false): void {
    const yawMax = HEAD_YAW_BASE * this.a();
    const pitchMax = HEAD_PITCH_BASE * this.a();
    const kinds: GlanceKind[] = ["side", "side", "desk", "screen", "soft"];
    let kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    // Avoid immediate repeat of the same glance family.
    if (kind === this.lastGlance && Math.random() < 0.65) {
      kind = kinds[Math.floor(Math.random() * kinds.length)]!;
    }
    this.lastGlance = kind;

    let toYaw = 0;
    let toPitch = 0;
    switch (kind) {
      case "side": {
        const side = Math.random() < 0.5 ? -1 : 1;
        toYaw = side * rand(yawMax * 0.45, yawMax);
        toPitch = rand(-pitchMax * 0.25, pitchMax * 0.35);
        break;
      }
      case "desk": {
        // Look down toward keyboard/desk.
        toYaw = rand(-yawMax * 0.35, yawMax * 0.35);
        toPitch = rand(pitchMax * 0.45, pitchMax);
        break;
      }
      case "screen": {
        // Slightly up / forward toward the screen.
        toYaw = rand(-yawMax * 0.25, yawMax * 0.25);
        toPitch = -rand(pitchMax * 0.25, pitchMax * 0.75);
        break;
      }
      case "soft": {
        toYaw = rand(-yawMax * 0.35, yawMax * 0.35);
        toPitch = rand(-pitchMax * 0.3, pitchMax * 0.3);
        break;
      }
      default: {
        const _never: never = kind;
        void _never;
      }
    }

    this.head = {
      kind: "anticipate",
      fromYaw: this.yaw,
      fromPitch: this.pitch,
      toYaw,
      toPitch,
      t0: this.nowMs,
      dur: fromHold ? rand(100, 180) : rand(120, 240),
    };
  }

  private writeTransforms(): void {
    this.write(this.breathY(), this.swayX(), this.swayRot(), this.yaw, this.pitch);
  }

  private write(
    breathY: number,
    swayX: number,
    swayRot: number,
    yaw: number,
    pitch: number,
  ): void {
    if (this.breathEl) {
      this.breathEl.style.transform = `translate3d(${swayX.toFixed(3)}px, ${breathY.toFixed(3)}px, 0) rotate(${swayRot.toFixed(3)}deg)`;
    }
    if (this.headEl) {
      const y = (pitch * 1.55).toFixed(3);
      this.headEl.style.transform = `translate3d(0, ${y}px, 0) rotate(${yaw.toFixed(3)}deg)`;
    }
  }
}
