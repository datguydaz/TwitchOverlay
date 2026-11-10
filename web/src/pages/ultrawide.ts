import {
  applyCssVars,
  fetchSettings,
} from "../lib/settingsClient.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";

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

function applyUltrawide(settings: OverlaySettings): void {
  const uw = settings.ultrawide;
  const mode = document.body.dataset.uwMode; // top | bottom | undefined (full)
  const stage = qs<HTMLElement>("#uw-stage");
  if (!stage) return;

  const barH = Math.max(48, Math.min(400, uw.barHeight || 180));
  const canvasW = Math.max(1280, uw.canvasWidth || 3440);
  const canvasH = Math.max(720, uw.canvasHeight || 1440);

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
  const topStatus = qs<HTMLElement>("#uw-top-status");
  const bottomStatus = qs<HTMLElement>("#uw-bottom-status");

  if (top) {
    top.style.height = `${barH}px`;
    top.dataset.hidden = uw.topVisible ? "false" : "true";
  }
  if (bottom) {
    bottom.style.height = `${barH}px`;
    bottom.dataset.hidden = uw.bottomVisible ? "false" : "true";
  }

  if (topText) topText.textContent = uw.topText || "ZONE OPS // TRANSMISSION";
  if (bottomText) {
    const label = uw.bottomText || "OPERATOR ONLINE";
    bottomText.innerHTML = `<span data-streamer-name>${settings.streamerName}</span> // ${label}`;
  }

  const status = uw.statusText || "SIGNAL NOMINAL";
  if (topStatus) topStatus.textContent = status;
  if (bottomStatus) bottomStatus.textContent = status;
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
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* polling still covers settings */
  }
}

void main();
