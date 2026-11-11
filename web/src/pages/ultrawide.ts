import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";

function qs<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector(sel);
}

function displayName(raw: string | undefined): string {
  const t = (raw || "").trim();
  // No em-dash / "--" placeholder — leave blank until a real name exists
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

function setVfxEnabled(on: boolean): void {
  const stage = qs<HTMLElement>("#uw-stage");
  if (stage) stage.dataset.vfx = on ? "on" : "off";
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
  if (followerName) {
    followerName.textContent = displayName(
      social.latestFollower ?? social.latestFollowerSample,
    );
  }
  if (subscriberName) {
    subscriberName.textContent = displayName(
      social.latestSubscriber ?? social.latestSubscriberSample,
    );
  }
  if (follower) follower.hidden = !social.showFollower;
  if (subscriber) subscriber.hidden = !social.showSubscriber;
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

async function main(): Promise<void> {
  let settings = await fetchSettings();
  applyCssVars(settings);
  applyUltrawide(settings);
  startGlitchLoop();

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
        const msg = JSON.parse(String(ev.data)) as { type?: string };
        if (msg.type === "settings-updated") void refresh();
        // AI / chat-line bubbles intentionally not shown on ultrawide bars
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* polling still covers settings */
  }
}

void main();
