import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import { AtmosphereVfx } from "../lib/atmosphereVfx.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";

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
let lastFollower = "";
let lastSubscriber = "";

function applyUltrawide(settings: OverlaySettings): void {
  const uw = settings.ultrawide;
  const mode = document.body.dataset.uwMode; // top | bottom | undefined (full)
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
  const bottomText = qs<HTMLElement>("#uw-bottom-text");
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
    const opStrip = topPlate.querySelector<HTMLElement>(".uw-op-strip");
    const housingFace = topPlate.querySelector<HTMLElement>(".uw-housing-face");
    const utility = topPlate.querySelector<HTMLElement>(".uw-utility");
    const legacyTitle = topPlate.querySelector<HTMLElement>(".uw-legacy-title");
    if (uw.operatorLineOnTop !== false) {
      if (nameEl) {
        nameEl.hidden = false;
        nameEl.textContent = name;
      }
      if (housingFace) housingFace.hidden = false;
      if (opStrip) opStrip.hidden = false;
      if (utility) utility.hidden = false;
      if (legacyTitle) legacyTitle.hidden = true;
      if (opSuffix) {
        opSuffix.textContent =
          (uw.operatorLine || "OPERATOR ONLINE").trim() || "OPERATOR ONLINE";
      }
    } else {
      if (nameEl) nameEl.hidden = true;
      if (housingFace) housingFace.hidden = true;
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

  if (bottomText) {
    bottomText.textContent = uw.bottomText || "HOLD THE LINE";
  }

  const status = uw.statusText || "ZONE THREAT // RAID READY";
  if (bottomStatus) bottomStatus.textContent = status;

  const social = settings.social;
  const follower = qs<HTMLElement>("#uw-follower");
  const subscriber = qs<HTMLElement>("#uw-subscriber");
  const followerName = qs<HTMLElement>("#uw-follower-name");
  const subscriberName = qs<HTMLElement>("#uw-subscriber-name");
  const nextFol = displayName(social.latestFollower ?? social.latestFollowerSample);
  const nextSub = displayName(social.latestSubscriber ?? social.latestSubscriberSample);
  if (followerName) followerName.textContent = nextFol;
  if (subscriberName) subscriberName.textContent = nextSub;
  if (follower) follower.hidden = !social.showFollower;
  if (subscriber) subscriber.hidden = !social.showSubscriber;

  if (atm) {
    if (nextFol && nextFol !== lastFollower) atm.pulseSocial("follow");
    if (nextSub && nextSub !== lastSubscriber) atm.pulseSocial("sub");
  }
  lastFollower = nextFol;
  lastSubscriber = nextSub;

  if (!atm) atm = new AtmosphereVfx(stage, settings.atmosphere);
  else atm.applyConfig(settings.atmosphere);

  stage.dataset.vfx = settings.atmosphere.enabled && !settings.atmosphere.reducedMotion ? "on" : "off";
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

  // Dashboard can ask for atmosphere preview via query (local only)
  const params = new URLSearchParams(location.search);
  const preview = params.get("atmPreview");
  if (preview && atm) {
    window.setTimeout(() => {
      if (preview === "flicker" || preview === "smoke" || preview === "sparks" || preview === "follow" || preview === "sub") {
        atm?.preview(preview);
      }
    }, 400);
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
        if (msg.type === "atm-preview" && msg.kind && atm) {
          atm.preview(msg.kind as "flicker" | "smoke" | "sparks" | "follow" | "sub");
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
