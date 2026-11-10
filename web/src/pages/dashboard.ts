import { ReactiveAvatar, ZONE_TRASH_TALK } from "../avatar/reactiveAvatar.ts";
import {
  applyCssVars,
  fetchSettings,
  resetSettings,
  saveSettings,
} from "../lib/settingsClient.ts";
import { applyDemoInput } from "../lib/inputClient.ts";
import { MicCapture } from "../lib/micCapture.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";
import type { StatusMessage } from "../../../shared/protocol.ts";

let settings: OverlaySettings;
let avatar: ReactiveAvatar;
let demoOn = false;
let holdTimer: number | null = null;
let dashWs: WebSocket | null = null;
let token = "";
let mic: MicCapture | null = null;
let lastInputAt: number | null = null;

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
  (document.getElementById("micEnabled") as HTMLInputElement).checked = s.mic.enabled;
  (document.getElementById("micThreshold") as HTMLInputElement).value = String(s.mic.threshold);
  (document.getElementById("chatEnabled") as HTMLInputElement).checked = s.chat.enabled;
  (document.getElementById("chatDemoAuto") as HTMLInputElement).checked = s.chat.demoAuto;
  (document.getElementById("chatIntervalMs") as HTMLInputElement).value = String(
    s.chat.intervalMs,
  );

  (document.getElementById("socialShowFollower") as HTMLInputElement).checked =
    s.social.showFollower;
  (document.getElementById("socialShowSubscriber") as HTMLInputElement).checked =
    s.social.showSubscriber;
  (document.getElementById("socialFollowerName") as HTMLInputElement).value =
    s.social.latestFollowerSample;
  (document.getElementById("socialSubscriberName") as HTMLInputElement).value =
    s.social.latestSubscriberSample;
  (document.getElementById("socialFollowerPlace") as HTMLSelectElement).value =
    s.social.followerPlacement;
  (document.getElementById("socialSubscriberPlace") as HTMLSelectElement).value =
    s.social.subscriberPlacement;

  (document.getElementById("uwCanvasWidth") as HTMLInputElement).value = String(
    s.ultrawide.canvasWidth,
  );
  (document.getElementById("uwCanvasHeight") as HTMLInputElement).value = String(
    s.ultrawide.canvasHeight,
  );
  (document.getElementById("uwBarHeight") as HTMLInputElement).value = String(
    s.ultrawide.barHeight,
  );
  (document.getElementById("uwTopVisible") as HTMLInputElement).checked =
    s.ultrawide.topVisible;
  (document.getElementById("uwBottomVisible") as HTMLInputElement).checked =
    s.ultrawide.bottomVisible;
  (document.getElementById("uwOperatorOnTop") as HTMLInputElement).checked =
    s.ultrawide.operatorLineOnTop;
  (document.getElementById("uwOperatorLine") as HTMLInputElement).value =
    s.ultrawide.operatorLine;
  (document.getElementById("uwTopText") as HTMLInputElement).value = s.ultrawide.topText;
  (document.getElementById("uwBottomText") as HTMLInputElement).value = s.ultrawide.bottomText;
  (document.getElementById("uwStatusText") as HTMLInputElement).value = s.ultrawide.statusText;

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
  next.mic.enabled = (document.getElementById("micEnabled") as HTMLInputElement).checked;
  next.mic.threshold = Number(
    (document.getElementById("micThreshold") as HTMLInputElement).value,
  );
  next.chat.enabled = (document.getElementById("chatEnabled") as HTMLInputElement).checked;
  next.chat.demoAuto = (document.getElementById("chatDemoAuto") as HTMLInputElement).checked;
  next.chat.intervalMs = Math.max(
    6000,
    Math.min(
      90000,
      Number((document.getElementById("chatIntervalMs") as HTMLInputElement).value) || 14000,
    ),
  );

  next.social.showFollower = (
    document.getElementById("socialShowFollower") as HTMLInputElement
  ).checked;
  next.social.showSubscriber = (
    document.getElementById("socialShowSubscriber") as HTMLInputElement
  ).checked;
  next.social.latestFollowerSample =
    (document.getElementById("socialFollowerName") as HTMLInputElement).value.trim() ||
    "GhostPing_42";
  next.social.latestSubscriberSample =
    (document.getElementById("socialSubscriberName") as HTMLInputElement).value.trim() ||
    "RaidMama";
  next.social.followerPlacement = (
    document.getElementById("socialFollowerPlace") as HTMLSelectElement
  ).value as OverlaySettings["social"]["followerPlacement"];
  next.social.subscriberPlacement = (
    document.getElementById("socialSubscriberPlace") as HTMLSelectElement
  ).value as OverlaySettings["social"]["subscriberPlacement"];

  next.ultrawide.canvasWidth = Number(
    (document.getElementById("uwCanvasWidth") as HTMLInputElement).value,
  );
  next.ultrawide.canvasHeight = Number(
    (document.getElementById("uwCanvasHeight") as HTMLInputElement).value,
  );
  next.ultrawide.barHeight = Number(
    (document.getElementById("uwBarHeight") as HTMLInputElement).value,
  );
  next.ultrawide.topVisible = (
    document.getElementById("uwTopVisible") as HTMLInputElement
  ).checked;
  next.ultrawide.bottomVisible = (
    document.getElementById("uwBottomVisible") as HTMLInputElement
  ).checked;
  next.ultrawide.operatorLineOnTop = (
    document.getElementById("uwOperatorOnTop") as HTMLInputElement
  ).checked;
  next.ultrawide.operatorLine =
    (document.getElementById("uwOperatorLine") as HTMLInputElement).value.trim() ||
    "OPERATOR ONLINE";
  next.ultrawide.topText = (document.getElementById("uwTopText") as HTMLInputElement).value;
  next.ultrawide.bottomText = (
    document.getElementById("uwBottomText") as HTMLInputElement
  ).value;
  next.ultrawide.statusText = (
    document.getElementById("uwStatusText") as HTMLInputElement
  ).value;

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

function formatLastInput(ts: number | null): string {
  if (!ts) return "—";
  const ago = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (ago < 2) return "just now";
  if (ago < 60) return `${ago}s ago`;
  return `${Math.floor(ago / 60)}m ago`;
}

function updateStatus(msg: StatusMessage): void {
  const el = document.getElementById("conn-status");
  if (!el) return;
  el.textContent = `Companion: ${msg.companionConnected ? "CONNECTED" : "not connected"} · Capture: ${msg.capturePaused ? "PAUSED" : "active"} · Overlays: ${msg.overlayClients}${demoOn ? " · DEMO PREVIEW ON (not live)" : ""}`;
  if (msg.lastInputAt) lastInputAt = msg.lastInputAt;
  const li = document.getElementById("last-input");
  if (li) li.textContent = `Last input: ${formatLastInput(lastInputAt)}`;
}

async function syncMicCapture(): Promise<void> {
  const enabled = (document.getElementById("micEnabled") as HTMLInputElement).checked;
  const threshold = Number(
    (document.getElementById("micThreshold") as HTMLInputElement).value,
  );
  if (!enabled) {
    await mic?.stop();
    mic = null;
    const el = document.getElementById("mic-level");
    if (el) el.textContent = "Mic level: off";
    return;
  }
  if (!mic) {
    mic = new MicCapture({
      threshold,
      onLevel: (level, talking) => {
        const el = document.getElementById("mic-level");
        if (el) {
          el.textContent = `Mic level: ${level.toFixed(2)}${talking ? " · TALKING" : ""}`;
        }
        avatar.setMicLevel(level, talking);
        dashWs?.send(JSON.stringify({ type: "mic", level, talking }));
      },
      onError: (message) => toast(`Mic: ${message}`),
    });
    await mic.start();
  } else {
    mic.setThreshold(threshold);
  }
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
        lastInputAt = Date.now();
        const li = document.getElementById("last-input");
        if (li) li.textContent = `Last input: just now (${msg.kind})`;
        avatar.setSource("live");
        avatar.handleInput(
          msg.kind,
          msg.phase,
          msg.held,
          typeof (msg as { slot?: number }).slot === "number"
            ? (msg as { slot?: number }).slot
            : undefined,
          typeof (msg as { pressId?: number }).pressId === "number"
            ? (msg as { pressId?: number }).pressId
            : undefined,
        );
      } else if (msg.type === "mic") {
        /* dashboard is the publisher; ignore echo */
      } else if (msg.type === "chat-line" && typeof msg.text === "string") {
        avatar.say(msg.text);
      } else if (msg.type === "reset-idle") {
        avatar.resetIdle("server");
      } else if (msg.type === "settings-updated") {
        void fetchSettings().then((s) => {
          settings = s;
          fillForm(s);
          applyCssVars(s);
          avatar.setStreamerName(s.streamerName);
          avatar.setIntensity(s.avatar.intensity);
          avatar.setLightsEnabled(s.avatar.lightsEnabled);
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
    streamerName: settings.streamerName,
    chatEnabled: settings.chat.enabled,
  });

  document.getElementById("btn-save")?.addEventListener("click", async () => {
    settings = await saveSettings(readForm());
    fillForm(settings);
    avatar.setIntensity(settings.avatar.intensity);
    avatar.setLightsEnabled(settings.avatar.lightsEnabled);
    avatar.setStreamerName(settings.streamerName);
    avatar.setChatEnabled(settings.chat.enabled);
    await syncMicCapture();
    toast("Settings saved");
  });

  document.getElementById("btn-reset")?.addEventListener("click", async () => {
    settings = await resetSettings();
    fillForm(settings);
    applyCssVars(settings);
    avatar.setIntensity(settings.avatar.intensity);
    avatar.setLightsEnabled(settings.avatar.lightsEnabled);
    avatar.setStreamerName(settings.streamerName);
    avatar.setChatEnabled(settings.chat.enabled);
    await syncMicCapture();
    toast("Defaults restored");
  });

  document.getElementById("micEnabled")?.addEventListener("change", () => {
    void syncMicCapture();
  });
  document.getElementById("micThreshold")?.addEventListener("input", () => {
    const v = Number((document.getElementById("micThreshold") as HTMLInputElement).value);
    mic?.setThreshold(v);
  });

  document.getElementById("btn-chat-send")?.addEventListener("click", () => {
    const text = (document.getElementById("chatLine") as HTMLInputElement).value.trim();
    if (!text) return;
    avatar.setChatEnabled(true);
    avatar.say(text);
    dashWs?.send(JSON.stringify({ type: "chat-line", text, from: "dashboard" }));
    (document.getElementById("chatLine") as HTMLInputElement).value = "";
  });
  document.getElementById("btn-chat-sample")?.addEventListener("click", () => {
    avatar.setChatEnabled(true);
    const line = ZONE_TRASH_TALK[Math.floor(Math.random() * ZONE_TRASH_TALK.length)]!;
    avatar.say(line);
    dashWs?.send(JSON.stringify({ type: "chat-line", text: line, from: "demo" }));
  });

  document.getElementById("streamerName")?.addEventListener("input", () => {
    const value = (document.getElementById("streamerName") as HTMLInputElement).value;
    avatar.setStreamerName(value);
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
    const slot = Math.floor(Math.random() * 18);
    const pid = 8000 + slot;
    applyDemoInput(avatar, "key", "down", 1, slot, pid);
    window.setTimeout(() => applyDemoInput(avatar, "key", "up", 0, slot, pid), 100);
  });

  document.getElementById("btn-demo-hold")?.addEventListener("click", () => {
    demoOn = true;
    if (holdTimer != null) {
      window.clearTimeout(holdTimer);
      applyDemoInput(avatar, "key", "up", 0, 12, 8100);
      holdTimer = null;
      return;
    }
    applyDemoInput(avatar, "key", "down", 1, 12, 8100);
    holdTimer = window.setTimeout(() => {
      applyDemoInput(avatar, "key", "up", 0, 12, 8100);
      holdTimer = null;
    }, 2800);
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
  if (settings.mic.enabled) await syncMicCapture();

  window.setInterval(() => {
    const li = document.getElementById("last-input");
    if (li && lastInputAt) li.textContent = `Last input: ${formatLastInput(lastInputAt)}`;
  }, 1000);
}

void main();
