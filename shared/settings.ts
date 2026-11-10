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

export interface ChatSettings {
  enabled: boolean;
  /** Auto Zone Ops trash-talk on a timer. */
  demoAuto: boolean;
  /** Trash-talk interval in ms (clamped 6s–90s). */
  intervalMs: number;
}

export interface SocialSettings {
  showFollower: boolean;
  showSubscriber: boolean;
  followerPlacement: SocialPlacement;
  subscriberPlacement: SocialPlacement;
  /** Demo names — clearly SAMPLE until Twitch/Kick wired. */
  latestFollowerSample: string;
  latestSubscriberSample: string;
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
  };
  mic: {
    /** Dashboard Web Audio mic → overlays (levels only). */
    enabled: boolean;
    threshold: number;
  };
  chat: ChatSettings;
  social: SocialSettings;
  ultrawide: UltrawideSettings;
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
    webcam: { visible: true, x: 1560, y: 48, scale: 1 },
    events: { visible: true, x: 48, y: 820, scale: 1 },
    /* Visual size ~420px after 1200px hi-res base (1200 * 0.35 ≈ 420) */
    avatar: { visible: true, x: 1500, y: 740, scale: 0.35 },
  },
  avatar: {
    intensity: 1,
    lightsEnabled: true,
  },
  mic: {
    enabled: false,
    threshold: 0.12,
  },
  chat: {
    enabled: true,
    demoAuto: true,
    intervalMs: 14000,
  },
  social: {
    showFollower: true,
    showSubscriber: true,
    followerPlacement: "top-left",
    subscriberPlacement: "top-right",
    latestFollowerSample: "GhostPing_42",
    latestSubscriberSample: "RaidMama",
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
    avatar: { ...base.avatar, ...partial.avatar },
    mic: { ...base.mic, ...partial.mic },
    chat: { ...base.chat, ...partial.chat },
    social: { ...base.social, ...partial.social },
    ultrawide: { ...base.ultrawide, ...partial.ultrawide },
  };
}
