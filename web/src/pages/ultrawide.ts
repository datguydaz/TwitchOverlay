import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import { AtmosphereVfx } from "../lib/atmosphereVfx.ts";
import { TextLifeVfx } from "../lib/textLifeVfx.ts";
import { SocialReadoutAnim } from "../lib/socialReadoutAnim.ts";
import { createBunkerSfx } from "../lib/bunkerSfx.ts";
import {
  applySmokeRuinTextures,
  resolveSmokeEdgeStyle,
  type SmokeEdgeStyle,
} from "../lib/smokeRuinTextures.ts";
import { applySmokeBarFx } from "../lib/smokeBarFx.ts";
import { applySmokeBunkerHud } from "../lib/smokeBunkerHud.ts";
import { applySmokeBarProps } from "../lib/smokeBarProps.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";
import type { AtmPreviewKind } from "../../../shared/protocol.ts";

function qs<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector(sel);
}

function displayName(raw: string | undefined): string {
  const t = (raw || "").trim();
  if (!t || t === "—" || t === "--" || t === "-") return "";
  return t;
}

const LS_LAST_FOLLOWER = "pz.uw.smoke.lastFollower";
const LS_LAST_SUBSCRIBER = "pz.uw.smoke.lastSubscriber";

function readStoredName(key: string): string {
  try {
    return displayName(localStorage.getItem(key) || "");
  } catch {
    return "";
  }
}

function writeStoredName(key: string, name: string): void {
  if (!name) return;
  try {
    localStorage.setItem(key, name);
  } catch {
    /* private mode / blocked storage */
  }
}

/**
 * Live social name with last-known fallback.
 * Empty settings → last memory → localStorage → "" (never STANDBY).
 */
function resolveSocialName(
  incoming: string | undefined,
  memory: string,
  lsKey: string,
): string {
  const next = displayName(incoming);
  if (next) {
    writeStoredName(lsKey, next);
    return next;
  }
  if (memory) return memory;
  return readStoredName(lsKey);
}

/** Smoke dog-tag: keep OPERATOR bone, ONLINE muted green + status dot. */
function applySmokeOperatorLine(host: HTMLElement, line: string): void {
  let left = host.querySelector<HTMLElement>(".smk-op-left");
  let online = host.querySelector<HTMLElement>(".smk-op-online");
  let dot = host.querySelector<HTMLElement>(".smk-op-dot");
  if (!left || !online) {
    host.innerHTML =
      '<span class="smk-op-left"></span><i class="smk-op-dot" aria-hidden="true"></i><span class="smk-op-online"></span>';
    left = host.querySelector(".smk-op-left");
    online = host.querySelector(".smk-op-online");
    dot = host.querySelector(".smk-op-dot");
  }
  if (!left || !online) {
    host.textContent = line;
    return;
  }
  const m = /^(.*)\s+(ONLINE)\s*$/i.exec(line);
  if (m) {
    left.textContent = m[1];
    online.textContent = "ONLINE";
    online.hidden = false;
    if (dot) dot.hidden = false;
  } else {
    left.textContent = line;
    online.textContent = "";
    online.hidden = true;
    if (dot) dot.hidden = true;
  }
}

function scaleUwStage(stage: HTMLElement, width: number, height: number): void {
  const apply = () => {
    const sx = window.innerWidth / width;
    const sy = window.innerHeight / height;
    const s = Math.min(sx, sy);
    stage.style.transform = `scale(${s})`;
  };
  apply();
  window.addEventListener("resize", apply);
}

let atm: AtmosphereVfx | null = null;
let textFx: TextLifeVfx | null = null;
let socialAnim: SocialReadoutAnim | null = null;
const bunkerSfx = createBunkerSfx();
let lastFollower = "";
let lastSubscriber = "";
let bootstrappedSocial = false;
let smokeRuinCleanup: (() => void) | null = null;
let smokeBarFxCleanup: (() => void) | null = null;
let smokeBunkerHudCleanup: (() => void) | null = null;
let smokeBarPropsCleanup: (() => void) | null = null;
let smokeRuinReady = false;
let lastSmokeBarH = 0;
let lastSmokeEdge: SmokeEdgeStyle | "" = "";
let lastSmokeNames: SmokeNamesStyle | "" = "";

export type SmokeNamesStyle = "terminal" | "stencil" | "condensed" | "oswald";

/** Smoke page only: `?bar=` tunes letterbox height (120–248). Default 180. */
function resolveSmokeBarH(): number {
  try {
    const raw = new URLSearchParams(location.search).get("bar");
    if (raw != null && raw !== "") {
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n)) return Math.round(Math.max(120, Math.min(248, n)));
    }
  } catch {
    /* ignore */
  }
  return 180;
}

/**
 * `?names=` — follower/subscriber name font only.
 * Unset → current look (Oswald + greenish). Explicit oswald → bone.
 */
function resolveSmokeNamesStyle(): SmokeNamesStyle | "" {
  try {
    const raw = (new URLSearchParams(location.search).get("names") || "").toLowerCase();
    if (raw === "terminal" || raw === "stencil" || raw === "condensed" || raw === "oswald") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return "";
}

/** Shrink name glyphs so long handles still fit inside the radio screen. */
function fitSocialNameFonts(stage: HTMLElement): void {
  for (const id of ["uw-follower-name", "uw-subscriber-name"]) {
    const el = stage.querySelector(`#${id}`) as HTMLElement | null;
    if (!el) continue;
    const parent = el.parentElement;
    if (!parent) continue;
    el.style.fontSize = "";
    const base = Number.parseFloat(getComputedStyle(el).fontSize) || 28;
    let size = base;
    const min = Math.max(13, base * 0.42);
    const maxW = Math.max(40, parent.clientWidth - 12);
    // Binary-ish shrink — keep type-in readable
    let guard = 0;
    while (el.scrollWidth > maxW && size > min && guard++ < 60) {
      size -= 0.75;
      el.style.fontSize = `${size}px`;
    }
  }
}

const TEXT_PREVIEW = new Set<AtmPreviewKind>(["text-dip", "text-sweep", "text-op"]);

const DEMO_FOLLOW = "ZONE_SCOUT";
const DEMO_SUB = "RAID_READY";

function applyUltrawide(settings: OverlaySettings): void {
  const uw = settings.ultrawide;
  const mode = document.body.dataset.uwMode;
  const stage = qs<HTMLElement>("#uw-stage");
  if (!stage) return;

  let barH = Math.max(64, Math.min(420, uw.barHeight || 180));
  const smokeFixed = stage.dataset.variant === "smoke-flare";
  // Smoke page: default 180; optional ?bar= (120–248) for Streamlabs tuning
  if (smokeFixed) {
    barH = resolveSmokeBarH();
  }
  // Streamlabs Browser Source smoke page: always exact 3440×1440 (no window scaling)
  const canvasW = smokeFixed ? 3440 : Math.max(1280, uw.canvasWidth || 3440);
  const canvasH = smokeFixed ? 1440 : Math.max(720, uw.canvasHeight || 1440);

  stage.style.setProperty("--uw-bar-h", `${barH}px`);
  stage.style.setProperty("--uw-canvas-w", `${canvasW}px`);

  if (!mode) {
    stage.style.width = `${canvasW}px`;
    stage.style.height = `${canvasH}px`;
    if (smokeFixed) {
      document.documentElement.classList.add("uw-smoke-html");
      stage.style.transform = "none";
      // Keep text-fx lamp/amber breathe off on smoke mono variant
      stage.dataset.textFx = "off";
    } else {
      scaleUwStage(stage, canvasW, canvasH);
    }
  }

  document.querySelectorAll("[data-streamer-name]").forEach((el) => {
    el.textContent = settings.streamerName;
  });

  const top = qs<HTMLElement>("#uw-top");
  const bottom = qs<HTMLElement>("#uw-bottom");
  const topPlate = qs<HTMLElement>("#uw-top-text");
  const opSuffix = qs<HTMLElement>("#uw-operator-suffix");

  if (top) {
    top.style.height = `${barH}px`;
    top.dataset.hidden = uw.topVisible ? "false" : "true";
  }
  if (bottom) {
    bottom.style.height = `${barH}px`;
    bottom.dataset.hidden = uw.bottomVisible ? "false" : "true";
  }

  const name = settings.streamerName || "datguydaz";
  if (topPlate) {
    const nameEl = topPlate.querySelector<HTMLElement>("[data-streamer-name]");
    const opStrip = topPlate.querySelector<HTMLElement>(".uw-op-readout");
    const stencil = topPlate.querySelector<HTMLElement>(".uw-stencil");
    const utility = topPlate.querySelector<HTMLElement>(".uw-util-lamp");
    const legacyTitle = topPlate.querySelector<HTMLElement>(".uw-legacy-title");
    if (uw.operatorLineOnTop !== false) {
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = name;
      }
      if (stencil) stencil.hidden = false;
      if (opStrip) opStrip.hidden = false;
      if (utility) utility.hidden = false;
      if (legacyTitle) legacyTitle.hidden = true;
      if (opSuffix) {
        const line =
          (uw.operatorLine || "OPERATOR ONLINE").trim() || "OPERATOR ONLINE";
        if (smokeFixed) {
          applySmokeOperatorLine(opSuffix, line);
        } else {
          opSuffix.textContent = line;
        }
      }
    } else {
      if (nameEl) nameEl.hidden = true;
      if (stencil) stencil.hidden = true;
      if (opStrip) opStrip.hidden = true;
      if (utility) utility.hidden = true;
      let legacy = legacyTitle;
      if (!legacy) {
        legacy = document.createElement("div");
        legacy.className = "uw-legacy-title uw-title";
        topPlate.appendChild(legacy);
      }
      legacy.hidden = false;
      legacy.textContent = uw.topText || "ZONE OPS // TRANSMISSION";
    }
  }

  const social = settings.social;
  const follower = qs<HTMLElement>("#uw-follower");
  const subscriber = qs<HTMLElement>("#uw-subscriber");
  const followerName = qs<HTMLElement>("#uw-follower-name");
  const subscriberName = qs<HTMLElement>("#uw-subscriber-name");
  const nextFol = resolveSocialName(
    social.latestFollower ?? social.latestFollowerSample,
    lastFollower,
    LS_LAST_FOLLOWER,
  );
  const nextSub = resolveSocialName(
    social.latestSubscriber ?? social.latestSubscriberSample,
    lastSubscriber,
    LS_LAST_SUBSCRIBER,
  );

  if (follower) follower.hidden = !social.showFollower;
  if (subscriber) subscriber.hidden = !social.showSubscriber;

  const reduced =
    settings.textEffects.reducedMotion || settings.atmosphere.reducedMotion;

  if (!atm) atm = new AtmosphereVfx(stage, settings.atmosphere);
  else atm.applyConfig(settings.atmosphere);

  if (!textFx) textFx = new TextLifeVfx(stage, settings.textEffects);
  else textFx.applyConfig(settings.textEffects);
  // Smoke mono: kill lamp/amber text-life after TextLifeVfx may flip dataset on
  if (smokeFixed) {
    stage.dataset.textFx = "off";
    stage.dataset.barH = String(barH);
    const edgeStyle = resolveSmokeEdgeStyle(stage);
    stage.dataset.edge = edgeStyle;
    const namesStyle = resolveSmokeNamesStyle();
    if (namesStyle) stage.dataset.names = namesStyle;
    else delete stage.dataset.names;
    if (!smokeRuinReady || lastSmokeBarH !== barH || lastSmokeEdge !== edgeStyle) {
      smokeRuinCleanup?.();
      smokeBarFxCleanup?.();
      smokeBunkerHudCleanup?.();
      smokeBarPropsCleanup?.();
      smokeRuinCleanup = applySmokeRuinTextures(stage);
      smokeBarFxCleanup = applySmokeBarFx(stage);
      smokeBunkerHudCleanup = applySmokeBunkerHud(stage);
      smokeBarPropsCleanup = applySmokeBarProps(stage);
      smokeRuinReady = true;
      lastSmokeBarH = barH;
      lastSmokeEdge = edgeStyle;
    }
    if (lastSmokeNames !== namesStyle) {
      lastSmokeNames = namesStyle;
      // Re-fit after font family swap
      void (async () => {
        try {
          if (document.fonts?.ready) await document.fonts.ready;
        } catch {
          /* ignore */
        }
        fitSocialNameFonts(stage);
      })();
    }
  }

  bunkerSfx.applyConfig(
    settings.sfx || {
      enabled: true,
      volume: 0.6,
      follow: { preset: "typewriter", customId: "", pool: [], typewriterLayer: false, volume: 1 },
      sub: { preset: "typewriter", customId: "", pool: [], typewriterLayer: false, volume: 1 },
    },
  );

  if (!socialAnim) {
    socialAnim = new SocialReadoutAnim(stage, reduced, {
      onEventStart: (kind) => bunkerSfx.playEventStart(kind),
      onTypeChar: (kind, ch) => bunkerSfx.onTypeChar(kind, ch),
      onTypeDone: (kind) => bunkerSfx.onTypeDone(kind),
    });
  } else {
    socialAnim.setReducedMotion(reduced);
  }

  // First load: set names quietly (never leave plates blank on smoke). Later: anim on change.
  if (!bootstrappedSocial) {
    if (followerName) followerName.textContent = nextFol;
    if (subscriberName) subscriberName.textContent = nextSub;
    bootstrappedSocial = true;
    if (smokeFixed) {
      void (async () => {
        try {
          if (document.fonts?.ready) await document.fonts.ready;
        } catch {
          /* ignore */
        }
        fitSocialNameFonts(stage);
      })();
    }
  } else {
    if (nextFol && nextFol !== lastFollower) {
      socialAnim.enqueue("follow", nextFol);
      atm.pulseSocial("follow");
    } else if (followerName && !followerName.closest("[data-social-fx]")) {
      followerName.textContent = nextFol;
    }
    if (nextSub && nextSub !== lastSubscriber) {
      socialAnim.enqueue("sub", nextSub);
      atm.pulseSocial("sub");
    } else if (subscriberName && !subscriberName.closest("[data-social-fx]")) {
      subscriberName.textContent = nextSub;
    }
  }

  lastFollower = nextFol;
  lastSubscriber = nextSub;

  stage.dataset.vfx =
    settings.atmosphere.enabled && !settings.atmosphere.reducedMotion ? "on" : "off";
}

function routePreview(kind: AtmPreviewKind): void {
  if (kind === "sfx-follow") {
    bunkerSfx.playTest("follow");
    return;
  }
  if (kind === "sfx-sub") {
    bunkerSfx.playTest("sub");
    return;
  }
  if (kind === "follow") {
    socialAnim?.demo("follow", DEMO_FOLLOW);
    atm?.preview("follow");
    return;
  }
  if (kind === "sub") {
    socialAnim?.demo("sub", DEMO_SUB);
    atm?.preview("sub");
    return;
  }
  if (kind === "flicker" || kind === "smoke" || kind === "sparks") atm?.preview(kind);
  if (TEXT_PREVIEW.has(kind)) textFx?.preview(kind);
}

async function refreshCustomSounds(): Promise<void> {
  try {
    const res = await fetch("/api/sounds");
    if (!res.ok) return;
    const data = (await res.json()) as {
      sounds?: { id: string; name: string; filename: string }[];
    };
    bunkerSfx.setCustomCatalog(
      (data.sounds || []).map((s) => ({
        id: s.id,
        name: s.name,
        url: `/sounds/${encodeURIComponent(s.filename)}`,
      })),
    );
  } catch {
    /* offline */
  }
}

async function main(): Promise<void> {
  const params = new URLSearchParams(location.search);
  bunkerSfx.applyUrlParams(params);
  // Browser Source: resume early; Chrome tab may stay suspended until click.
  void bunkerSfx.unlock();
  const unlockOnce = () => {
    void bunkerSfx.unlock();
    window.removeEventListener("pointerdown", unlockOnce);
    window.removeEventListener("keydown", unlockOnce);
  };
  window.addEventListener("pointerdown", unlockOnce, { once: true });
  window.addEventListener("keydown", unlockOnce, { once: true });

  let settings = await fetchSettings();
  await refreshCustomSounds();
  applyCssVars(settings);
  applyUltrawide(settings);

  const refresh = async () => {
    settings = await fetchSettings();
    await refreshCustomSounds();
    applyCssVars(settings);
    applyUltrawide(settings);
  };

  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, 2500);

  const preview = params.get("atmPreview") as AtmPreviewKind | null;
  if (preview) {
    window.setTimeout(() => routePreview(preview), 400);
  }

  const proto = location.protocol === "https:" ? "wss" : "ws";
  try {
    const tokenRes = await fetch("/api/token");
    const { token } = (await tokenRes.json()) as { token: string };
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "hello", role: "overlay", token }));
    });
    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as {
          type?: string;
          kind?: string;
        };
        if (msg.type === "settings-updated") void refresh();
        if (msg.type === "atm-preview" && msg.kind) {
          routePreview(msg.kind as AtmPreviewKind);
        }
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* polling still covers settings */
  }
}

void main();
