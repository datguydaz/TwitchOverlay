import { scavengerSvg } from "./scavenger.svg.ts";
import type { InputKind, InputPhase } from "../../../shared/protocol.ts";
import { HAND_HOME, KEY_SLOT_COUNT, slotPos } from "../../../shared/keyGrid.ts";
import { applyChatPlacement } from "../lib/chatPlacement.ts";
import type { ChatSettings } from "../../../shared/settings.ts";

export type AvatarInputSource = "idle" | "live" | "demo";

export interface ReactiveAvatarOptions {
  root: HTMLElement;
  intensity?: number;
  lightsEnabled?: boolean;
  streamerName?: string;
  chatEnabled?: boolean;
}

/** Stream-brand filler — no game-specific slang (kept generic on purpose). */
export const ZONE_TRASH_TALK: readonly string[] = [
  "Zone quiet. Keep your head on a swivel.",
  "Copy. Filter's clean — for now.",
  "Heard. Stay sharp.",
  "Eyes open. Hands ready.",
  "Comms hot. Cut the chatter unless it matters.",
  "Threat board's lit. Stay focused.",
  "That angle's cursed. Reposition.",
  "Hold W. Die less.",
  "Solid. Reset and go again.",
  "Don't tilt. Next one's ours.",
];

/** Per-game line family — slang stays inside its own pool. */
export type GameTalkFamily =
  | "tarkov"
  | "dayz"
  | "arena"
  | "hunt"
  | "wow"
  | "tibia"
  | "diablo"
  | "cs"
  | "generic";

/** Map dashboard game label → family. Unknown titles use safe generic lines only. */
export function classifyGameTalk(game: string): GameTalkFamily {
  const n = game.trim().toLowerCase();
  if (!n) return "generic";
  if (n.includes("tarkov") || /\beft\b/.test(n)) return "tarkov";
  if (n.includes("dayz")) return "dayz";
  if (n.includes("arena") && n.includes("breakout")) return "arena";
  if (n.includes("hunt")) return "hunt";
  if (n.includes("warcraft") || /\bwow\b/.test(n)) return "wow";
  if (n.includes("tibia")) return "tibia";
  if (n.includes("diablo")) return "diablo";
  if (
    n.includes("counter-strike") ||
    n.includes("counter strike") ||
    /\bcs2?\b/.test(n) ||
    n === "cs"
  ) {
    return "cs";
  }
  return "generic";
}

/**
 * Per-game canned match lines. Not live game reading.
 * `{game}` is the dashboard label; slang never crosses families.
 */
export const GAME_TALK_POOLS: Readonly<Record<GameTalkFamily, readonly string[]>> = {
  tarkov: [
    "In a {game} raid — keep it quiet.",
    "{game} extract's thin. Move clean.",
    "{game} gear fear is a skill issue.",
    "Another scav in the wire? Soft them.",
    "Loot later. Survive first.",
    "Just wiped a trio on {game}. Reset.",
    "{game} night run. Lights off, ears on.",
    "Don't ego-peek mid. Hold the angle.",
  ],
  dayz: [
    "Fresh spawn on {game}. Need a drink and a gun.",
    "{game} coast is loud. Cut inland.",
    "Heard a shot west. Don't third-party blind.",
    "Inventory's a mess. Stash and move.",
    "{game} night — NVG or die slow.",
    "Zeds stacked. Don't spray, break contact.",
    "Friendly? Or KOSing. Trust nothing.",
    "Base run later. Survive the road first.",
  ],
  arena: [
    "{game} raid — cover the flanks.",
    "Extract window's short. Move clean.",
    "Don't greed the crate. Cover first.",
    "{game} mid-fight. Cut the chatter.",
    "Armor's cracked. Play for extract.",
    "Third-partied. Classic. Reset.",
  ],
  hunt: [
    "{game} — dark sight's up. Listen.",
    "Boss lair is contested. Don't push alone.",
    "Bounty team's loud. Flank wide.",
    "Banishing now — hold the compound.",
    "{game} night map. Sound traps everywhere.",
    "Don't greed the token. Extract clean.",
  ],
  wow: [
    "{game} pull's big. Kick and stay out of fire.",
    "Need a rez. Don't release yet.",
    "Queues popped — {game}. Don't AFK the gate.",
    "Interrupt that cast. Now.",
    "Loot rules later. Don't die to mechanics.",
    "{game} M+ — keys don't forgive greed.",
  ],
  tibia: [
    "{game} hunt — watch the respawns.",
    "Mana low. Don't overpull.",
    "Team hunt or solo? Call it.",
    "Loot every corpse. No leftovers.",
    "{game} spawn's contested. Reposition.",
    "Utamo when it spikes. Stay calm.",
  ],
  diablo: [
    "{game} pit — don't stand in the ground effects.",
    "Elite pack — focus the waller first.",
    "Town portal if you're cooking. Reset clean.",
    "{game} nightmare dungeon. Move with the pack.",
    "Don't greed the shrine. Survive first.",
    "Boss mechanics — dodge, then burn.",
  ],
  cs: [
    "{game} — don't overpeek mid.",
    "Eco round. Play for info, not frags.",
    "Bomb down. Rotate and trade.",
    "Save the AWP. Next round matters.",
    "Default execute — utility first.",
    "They're stacking B. Clear close angles.",
    "Clutch setup. Crosshair head-height.",
    "Anti-eco. Don't give them guns.",
  ],
  generic: [
    "Yeah I'm in {game}. Stay on comms.",
    "{game} lobby's spicy. Don't ego peek.",
    "Queue popped — {game}. Hold the line.",
    "{game} mid-fight. Cut the chatter.",
    "Just clutched {game}. Reset.",
    "{game} night session. Focus up.",
  ],
};

/** @deprecated Prefer GAME_TALK_POOLS — kept so older imports don't break. */
export const GAME_TRASH_TEMPLATES: readonly string[] = GAME_TALK_POOLS.generic;

export function pickGameTalkLine(games: readonly string[]): string {
  const list = games.length ? games : ["Escape from Tarkov"];
  const game = list[Math.floor(Math.random() * list.length)]!;
  const family = classifyGameTalk(game);
  const pool = GAME_TALK_POOLS[family];
  const tmpl = pool[Math.floor(Math.random() * pool.length)]!;
  return tmpl.replaceAll("{game}", game);
}

/** Mix generic Zone Ops lines with per-game match talk (no cross-game slang). */
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
  private handLeftAim: SVGGElement | null = null;
  /** Last applied hand aim transform — skip redundant writes that restart transitions. */
  private lastHandTx = "";
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
    this.handLeftAim = this.root.querySelector("#hand-left-aim");
    this.setStreamerName(this.streamerName);
    this.applyVisualState();
    this.bindHelmPhoto();
    document.addEventListener("visibilitychange", this.onVis);
    this.scheduleFlavor();
  }

  /**
   * Prefer a painted transparent head asset when present.
   * SVG #helm-drawn stays as silhouette fallback / layout anchor.
   */
  private bindHelmPhoto(): void {
    const img = this.root.querySelector("#helm-photo") as SVGImageElement | null;
    const drawn = this.root.querySelector("#helm-drawn") as SVGGElement | null;
    if (!img) return;
    // Alpha assets only — jpg kept in public/ as a placement reference, not auto-mounted.
    const candidates = ["/avatar/killa-maska-head.webp", "/avatar/killa-maska-head.png"];
    const apply = (url: string) => {
      img.setAttribute("href", url);
      img.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
      img.setAttribute("opacity", "1");
      if (drawn) drawn.setAttribute("opacity", "0");
      this.root.dataset.helmPhoto = "1";
    };
    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        img.setAttribute("opacity", "0");
        if (drawn) drawn.setAttribute("opacity", "1");
        this.root.dataset.helmPhoto = "0";
        return;
      }
      const probe = new Image();
      probe.onload = () => apply(candidates[i]!);
      probe.onerror = () => tryNext(i + 1);
      probe.src = candidates[i]!;
    };
    tryNext(0);
  }

  setStreamerName(name: string): void {
    this.streamerName = name.trim() || "datguydaz";
  }

  setChatEnabled(on: boolean): void {
    this.chatEnabled = on;
    if (!on) this.hideChat();
  }

  /** Dashboard-persisted corner + insets for the AI bot chat bubble. */
  setChatPlacement(
    chat: Pick<ChatSettings, "placement" | "offsetXPct" | "offsetYPct">,
  ): void {
    applyChatPlacement(this.chatEl, chat);
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
    this.applyIdleMotionTiming();
  }

  /** Quiet chest + varied head cycle length (avoids a metronome hitch feel). */
  private applyIdleMotionTiming(): void {
    if (
      this.root.dataset.cough === "1" ||
      this.root.dataset.roll === "1" ||
      this.root.dataset.talk === "1" ||
      this.root.dataset.talkNod === "1"
    ) {
      return;
    }
    const torso = this.root.querySelector("#layer-torso") as SVGElement | null;
    const head = this.root.querySelector("#layer-head") as SVGElement | null;
    if (torso) {
      torso.style.animationDuration = `${(5.0 + Math.random() * 0.8) / this.intensity}s`;
    }
    if (head) {
      // Slow varied cycle (11–15s); linear keyframes stay hitch-free.
      head.style.animationDuration = `${(11 + Math.random() * 4) / this.intensity}s`;
    }
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
    this.lastHandTx = "";
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
    if (!this.handLeftAim) return;
    // Vest pivot (#hand-left-pivot @ 128,220). SVG only — rotate for lean, then
    // residual translate so palm lands on the keycap. No CSS fill-box, no scale stretch.
    const shoulder = { x: 128, y: 220 };
    const home = HAND_HOME;
    const kbMinX = 64;
    const kbMaxX = 214;
    const kbMinY = 266;
    const kbMaxY = 282;
    let next: string;
    if (this.keyHeld > 0 && this.activeSlot != null) {
      const pos = slotPos(this.activeSlot);
      // Palm sits slightly above key center so fingertips hit the cap
      const targetCx = Math.min(kbMaxX, Math.max(kbMinX, pos.cx));
      const targetCy = Math.min(kbMaxY, Math.max(kbMinY, pos.cy - 6));
      const homeAng = Math.atan2(home.cy - shoulder.y, home.cx - shoulder.x);
      const tgtAng = Math.atan2(targetCy - shoulder.y, targetCx - shoulder.x);
      const rotDeg = ((tgtAng - homeAng) * 180) / Math.PI;
      const hx = home.cx - shoulder.x;
      const hy = home.cy - shoulder.y;
      const rad = (rotDeg * Math.PI) / 180;
      // Tip after rotate-only around vest root
      const tipX = shoulder.x + hx * Math.cos(rad) - hy * Math.sin(rad);
      const tipY = shoulder.y + hx * Math.sin(rad) + hy * Math.cos(rad);
      const dx = targetCx - tipX;
      const dy = targetCy - tipY;
      // SVG: rotate first, then translate residual (right-to-left attr order)
      next = `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rotDeg.toFixed(2)})`;
      this.root.dataset.keySlot = String(this.activeSlot);
    } else {
      next = "";
      delete this.root.dataset.keySlot;
    }
    if (next === this.lastHandTx) return;
    this.lastHandTx = next;
    this.handLeftAim.style.transform = "";
    this.handLeftAim.style.transition = "";
    if (next) this.handLeftAim.setAttribute("transform", next);
    else this.handLeftAim.removeAttribute("transform");
    if (this.handLeft) this.handLeft.style.transform = "";
  }

  private applyVisualState(): void {
    this.root.dataset.key = this.keyHeld > 0 ? "1" : "0";
    this.root.dataset.mouseL = this.mouseLHeld > 0 ? "1" : "0";
    this.root.dataset.mouseR = this.mouseRHeld > 0 ? "1" : "0";

    // Button shine only — never glow fingers/hand
    const lmb = this.root.querySelector("#mouse-lmb") as SVGElement | null;
    const rmb = this.root.querySelector("#mouse-rmb") as SVGElement | null;
    const lmbOver = this.root.querySelector("#mouse-lmb-overlay") as SVGElement | null;
    const rmbOver = this.root.querySelector("#mouse-rmb-overlay") as SVGElement | null;
    const fingerL = this.root.querySelector("#finger-lmb") as SVGElement | null;
    const fingerR = this.root.querySelector("#finger-rmb") as SVGElement | null;
    if (lmb) {
      lmb.style.fill = this.mouseLHeld > 0 ? "#c7923a" : "#1a1a1a";
      lmb.setAttribute("fill", this.mouseLHeld > 0 ? "#c7923a" : "#1a1a1a");
    }
    if (rmb) {
      rmb.style.fill = this.mouseRHeld > 0 ? "#c7923a" : "#1a1a1a";
      rmb.setAttribute("fill", this.mouseRHeld > 0 ? "#c7923a" : "#1a1a1a");
    }
    if (lmbOver) {
      const op = this.mouseLHeld > 0 ? "1" : "0";
      lmbOver.style.fillOpacity = op;
      lmbOver.setAttribute("fill-opacity", op);
      lmbOver.removeAttribute("opacity");
    }
    if (rmbOver) {
      const op = this.mouseRHeld > 0 ? "1" : "0";
      rmbOver.style.fillOpacity = op;
      rmbOver.setAttribute("fill-opacity", op);
      rmbOver.removeAttribute("opacity");
    }
    if (fingerL) {
      fingerL.style.fill = "#b89068";
      fingerL.setAttribute("fill", "#b89068");
    }
    if (fingerR) {
      fingerR.style.fill = "#b89068";
      fingerR.setAttribute("fill", "#b89068");
    }

    const wheelBusy = this.root.dataset.wheel === "up" || this.root.dataset.wheel === "down";
    const active =
      this.keyHeld > 0 || this.mouseLHeld > 0 || this.mouseRHeld > 0 || wheelBusy ? "1" : "0";
    this.root.dataset.active = this.lightsEnabled ? active : "0";
    this.applyHandToSlot();
    // Do NOT reseed idle animation durations here — that hitch/reset on every key event.
    this.root.dataset.lights = this.lightsEnabled ? "1" : "0";
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
