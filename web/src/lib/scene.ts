import { ReactiveAvatar } from "../avatar/reactiveAvatar.ts";
import { InputClient, type ConnectionState } from "./inputClient.ts";
import {
  applyCssVars,
  applyModuleTransform,
  fetchSettings,
  scaleStageToViewport,
} from "./settingsClient.ts";
import type { OverlaySettings } from "../../../shared/settings.ts";

export type SceneKind = "gameplay" | "starting-soon" | "brb" | "ending" | "avatar";

export interface SceneBootOptions {
  scene: SceneKind;
  opaqueBackground?: boolean;
  includeModules?: boolean;
}

function qs<T extends HTMLElement>(sel: string): T | null {
  return document.querySelector(sel);
}

function setConnPill(state: ConnectionState): void {
  const el = qs<HTMLElement>("#conn-pill");
  if (!el) return;
  el.dataset.state = state === "live" ? "live" : state === "demo" ? "demo" : "offline";
  const label =
    state === "live"
      ? "INPUT // LIVE COMPANION"
      : state === "demo"
        ? "INPUT // DEMO PREVIEW (NOT LIVE)"
        : state === "connecting"
          ? "INPUT // CONNECTING"
          : "INPUT // IDLE (NO COMPANION)";
  el.textContent = label;
}

function applySceneText(settings: OverlaySettings, scene: SceneKind): void {
  const title = qs<HTMLElement>("#scene-title");
  const sub = qs<HTMLElement>("#scene-sub");
  const nameEls = document.querySelectorAll("[data-streamer-name]");
  nameEls.forEach((el) => {
    el.textContent = settings.streamerName;
  });

  if (scene === "starting-soon") {
    if (title) title.textContent = settings.sceneText.startingSoonTitle;
    if (sub) sub.textContent = settings.sceneText.startingSoonSub;
  } else if (scene === "brb") {
    if (title) title.textContent = settings.sceneText.brbTitle;
    if (sub) sub.textContent = settings.sceneText.brbSub;
  } else if (scene === "ending") {
    if (title) title.textContent = settings.sceneText.endingTitle;
    if (sub) sub.textContent = settings.sceneText.endingSub;
  }
}

function startCountdown(settings: OverlaySettings): void {
  const el = qs<HTMLElement>("#countdown");
  if (!el) return;

  const target = settings.countdownTargetIso
    ? new Date(settings.countdownTargetIso).getTime()
    : Date.now() + settings.countdownMinutes * 60_000;

  const tick = () => {
    if (document.hidden) {
      // Cap work while backgrounded
      return;
    }
    const ms = Math.max(0, target - Date.now());
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  tick();
  window.setInterval(tick, 250);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
}

function wireSampleEvents(rail: HTMLElement | null): void {
  if (!rail) return;
  // Static sample only — never pretend live platform events are connected.
  rail.innerHTML = `
    <div class="event-card sample">
      <div class="tag">SAMPLE // NOT LIVE</div>
      <div class="body">Raid inbound — 12 operators</div>
    </div>
  `;
}

export async function bootScene(opts: SceneBootOptions): Promise<void> {
  if (opts.opaqueBackground) {
    document.body.classList.add("scene-opaque");
  }

  const stage = qs<HTMLElement>("#stage");
  if (stage) scaleStageToViewport(stage);

  let settings = await fetchSettings();
  applyCssVars(settings);
  applySceneText(settings, opts.scene);

  if (opts.includeModules !== false) {
    applyModuleTransform(qs("#mod-identity"), settings.modules.identity);
    applyModuleTransform(qs("#mod-webcam"), settings.modules.webcam);
    applyModuleTransform(qs("#mod-events"), settings.modules.events);
    applyModuleTransform(qs("#mod-avatar"), settings.modules.avatar);
  } else if (opts.scene === "avatar") {
    // Dedicated OBS source: full hi-res draw (ignore composite corner scale)
    applyModuleTransform(qs("#mod-avatar"), {
      ...settings.modules.avatar,
      x: 0,
      y: 0,
      scale: 1,
      visible: true,
    });
  }

  wireSampleEvents(qs("#events-rail"));
  if (opts.scene === "starting-soon") startCountdown(settings);

  const avatarMount = qs<HTMLElement>("#avatar-mount");
  let avatar: ReactiveAvatar | null = null;
  let input: InputClient | null = null;

  if (avatarMount && settings.modules.avatar.visible !== false) {
    avatar = new ReactiveAvatar({
      root: avatarMount,
      intensity: settings.avatar.intensity,
      lightsEnabled: settings.avatar.lightsEnabled,
      streamerName: settings.streamerName,
    });
    input = new InputClient({
      avatar,
      onConnection: setConnPill,
    });
    await input.start();
  } else {
    setConnPill("offline");
  }

  // Settings live updates via WS + polling fallback
  const refresh = async () => {
    settings = await fetchSettings();
    applyCssVars(settings);
    applySceneText(settings, opts.scene);
    if (opts.includeModules !== false) {
      applyModuleTransform(qs("#mod-identity"), settings.modules.identity);
      applyModuleTransform(qs("#mod-webcam"), settings.modules.webcam);
      applyModuleTransform(qs("#mod-events"), settings.modules.events);
      applyModuleTransform(qs("#mod-avatar"), settings.modules.avatar);
    }
    if (avatar) {
      avatar.setIntensity(settings.avatar.intensity);
      avatar.setLightsEnabled(settings.avatar.lightsEnabled);
      avatar.setStreamerName(settings.streamerName);
      const hidden = !settings.modules.avatar.visible && opts.scene !== "avatar";
      if (hidden) {
        avatar.dispose();
      }
    }
    document.querySelectorAll("[data-streamer-name]").forEach((el) => {
      el.textContent = settings.streamerName;
    });
  };

  window.setInterval(() => {
    if (!document.hidden) void refresh();
  }, 2000);

  try {
    const tokenRes = await fetch("/api/token");
    const { token } = (await tokenRes.json()) as { token: string };
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "hello", role: "overlay", token }));
    });
    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as { type: string };
        if (msg.type === "settings-updated") void refresh();
      } catch {
        /* ignore */
      }
    });
  } catch {
    /* polling covers this */
  }

  void input;
}
