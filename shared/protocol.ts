/** Minimal animation wire format — no characters or key names. */

export type InputKind = "key" | "mouseL" | "mouseR";
export type InputPhase = "down" | "up";

export type ClientRole = "overlay" | "dashboard" | "companion" | "test";

export interface HelloMessage {
  type: "hello";
  role: ClientRole;
  token: string;
}

export interface InputMessage {
  type: "input";
  kind: InputKind;
  phase: InputPhase;
  /** Opaque monotonic id for this press; reused on matching up. */
  pressId: number;
  /** Count of currently held keys/buttons of this kind after applying this event. */
  held: number;
}

export interface PauseMessage {
  type: "pause";
}

export interface ResumeMessage {
  type: "resume";
}

export interface PingMessage {
  type: "ping";
}

export interface PongMessage {
  type: "pong";
}

export interface StatusMessage {
  type: "status";
  capturePaused: boolean;
  companionConnected: boolean;
  overlayClients: number;
  demoModeHint: string;
}

export interface SettingsUpdatedMessage {
  type: "settings-updated";
}

export interface ErrorMessage {
  type: "error";
  code: string;
  message: string;
}

export interface ResetIdleMessage {
  type: "reset-idle";
  reason: "disconnect" | "pause" | "reconnect";
}

export type ClientToServerMessage =
  | HelloMessage
  | InputMessage
  | PauseMessage
  | ResumeMessage
  | PingMessage;

export type ServerToClientMessage =
  | StatusMessage
  | SettingsUpdatedMessage
  | InputMessage
  | ResetIdleMessage
  | PongMessage
  | ErrorMessage;

export const DEFAULT_WS_PORT = 8787;
export const DEFAULT_HTTP_PORT = 8787;
export const LOCAL_ORIGIN_RE = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i;
