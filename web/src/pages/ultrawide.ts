import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import { ZONE_TRASH_TALK } from "../avatar/reactiveAvatar.ts";
import type { OverlaySettings, SocialPlacement } from "../../../shared/settings.ts";

function qs<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector(sel);
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

function setVfxEnabled(on: boolean): void {
  const stage = qs<HTMLElement>("#uw-stage");
  if (stage) stage.dataset.vfx = on ? "on" : "off";
}

function placeSocial(el: HTMLElement | null, place: SocialPlacement, show: boolean): void {
  if (!el) return;
  el.dataset.place = place;
  el.hidden = !show;
}

function showChatLine(text: string, tag: string): void {
  const box = qs<HTMLElement>("#uw-chat");
  const body = qs<HTMLElement>("#uw-chat-body");
  const tagEl = qs<HTMLElement>("#uw-chat-tag");
  if (!box || !body) return;
  if (tagEl) tagEl.textContent = tag;
  body.textContent = text.slice(0, 220);
  box.dataset.show = "1";
  window.clearTimeout((showChatLine as { _t?: number })._t);
  (showChatLine as { _t?: number })._t = window.setTimeout(() => {
    box.dataset.show = "0";
  }, 5600);
}

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
  const topText = qs<HTMLElement>("#uw-top-text");
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
  if (topText) {
    if (uw.operatorLineOnTop !== false) {
      const suffix = (uw.operatorLine || "OPERATOR ONLINE").trim() || "OPERATOR ONLINE";
      topText.innerHTML = `<span data-streamer-name>${name}</span> // ${suffix}`;
    } else {
      topText.textContent = uw.topText || "ZONE OPS // TRANSMISSION";
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
  if (followerName) followerName.textContent = social.latestFollowerSample || "SAMPLE_USER";
  if (subscriberName) subscriberName.textContent = social.latestSubscriberSample || "SAMPLE_SUB";

  // Placement: on top-only / bottom-only pages, prefer edge placements that fit.
  let fPlace = social.followerPlacement;
  let sPlace = social.subscriberPlacement;
  if (mode === "top") {
    if (fPlace.startsWith("bottom")) fPlace = "top-left";
    if (sPlace.startsWith("bottom")) sPlace = "top-right";
  } else if (mode === "bottom") {
    if (fPlace.startsWith("top")) fPlace = "bottom-left";
    if (sPlace.startsWith("top")) sPlace = "bottom-right";
  }
  placeSocial(follower, fPlace, social.showFollower);
  placeSocial(subscriber, sPlace, social.showSubscriber);

  const chat = qs<HTMLElement>("#uw-chat");
  if (chat) chat.style.display = settings.chat.enabled ? "" : "none";
}

/** Rare signal glitch — low duty cycle, paused when tab hidden. */
function startGlitchLoop(): void {
  let timer: number | null = null;
  let clearTimer: number | null = null;

  const clear = () => {
    if (timer != null) window.clearTimeout(timer);
    if (clearTimer != null) window.clearTimeout(clearTimer);
    timer = null;
    clearTimer = null;
  };

  const schedule = () => {
    clear();
    if (document.hidden) return;
    const delay = 11000 + Math.random() * 17000;
    timer = window.setTimeout(() => {
      timer = null;
      if (document.hidden) {
        schedule();
        return;
      }
      const bars = document.querySelectorAll<HTMLElement>(".uw-bar");
      const pick = bars[Math.floor(Math.random() * Math.max(1, bars.length))];
      if (pick && pick.dataset.hidden !== "true") {
        pick.dataset.glitch = "1";
        clearTimer = window.setTimeout(() => {
          delete pick.dataset.glitch;
          clearTimer = null;
        }, 300);
      }
      schedule();
    }, delay);
  };

  document.addEventListener("visibilitychange", () => {
    setVfxEnabled(!document.hidden);
    if (document.hidden) {
      clear();
      document.querySelectorAll(".uw-bar").forEach((el) => {
        delete (el as HTMLElement).dataset.glitch;
      });
    } else {
      schedule();
    }
  });

  setVfxEnabled(!document.hidden);
  schedule();
}

function startTrashTalk(getSettings: () => OverlaySettings): void {
  let timer: number | null = null;

  const tick = () => {
    if (timer != null) window.clearTimeout(timer);
    const s = getSettings();
    const interval = Math.max(6000, Math.min(90000, s.chat.intervalMs || 14000));
    timer = window.setTimeout(() => {
      timer = null;
      const cur = getSettings();
      if (
        !document.hidden &&
        cur.chat.enabled &&
        cur.chat.demoAuto &&
        qs("#uw-chat")
      ) {
        const line = ZONE_TRASH_TALK[Math.floor(Math.random() * ZONE_TRASH_TALK.length)]!;
        showChatLine(line, `${cur.streamerName.toUpperCase()} // COMMS`);
      }
      tick();
    }, interval + Math.random() * 4000);
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
  tick();
}

async function main(): Promise<void> {
  let settings = await fetchSettings();
  applyCssVars(settings);
  applyUltrawide(settings);
  startGlitchLoop();
  startTrashTalk(() => settings);

  const refresh = async () => {
    settings = await fetchSettings();
    applyCssVars(settings);
    applyUltrawide(settings);
  };

  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, 2500);

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
          text?: string;
          from?: string;
        };
        if (msg.type === "settings-updated") void refresh();
        if (msg.type === "chat-line" && typeof msg.text === "string" && settings.chat.enabled) {
          showChatLine(
            msg.text,
            `${settings.streamerName.toUpperCase()} // COMMS`,
          );
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
