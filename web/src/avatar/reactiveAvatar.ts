import { scavengerSvg } from "./scavenger.svg.ts";
import type { InputKind, InputPhase } from "../../../shared/protocol.ts";
import { HAND_HOME, KEY_SLOT_COUNT, slotPos } from "../../../shared/keyGrid.ts";

export type AvatarInputSource = "idle" | "live" | "demo";

export interface ReactiveAvatarOptions {
  root: HTMLElement;
  intensity?: number;
  lightsEnabled?: boolean;
  streamerName?: string;
  chatEnabled?: boolean;
}

/** Zone Ops trash-talk — random timer / dashboard samples. */
export const ZONE_TRASH_TALK: readonly string[] = [
  "Zone quiet. Keep your head on a swivel.",
  "Copy. Filter's clean — for now.",
  "Heard. Don't stack up on that door.",
  "Eyes open. Hands on glass.",
  "Extract window's thin. Move clean.",
  "Another scav in the wire? Soft them.",
  "Raid ready. Don't ego-peek mid.",
  "Comms hot. Cut the chatter unless you're bleeding.",
  "Threat board's lit. Stay off the ridge.",
  "Loot later. Survive first.",
  "That angle's cursed. Reposition.",
  "Hold W. Die less.",
];

/** Canned "in a match" lines — `{game}` filled from dashboard list. Not live game reading. */
export const GAME_TRASH_TEMPLATES: readonly string[] = [
  "{game} lobby's spicy. Don't ego peek.",
  "In a {game} raid — keep it quiet.",
  "{game} extract's thin. Move clean.",
  "Yeah I'm in {game}. Hands on glass.",
  "{game} mid-fight. Cut the chatter.",
  "Just wiped a squad in {game}. Reset.",
  "{game} gear fear is a skill issue.",
  "Queue popped — {game}. Hold the line.",
  "Third-partied in {game}. Classic.",
  "{game} night run. Lights off, ears on.",
];

export function pickGameTalkLine(games: readonly string[]): string {
  const list = games.length ? games : ["Tarkov"];
  const game = list[Math.floor(Math.random() * list.length)]!;
  const tmpl =
    GAME_TRASH_TEMPLATES[Math.floor(Math.random() * GAME_TRASH_TEMPLATES.length)]!;
  return tmpl.replaceAll("{game}", game);
}

/** Mix generic Zone Ops lines with game-flavored match talk. */
export function pickDemoTalkLine(games: readonly string[] = []): string {
  if (games.length && Math.random() < 0.72) return pickGameTalkLine(games);
  return ZONE_TRASH_TALK[Math.floor(Math.random() * ZONE_TRASH_TALK.length)]!;
}

/** Mic-level acknowledgements — NOT content understanding. */
export const TALK_ACK_LINES: readonly string[] = [
  "Copy that.",
  "Mhm. Still here.",
  "Reading you.",
  "Yeah — go on.",
  "Solid.",
  "Affirm.",
];

/**
 * Local keyword → reply demo only. Not STT / Twitch chat AI.
 * True topic understanding needs speech-to-text or a chat API later.
 */
export const TOPIC_REACT_MAP: ReadonlyArray<{ keys: readonly string[]; line: string }> = [
  { keys: ["raid", "raiding"], line: "Raid call noted. Stack up." },
  { keys: ["extract", "exfil"], line: "Extract window — move clean." },
  { keys: ["hello", "hi", "hey"], line: "Hey. Operator online." },
  { keys: ["loot", "gear"], line: "Loot later. Survive first." },
  { keys: ["help", "clutch"], line: "Hold angle. I'm rotating." },
  { keys: ["gg", "nice"], line: "Clean. Reset for next." },
];

export function topicReactLine(topic: string): string {
  const t = topic.trim().toLowerCase();
  if (!t) return TALK_ACK_LINES[0]!;
  for (const row of TOPIC_REACT_MAP) {
    if (row.keys.some((k) => t.includes(k))) return row.line;
  }
  return `Heard "${topic.slice(0, 40)}". Level-react only — no chat AI.`;
}

/**
 * Instant pose from held counts. Key `slot` moves left hand over the grid key.
 * Mouse LMB/RMB amber pads dim while held. No key names on the wire.
 */
export class ReactiveAvatar {
  readonly root: HTMLElement;
  private keyHeld = 0;
  private mouseLHeld = 0;
  private mouseRHeld = 0;
  /** pressId → slot for currently held keys */
  private heldSlots = new Map<number, number>();
  /** Most recent slot for hand aim */
  private activeSlot: number | null = null;
  private source: AvatarInputSource = "idle";
  private intensity = 1;
  private lightsEnabled = true;
  private streamerName = "datguydaz";
  private chatEnabled = true;
  private gameList: string[] = [];
  private keyPulseTimer: number | null = null;
  private mouseLPulseTimer: number | null = null;
  private mouseRPulseTimer: number | null = null;
  private wheelClearTimer: number | null = null;
  private tapClearTimer: number | null = null;
  private flavorTimer: number | null = null;
  private flavorClearTimer: number | null = null;
  private talkClearTimer: number | null = null;
  private chatHideTimer: number | null = null;
  private talkBurstMs = 0;
  private lastAckAt = 0;
  private chatEl: HTMLElement | null = null;
  private handLeft: SVGElement | null = null;
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
    this.handLeft = this.root.querySelector("#hand-left");
    this.setStreamerName(this.streamerName);
    this.applyVisualState();
    document.addEventListener("visibilitychange", this.onVis);
    this.scheduleFlavor();
  }

  setStreamerName(name: string): void {
    this.streamerName = name.trim() || "datguydaz";
  }

  setChatEnabled(on: boolean): void {
    this.chatEnabled = on;
    if (!on) this.hideChat();
  }

  /** Editable dashboard game roster for canned match talk (not live reading). */
  setGameList(games: readonly string[]): void {
    this.gameList = games.map((g) => g.trim()).filter(Boolean).slice(0, 24);
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
    if (torso) torso.style.animationDuration = `${6.8 / this.intensity}s`;
    if (head) head.style.animationDuration = `${8.5 / this.intensity}s`;
  }

  setLightsEnabled(on: boolean): void {
    this.lightsEnabled = on;
    this.root.dataset.lights = on ? "1" : "0";
    this.root.querySelectorAll(".eq-light").forEach((el) => {
      (el as HTMLElement).style.visibility = on ? "visible" : "hidden";
    });
  }

  setSource(source: AvatarInputSource): void {
    this.source = source;
    this.root.dataset.source = source;
  }

  /**
   * Level-based talk react (mic amplitude only).
   * Does NOT understand speech/chat topics — see topicReact() for local keyword demo.
   */
  setMicLevel(level: number, talking: boolean): void {
    if (this.disposed) return;
    const hot = talking || level > 0.08;
    if (!hot) return;

    const intensity = level > 0.28 ? "2" : "1";
    this.root.dataset.talk = intensity;
    if (level > 0.22) this.root.dataset.talkNod = "1";
    else delete this.root.dataset.talkNod;

    this.talkBurstMs += 90;
    if (
      this.chatEnabled &&
      this.talkBurstMs > 900 &&
      Date.now() - this.lastAckAt > 9000
    ) {
      this.talkBurstMs = 0;
      this.lastAckAt = Date.now();
      const line = TALK_ACK_LINES[Math.floor(Math.random() * TALK_ACK_LINES.length)]!;
      this.say(line, `${this.streamerName.toUpperCase()} // ACK`);
    }

    if (this.talkClearTimer != null) window.clearTimeout(this.talkClearTimer);
    this.talkClearTimer = window.setTimeout(() => {
      this.talkClearTimer = null;
      this.talkBurstMs = 0;
      delete this.root.dataset.talk;
      delete this.root.dataset.talkNod;
      this.setIntensity(this.intensity);
    }, 280);
  }

  /** Dashboard keyword demo — not live Twitch/STT understanding. */
  topicReact(topic: string): void {
    this.setSource("demo");
    this.root.dataset.talk = "2";
    this.root.dataset.talkNod = "1";
    this.say(topicReactLine(topic), `${this.streamerName.toUpperCase()} // REACT`);
    if (this.talkClearTimer != null) window.clearTimeout(this.talkClearTimer);
    this.talkClearTimer = window.setTimeout(() => {
      this.talkClearTimer = null;
      delete this.root.dataset.talk;
      delete this.root.dataset.talkNod;
      this.setIntensity(this.intensity);
    }, 700);
  }

  say(text: string, tag = "ZONE OPS // COMMS"): void {
    if (!this.chatEnabled || this.disposed || !this.chatEl) return;
    const body = this.chatEl.querySelector(".chat-body");
    const tagEl = this.chatEl.querySelector(".chat-tag");
    if (tagEl) tagEl.textContent = tag;
    if (body) body.textContent = text.slice(0, 220);
    this.chatEl.dataset.show = "1";
    if (this.chatHideTimer != null) window.clearTimeout(this.chatHideTimer);
    this.chatHideTimer = window.setTimeout(() => this.hideChat(), 5200);
  }

  sayDemoLine(): void {
    const line = pickDemoTalkLine(this.gameList);
    this.say(line, `${this.streamerName.toUpperCase()} // COMMS`);
  }

  hideChat(): void {
    if (this.chatEl) this.chatEl.dataset.show = "0";
  }

  resetIdle(reason?: string): void {
    this.keyHeld = 0;
    this.mouseLHeld = 0;
    this.mouseRHeld = 0;
    this.heldSlots.clear();
    this.activeSlot = null;
    this.clearPulse("key");
    this.clearPulse("mouseL");
    this.clearPulse("mouseR");
    this.clearKeycaps();
    this.applyVisualState();
    if (reason) {
      this.root.dataset.lastReset = reason;
    }
  }

  handleInput(
    kind: InputKind,
    phase: InputPhase,
    held: number,
    slot?: number,
    pressId?: number,
  ): void {
    if (this.disposed) return;
    if (kind === "key") {
      const was = this.keyHeld;
      this.keyHeld = Math.max(0, held);
      const s =
        typeof slot === "number" && Number.isFinite(slot)
          ? Math.max(0, Math.min(KEY_SLOT_COUNT - 1, Math.floor(slot)))
          : null;
      const pid = pressId ?? -1;

      if (phase === "down") {
        if (s != null) {
          if (pid >= 0) this.heldSlots.set(pid, s);
          this.activeSlot = s;
          this.depressKeycap(s, true);
        }
        if (was === 0 && this.keyHeld > 0) this.pulseEdge("key");
        // Snappy tap flash even on rapid repeats of new keys
        this.root.dataset.keyTap = "1";
        if (this.tapClearTimer != null) window.clearTimeout(this.tapClearTimer);
        this.tapClearTimer = window.setTimeout(() => {
          this.tapClearTimer = null;
          delete this.root.dataset.keyTap;
        }, 70);
      } else {
        if (pid >= 0 && this.heldSlots.has(pid)) {
          const released = this.heldSlots.get(pid)!;
          this.heldSlots.delete(pid);
          if (![...this.heldSlots.values()].includes(released)) {
            this.depressKeycap(released, false);
          }
        } else if (s != null && this.keyHeld === 0) {
          this.depressKeycap(s, false);
        }
        if (this.keyHeld === 0) {
          this.heldSlots.clear();
          this.activeSlot = null;
          this.clearKeycaps();
          this.clearPulse("key");
        } else {
          // Aim at most recently still-held slot
          const vals = [...this.heldSlots.values()];
          this.activeSlot = vals.length ? vals[vals.length - 1]! : this.activeSlot;
        }
      }
    } else if (kind === "mouseL") {
      const was = this.mouseLHeld;
      this.mouseLHeld = Math.max(0, held);
      if (phase === "down" && was === 0 && this.mouseLHeld > 0) this.pulseEdge("mouseL");
      if (this.mouseLHeld === 0) this.clearPulse("mouseL");
    } else if (kind === "mouseR") {
      const was = this.mouseRHeld;
      this.mouseRHeld = Math.max(0, held);
      if (phase === "down" && was === 0 && this.mouseRHeld > 0) this.pulseEdge("mouseR");
      if (this.mouseRHeld === 0) this.clearPulse("mouseR");
    } else if (kind === "wheelUp" || kind === "wheelDown") {
      if (phase === "down") this.pulseWheel(kind === "wheelUp" ? "up" : "down");
    } else {
      const _never: never = kind;
      void _never;
    }
    this.applyVisualState();
  }

  demoKey(down: boolean, slot = 12): void {
    this.setSource("demo");
    this.handleInput("key", down ? "down" : "up", down ? 1 : 0, slot, 9001);
  }

  demoMouse(button: "l" | "r", down: boolean): void {
    this.setSource("demo");
    const kind = button === "l" ? "mouseL" : "mouseR";
    this.handleInput(kind, down ? "down" : "up", down ? 1 : 0);
  }

  demoWheel(dir: "up" | "down" = "down"): void {
    this.setSource("demo");
    this.handleInput(dir === "up" ? "wheelUp" : "wheelDown", "down", 1);
  }

  private pulseWheel(dir: "up" | "down"): void {
    // Amber flash only (same language as LMB/RMB) — never spin the wheel graphic.
    this.root.dataset.wheel = dir;
    if (this.wheelClearTimer != null) window.clearTimeout(this.wheelClearTimer);
    this.wheelClearTimer = window.setTimeout(() => {
      this.wheelClearTimer = null;
      delete this.root.dataset.wheel;
    }, 140);
  }

  private depressKeycap(slot: number, on: boolean): void {
    const el = this.root.querySelector(`#kb-s${slot}`);
    if (!el) return;
    if (on) el.setAttribute("data-pressed", "1");
    else el.removeAttribute("data-pressed");
  }

  private clearKeycaps(): void {
    this.root.querySelectorAll(".kb-key[data-pressed]").forEach((el) => {
      el.removeAttribute("data-pressed");
    });
  }

  private pulseEdge(kind: "key" | "mouseL" | "mouseR"): void {
    const pulseAttr =
      kind === "key" ? "keyPulse" : kind === "mouseL" ? "mouseLPulse" : "mouseRPulse";
    const timerKey =
      kind === "key"
        ? "keyPulseTimer"
        : kind === "mouseL"
          ? "mouseLPulseTimer"
          : "mouseRPulseTimer";
    this.root.dataset[pulseAttr] = "1";
    const existing = this[timerKey];
    if (existing != null) window.clearTimeout(existing);
    this[timerKey] = window.setTimeout(() => {
      this[timerKey] = null;
      delete this.root.dataset[pulseAttr];
    }, 130);
  }

  private clearPulse(kind: "key" | "mouseL" | "mouseR"): void {
    const pulseAttr =
      kind === "key" ? "keyPulse" : kind === "mouseL" ? "mouseLPulse" : "mouseRPulse";
    const timerKey =
      kind === "key"
        ? "keyPulseTimer"
        : kind === "mouseL"
          ? "mouseLPulseTimer"
          : "mouseRPulseTimer";
    const existing = this[timerKey];
    if (existing != null) window.clearTimeout(existing);
    this[timerKey] = null;
    delete this.root.dataset[pulseAttr];
  }

  private applyHandToSlot(): void {
    if (!this.handLeft) return;
    if (this.keyHeld > 0 && this.activeSlot != null) {
      const pos = slotPos(this.activeSlot);
      const dx = pos.cx - HAND_HOME.cx;
      const dy = pos.cy - HAND_HOME.cy + 6;
      // Snappy when tapping, settle while holding
      const ms = this.root.dataset.keyTap === "1" ? "50ms" : "85ms";
      this.handLeft.style.transition = `transform ${ms} ease-out`;
      this.handLeft.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      this.root.dataset.keySlot = String(this.activeSlot);
    } else {
      this.handLeft.style.transition = "transform 120ms ease-out";
      this.handLeft.style.transform = "translate(0px, 0px)";
      delete this.root.dataset.keySlot;
    }
  }

  private applyVisualState(): void {
    this.root.dataset.key = this.keyHeld > 0 ? "1" : "0";
    this.root.dataset.mouseL = this.mouseLHeld > 0 ? "1" : "0";
    this.root.dataset.mouseR = this.mouseRHeld > 0 ? "1" : "0";

    const lmb = this.root.querySelector("#mouse-lmb") as SVGElement | null;
    const rmb = this.root.querySelector("#mouse-rmb") as SVGElement | null;
    if (lmb) lmb.style.fill = this.mouseLHeld > 0 ? "#c7923a" : "#1a1a1a";
    if (rmb) rmb.style.fill = this.mouseRHeld > 0 ? "#c7923a" : "#1a1a1a";

    const wheelBusy = this.root.dataset.wheel === "up" || this.root.dataset.wheel === "down";
    const active =
      this.keyHeld > 0 || this.mouseLHeld > 0 || this.mouseRHeld > 0 || wheelBusy ? "1" : "0";
    this.root.dataset.active = this.lightsEnabled ? active : "0";
    this.applyHandToSlot();
    this.setIntensity(this.intensity);
    this.setLightsEnabled(this.lightsEnabled);
    this.root.dataset.source = this.source;
  }

  private isBusy(): boolean {
    return (
      this.keyHeld > 0 ||
      this.mouseLHeld > 0 ||
      this.mouseRHeld > 0 ||
      this.root.dataset.wheel === "up" ||
      this.root.dataset.wheel === "down"
    );
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
    if (this.tapClearTimer != null) window.clearTimeout(this.tapClearTimer);
    if (this.wheelClearTimer != null) window.clearTimeout(this.wheelClearTimer);
    this.clearPulse("key");
    this.clearPulse("mouseL");
    this.clearPulse("mouseR");
    this.flavorClearTimer = null;
    this.talkClearTimer = null;
    this.chatHideTimer = null;
    this.tapClearTimer = null;
    this.wheelClearTimer = null;
    delete this.root.dataset.cough;
    delete this.root.dataset.roll;
    delete this.root.dataset.blink;
    delete this.root.dataset.talk;
    delete this.root.dataset.talkNod;
    delete this.root.dataset.wheel;
    this.hideChat();
    this.resetIdle();
  }
}
