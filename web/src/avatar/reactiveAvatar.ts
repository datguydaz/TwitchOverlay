import { scavengerSvg } from "./scavenger.svg.ts";
import type { InputKind, InputPhase } from "../../../shared/protocol.ts";

export type AvatarInputSource = "idle" | "live" | "demo";

export interface ReactiveAvatarOptions {
  root: HTMLElement;
  intensity?: number;
  lightsEnabled?: boolean;
  streamerName?: string;
  chatEnabled?: boolean;
}

const DEMO_LINES = [
  "Zone quiet. Keep your head on a swivel.",
  "Copy. Filter's clean — for now.",
  "Heard. Don't stack up on that door.",
  "Signal nominal. Operator standing by.",
  "Eyes open. Hands on glass.",
];

/**
 * Instant pose state from held counts — no animation queue.
 * Idle flavor: breathing/sway + rare cough / shoulder roll / eq blink.
 * Mic: data-talk from level messages. Chat: short Zone Ops bubble.
 */
export class ReactiveAvatar {
  readonly root: HTMLElement;
  private keyHeld = 0;
  private mouseLHeld = 0;
  private mouseRHeld = 0;
  private source: AvatarInputSource = "idle";
  private intensity = 1;
  private lightsEnabled = true;
  private streamerName = "datguydaz";
  private chatEnabled = true;
  private mouseLTimer: number | null = null;
  private mouseRTimer: number | null = null;
  private flavorTimer: number | null = null;
  private flavorClearTimer: number | null = null;
  private talkClearTimer: number | null = null;
  private chatHideTimer: number | null = null;
  private chatEl: HTMLElement | null = null;
  private disposed = false;
  private readonly onVis = (): void => {
    if (document.hidden) this.clearFlavorSchedule();
    else this.scheduleFlavor();
  };

  constructor(opts: ReactiveAvatarOptions) {
    this.root = opts.root;
    this.intensity = opts.intensity ?? 1;
    this.lightsEnabled = opts.lightsEnabled ?? true;
    this.streamerName = (opts.streamerName || "datguydaz").trim() || "datguydaz";
    this.chatEnabled = opts.chatEnabled ?? true;
    this.root.classList.add("avatar-root");
    this.root.innerHTML = `
      <div class="demo-badge">DEMO INPUT</div>
      <div class="live-badge">LIVE INPUT</div>
      <div class="avatar-chat" id="avatar-chat" data-show="0" aria-live="polite">
        <span class="chat-tag">ZONE OPS // COMMS</span>
        <span class="chat-body"></span>
      </div>
      ${scavengerSvg}
    `;
    this.chatEl = this.root.querySelector("#avatar-chat");
    this.setStreamerName(this.streamerName);
    this.applyVisualState();
    document.addEventListener("visibilitychange", this.onVis);
    this.scheduleFlavor();
  }

  setStreamerName(name: string): void {
    this.streamerName = name.trim() || "datguydaz";
    // Desk lettering removed — name is for chat/persona only.
  }

  setChatEnabled(on: boolean): void {
    this.chatEnabled = on;
    if (!on) this.hideChat();
  }

  setIntensity(value: number): void {
    this.intensity = Math.max(0.2, Math.min(2, value));
    this.root.style.setProperty("--avatar-intensity", String(this.intensity));
    if (
      this.root.dataset.cough === "1" ||
      this.root.dataset.roll === "1" ||
      this.root.dataset.talk === "1"
    ) {
      return;
    }
    const torso = this.root.querySelector("#layer-torso") as SVGElement | null;
    const head = this.root.querySelector("#layer-head") as SVGElement | null;
    if (torso) torso.style.animationDuration = `${5.2 / this.intensity}s`;
    if (head) head.style.animationDuration = `${12 / this.intensity}s`;
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

  /** Mic level → talking pose (levels only; no audio). */
  setMicLevel(level: number, talking: boolean): void {
    if (this.disposed) return;
    if (talking || level > 0.08) {
      this.root.dataset.talk = "1";
      if (this.talkClearTimer != null) window.clearTimeout(this.talkClearTimer);
      this.talkClearTimer = window.setTimeout(() => {
        this.talkClearTimer = null;
        delete this.root.dataset.talk;
        this.setIntensity(this.intensity);
      }, 220);
    }
  }

  say(text: string, tag = "ZONE OPS // COMMS"): void {
    if (!this.chatEnabled || this.disposed || !this.chatEl) return;
    const body = this.chatEl.querySelector(".chat-body");
    const tagEl = this.chatEl.querySelector(".chat-tag");
    if (tagEl) tagEl.textContent = tag;
    if (body) body.textContent = text.slice(0, 160);
    this.chatEl.dataset.show = "1";
    if (this.chatHideTimer != null) window.clearTimeout(this.chatHideTimer);
    this.chatHideTimer = window.setTimeout(() => this.hideChat(), 4200);
  }

  sayDemoLine(): void {
    const line = DEMO_LINES[Math.floor(Math.random() * DEMO_LINES.length)]!;
    this.say(line, `${this.streamerName.toUpperCase()} // COMMS`);
  }

  hideChat(): void {
    if (this.chatEl) this.chatEl.dataset.show = "0";
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

  private isBusy(): boolean {
    return this.keyHeld > 0 || this.mouseLHeld > 0 || this.mouseRHeld > 0;
  }

  private scheduleFlavor(): void {
    this.clearFlavorSchedule();
    if (this.disposed || document.hidden) return;
    const delay = 9000 + Math.random() * 14000;
    this.flavorTimer = window.setTimeout(() => {
      this.flavorTimer = null;
      if (this.disposed || document.hidden) return;
      if (!this.isBusy()) this.triggerFlavorBeat();
      this.scheduleFlavor();
    }, delay);
  }

  private triggerFlavorBeat(): void {
    const roll = Math.random();
    if (roll < 0.38) this.pulseAttr("cough", 560);
    else if (roll < 0.68) this.pulseAttr("roll", 720);
    else this.pulseAttr("blink", 420);
  }

  private pulseAttr(attr: "cough" | "roll" | "blink", ms: number): void {
    if (this.flavorClearTimer != null) window.clearTimeout(this.flavorClearTimer);
    delete this.root.dataset.cough;
    delete this.root.dataset.roll;
    delete this.root.dataset.blink;
    this.root.dataset[attr] = "1";
    this.flavorClearTimer = window.setTimeout(() => {
      this.flavorClearTimer = null;
      if (this.disposed) return;
      delete this.root.dataset[attr];
      this.setIntensity(this.intensity);
    }, ms);
  }

  private clearFlavorSchedule(): void {
    if (this.flavorTimer != null) {
      window.clearTimeout(this.flavorTimer);
      this.flavorTimer = null;
    }
  }

  dispose(): void {
    this.disposed = true;
    document.removeEventListener("visibilitychange", this.onVis);
    this.clearFlavorSchedule();
    if (this.flavorClearTimer != null) window.clearTimeout(this.flavorClearTimer);
    if (this.talkClearTimer != null) window.clearTimeout(this.talkClearTimer);
    if (this.chatHideTimer != null) window.clearTimeout(this.chatHideTimer);
    this.flavorClearTimer = null;
    this.talkClearTimer = null;
    this.chatHideTimer = null;
    delete this.root.dataset.cough;
    delete this.root.dataset.roll;
    delete this.root.dataset.blink;
    delete this.root.dataset.talk;
    this.hideChat();
    this.resetIdle();
  }
}
