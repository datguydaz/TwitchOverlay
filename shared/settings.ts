export type SceneId =
  | "gameplay"
  | "starting-soon"
  | "brb"
  | "ending"
  | "avatar"
  | "ultrawide";

export type SocialPlacement =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** AI bot chat corner on avatar overlay (dashboard-editable). */
export type ChatPlacement =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-left"
  | "top-right"
  | "mid-left"
  | "mid-right";

export const CHAT_PLACEMENTS: readonly ChatPlacement[] = [
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-left",
  "top-right",
  "mid-left",
  "mid-right",
] as const;

export interface ModuleTransform {
  visible: boolean;
  x: number;
  y: number;
  scale: number;
}

/** Letterbox fills for ultrawide canvas (e.g. 3440×1440) around centered 16:9. */
export interface UltrawideSettings {
  canvasWidth: number;
  canvasHeight: number;
  /** Each bar thickness in px. Default 180 → 1080px hole in 1440 canvas. */
  barHeight: number;
  topVisible: boolean;
  bottomVisible: boolean;
  /** Legacy/custom top center when operatorLineOnTop is false. */
  topText: string;
  /** Bottom-center banner line (operator name lives on top). */
  bottomText: string;
  /** Bottom-right status chip — threat / extract / raid vibe. */
  statusText: string;
  /** When true, top center shows `{STREAMER} // {operatorLine}`. */
  operatorLineOnTop: boolean;
  /** Suffix after streamer name on the top bar. */
  operatorLine: string;
}

export type AtmosphereIntensity = "low" | "medium" | "high";

/** Ultrawide / bunker frame ambient VFX — dashboard only; not real connection status. */
export interface AtmosphereSettings {
  /** Master enable for decorative atmosphere. */
  enabled: boolean;
  intensity: AtmosphereIntensity;
  dust: boolean;
  smoke: boolean;
  sparks: boolean;
  flicker: boolean;
  /** Force-disable motion even if OS allows it. */
  reducedMotion: boolean;
}

/** Frame lettering life FX — separate from ambient atmosphere. */
export interface TextEffectsSettings {
  enabled: boolean;
  intensity: AtmosphereIntensity;
  /** Force-disable text motion even if OS allows it. */
  reducedMotion: boolean;
}

/**
 * Per-event sound selection for ultrawide-smoke.
 * Built-ins: none / typewriter (default) / radio / hatch / random (from pool).
 * `custom` picks one uploaded file via `customId`.
 */
export type SfxPreset = "none" | "typewriter" | "radio" | "hatch" | "random" | "custom";

export interface SfxEventSettings {
  preset: SfxPreset;
  /** When preset is `custom` — single uploaded sound id. */
  customId: string;
  /** When preset is `random` — uploaded ids eligible for the pool. */
  pool: string[];
  /**
   * Layer typewriter key-clacks under a oneshot (radio/hatch/custom/random).
   * Default false when a non-typewriter oneshot is selected.
   */
  typewriterLayer: boolean;
  /** Per-event volume 0..1 (multiplied by master). */
  volume: number;
}

/** Event SFX — master mute/volume + separate Follow / Sub pickers. */
export interface SfxSettings {
  /** Master enable — URL `?sfx=0` still forces mute. */
  enabled: boolean;
  /** Master 0..1 — URL `?vol=` overrides when present. Default ~0.6. */
  volume: number;
  follow: SfxEventSettings;
  sub: SfxEventSettings;
}

export const DEFAULT_SFX_EVENT: SfxEventSettings = {
  preset: "typewriter",
  customId: "",
  pool: [],
  typewriterLayer: false,
  volume: 1,
};

/** Comedic operator typos during follow/sub type-in. */
export interface OperatorTypoSettings {
  /** Master enable — URL `?typos=0` forces off, `?typos=1` forces on. */
  enabled: boolean;
  /** Chance 0..1 when enabled (default 0.7). Long names skip. */
  chance: number;
}

export const DEFAULT_OPERATOR_TYPOS: OperatorTypoSettings = {
  enabled: true,
  chance: 0.7,
};

export interface ChatSettings {
  enabled: boolean;
  /** Auto Zone Ops trash-talk on a timer. */
  demoAuto: boolean;
  /** Trash-talk interval in ms (clamped 6s–90s). */
  intervalMs: number;
  /**
   * Games he "plays" for canned match trash-talk (not live game reading).
   * One display name per entry — edited in dashboard.
   */
  games: string[];
  /** Corner / side for the AI bot chat bubble (persisted). */
  placement: ChatPlacement;
  /** Inset from the chosen horizontal edge, percent of overlay width (0–40). */
  offsetXPct: number;
  /** Inset from the chosen vertical edge, percent of overlay height (0–40). */
  offsetYPct: number;
  /** COMMS bubble scale multiplier (0.6–10, default 1). */
  scale: number;
}

/** Default roster for "playing his own games" chat flavor. */
export const DEFAULT_CHAT_GAMES: readonly string[] = [
  "Tarkov",
  "DayZ",
  "Arena Breakout",
  "Hunt: Showdown",
  "Gray Zone",
];

export interface SocialSettings {
  showFollower: boolean;
  showSubscriber: boolean;
  /**
   * Display name for latest follower. Empty until Twitch/Kick is wired.
   * (Kept as latestFollowerSample in persisted JSON via merge for compat.)
   */
  latestFollower: string;
  latestSubscriber: string;
  /** @deprecated compat — mapped to latestFollower */
  latestFollowerSample?: string;
  /** @deprecated compat — mapped to latestSubscriber */
  latestSubscriberSample?: string;
  followerPlacement?: SocialPlacement;
  subscriberPlacement?: SocialPlacement;
}

export interface OverlaySettings {
  version: 1;
  streamerName: string;
  accentColor: string;
  oliveColor: string;
  beigeColor: string;
  charcoalColor: string;
  countdownMinutes: number;
  countdownTargetIso: string | null;
  sceneText: {
    startingSoonTitle: string;
    startingSoonSub: string;
    brbTitle: string;
    brbSub: string;
    endingTitle: string;
    endingSub: string;
  };
  modules: {
    identity: ModuleTransform;
    webcam: ModuleTransform;
    events: ModuleTransform;
    avatar: ModuleTransform;
  };
  avatar: {
    intensity: number;
    lightsEnabled: boolean;
    /**
     * Mouse+hand follow gain (speed). Higher = bigger nudge per cursor delta.
     * Typical 0.06–0.35; default ~0.12 (slower/smoother than the first pass).
     */
    mouseFollowGain: number;
    /**
     * Mouse+hand follow smoothness 0–1. Higher = slower lerp / more glide.
     * 0 = snappy; ~0.75 default; 0.95 = very soft.
     */
    mouseFollowSmooth: number;
  };
  mic: {
    /** Dashboard Web Audio mic → overlays (levels only). */
    enabled: boolean;
    threshold: number;
  };
  chat: ChatSettings;
  social: SocialSettings;
  ultrawide: UltrawideSettings;
  atmosphere: AtmosphereSettings;
  textEffects: TextEffectsSettings;
  sfx: SfxSettings;
  operatorTypos: OperatorTypoSettings;
  demoModeDefault: boolean;
}

export const DEFAULT_SETTINGS: OverlaySettings = {
  version: 1,
  streamerName: "datguydaz",
  accentColor: "#c7923a",
  oliveColor: "#6b7355",
  beigeColor: "#c4b59a",
  charcoalColor: "#1a1c18",
  countdownMinutes: 10,
  countdownTargetIso: null,
  sceneText: {
    startingSoonTitle: "SIGNAL ACQUISITION",
    startingSoonSub: "Operator inbound. Stand by for zone entry.",
    brbTitle: "OPERATOR AWAY",
    brbSub: "Hold position. Transmission resumes shortly.",
    endingTitle: "EXTRACTION COMPLETE",
    endingSub: "Thanks for riding along in the zone.",
  },
  modules: {
    identity: { visible: true, x: 48, y: 48, scale: 1 },
    /* 16:9 cam is 420px wide — keep fully on 1920 stage (was 1560+320) */
    webcam: { visible: true, x: 1452, y: 48, scale: 1 },
    events: { visible: true, x: 48, y: 820, scale: 1 },
    /* Visual size ~420px after 1200px hi-res base (1200 * 0.35 ≈ 420) */
    avatar: { visible: true, x: 1500, y: 740, scale: 0.35 },
  },
  avatar: {
    intensity: 1,
    lightsEnabled: true,
    mouseFollowGain: 0.12,
    mouseFollowSmooth: 0.75,
  },
  mic: {
    enabled: false,
    threshold: 0.12,
  },
  chat: {
    enabled: true,
    demoAuto: true,
    intervalMs: 14000,
    games: [...DEFAULT_CHAT_GAMES],
    // Centered under desk lip by default (ox 20 = dead center for bottom-center)
    placement: "bottom-center",
    offsetXPct: 20,
    offsetYPct: 2,
    scale: 1,
  },
  social: {
    showFollower: true,
    showSubscriber: true,
    latestFollower: "",
    latestSubscriber: "",
  },
  ultrawide: {
    canvasWidth: 3440,
    canvasHeight: 1440,
    barHeight: 180,
    topVisible: true,
    bottomVisible: true,
    topText: "ZONE OPS // TRANSMISSION",
    bottomText: "HOLD THE LINE",
    statusText: "ZONE THREAT // RAID READY",
    operatorLineOnTop: true,
    operatorLine: "OPERATOR ONLINE",
  },
  atmosphere: {
    enabled: true,
    intensity: "low",
    dust: true,
    smoke: true,
    sparks: true,
    flicker: true,
    reducedMotion: false,
  },
  textEffects: {
    enabled: true,
    intensity: "medium",
    reducedMotion: false,
  },
  sfx: {
    enabled: true,
    volume: 0.6,
    follow: { ...DEFAULT_SFX_EVENT },
    sub: { ...DEFAULT_SFX_EVENT },
  },
  operatorTypos: { ...DEFAULT_OPERATOR_TYPOS },
  demoModeDefault: false,
};

export function mergeSettings(
  partial: Partial<OverlaySettings> | null | undefined,
): OverlaySettings {
  const base = structuredClone(DEFAULT_SETTINGS);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    version: 1,
    sceneText: { ...base.sceneText, ...partial.sceneText },
    modules: {
      identity: { ...base.modules.identity, ...partial.modules?.identity },
      webcam: { ...base.modules.webcam, ...partial.modules?.webcam },
      events: { ...base.modules.events, ...partial.modules?.events },
      avatar: { ...base.modules.avatar, ...partial.modules?.avatar },
    },
    avatar: (() => {
      const a = { ...base.avatar, ...partial.avatar };
      const clamp = (n: unknown, min: number, max: number, fallback: number) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return fallback;
        return Math.max(min, Math.min(max, Math.round(v * 1000) / 1000));
      };
      return {
        ...a,
        intensity: clamp(a.intensity, 0.2, 2, 1),
        lightsEnabled: !!a.lightsEnabled,
        mouseFollowGain: clamp(a.mouseFollowGain, 0.04, 0.45, 0.12),
        mouseFollowSmooth: clamp(a.mouseFollowSmooth, 0, 0.95, 0.75),
      };
    })(),
    mic: { ...base.mic, ...partial.mic },
    chat: (() => {
      const c = { ...base.chat, ...partial.chat };
      const raw = partial.chat?.games ?? c.games ?? [...DEFAULT_CHAT_GAMES];
      const games = (Array.isArray(raw) ? raw : [])
        .map((g) => String(g ?? "").trim())
        .filter(Boolean)
        .slice(0, 24);
      const placementRaw = String(partial.chat?.placement ?? c.placement ?? "bottom-center");
      const placement = (CHAT_PLACEMENTS as readonly string[]).includes(placementRaw)
        ? (placementRaw as ChatPlacement)
        : "bottom-center";
      const clampPct = (n: unknown, fallback: number) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return fallback;
        return Math.max(0, Math.min(40, v));
      };
      const clampScale = (n: unknown, fallback: number) => {
        const v = Number(n);
        if (!Number.isFinite(v)) return fallback;
        return Math.max(0.6, Math.min(10, Math.round(v * 100) / 100));
      };
      return {
        ...c,
        games: games.length ? games : [...DEFAULT_CHAT_GAMES],
        placement,
        offsetXPct: clampPct(partial.chat?.offsetXPct ?? c.offsetXPct, 20),
        offsetYPct: clampPct(partial.chat?.offsetYPct ?? c.offsetYPct, 2),
        scale: clampScale(partial.chat?.scale ?? c.scale, 1),
      };
    })(),
    social: (() => {
      const s = { ...base.social, ...partial.social };
      // Migrate old SAMPLE fields → empty placeholders
      const fol =
        partial.social?.latestFollower ??
        partial.social?.latestFollowerSample ??
        s.latestFollower ??
        "";
      const sub =
        partial.social?.latestSubscriber ??
        partial.social?.latestSubscriberSample ??
        s.latestSubscriber ??
        "";
      const scrub = (v: string) => {
        const t = String(v ?? "").trim();
        if (!t || t === "—" || t === "--" || t === "-") return "";
        if (/^sample/i.test(t) || t === "GhostPing_42" || t === "RaidMama" || t === "SAMPLE_USER" || t === "SAMPLE_SUB") {
          return "";
        }
        return t;
      };
      return {
        showFollower: s.showFollower,
        showSubscriber: s.showSubscriber,
        latestFollower: scrub(fol),
        latestSubscriber: scrub(sub),
      };
    })(),
    ultrawide: { ...base.ultrawide, ...partial.ultrawide },
    atmosphere: (() => {
      const a = { ...base.atmosphere, ...partial.atmosphere };
      const raw = String(a.intensity || "low").toLowerCase();
      const intensity: AtmosphereIntensity =
        raw === "medium" || raw === "med"
          ? "medium"
          : raw === "high"
            ? "high"
            : "low";
      return {
        enabled: a.enabled !== false,
        intensity,
        dust: a.dust !== false,
        smoke: a.smoke !== false,
        sparks: a.sparks !== false,
        flicker: a.flicker !== false,
        reducedMotion: !!a.reducedMotion,
      };
    })(),
    textEffects: (() => {
      const t = { ...base.textEffects, ...partial.textEffects };
      const raw = String(t.intensity || "medium").toLowerCase();
      const intensity: AtmosphereIntensity =
        raw === "low" ? "low" : raw === "high" ? "high" : "medium";
      return {
        enabled: t.enabled !== false,
        intensity,
        reducedMotion: !!t.reducedMotion,
      };
    })(),
    sfx: (() => {
      const s = { ...base.sfx, ...partial.sfx };
      const vol = Number(s.volume);
      const mergeEvent = (
        raw: Partial<SfxEventSettings> | undefined,
        fallback: SfxEventSettings,
      ): SfxEventSettings => {
        const e = { ...fallback, ...raw };
        const presetRaw = String(e.preset || "typewriter").toLowerCase();
        const preset: SfxPreset =
          presetRaw === "none" ||
          presetRaw === "radio" ||
          presetRaw === "hatch" ||
          presetRaw === "random" ||
          presetRaw === "custom"
            ? presetRaw
            : "typewriter";
        const evVol = Number(e.volume);
        const pool = Array.isArray(e.pool)
          ? e.pool.map((id) => String(id || "").trim()).filter(Boolean).slice(0, 48)
          : [];
        return {
          preset,
          customId: String(e.customId || "").trim(),
          pool,
          typewriterLayer: !!e.typewriterLayer,
          volume: Number.isFinite(evVol) ? Math.max(0, Math.min(1, evVol)) : 1,
        };
      };
      return {
        enabled: s.enabled !== false,
        volume: Number.isFinite(vol) ? Math.max(0, Math.min(1, vol)) : 0.6,
        follow: mergeEvent(partial.sfx?.follow ?? s.follow, DEFAULT_SFX_EVENT),
        sub: mergeEvent(partial.sfx?.sub ?? s.sub, DEFAULT_SFX_EVENT),
      };
    })(),
    operatorTypos: (() => {
      const t = { ...base.operatorTypos, ...partial.operatorTypos };
      const ch = Number(t.chance);
      return {
        enabled: t.enabled !== false,
        chance: Number.isFinite(ch) ? Math.max(0, Math.min(1, ch)) : 0.7,
      };
    })(),
  };
}
