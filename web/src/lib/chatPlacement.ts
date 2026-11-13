import type { ChatPlacement, ChatSettings } from "../../../shared/settings.ts";

export type ChatLayout = Pick<
  ChatSettings,
  "placement" | "offsetXPct" | "offsetYPct" | "scale"
>;

/** Apply persisted AI chat corner + insets + scale to an overlay chat element. */
export function applyChatPlacement(
  el: HTMLElement | null | undefined,
  chat: ChatLayout,
  opts?: { /** Ultrawide bottom bar — lift bottom placements above the letterbox. */ barH?: number },
): void {
  if (!el) return;
  const placement = chat.placement || "bottom-center";
  const ox = Math.max(0, Math.min(40, Number(chat.offsetXPct) || 0));
  const oy = Math.max(0, Math.min(40, Number(chat.offsetYPct) || 0));
  const scaleRaw = Number(chat.scale);
  const scale = Number.isFinite(scaleRaw)
    ? Math.max(0.6, Math.min(10, Math.round(scaleRaw * 100) / 100))
    : 1;
  el.dataset.placement = placement;
  el.style.setProperty("--chat-ox", `${ox}%`);
  el.style.setProperty("--chat-oy", `${oy}%`);
  el.style.setProperty("--chat-scale", String(scale));

  // Reset then set edges for the chosen corner/side
  el.style.left = "auto";
  el.style.right = "auto";
  el.style.top = "auto";
  el.style.bottom = "auto";
  // Do not set transform here — show/hide animation (+ centering + scale) owns it via CSS

  const barLift =
    opts?.barH != null && Number.isFinite(opts.barH)
      ? `calc(${Math.max(0, opts.barH)}px + ${oy}%)`
      : `${oy}%`;

  switch (placement as ChatPlacement) {
    case "bottom-center":
      // ox 20 = dead center; 0..40 nudges left/right from center
      el.style.left = `calc(50% + ${ox - 20}%)`;
      el.style.bottom = barLift;
      break;
    case "top-left":
      el.style.left = `${ox}%`;
      el.style.top = `${oy}%`;
      break;
    case "top-right":
      el.style.right = `${ox}%`;
      el.style.top = `${oy}%`;
      break;
    case "bottom-right":
      el.style.right = `${ox}%`;
      el.style.bottom = barLift;
      break;
    case "mid-left":
      el.style.left = `${ox}%`;
      el.style.top = `${Math.max(10, Math.min(70, 42 - oy * 0.25))}%`;
      break;
    case "mid-right":
      el.style.right = `${ox}%`;
      el.style.top = `${Math.max(10, Math.min(70, 42 - oy * 0.25))}%`;
      break;
    case "bottom-left":
      el.style.left = `${ox}%`;
      el.style.bottom = barLift;
      break;
    default:
      el.style.left = `calc(50% + ${ox - 20}%)`;
      el.style.bottom = barLift;
      el.dataset.placement = "bottom-center";
      break;
  }
}
