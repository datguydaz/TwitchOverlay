/**
 * Ultrawide-smoke event SFX: typewriter (default), radio/hatch builtins, custom uploads,
 * plus narrative scene cues (telex/chain/chute/alarm). Idle = no scheduled audio.
 */
import type { SfxEventSettings, SfxPreset, SfxSettings } from "../../../shared/settings.ts";
import { DEFAULT_SFX_EVENT } from "../../../shared/settings.ts";
import type { EventSceneCue } from "./eventScenes.ts";

export type BunkerSfxKind = "follow" | "sub";

export type CustomSoundRef = {
  id: string;
  name: string;
  /** Absolute or same-origin URL, e.g. /sounds/snd_….wav */
  url: string;
};

const DEFAULT_VOL = 0.6;
const DEBOUNCE_MS: Record<BunkerSfxKind, number> = {
  follow: 900,
  sub: 1800,
};

function clamp01(n: number, fallback = DEFAULT_VOL): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

export class BunkerSfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = true;
  private settingsVol = DEFAULT_VOL;
  private urlMute = false;
  private urlVol: number | null = null;
  private follow: SfxEventSettings = { ...DEFAULT_SFX_EVENT };
  private sub: SfxEventSettings = { ...DEFAULT_SFX_EVENT };
  private customs = new Map<string, CustomSoundRef>();
  private bufferCache = new Map<string, AudioBuffer>();
  private lastOneshotAt: Record<BunkerSfxKind, number> = { follow: 0, sub: 0 };
  /** Active typewriter session per kind (for layer / preset). */
  private typing: Record<BunkerSfxKind, boolean> = { follow: false, sub: false };

  applyUrlParams(params: URLSearchParams): void {
    const sfx = (params.get("sfx") || "").trim().toLowerCase();
    if (sfx === "0" || sfx === "off" || sfx === "false" || sfx === "mute") {
      this.urlMute = true;
    } else if (sfx === "1" || sfx === "on" || sfx === "true") {
      this.urlMute = false;
    }
    const volRaw = params.get("vol");
    if (volRaw != null && volRaw !== "") {
      const v = Number(volRaw);
      this.urlVol = Number.isFinite(v) ? clamp01(v) : null;
    }
  }

  applyConfig(cfg: SfxSettings): void {
    this.enabled = cfg.enabled !== false;
    this.settingsVol = clamp01(cfg.volume);
    this.follow = { ...DEFAULT_SFX_EVENT, ...cfg.follow };
    this.sub = { ...DEFAULT_SFX_EVENT, ...cfg.sub };
  }

  setCustomCatalog(list: CustomSoundRef[]): void {
    this.customs.clear();
    for (const s of list) {
      if (s?.id && s.url) this.customs.set(s.id, s);
    }
  }

  get effectiveMasterVolume(): number {
    if (this.urlMute || !this.enabled) return 0;
    if (this.urlVol != null) return this.urlVol;
    return this.settingsVol;
  }

  async unlock(): Promise<boolean> {
    const ctx = this.ensureCtx();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      return ctx.state === "running";
    } catch {
      return false;
    }
  }

  eventConfig(kind: BunkerSfxKind): SfxEventSettings {
    return kind === "follow" ? this.follow : this.sub;
  }

  /**
   * Event start: oneshots (radio/hatch/custom/random) + open typewriter session if needed.
   * Debounced for gift-sub bombs unless `force`.
   */
  playEventStart(kind: BunkerSfxKind, opts?: { force?: boolean }): void {
    const cfg = this.eventConfig(kind);
    const master = this.effectiveMasterVolume;
    if (master <= 0.001) return;

    const now = performance.now();
    if (!opts?.force && now - this.lastOneshotAt[kind] < DEBOUNCE_MS[kind]) {
      // Still allow typewriter chars if a session is already open
      return;
    }
    this.lastOneshotAt[kind] = now;

    const wantType =
      cfg.preset === "typewriter" ||
      (cfg.typewriterLayer && cfg.preset !== "none");
    this.typing[kind] = wantType;

    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== "running" || !this.master) return;
      const vol = master * clamp01(cfg.volume, 1);
      if (vol <= 0.001) return;

      if (cfg.preset === "none") return;

      if (cfg.preset === "typewriter") {
        // Clacks come from onTypeChar; soft idle arm only.
        return;
      }

      if (cfg.preset === "radio") {
        this.playRadio(ctx, this.master, ctx.currentTime + 0.01, vol);
        return;
      }
      if (cfg.preset === "hatch") {
        this.playHatch(ctx, this.master, ctx.currentTime + 0.01, vol);
        return;
      }

      const id = this.pickCustomId(cfg);
      if (id) void this.playCustom(id, vol);
    });
  }

  /** One key clack — call from type-in loop. */
  onTypeChar(kind: BunkerSfxKind, char: string): void {
    if (!this.typing[kind]) return;
    const master = this.effectiveMasterVolume;
    if (master <= 0.001) return;
    const cfg = this.eventConfig(kind);
    const vol = master * clamp01(cfg.volume, 1) * 0.55;
    if (vol <= 0.001) return;
    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== "running" || !this.master) return;
      const soft = char === " " || char === "-" || char === "_";
      this.playTypeClack(ctx, this.master, ctx.currentTime, vol * (soft ? 0.55 : 1), soft);
    });
  }

  /** Carriage return + bell at end of type-in. */
  onTypeDone(kind: BunkerSfxKind): void {
    if (!this.typing[kind]) return;
    this.typing[kind] = false;
    const master = this.effectiveMasterVolume;
    if (master <= 0.001) return;
    const cfg = this.eventConfig(kind);
    const vol = master * clamp01(cfg.volume, 1) * 0.45;
    if (vol <= 0.001) return;
    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== "running" || !this.master) return;
      this.playTypeBell(ctx, this.master, ctx.currentTime + 0.02, vol);
    });
  }

  /**
   * Dashboard / atm-preview test — uses current selection, no name change.
   * Typewriter: a short demo string of clacks + bell.
   */
  playTest(kind: BunkerSfxKind): void {
    const cfg = this.eventConfig(kind);
    this.playEventStart(kind, { force: true });
    if (cfg.preset === "typewriter" || cfg.typewriterLayer) {
      this.typing[kind] = true;
      const demo = kind === "follow" ? "Follow" : "Sub";
      let i = 0;
      const tick = () => {
        if (i >= demo.length) {
          this.onTypeDone(kind);
          return;
        }
        this.onTypeChar(kind, demo[i]!);
        i += 1;
        window.setTimeout(tick, 28 + Math.floor(Math.random() * 36));
      };
      window.setTimeout(tick, 40);
    }
  }

  /** @deprecated use playTest / playEventStart */
  play(kind: BunkerSfxKind, opts?: { force?: boolean }): void {
    if (opts?.force) this.playTest(kind);
    else this.playEventStart(kind);
  }

  /**
   * Narrative scene cue — procedural, respects master + event volume.
   * Opens a typewriter session when cue implies typing will follow.
   */
  playSceneCue(cue: EventSceneCue, kind: BunkerSfxKind): void {
    const master = this.effectiveMasterVolume;
    if (master <= 0.001) return;
    const cfg = this.eventConfig(kind);
    const vol = master * clamp01(cfg.volume, 1);
    if (vol <= 0.001) return;

    // Arm typewriter for scenes that engrave/print character-by-character
    if (
      cue === "telex-chatter" ||
      cue === "chain-jingle" ||
      cue === "chute-flap" ||
      cue === "alarm-klaxon"
    ) {
      const wantType =
        cfg.preset === "typewriter" ||
        (cfg.typewriterLayer && cfg.preset !== "none");
      this.typing[kind] = wantType;
    }

    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== "running" || !this.master) return;
      const t0 = ctx.currentTime + 0.01;
      switch (cue) {
        case "telex-chatter":
          this.playTelexChatter(ctx, this.master, t0, vol * 0.55);
          break;
        case "telex-tear":
          this.noiseSource(ctx, this.master, t0, 0.08, vol * 0.22, "bandpass", 1800, 1.4);
          break;
        case "telex-pin":
          this.noiseSource(ctx, this.master, t0, 0.05, vol * 0.18, "highpass", 2400, 0.8);
          break;
        case "chain-jingle":
          this.playChainJingle(ctx, this.master, t0, vol * 0.5);
          break;
        case "engrave-spark":
          this.noiseSource(ctx, this.master, t0, 0.03, vol * 0.12, "highpass", 3200, 1.2);
          break;
        case "chute-flap":
          this.playChuteFlap(ctx, this.master, t0, vol * 0.45);
          break;
        case "airdrop-thud":
          this.playAirdropThud(ctx, this.master, t0, vol * 0.7);
          break;
        case "flare-hiss":
          this.noiseSource(ctx, this.master, t0, 0.55, vol * 0.2, "bandpass", 900, 0.6);
          break;
        case "alarm-klaxon":
          this.playAlarmKlaxon(ctx, this.master, t0, vol * 0.55);
          break;
        case "door-slam":
          this.playDoorSlam(ctx, this.master, t0, vol * 0.75);
          break;
        case "door-grind":
          this.noiseSource(ctx, this.master, t0, 0.7, vol * 0.28, "bandpass", 420, 1.8);
          this.noiseSource(ctx, this.master, t0 + 0.1, 0.55, vol * 0.14, "highpass", 1600, 0.7);
          break;
        default:
          break;
      }
    });
  }

  private pickCustomId(cfg: SfxEventSettings): string | null {
    if (cfg.preset === "custom") {
      return cfg.customId && this.customs.has(cfg.customId) ? cfg.customId : null;
    }
    if (cfg.preset === "random") {
      const pool = (cfg.pool || []).filter((id) => this.customs.has(id));
      if (!pool.length) {
        // Fall back to all customs if pool empty
        const all = [...this.customs.keys()];
        if (!all.length) return null;
        return all[Math.floor(Math.random() * all.length)] || null;
      }
      return pool[Math.floor(Math.random() * pool.length)] || null;
    }
    return null;
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 1;
        this.master.connect(this.ctx.destination);
        this.noise = noiseBuffer(this.ctx, 1.2);
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  private noiseSource(
    ctx: AudioContext,
    dest: AudioNode,
    t0: number,
    dur: number,
    gain: number,
    filterType: BiquadFilterType,
    freq: number,
    q = 0.7,
  ): void {
    if (!this.noise) this.noise = noiseBuffer(ctx, 1.2);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = filterType;
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.03, dur));
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.04);
  }

  /** Mechanical typewriter key — noise strike + low mechanism, not a beep. */
  private playTypeClack(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
    soft: boolean,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol * rand(0.75, 1.15);
    bus.connect(dest);

    const strikeDur = soft ? rand(0.012, 0.022) : rand(0.016, 0.032);
    const strikeFreq = soft ? rand(1800, 2600) : rand(2200, 3800);
    this.noiseSource(
      ctx,
      bus,
      t0,
      strikeDur,
      soft ? 0.22 : 0.38,
      "bandpass",
      strikeFreq,
      rand(1.6, 3.2),
    );
    // Body / linkage thud
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const f0 = soft ? rand(70, 95) : rand(85, 130);
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(f0 * 0.55, t0 + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(soft ? 0.12 : 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + rand(0.035, 0.055));
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + 0.06);
  }

  private playTypeBell(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);

    // Carriage slide
    this.noiseSource(ctx, bus, t0, 0.12, 0.12, "bandpass", 600, 1.2);

    const ding = (freq: number, gain: number, delay: number) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const start = t0 + delay;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
      osc.connect(g);
      g.connect(bus);
      osc.start(start);
      osc.stop(start + 0.6);
    };
    ding(987.8, 0.16, 0.05); // B5-ish
    ding(1318.5, 0.09, 0.055);
  }

  private playTelexChatter(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    for (let i = 0; i < 7; i++) {
      const tt = t0 + i * 0.045;
      this.noiseSource(ctx, bus, tt, 0.028, 0.35, "bandpass", rand(1400, 2800), 2.2);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = rand(90, 140);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, tt);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.035);
      osc.connect(g);
      g.connect(bus);
      osc.start(tt);
      osc.stop(tt + 0.04);
    }
  }

  private playChainJingle(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    const freqs = [880, 1174, 1480, 990, 1320];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f * rand(0.97, 1.03);
      const g = ctx.createGain();
      const tt = t0 + i * 0.04;
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.12, tt + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.18);
      osc.connect(g);
      g.connect(bus);
      osc.start(tt);
      osc.stop(tt + 0.2);
    });
    this.noiseSource(ctx, bus, t0, 0.12, 0.1, "highpass", 2500, 0.8);
  }

  private playChuteFlap(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    for (let i = 0; i < 4; i++) {
      this.noiseSource(
        ctx,
        bus,
        t0 + i * 0.18,
        0.14,
        0.22 - i * 0.03,
        "bandpass",
        rand(280, 520),
        0.9,
      );
    }
  }

  private playAirdropThud(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, t0);
    osc.frequency.exponentialRampToValueAtTime(32, t0 + 0.28);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.55, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + 0.34);
    this.noiseSource(ctx, bus, t0, 0.16, 0.4, "lowpass", 400, 0.7);
  }

  private playAlarmKlaxon(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      const tt = t0 + i * 0.16;
      osc.frequency.setValueAtTime(420, tt);
      osc.frequency.linearRampToValueAtTime(620, tt + 0.1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.14, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.13);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1800;
      osc.connect(lp);
      lp.connect(g);
      g.connect(bus);
      osc.start(tt);
      osc.stop(tt + 0.15);
    }
  }

  private playDoorSlam(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    this.noiseSource(ctx, bus, t0, 0.08, 0.5, "lowpass", 600, 1.2);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(70, t0);
    osc.frequency.exponentialRampToValueAtTime(28, t0 + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.45, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + 0.24);
    this.noiseSource(ctx, bus, t0 + 0.02, 0.1, 0.25, "highpass", 2000, 0.6);
  }

  private playRadio(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    // Soft click
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1600, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + 0.06);
    this.noiseSource(ctx, bus, t0, 0.16, 0.32, "bandpass", 1400, 1.4);
    this.noiseSource(ctx, bus, t0 + 0.08, 0.5, 0.16, "highpass", 1200, 0.6);
  }

  private playHatch(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);
    this.noiseSource(ctx, bus, t0, 0.09, 0.24, "highpass", 2800, 0.5);
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, t0 + 0.04);
    osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.26);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.32);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0 + 0.04);
    osc.stop(t0 + 0.34);
    this.noiseSource(ctx, bus, t0 + 0.04, 0.18, 0.4, "bandpass", 900, 2.2);
    this.noiseSource(ctx, bus, t0 + 0.12, 0.22, 0.18, "bandpass", 480, 1.8);
    const dots = [
      [0.42, 0.055],
      [0.52, 0.055],
      [0.64, 0.14],
      [0.84, 0.055],
    ] as const;
    for (const [off, dur] of dots) {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = 780;
      const gg = ctx.createGain();
      const tt = t0 + off;
      gg.gain.setValueAtTime(0.0001, tt);
      gg.gain.exponentialRampToValueAtTime(0.12, tt + 0.008);
      gg.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2400;
      o.connect(lp);
      lp.connect(gg);
      gg.connect(bus);
      o.start(tt);
      o.stop(tt + dur + 0.02);
    }
    this.noiseSource(ctx, bus, t0 + 1.05, 0.5, 0.12, "bandpass", 1100, 0.7);
  }

  private async playCustom(id: string, vol: number): Promise<void> {
    const ref = this.customs.get(id);
    if (!ref) return;
    const ctx = this.ensureCtx();
    if (!ctx || !this.master) return;
    try {
      let buf = this.bufferCache.get(id);
      if (!buf) {
        const res = await fetch(ref.url);
        if (!res.ok) return;
        const ab = await res.arrayBuffer();
        buf = await ctx.decodeAudioData(ab.slice(0));
        this.bufferCache.set(id, buf);
      }
      if (ctx.state !== "running") await ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const g = ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    } catch {
      /* decode / fetch fail quietly */
    }
  }
}

export function createBunkerSfx(): BunkerSfx {
  return new BunkerSfx();
}

export function resolvePresetLabel(preset: SfxPreset, customName?: string): string {
  switch (preset) {
    case "none":
      return "None";
    case "typewriter":
      return "Typewriter";
    case "radio":
      return "Radio squelch";
    case "hatch":
      return "Hatch / radio (heavy)";
    case "random":
      return "Random from my list";
    case "custom":
      return customName ? `Custom: ${customName}` : "Custom";
    default:
      return preset;
  }
}
