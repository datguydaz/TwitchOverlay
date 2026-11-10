import { ReactiveAvatar } from "../avatar/reactiveAvatar.ts";
import {
  applyCssVars,
  fetchSettings,
  resetSettings,
  saveSettings,
} from "../lib/settingsClient.ts";
import { applyDemoInput } from "../lib/inputClient.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";
import type { StatusMessage } from "../../../shared/protocol.ts";

let settings: OverlaySettings;
let avatar: ReactiveAvatar;
let demoOn = false;
let holdTimer: number | null = null;
let dashWs: WebSocket | null = null;
let token = "";

function toast(msg: string): void {
  const el = document.getElementById("toast");
  if (!el) return;
  el.hidden = false;
  el.textContent = msg;
  window.setTimeout(() => {
    el.hidden = true;
  }, 2200);
}

function fillForm(s: OverlaySettings): void {
  (document.getElementById("streamerName") as HTMLInputElement).value = s.streamerName;
  (document.getElementById("accentColor") as HTMLInputElement).value = s.accentColor;
  (document.getElementById("oliveColor") as HTMLInputElement).value = s.oliveColor;
  (document.getElementById("beigeColor") as HTMLInputElement).value = s.beigeColor;
  (document.getElementById("charcoalColor") as HTMLInputElement).value = s.charcoalColor;
  (document.getElementById("startingSoonTitle") as HTMLInputElement).value =
    s.sceneText.startingSoonTitle;
  (document.getElementById("startingSoonSub") as HTMLInputElement).value =
    s.sceneText.startingSoonSub;
  (document.getElementById("brbTitle") as HTMLInputElement).value = s.sceneText.brbTitle;
  (document.getElementById("brbSub") as HTMLInputElement).value = s.sceneText.brbSub;
  (document.getElementById("endingTitle") as HTMLInputElement).value = s.sceneText.endingTitle;
  (document.getElementById("endingSub") as HTMLInputElement).value = s.sceneText.endingSub;
  (document.getElementById("countdownMinutes") as HTMLInputElement).value = String(
    s.countdownMinutes,
  );
  (document.getElementById("intensity") as HTMLInputElement).value = String(s.avatar.intensity);
  (document.getElementById("lightsEnabled") as HTMLInputElement).checked =
    s.avatar.lightsEnabled;

  for (const key of Object.keys(s.modules) as (keyof OverlaySettings["modules"])[]) {
    const root = document.querySelector(`[data-mod="${key}"]`);
    if (!root) continue;
    const mod = s.modules[key];
    (root.querySelector('[data-field="visible"]') as HTMLInputElement).checked = mod.visible;
    (root.querySelector('[data-field="x"]') as HTMLInputElement).value = String(mod.x);
    (root.querySelector('[data-field="y"]') as HTMLInputElement).value = String(mod.y);
    (root.querySelector('[data-field="scale"]') as HTMLInputElement).value = String(mod.scale);
  }
}

function readForm(): OverlaySettings {
  const next = structuredClone(settings);
  next.streamerName =
    (document.getElementById("streamerName") as HTMLInputElement).value.trim() ||
    "datguydaz";
  next.accentColor = (document.getElementById("accentColor") as HTMLInputElement).value;
  next.oliveColor = (document.getElementById("oliveColor") as HTMLInputElement).value;
  next.beigeColor = (document.getElementById("beigeColor") as HTMLInputElement).value;
  next.charcoalColor = (document.getElementById("charcoalColor") as HTMLInputElement).value;
  next.sceneText.startingSoonTitle = (
    document.getElementById("startingSoonTitle") as HTMLInputElement
  ).value;
  next.sceneText.startingSoonSub = (
    document.getElementById("startingSoonSub") as HTMLInputElement
  ).value;
  next.sceneText.brbTitle = (document.getElementById("brbTitle") as HTMLInputElement).value;
  next.sceneText.brbSub = (document.getElementById("brbSub") as HTMLInputElement).value;
  next.sceneText.endingTitle = (document.getElementById("endingTitle") as HTMLInputElement).value;
  next.sceneText.endingSub = (document.getElementById("endingSub") as HTMLInputElement).value;
  next.countdownMinutes = Number(
    (document.getElementById("countdownMinutes") as HTMLInputElement).value,
  );
  next.avatar.intensity = Number(
    (document.getElementById("intensity") as HTMLInputElement).value,
  );
  next.avatar.lightsEnabled = (
    document.getElementById("lightsEnabled") as HTMLInputElement
  ).checked;

  for (const key of Object.keys(next.modules) as (keyof OverlaySettings["modules"])[]) {
    const root = document.querySelector(`[data-mod="${key}"]`);
    if (!root) continue;
    next.modules[key] = {
      visible: (root.querySelector('[data-field="visible"]') as HTMLInputElement).checked,
      x: Number((root.querySelector('[data-field="x"]') as HTMLInputElement).value),
      y: Number((root.querySelector('[data-field="y"]') as HTMLInputElement).value),
      scale: Number((root.querySelector('[data-field="scale"]') as HTMLInputElement).value),
    };
  }
  return next;
}

function showSample(kind: string): void {
  const rail = document.getElementById("sample-rail");
  if (!rail) return;
  const labels: Record<string, string> = {
    follow: "SAMPLE FOLLOW — not a live event",
    sub: "SAMPLE SUB — not a live event",
    donation: "SAMPLE DONATION — not a live event",
  };
  const card = document.createElement("div");
  card.className = "event-card sample";
  card.innerHTML = `<div class="tag">SAMPLE // NOT LIVE</div><div class="body">${labels[kind] ?? kind}</div>`;
  rail.prepend(card);
  window.setTimeout(() => card.remove(), 5000);
}

function updateStatus(msg: StatusMessage): void {
  const el = document.getElementById("conn-status");
  if (!el) return;
  el.textContent = `Companion: ${msg.companionConnected ? "connected" : "not connected"} · Capture: ${msg.capturePaused ? "PAUSED" : "active"} · Overlays: ${msg.overlayClients}${demoOn ? " · DEMO PREVIEW ON (not live)" : ""}`;
}

async function connectDashWs(): Promise<void> {
  const res = await fetch("/api/token");
  token = ((await res.json()) as { token: string }).token;
  const proto = location.protocol === "https:" ? "wss" : "ws";
  dashWs = new WebSocket(`${proto}://${location.host}/ws`);
  dashWs.addEventListener("open", () => {
    dashWs?.send(JSON.stringify({ type: "hello", role: "dashboard", token }));
  });
  dashWs.addEventListener("message", (ev) => {
    try {
      const msg = JSON.parse(String(ev.data)) as {
        type: string;
        kind?: "key" | "mouseL" | "mouseR";
        phase?: "down" | "up";
        held?: number;
        companionConnected?: boolean;
        capturePaused?: boolean;
        overlayClients?: number;
        demoModeHint?: string;
      };
      if (msg.type === "status") {
        updateStatus(msg as StatusMessage);
      } else if (msg.type === "input" && !demoOn && msg.kind && msg.phase != null && msg.held != null) {
        avatar.setSource("live");
        avatar.handleInput(msg.kind, msg.phase, msg.held);
      } else if (msg.type === "reset-idle") {
        avatar.resetIdle("server");
      } else if (msg.type === "settings-updated") {
        void fetchSettings().then((s) => {
          settings = s;
          fillForm(s);
          applyCssVars(s);
        });
      }
    } catch {
      /* ignore */
    }
  });
  dashWs.addEventListener("close", () => {
    avatar.resetIdle("disconnect");
    window.setTimeout(() => {
      void connectDashWs();
    }, 1000);
  });
}

async function main(): Promise<void> {
  settings = await fetchSettings();
  fillForm(settings);
  applyCssVars(settings);

  const mount = document.getElementById("dash-avatar");
  if (!mount) return;
  avatar = new ReactiveAvatar({
    root: mount,
    intensity: settings.avatar.intensity,
    lightsEnabled: settings.avatar.lightsEnabled,
  });

  document.getElementById("btn-save")?.addEventListener("click", async () => {
    settings = await saveSettings(readForm());
    fillForm(settings);
    avatar.setIntensity(settings.avatar.intensity);
    avatar.setLightsEnabled(settings.avatar.lightsEnabled);
    toast("Settings saved");
  });

  document.getElementById("btn-reset")?.addEventListener("click", async () => {
    settings = await resetSettings();
    fillForm(settings);
    applyCssVars(settings);
    toast("Defaults restored");
  });

  document.getElementById("btn-countdown-now")?.addEventListener("click", async () => {
    const mins = Number(
      (document.getElementById("countdownMinutes") as HTMLInputElement).value,
    );
    const next = readForm();
    next.countdownMinutes = mins;
    next.countdownTargetIso = new Date(Date.now() + mins * 60_000).toISOString();
    settings = await saveSettings(next);
    toast("Countdown target set");
  });

  document.getElementById("btn-demo-toggle")?.addEventListener("click", () => {
    demoOn = !demoOn;
    const btn = document.getElementById("btn-demo-toggle");
    if (btn) btn.textContent = demoOn ? "Disable demo preview" : "Enable demo preview";
    if (demoOn) {
      avatar.setSource("demo");
      toast("Demo preview ON — not a live connection");
    } else {
      avatar.resetIdle("demo-off");
      avatar.setSource("idle");
      toast("Demo preview OFF");
    }
  });

  document.getElementById("btn-demo-key")?.addEventListener("click", () => {
    demoOn = true;
    applyDemoInput(avatar, "key", "down", 1);
    window.setTimeout(() => applyDemoInput(avatar, "key", "up", 0), 120);
  });

  document.getElementById("btn-demo-hold")?.addEventListener("click", () => {
    demoOn = true;
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      applyDemoInput(avatar, "key", "up", 0);
      holdTimer = null;
      return;
    }
    applyDemoInput(avatar, "key", "down", 1);
    holdTimer = window.setTimeout(() => {
      applyDemoInput(avatar, "key", "up", 0);
      holdTimer = null;
    }, 1500);
  });

  document.getElementById("btn-demo-l")?.addEventListener("click", () => {
    demoOn = true;
    applyDemoInput(avatar, "mouseL", "down", 1);
    window.setTimeout(() => applyDemoInput(avatar, "mouseL", "up", 0), 100);
  });

  document.getElementById("btn-demo-r")?.addEventListener("click", () => {
    demoOn = true;
    applyDemoInput(avatar, "mouseR", "down", 1);
    window.setTimeout(() => applyDemoInput(avatar, "mouseR", "up", 0), 100);
  });

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    dashWs?.send(JSON.stringify({ type: "pause" }));
  });
  document.getElementById("btn-resume")?.addEventListener("click", () => {
    dashWs?.send(JSON.stringify({ type: "resume" }));
  });

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      showSample((btn as HTMLElement).dataset.sample || "");
    });
  });

  await connectDashWs();
}

void main();
