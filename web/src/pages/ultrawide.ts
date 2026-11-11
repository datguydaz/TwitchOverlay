import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import { AtmosphereVfx } from "../lib/atmosphereVfx.ts";
import { TextLifeVfx } from "../lib/textLifeVfx.ts";
import { SocialReadoutAnim } from "../lib/socialReadoutAnim.ts";
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
let lastFollower = "";
let lastSubscriber = "";
let bootstrappedSocial = false;

const TEXT_PREVIEW = new Set<AtmPreviewKind>(["text-dip", "text-sweep", "text-op"]);

const DEMO_FOLLOW = "ZONE_SCOUT";
const DEMO_SUB = "RAID_READY";

function applyUltrawide(settings: OverlaySettings): void {
  const uw = settings.ultrawide;
  const mode = document.body.dataset.uwMode;
  const stage = qs<HTMLElement>("#uw-stage");
  if (!stage) return;

  const barH = Math.max(64, Math.min(420, uw.barHeight || 180));
  const canvasW = Math.max(1280, uw.canvasWidth || 3440);
  const canvasH = Math.max(720, uw.canvasHeight || 1440);

  stage.style.setProperty("--uw-bar-h", `${barH}px`);
  stage.style.setProperty("--uw-canvas-w", `${canvasW}px`);

  if (!mode) {
    stage.style.width = `${canvasW}px`;
    stage.style.height = `${canvasH}px`;
    scaleUwStage(stage, canvasW, canvasH);
  }

  document.querySelectorAll("[data-streamer-name]").forEach((el) => {
    el.textContent = settings.streamerName;
  });

  const top = qs<HTMLElement>("#uw-top");
  const bottom = qs<HTMLElement>("#uw-bottom");
  const topPlate = qs<HTMLElement>("#uw-top-text");
  const opSuffix = qs<HTMLElement>("#uw-operator-suffix");
  const bottomStatus = qs<HTMLElement>("#uw-bottom-status");

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
        opSuffix.textContent =
          (uw.operatorLine || "OPERATOR ONLINE").trim() || "OPERATOR ONLINE";
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

  if (bottomStatus) {
    const face = bottomStatus.querySelector<HTMLElement>(".uw-text-face");
    if (face) face.textContent = uw.statusText || "ZONE THREAT // RAID READY";
    else bottomStatus.textContent = uw.statusText || "ZONE THREAT // RAID READY";
  }

  const social = settings.social;
  const follower = qs<HTMLElement>("#uw-follower");
  const subscriber = qs<HTMLElement>("#uw-subscriber");
  const followerName = qs<HTMLElement>("#uw-follower-name");
  const subscriberName = qs<HTMLElement>("#uw-subscriber-name");
  const nextFol = displayName(social.latestFollower ?? social.latestFollowerSample);
  const nextSub = displayName(social.latestSubscriber ?? social.latestSubscriberSample);

  if (follower) follower.hidden = !social.showFollower;
  if (subscriber) subscriber.hidden = !social.showSubscriber;

  const reduced =
    settings.textEffects.reducedMotion || settings.atmosphere.reducedMotion;

  if (!atm) atm = new AtmosphereVfx(stage, settings.atmosphere);
  else atm.applyConfig(settings.atmosphere);

  if (!textFx) textFx = new TextLifeVfx(stage, settings.textEffects);
  else textFx.applyConfig(settings.textEffects);

  if (!socialAnim) socialAnim = new SocialReadoutAnim(stage, reduced);
  else socialAnim.setReducedMotion(reduced);

  // First load: set names quietly. Later changes: queue smoked-glass event anim.
  if (!bootstrappedSocial) {
    if (followerName) followerName.textContent = nextFol;
    if (subscriberName) subscriberName.textContent = nextSub;
    bootstrappedSocial = true;
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

async function main(): Promise<void> {
  let settings = await fetchSettings();
  applyCssVars(settings);
  applyUltrawide(settings);

  const refresh = async () => {
    settings = await fetchSettings();
    applyCssVars(settings);
    applyUltrawide(settings);
  };

  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, 2500);

  const params = new URLSearchParams(location.search);
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
