import { ReactiveAvatar, pickDemoTalkLine } from "../avatar/reactiveAvatar.ts";
import { KEY_SLOT_COUNT } from "../../../shared/keyGrid.ts";
import { DEFAULT_CHAT_GAMES } from "../../../shared/settings.ts";

import {
  applyCssVars,
  fetchSettings,
  resetSettings,
  saveSettings,
} from "../lib/settingsClient.ts";
import { applyDemoInput } from "../lib/inputClient.ts";
import { MicCapture } from "../lib/micCapture.ts";
import { createBunkerSfx } from "../lib/bunkerSfx.ts";
import type {
  OverlaySettings,
  SfxEventSettings,
  SfxPreset,
} from "../../../shared/settings.ts";
import { DEFAULT_SFX_EVENT, DEFAULT_OPERATOR_TYPOS } from "../../../shared/settings.ts";
import type { StatusMessage } from "../../../shared/protocol.ts";

type CustomSoundMeta = {
  id: string;
  name: string;
  filename: string;
  mime: string;
  bytes: number;
};

let settings: OverlaySettings;
let avatar: ReactiveAvatar;
let demoOn = false;
let holdTimer: number | null = null;
let dashWs: WebSocket | null = null;
let token = "";
let mic: MicCapture | null = null;
let lastInputAt: number | null = null;
const dashSfx = createBunkerSfx();
let customSounds: CustomSoundMeta[] = [];

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
  (document.getElementById("mouseFollowGain") as HTMLInputElement).value = String(
    s.avatar.mouseFollowGain ?? 0.12,
  );
  (document.getElementById("mouseFollowSmooth") as HTMLInputElement).value = String(
    s.avatar.mouseFollowSmooth ?? 0.75,
  );
  (document.getElementById("micEnabled") as HTMLInputElement).checked = s.mic.enabled;
  (document.getElementById("micThreshold") as HTMLInputElement).value = String(s.mic.threshold);
  (document.getElementById("chatEnabled") as HTMLInputElement).checked = s.chat.enabled;
  (document.getElementById("chatDemoAuto") as HTMLInputElement).checked = s.chat.demoAuto;
  (document.getElementById("chatIntervalMs") as HTMLInputElement).value = String(
    s.chat.intervalMs,
  );
  (document.getElementById("chatPlacement") as HTMLSelectElement).value =
    s.chat.placement || "bottom-center";
  (document.getElementById("chatOffsetX") as HTMLInputElement).value = String(
    s.chat.offsetXPct ?? 20,
  );
  (document.getElementById("chatOffsetY") as HTMLInputElement).value = String(
    s.chat.offsetYPct ?? 2,
  );
  (document.getElementById("chatScale") as HTMLInputElement).value = String(
    s.chat.scale ?? 1,
  );
  (document.getElementById("chatGames") as HTMLTextAreaElement).value = (
    s.chat.games?.length ? s.chat.games : [...DEFAULT_CHAT_GAMES]
  ).join("\n");

  (document.getElementById("socialShowFollower") as HTMLInputElement).checked =
    s.social.showFollower;
  (document.getElementById("socialShowSubscriber") as HTMLInputElement).checked =
    s.social.showSubscriber;
  (document.getElementById("socialFollowerName") as HTMLInputElement).value =
    !s.social.latestFollower || s.social.latestFollower === "—" || s.social.latestFollower === "--"
      ? ""
      : s.social.latestFollower;
  (document.getElementById("socialSubscriberName") as HTMLInputElement).value =
    !s.social.latestSubscriber || s.social.latestSubscriber === "—" || s.social.latestSubscriber === "--"
      ? ""
      : s.social.latestSubscriber;

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
  (document.getElementById("uwStatusText") as HTMLInputElement).value = s.ultrawide.statusText;

  (document.getElementById("atmEnabled") as HTMLInputElement).checked = s.atmosphere.enabled;
  (document.getElementById("atmIntensity") as HTMLSelectElement).value = s.atmosphere.intensity;
  (document.getElementById("atmDust") as HTMLInputElement).checked = s.atmosphere.dust;
  (document.getElementById("atmSmoke") as HTMLInputElement).checked = s.atmosphere.smoke;
  (document.getElementById("atmSparks") as HTMLInputElement).checked = s.atmosphere.sparks;
  (document.getElementById("atmFlicker") as HTMLInputElement).checked = s.atmosphere.flicker;
  (document.getElementById("atmReducedMotion") as HTMLInputElement).checked =
    s.atmosphere.reducedMotion;

  (document.getElementById("textFxEnabled") as HTMLInputElement).checked = s.textEffects.enabled;
  (document.getElementById("textFxIntensity") as HTMLSelectElement).value = s.textEffects.intensity;
  (document.getElementById("textFxReducedMotion") as HTMLInputElement).checked =
    s.textEffects.reducedMotion;

  fillSfxForm(s);
  fillOperatorTyposForm(s);

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
  {
    const g = Number((document.getElementById("mouseFollowGain") as HTMLInputElement).value);
    next.avatar.mouseFollowGain = Number.isFinite(g)
      ? Math.max(0.04, Math.min(0.45, Math.round(g * 1000) / 1000))
      : 0.12;
    const sm = Number((document.getElementById("mouseFollowSmooth") as HTMLInputElement).value);
    next.avatar.mouseFollowSmooth = Number.isFinite(sm)
      ? Math.max(0, Math.min(0.95, Math.round(sm * 1000) / 1000))
      : 0.75;
  }
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
  next.chat.placement = ((document.getElementById("chatPlacement") as HTMLSelectElement)
    .value || "bottom-center") as OverlaySettings["chat"]["placement"];
  next.chat.offsetXPct = Math.max(
    0,
    Math.min(40, Number((document.getElementById("chatOffsetX") as HTMLInputElement).value) || 0),
  );
  next.chat.offsetYPct = Math.max(
    0,
    Math.min(40, Number((document.getElementById("chatOffsetY") as HTMLInputElement).value) || 0),
  );
  {
    const raw = Number((document.getElementById("chatScale") as HTMLInputElement).value);
    next.chat.scale = Number.isFinite(raw)
      ? Math.max(0.6, Math.min(10, Math.round(raw * 100) / 100))
      : 1;
  }
  next.chat.games = (document.getElementById("chatGames") as HTMLTextAreaElement).value
    .split(/[\n,;]+/)
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 24);
  if (!next.chat.games.length) next.chat.games = [...DEFAULT_CHAT_GAMES];

  next.social.showFollower = (
    document.getElementById("socialShowFollower") as HTMLInputElement
  ).checked;
  next.social.showSubscriber = (
    document.getElementById("socialShowSubscriber") as HTMLInputElement
  ).checked;
  next.social.latestFollower = (
    document.getElementById("socialFollowerName") as HTMLInputElement
  ).value.trim();
  next.social.latestSubscriber = (
    document.getElementById("socialSubscriberName") as HTMLInputElement
  ).value.trim();
  delete next.social.latestFollowerSample;
  delete next.social.latestSubscriberSample;
  delete next.social.followerPlacement;
  delete next.social.subscriberPlacement;

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
  next.ultrawide.statusText = (
    document.getElementById("uwStatusText") as HTMLInputElement
  ).value;

  {
    const intensityRaw = (
      document.getElementById("atmIntensity") as HTMLSelectElement
    ).value;
    next.atmosphere = {
      enabled: (document.getElementById("atmEnabled") as HTMLInputElement).checked,
      intensity:
        intensityRaw === "medium" || intensityRaw === "high" ? intensityRaw : "low",
      dust: (document.getElementById("atmDust") as HTMLInputElement).checked,
      smoke: (document.getElementById("atmSmoke") as HTMLInputElement).checked,
      sparks: (document.getElementById("atmSparks") as HTMLInputElement).checked,
      flicker: (document.getElementById("atmFlicker") as HTMLInputElement).checked,
      reducedMotion: (document.getElementById("atmReducedMotion") as HTMLInputElement)
        .checked,
    };
  }

  next.sfx = readSfxForm();
  next.operatorTypos = readOperatorTyposForm();

  {
    const intensityRaw = (
      document.getElementById("textFxIntensity") as HTMLSelectElement
    ).value;
    next.textEffects = {
      enabled: (document.getElementById("textFxEnabled") as HTMLInputElement).checked,
      intensity:
        intensityRaw === "low" || intensityRaw === "high" ? intensityRaw : "medium",
      reducedMotion: (document.getElementById("textFxReducedMotion") as HTMLInputElement)
        .checked,
    };
  }

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

function syncSfxVolLabel(): void {
  const el = document.getElementById("sfx-vol-label");
  const input = document.getElementById("sfxVolume") as HTMLInputElement | null;
  if (!el || !input) return;
  const v = Number(input.value);
  el.textContent = `Master: ${Number.isFinite(v) ? v.toFixed(2) : "0.60"}`;
}

function selectValueForEvent(ev: SfxEventSettings): string {
  if (ev.preset === "custom" && ev.customId) return `custom:${ev.customId}`;
  return ev.preset || "typewriter";
}

function parseSelectValue(raw: string): { preset: SfxPreset; customId: string } {
  if (raw.startsWith("custom:")) {
    return { preset: "custom", customId: raw.slice(7) };
  }
  const preset = raw as SfxPreset;
  if (
    preset === "none" ||
    preset === "typewriter" ||
    preset === "radio" ||
    preset === "hatch" ||
    preset === "random" ||
    preset === "custom"
  ) {
    return { preset, customId: "" };
  }
  return { preset: "typewriter", customId: "" };
}

function rebuildSfxPresetSelect(selectId: string, selected: string): void {
  const sel = document.getElementById(selectId) as HTMLSelectElement | null;
  if (!sel) return;
  const builtins: { value: string; label: string }[] = [
    { value: "none", label: "None" },
    { value: "typewriter", label: "Typewriter (default)" },
    { value: "radio", label: "Radio squelch (legacy)" },
    { value: "hatch", label: "Hatch / heavy radio (legacy)" },
    { value: "random", label: "Random from my list" },
  ];
  const opts = [
    ...builtins,
    ...customSounds.map((s) => ({
      value: `custom:${s.id}`,
      label: `Custom: ${s.name}`,
    })),
  ];
  sel.innerHTML = opts
    .map(
      (o) =>
        `<option value="${o.value.replace(/"/g, "&quot;")}">${o.label.replace(/</g, "&lt;")}</option>`,
    )
    .join("");
  const ok = opts.some((o) => o.value === selected);
  sel.value = ok ? selected : "typewriter";
}

function renderSfxPool(
  poolRootId: string,
  selectedPool: string[],
  visible: boolean,
): void {
  const root = document.getElementById(poolRootId);
  if (!root) return;
  root.hidden = !visible;
  const list = root.querySelector(".sfx-pool-list");
  if (!list) return;
  if (!customSounds.length) {
    list.innerHTML = `<p class="hint">No custom sounds yet — upload below.</p>`;
    return;
  }
  const set = new Set(selectedPool);
  list.innerHTML = customSounds
    .map(
      (s) =>
        `<label class="inline"><input type="checkbox" data-sound-id="${s.id}" ${
          set.has(s.id) ? "checked" : ""
        } /> ${s.name.replace(/</g, "&lt;")}</label>`,
    )
    .join("");
}

function fillSfxEventForm(
  which: "follow" | "sub",
  ev: SfxEventSettings,
): void {
  const prefix = which === "follow" ? "Follow" : "Sub";
  const presetEl = document.getElementById(
    `sfx${prefix}Preset`,
  ) as HTMLSelectElement | null;
  const volEl = document.getElementById(
    `sfx${prefix}Volume`,
  ) as HTMLInputElement | null;
  const layerEl = document.getElementById(
    `sfx${prefix}Layer`,
  ) as HTMLInputElement | null;
  const value = selectValueForEvent(ev);
  rebuildSfxPresetSelect(`sfx${prefix}Preset`, value);
  if (presetEl) {
    // rebuild already set value; ensure
    const ok = [...presetEl.options].some((o) => o.value === value);
    presetEl.value = ok ? value : "typewriter";
  }
  if (volEl) volEl.value = String(clamp01Form(ev.volume, 1));
  if (layerEl) {
    const isOneshot =
      ev.preset === "radio" ||
      ev.preset === "hatch" ||
      ev.preset === "custom" ||
      ev.preset === "random";
    layerEl.checked = !!ev.typewriterLayer;
    layerEl.disabled = !isOneshot;
  }
  renderSfxPool(`sfx${prefix}Pool`, ev.pool || [], ev.preset === "random");
}

function syncOperatorTyposChanceLabel(): void {
  const el = document.getElementById("operator-typos-chance-label");
  const input = document.getElementById("operatorTyposChance") as HTMLInputElement | null;
  if (!el || !input) return;
  const pct = Math.round(clamp01Form(Number(input.value), 0.7) * 100);
  el.textContent = `Chance: ${pct}%`;
}

function fillOperatorTyposForm(s: OverlaySettings): void {
  const en = document.getElementById("operatorTyposEnabled") as HTMLInputElement | null;
  const ch = document.getElementById("operatorTyposChance") as HTMLInputElement | null;
  const cfg = s.operatorTypos || DEFAULT_OPERATOR_TYPOS;
  if (en) en.checked = cfg.enabled !== false;
  if (ch) ch.value = String(clamp01Form(cfg.chance, 0.7));
  syncOperatorTyposChanceLabel();
}

function readOperatorTyposForm(): OverlaySettings["operatorTypos"] {
  const en = document.getElementById("operatorTyposEnabled") as HTMLInputElement | null;
  const ch = document.getElementById("operatorTyposChance") as HTMLInputElement | null;
  return {
    enabled: en ? en.checked : true,
    chance: clamp01Form(Number(ch?.value ?? 0.7), 0.7),
  };
}

function fillSfxForm(s: OverlaySettings): void {
  const sfxEnabled = document.getElementById("sfxEnabled") as HTMLInputElement | null;
  const sfxVolume = document.getElementById("sfxVolume") as HTMLInputElement | null;
  if (sfxEnabled) sfxEnabled.checked = s.sfx?.enabled !== false;
  if (sfxVolume) {
    sfxVolume.value = String(clamp01Form(s.sfx?.volume, 0.6));
  }
  syncSfxVolLabel();
  fillSfxEventForm("follow", s.sfx?.follow || DEFAULT_SFX_EVENT);
  fillSfxEventForm("sub", s.sfx?.sub || DEFAULT_SFX_EVENT);
  renderCustomSoundList();
  syncDashSfxEngine();
}

function readSfxEventForm(which: "follow" | "sub"): SfxEventSettings {
  const prefix = which === "follow" ? "Follow" : "Sub";
  const presetEl = document.getElementById(
    `sfx${prefix}Preset`,
  ) as HTMLSelectElement | null;
  const volEl = document.getElementById(
    `sfx${prefix}Volume`,
  ) as HTMLInputElement | null;
  const layerEl = document.getElementById(
    `sfx${prefix}Layer`,
  ) as HTMLInputElement | null;
  const poolRoot = document.getElementById(`sfx${prefix}Pool`);
  const parsed = parseSelectValue(presetEl?.value || "typewriter");
  const pool: string[] = [];
  poolRoot?.querySelectorAll<HTMLInputElement>("input[data-sound-id]").forEach((cb) => {
    if (cb.checked) pool.push(cb.dataset.soundId || "");
  });
  const isOneshot =
    parsed.preset === "radio" ||
    parsed.preset === "hatch" ||
    parsed.preset === "custom" ||
    parsed.preset === "random";
  return {
    preset: parsed.preset,
    customId: parsed.customId,
    pool: pool.filter(Boolean),
    typewriterLayer: isOneshot ? !!layerEl?.checked : false,
    volume: clamp01Form(Number(volEl?.value ?? 1), 1),
  };
}

function readSfxForm(): OverlaySettings["sfx"] {
  const sfxEnabled = document.getElementById("sfxEnabled") as HTMLInputElement | null;
  const sfxVolume = document.getElementById("sfxVolume") as HTMLInputElement | null;
  return {
    enabled: sfxEnabled ? sfxEnabled.checked : true,
    volume: clamp01Form(Number(sfxVolume?.value ?? 0.6), 0.6),
    follow: readSfxEventForm("follow"),
    sub: readSfxEventForm("sub"),
  };
}

function clamp01Form(n: number, fallback: number): number {
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(1, n));
}

function syncDashSfxEngine(): void {
  const sfx = readSfxForm();
  dashSfx.applyConfig(sfx);
  dashSfx.setCustomCatalog(
    customSounds.map((s) => ({
      id: s.id,
      name: s.name,
      url: `/sounds/${encodeURIComponent(s.filename)}`,
    })),
  );
}

function renderCustomSoundList(): void {
  const ul = document.getElementById("sfx-custom-list");
  if (!ul) return;
  if (!customSounds.length) {
    ul.innerHTML = `<li class="hint">No uploads yet.</li>`;
    return;
  }
  ul.innerHTML = customSounds
    .map(
      (s) => `<li data-id="${s.id}">
        <span class="sfx-meta">${s.name.replace(/</g, "&lt;")} <span class="hint">(${Math.round(
          s.bytes / 1024,
        )} KB)</span></span>
        <button type="button" class="btn" data-sfx-preview="${s.id}">Play</button>
        <button type="button" class="btn" data-sfx-delete="${s.id}">Delete</button>
      </li>`,
    )
    .join("");
}

async function refreshCustomSounds(): Promise<void> {
  try {
    const res = await fetch("/api/sounds");
    if (!res.ok) return;
    const data = (await res.json()) as { sounds?: CustomSoundMeta[] };
    customSounds = data.sounds || [];
  } catch {
    customSounds = [];
  }
  syncDashSfxEngine();
}

async function uploadCustomSound(file: File): Promise<void> {
  if (file.size > 2 * 1024 * 1024) {
    toast("File too large (max 2 MB)");
    return;
  }
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const dataBase64 = btoa(binary);
  const res = await fetch("/api/sounds", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      mime: file.type || "application/octet-stream",
      dataBase64,
    }),
  });
  const json = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok) {
    toast(json.error || "Upload failed");
    return;
  }
  await refreshCustomSounds();
  fillSfxForm(settings);
  toast("Sound uploaded");
}

async function deleteCustomSound(id: string): Promise<void> {
  const res = await fetch(`/api/sounds/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    toast("Delete failed");
    return;
  }
  const json = (await res.json()) as { settings?: OverlaySettings };
  if (json.settings) settings = json.settings;
  await refreshCustomSounds();
  fillForm(settings);
  toast("Sound deleted");
}

function previewCustomSound(id: string): void {
  const meta = customSounds.find((s) => s.id === id);
  if (!meta) return;
  const audio = new Audio(`/sounds/${encodeURIComponent(meta.filename)}`);
  audio.volume = clamp01Form(Number((document.getElementById("sfxVolume") as HTMLInputElement | null)?.value ?? 0.6), 0.6);
  void audio.play().catch(() => toast("Could not play (click page first)"));
}

function onSfxPresetChanged(which: "follow" | "sub"): void {
  const prefix = which === "follow" ? "Follow" : "Sub";
  const presetEl = document.getElementById(
    `sfx${prefix}Preset`,
  ) as HTMLSelectElement | null;
  const layerEl = document.getElementById(
    `sfx${prefix}Layer`,
  ) as HTMLInputElement | null;
  const parsed = parseSelectValue(presetEl?.value || "typewriter");
  const isOneshot =
    parsed.preset === "radio" ||
    parsed.preset === "hatch" ||
    parsed.preset === "custom" ||
    parsed.preset === "random";
  if (layerEl) {
    layerEl.disabled = !isOneshot;
    if (!isOneshot) layerEl.checked = false;
    // Default layer off when picking a custom/oneshot
    if (isOneshot && parsed.preset === "custom") layerEl.checked = false;
  }
  let pool = readSfxEventForm(which).pool;
  if (parsed.preset === "random" && !pool.length) {
    pool =
      (which === "follow" ? settings.sfx?.follow?.pool : settings.sfx?.sub?.pool) || [];
  }
  renderSfxPool(`sfx${prefix}Pool`, pool, parsed.preset === "random");
  syncDashSfxEngine();
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
  const ev = document.getElementById("events-status");
  if (ev) {
    const st = msg.eventsStatus || "not_configured";
    const label =
      st === "connected"
        ? "connected"
        : st === "connecting"
          ? "connecting…"
          : st === "disconnected"
            ? "disconnected"
            : "not configured";
    ev.textContent = `Events: ${label}${
      msg.eventsDetail && st !== "connected" ? ` (${msg.eventsDetail})` : ""
    }`;
  }
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
        kind?: "key" | "mouseL" | "mouseR" | "wheelUp" | "wheelDown" | "mouseMove";
        phase?: "down" | "up";
        held?: number;
        slot?: number;
        pressId?: number;
        dx?: number;
        dy?: number;
        companionConnected?: boolean;
        capturePaused?: boolean;
        overlayClients?: number;
        demoModeHint?: string;
        text?: string;
      };
      if (msg.type === "status") {
        updateStatus(msg as StatusMessage);
      } else if (msg.type === "input" && !demoOn && msg.kind && msg.phase != null && msg.held != null) {
        if (msg.kind !== "mouseMove") {
          lastInputAt = Date.now();
          const li = document.getElementById("last-input");
          if (li) li.textContent = `Last input: just now (${msg.kind})`;
          avatar.setSource("live");
        }
        avatar.handleInput(
          msg.kind,
          msg.phase,
          msg.held,
          typeof msg.slot === "number" ? msg.slot : undefined,
          typeof msg.pressId === "number" ? msg.pressId : undefined,
          typeof msg.dx === "number" ? msg.dx : undefined,
          typeof msg.dy === "number" ? msg.dy : undefined,
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
          avatar.setMouseFollowTuning(s.avatar.mouseFollowGain, s.avatar.mouseFollowSmooth);
          avatar.setChatEnabled(s.chat.enabled);
          avatar.setGameList(s.chat.games ?? []);
          avatar.setChatPlacement(s.chat);
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
  await refreshCustomSounds();
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
  avatar.setGameList(settings.chat.games ?? []);
  avatar.setChatPlacement(settings.chat);
  avatar.setMouseFollowTuning(
    settings.avatar.mouseFollowGain,
    settings.avatar.mouseFollowSmooth,
  );
  avatar.setChatPlacementPersist((chat) => {
    settings.chat.placement = chat.placement;
    settings.chat.offsetXPct = chat.offsetXPct;
    settings.chat.offsetYPct = chat.offsetYPct;
    settings.chat.scale = chat.scale ?? settings.chat.scale ?? 1;
    fillForm(settings);
    void saveSettings(settings).then(() => toast("COMMS position saved"));
  });

  document.getElementById("btn-save")?.addEventListener("click", async () => {
    settings = await saveSettings(readForm());
    fillForm(settings);
    avatar.setIntensity(settings.avatar.intensity);
    avatar.setLightsEnabled(settings.avatar.lightsEnabled);
    avatar.setMouseFollowTuning(
      settings.avatar.mouseFollowGain,
      settings.avatar.mouseFollowSmooth,
    );
    avatar.setStreamerName(settings.streamerName);
    avatar.setChatEnabled(settings.chat.enabled);
    avatar.setGameList(settings.chat.games ?? []);
    avatar.setChatPlacement(settings.chat);
    await syncMicCapture();
    toast("Settings saved");
  });

  document.getElementById("btn-reset")?.addEventListener("click", async () => {
    settings = await resetSettings();
    fillForm(settings);
    applyCssVars(settings);
    avatar.setIntensity(settings.avatar.intensity);
    avatar.setLightsEnabled(settings.avatar.lightsEnabled);
    avatar.setMouseFollowTuning(
      settings.avatar.mouseFollowGain,
      settings.avatar.mouseFollowSmooth,
    );
    avatar.setStreamerName(settings.streamerName);
    avatar.setChatEnabled(settings.chat.enabled);
    avatar.setGameList(settings.chat.games ?? []);
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
    avatar.setGameList(settings.chat.games);
    const line = pickDemoTalkLine(settings.chat.games);
    avatar.say(line);
    dashWs?.send(JSON.stringify({ type: "chat-line", text: line, from: "demo" }));
  });

  document.getElementById("btn-topic-react")?.addEventListener("click", () => {
    const topic =
      (document.getElementById("topicReact") as HTMLInputElement).value.trim() || "raid";
    avatar.setChatEnabled(true);
    avatar.topicReact(topic);
    dashWs?.send(
      JSON.stringify({
        type: "chat-line",
        text: `Topic react demo: ${topic}`,
        from: "demo",
      }),
    );
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
    const slot = Math.floor(Math.random() * KEY_SLOT_COUNT);
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

  document.getElementById("btn-demo-wheel")?.addEventListener("click", () => {
    demoOn = true;
    applyDemoInput(avatar, "wheelDown", "down", 1);
  });

  document.getElementById("btn-pause")?.addEventListener("click", () => {
    dashWs?.send(JSON.stringify({ type: "pause" }));
  });
  document.getElementById("btn-resume")?.addEventListener("click", () => {
    dashWs?.send(JSON.stringify({ type: "resume" }));
  });

  document.querySelectorAll("[data-sample]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = (btn as HTMLElement).dataset.sample || "";
      showSample(kind);
      // Simulated social react on bunker frame (labeled preview — not live Twitch)
      if (kind === "follow" || kind === "sub") {
        dashWs?.send(JSON.stringify({ type: "atm-preview", kind }));
      }
    });
  });

  document.getElementById("operatorTyposChance")?.addEventListener("input", () => {
    syncOperatorTyposChanceLabel();
  });
  document.getElementById("sfxVolume")?.addEventListener("input", () => {
    syncSfxVolLabel();
    syncDashSfxEngine();
  });
  document.getElementById("sfxEnabled")?.addEventListener("change", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxFollowPreset")?.addEventListener("change", () => {
    onSfxPresetChanged("follow");
  });
  document.getElementById("sfxSubPreset")?.addEventListener("change", () => {
    onSfxPresetChanged("sub");
  });
  document.getElementById("sfxFollowVolume")?.addEventListener("input", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxSubVolume")?.addEventListener("input", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxFollowLayer")?.addEventListener("change", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxSubLayer")?.addEventListener("change", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxFollowPool")?.addEventListener("change", () => {
    syncDashSfxEngine();
  });
  document.getElementById("sfxSubPool")?.addEventListener("change", () => {
    syncDashSfxEngine();
  });

  document.getElementById("btn-sfx-upload")?.addEventListener("click", () => {
    const input = document.getElementById("sfxUpload") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      toast("Choose a file first");
      return;
    }
    void uploadCustomSound(file).then(() => {
      if (input) input.value = "";
    });
  });

  document.getElementById("sfx-custom-list")?.addEventListener("click", (ev) => {
    const t = ev.target as HTMLElement | null;
    if (!t) return;
    const previewId = t.getAttribute("data-sfx-preview");
    if (previewId) {
      previewCustomSound(previewId);
      return;
    }
    const delId = t.getAttribute("data-sfx-delete");
    if (delId) void deleteCustomSound(delId);
  });

  document.querySelectorAll("[data-atm-preview]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const kind = (btn as HTMLElement).dataset.atmPreview || "";
      if (!kind) return;
      dashWs?.send(JSON.stringify({ type: "atm-preview", kind }));
      if (kind === "sfx-follow" || kind === "sfx-sub") {
        syncDashSfxEngine();
        dashSfx.playTest(kind === "sfx-follow" ? "follow" : "sub");
        toast(
          "SFX test: local preview + sent to ultrawide-smoke (does not change names)",
        );
        return;
      }
      const textish = kind.startsWith("text-") || kind === "follow" || kind === "sub";
      toast(
        textish
          ? `Sim event: ${kind} (labeled — does not overwrite saved names)`
          : `Atmosphere preview: ${kind} (simulated)`,
      );
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
