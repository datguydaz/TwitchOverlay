/**
 * Ultrawide-smoke event SFX: typewriter (default), radio/hatch builtins, custom uploads.
 * Idle = no scheduled audio. Typewriter clacks sync to type-in chars.
 */
import type { SfxEventSettings, SfxPreset, SfxSettings } from "../../../shared/settings.ts";
import { DEFAULT_SFX_EVENT } from "../../../shared/settings.ts";

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

  /** Softer backspace / delete click during typo correction. */
  onBackspace(kind: BunkerSfxKind): void {
    if (!this.typing[kind]) return;
    const master = this.effectiveMasterVolume;
    if (master <= 0.001) return;
    const cfg = this.eventConfig(kind);
    const vol = master * clamp01(cfg.volume, 1) * 0.32;
    if (vol <= 0.001) return;
    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || ctx.state !== "running" || !this.master) return;
      this.playBackspace(ctx, this.master, ctx.currentTime, vol);
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

  private playBackspace(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol * rand(0.85, 1.1);
    bus.connect(dest);
    this.noiseSource(ctx, bus, t0, rand(0.018, 0.03), 0.22, "bandpass", rand(900, 1400), 1.4);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(rand(55, 75), t0);
    osc.frequency.exponentialRampToValueAtTime(32, t0 + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.045);
    osc.connect(g);
    g.connect(bus);
    osc.start(t0);
    osc.stop(t0 + 0.05);
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
