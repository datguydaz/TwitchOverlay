/**
 * Gritty Tarkov/bunker radio SFX for ultrawide-smoke social events.
 * Procedural Web Audio only — no sample files, idle = zero CPU.
 */

export type BunkerSfxKind = "follow" | "sub";

export type BunkerSfxConfig = {
  enabled: boolean;
  /** 0..1 master level (before URL ?vol=). */
  volume: number;
};

const DEFAULT_VOL = 0.6;
const DEBOUNCE_MS: Record<BunkerSfxKind, number> = {
  follow: 900,
  sub: 1800,
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_VOL;
  return Math.max(0, Math.min(1, n));
}

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

export class BunkerSfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private enabled = true;
  private settingsVol = DEFAULT_VOL;
  private urlMute = false;
  private urlVol: number | null = null;
  private lastAt: Record<BunkerSfxKind, number> = { follow: 0, sub: 0 };
  private unlocked = false;

  /** Parse ?sfx=0 / ?vol=0..1 from the Browser Source URL. */
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

  applyConfig(cfg: BunkerSfxConfig): void {
    this.enabled = cfg.enabled !== false;
    this.settingsVol = clamp01(cfg.volume);
    this.syncMaster();
  }

  get effectiveVolume(): number {
    if (this.urlMute || !this.enabled) return 0;
    if (this.urlVol != null) return this.urlVol;
    return this.settingsVol;
  }

  /** Try to resume AudioContext (Browser Source usually OK; Chrome tab needs a click). */
  async unlock(): Promise<boolean> {
    const ctx = this.ensureCtx();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      this.unlocked = ctx.state === "running";
      return this.unlocked;
    } catch {
      return false;
    }
  }

  /**
   * Play follow/sub cue. Debounced for gift-sub bombs unless `force`.
   * No-op when muted / volume 0 / AudioContext blocked.
   */
  play(kind: BunkerSfxKind, opts?: { force?: boolean }): void {
    const vol = this.effectiveVolume;
    if (vol <= 0.001) return;

    const now = performance.now();
    if (!opts?.force) {
      const gap = DEBOUNCE_MS[kind];
      if (now - this.lastAt[kind] < gap) return;
    }
    this.lastAt[kind] = now;

    void this.unlock().then((ok) => {
      if (!ok && !this.ctx) return;
      const ctx = this.ensureCtx();
      if (!ctx || !this.master) return;
      if (ctx.state !== "running") {
        // Chrome tab without gesture — fail quietly; OBS Browser Source usually runs.
        return;
      }
      const t0 = ctx.currentTime + 0.01;
      if (kind === "follow") this.playFollow(ctx, this.master, t0, vol);
      else this.playSub(ctx, this.master, t0, vol);
    });
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

  private syncMaster(): void {
    // Per-shot bus gain uses effectiveVolume; master stays unity.
    void this.master;
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
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.05, dur));
    src.connect(bp);
    bp.connect(g);
    g.connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  private beep(
    ctx: AudioContext,
    dest: AudioNode,
    t0: number,
    freq: number,
    dur: number,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    osc.connect(lp);
    lp.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private click(
    ctx: AudioContext,
    dest: AudioNode,
    t0: number,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1800, t0);
    osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.04);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.06);
  }

  private thud(
    ctx: AudioContext,
    dest: AudioNode,
    t0: number,
    gain: number,
  ): void {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(95, t0);
    osc.frequency.exponentialRampToValueAtTime(38, t0 + 0.22);
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    osc.connect(g);
    g.connect(dest);
    osc.start(t0);
    osc.stop(t0 + 0.3);
    // Metallic overlay
    this.noiseSource(ctx, dest, t0, 0.18, gain * 0.45, "bandpass", 900, 2.2);
  }

  /** ~1s: radio squelch + static burst + faint click. */
  private playFollow(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);

    this.click(ctx, bus, t0, 0.22);
    // Squelch open
    this.noiseSource(ctx, bus, t0, 0.16, 0.35, "bandpass", 1400, 1.4);
    // Static body
    this.noiseSource(ctx, bus, t0 + 0.08, 0.55, 0.18, "highpass", 1200, 0.6);
    // Soft close chirp
    this.beep(ctx, bus, t0 + 0.62, 620, 0.05, 0.08);
    this.noiseSource(ctx, bus, t0 + 0.7, 0.28, 0.08, "bandpass", 800, 0.8);
  }

  /** ~1.7s: hatch thud + morse-ish beep + static tail (+ light surge crackle). */
  private playSub(
    ctx: AudioContext,
    dest: GainNode,
    t0: number,
    vol: number,
  ): void {
    const bus = ctx.createGain();
    bus.gain.value = vol;
    bus.connect(dest);

    // Optional power-surge crackle (cheap)
    this.noiseSource(ctx, bus, t0, 0.09, 0.28, "highpass", 2800, 0.5);
    this.thud(ctx, bus, t0 + 0.04, 0.55);
    // Hatch scrape
    this.noiseSource(ctx, bus, t0 + 0.12, 0.22, 0.2, "bandpass", 480, 1.8);

    // Morse-ish: · · — ·
    const dots = [
      [0.42, 0.055],
      [0.52, 0.055],
      [0.64, 0.14],
      [0.84, 0.055],
    ] as const;
    for (const [off, dur] of dots) {
      this.beep(ctx, bus, t0 + off, 780, dur, 0.14);
    }

    // Static tail
    this.noiseSource(ctx, bus, t0 + 1.05, 0.55, 0.14, "bandpass", 1100, 0.7);
    this.noiseSource(ctx, bus, t0 + 1.35, 0.35, 0.07, "highpass", 1600, 0.5);
  }
}

export function createBunkerSfx(): BunkerSfx {
  return new BunkerSfx();
}
