import { scavengerSvg } from "./scavenger.svg.ts";
import type { InputKind, InputPhase } from "../../../shared/protocol.ts";

export type AvatarInputSource = "idle" | "live" | "demo";

export interface ReactiveAvatarOptions {
  root: HTMLElement;
  intensity?: number;
  lightsEnabled?: boolean;
}

/**
 * Instant pose state from held counts — no animation queue.
 * Holding a key keeps data-key="1" without re-trigger jitter via CSS infinite tap.
 * Mouse clicks pulse via attribute toggle with rAF reset for distinct one-shots.
 */
export class ReactiveAvatar {
  readonly root: HTMLElement;
  private keyHeld = 0;
  private mouseLHeld = 0;
  private mouseRHeld = 0;
  private source: AvatarInputSource = "idle";
  private intensity = 1;
  private lightsEnabled = true;
  private mouseLTimer: number | null = null;
  private mouseRTimer: number | null = null;
  private disposed = false;

  constructor(opts: ReactiveAvatarOptions) {
    this.root = opts.root;
    this.intensity = opts.intensity ?? 1;
    this.lightsEnabled = opts.lightsEnabled ?? true;
    this.root.classList.add("avatar-root");
    this.root.innerHTML = `
      <div class="demo-badge">DEMO INPUT</div>
      <div class="live-badge">LIVE INPUT</div>
      ${scavengerSvg}
    `;
    this.applyVisualState();
  }

  setIntensity(value: number): void {
    this.intensity = Math.max(0.2, Math.min(2, value));
    this.root.style.setProperty("--avatar-intensity", String(this.intensity));
    const torso = this.root.querySelector("#layer-torso") as SVGElement | null;
    const head = this.root.querySelector("#layer-head") as SVGElement | null;
    if (torso) torso.style.animationDuration = `${3.6 / this.intensity}s`;
    if (head) head.style.animationDuration = `${7 / this.intensity}s`;
  }

  setLightsEnabled(on: boolean): void {
    this.lightsEnabled = on;
    this.root.querySelectorAll(".eq-light").forEach((el) => {
      (el as HTMLElement).style.visibility = on ? "visible" : "hidden";
    });
  }

  setSource(source: AvatarInputSource): void {
    this.source = source;
    this.root.dataset.source = source;
  }

  resetIdle(reason?: string): void {
    this.keyHeld = 0;
    this.mouseLHeld = 0;
    this.mouseRHeld = 0;
    if (this.mouseLTimer != null) window.clearTimeout(this.mouseLTimer);
    if (this.mouseRTimer != null) window.clearTimeout(this.mouseRTimer);
    this.mouseLTimer = null;
    this.mouseRTimer = null;
    this.applyVisualState();
    if (reason) {
      this.root.dataset.lastReset = reason;
    }
  }

  handleInput(kind: InputKind, phase: InputPhase, held: number): void {
    if (this.disposed) return;
    if (kind === "key") {
      this.keyHeld = Math.max(0, held);
    } else if (kind === "mouseL") {
      this.mouseLHeld = Math.max(0, held);
      if (phase === "down") this.pulseMouse("l");
    } else if (kind === "mouseR") {
      this.mouseRHeld = Math.max(0, held);
      if (phase === "down") this.pulseMouse("r");
    } else {
      const _never: never = kind;
      void _never;
    }
    this.applyVisualState();
  }

  /** Demo helpers — same path as live, but source badge differs. */
  demoKey(down: boolean): void {
    this.setSource("demo");
    this.handleInput("key", down ? "down" : "up", down ? 1 : 0);
  }

  demoMouse(button: "l" | "r", down: boolean): void {
    this.setSource("demo");
    const kind = button === "l" ? "mouseL" : "mouseR";
    this.handleInput(kind, down ? "down" : "up", down ? 1 : 0);
  }

  private pulseMouse(side: "l" | "r"): void {
    const attr = side === "l" ? "mouseL" : "mouseR";
    const timerKey = side === "l" ? "mouseLTimer" : "mouseRTimer";
    this.root.dataset[attr] = "1";
    const existing = this[timerKey];
    if (existing != null) window.clearTimeout(existing);
    this[timerKey] = window.setTimeout(() => {
      if (side === "l" && this.mouseLHeld === 0) this.root.dataset.mouseL = "0";
      if (side === "r" && this.mouseRHeld === 0) this.root.dataset.mouseR = "0";
    }, 140);
  }

  private applyVisualState(): void {
    this.root.dataset.key = this.keyHeld > 0 ? "1" : "0";
    if (this.mouseLHeld > 0) this.root.dataset.mouseL = "1";
    else if (this.mouseLTimer == null) this.root.dataset.mouseL = "0";
    if (this.mouseRHeld > 0) this.root.dataset.mouseR = "1";
    else if (this.mouseRTimer == null) this.root.dataset.mouseR = "0";

    const active =
      this.keyHeld > 0 || this.mouseLHeld > 0 || this.mouseRHeld > 0 ? "1" : "0";
    this.root.dataset.active = this.lightsEnabled ? active : "0";
    this.setIntensity(this.intensity);
    this.setLightsEnabled(this.lightsEnabled);
    this.root.dataset.source = this.source;
  }

  dispose(): void {
    this.disposed = true;
    this.resetIdle();
  }
}
