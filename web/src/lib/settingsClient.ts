import {
  DEFAULT_SETTINGS,
  mergeSettings,
  type OverlaySettings,
} from "../../../shared/settings.ts";

const API = "/api/settings";

export async function fetchSettings(): Promise<OverlaySettings> {
  try {
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    return mergeSettings(await res.json());
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function saveSettings(
  settings: OverlaySettings,
): Promise<OverlaySettings> {
  const res = await fetch(API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`save failed: ${res.status}`);
  return mergeSettings(await res.json());
}

export async function resetSettings(): Promise<OverlaySettings> {
  const res = await fetch("/api/settings/reset", { method: "POST" });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
  return mergeSettings(await res.json());
}

export function applyCssVars(settings: OverlaySettings, root: HTMLElement = document.documentElement): void {
  root.style.setProperty("--amber", settings.accentColor);
  root.style.setProperty("--olive", settings.oliveColor);
  root.style.setProperty("--beige", settings.beigeColor);
  root.style.setProperty("--charcoal", settings.charcoalColor);
}

export function applyModuleTransform(
  el: HTMLElement | null,
  mod: OverlaySettings["modules"][keyof OverlaySettings["modules"]],
): void {
  if (!el) return;
  el.dataset.hidden = mod.visible ? "false" : "true";
  el.style.left = `${mod.x}px`;
  el.style.top = `${mod.y}px`;
  el.style.transform = `scale(${mod.scale})`;
}

export function scaleStageToViewport(stage: HTMLElement): void {
  const apply = () => {
    const sx = window.innerWidth / 1920;
    const sy = window.innerHeight / 1080;
    const s = Math.min(sx, sy);
    stage.style.transform = `scale(${s})`;
  };
  apply();
  window.addEventListener("resize", apply);
}
