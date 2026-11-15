/**
 * Modular platform event surface — intentionally stubbed.
 * Overlays must never claim live Twitch/Kick connectivity from this module.
 *
 * Future work: a local Node bridge holding Twitch EventSub / Kick credentials
 * would push normalized SampleEvent-like payloads over the existing localhost WS.
 * Keep secrets off the browser.
 */

export type PlatformKind = "twitch" | "kick" | "sample";

export interface OverlayAlert {
  id: string;
  platform: PlatformKind;
  kind: "follow" | "subscribe" | "donation" | "raid" | "other";
  title: string;
  /** True only for dashboard/manual previews. */
  sample: boolean;
}

export function createSampleAlert(
  kind: OverlayAlert["kind"],
  title: string,
): OverlayAlert {
  return {
    id: `sample-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform: "sample",
    kind,
    title,
    sample: true,
  };
}

/** Placeholder — returns empty until a local credentialed bridge exists. */
export async function fetchLiveAlerts(): Promise<OverlayAlert[]> {
  return [];
}
