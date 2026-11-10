import type { ChatPlacement, ChatSettings } from "../../../shared/settings.ts";

/** Apply persisted AI chat corner + insets to an overlay chat element. */
export function applyChatPlacement(
  el: HTMLElement | null | undefined,
  chat: Pick<ChatSettings, "placement" | "offsetXPct" | "offsetYPct">,
  opts?: { /** Ultrawide bottom bar — lift bottom placements above the letterbox. */ barH?: number },
): void {
  if (!el) return;
  const placement = chat.placement || "bottom-left";
  const ox = Math.max(0, Math.min(40, Number(chat.offsetXPct) || 0));
  const oy = Math.max(0, Math.min(40, Number(chat.offsetYPct) || 0));
  el.dataset.placement = placement;
  el.style.setProperty("--chat-ox", `${ox}%`);
  el.style.setProperty("--chat-oy", `${oy}%`);

  // Reset then set edges for the chosen corner/side
  el.style.left = "auto";
  el.style.right = "auto";
  el.style.top = "auto";
  el.style.bottom = "auto";
  // Do not set transform here — show/hide animation owns it

  const barLift =
    opts?.barH != null && Number.isFinite(opts.barH)
      ? `calc(${Math.max(0, opts.barH)}px + ${oy}%)`
      : `${oy}%`;

  switch (placement as ChatPlacement) {
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
    default:
      el.style.left = `${ox}%`;
      el.style.bottom = barLift;
      break;
  }
}
