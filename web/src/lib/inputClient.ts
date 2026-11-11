import type {
  InputMessage,
  ServerToClientMessage,
  StatusMessage,
} from "../../../shared/protocol.ts";
import type { ReactiveAvatar } from "../avatar/reactiveAvatar.ts";

export type ConnectionState = "offline" | "connecting" | "live" | "demo";

export interface InputClientOptions {
  avatar: ReactiveAvatar;
  onStatus?: (status: StatusMessage) => void;
  onConnection?: (state: ConnectionState) => void;
  onChatLine?: (text: string, from: string) => void;
  /** When true, never auto-connect; dashboard demo only. */
  demoOnly?: boolean;
}

function wsUrl(): string {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${location.host}/ws`;
}

export class InputClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private closed = false;
  private retryMs = 500;
  private readonly avatar: ReactiveAvatar;
  private readonly onStatus?: (status: StatusMessage) => void;
  private readonly onConnection?: (state: ConnectionState) => void;
  private readonly onChatLine?: (text: string, from: string) => void;
  private readonly demoOnly: boolean;
  private demoActive = false;
  private lastInputAt: number | null = null;

  constructor(opts: InputClientOptions) {
    this.avatar = opts.avatar;
    this.onStatus = opts.onStatus;
    this.onConnection = opts.onConnection;
    this.onChatLine = opts.onChatLine;
    this.demoOnly = opts.demoOnly ?? false;
  }

  getLastInputAt(): number | null {
    return this.lastInputAt;
  }

  async start(): Promise<void> {
    if (this.demoOnly) {
      this.setConn("demo");
      this.avatar.setSource("demo");
      return;
    }
    await this.connect();
  }

  stop(): void {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
  }

  /** Local demo — visually distinct; does not open a fake live socket. */
  enableDemoPreview(on: boolean): void {
    this.demoActive = on;
    if (on) {
      this.setConn("demo");
      this.avatar.setSource("demo");
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.setConn("live");
      this.avatar.setSource("live");
    } else {
      this.setConn("offline");
      this.avatar.setSource("idle");
      this.avatar.resetIdle("demo-off");
    }
  }

  isDemo(): boolean {
    return this.demoActive || this.demoOnly;
  }

  private setConn(state: ConnectionState): void {
    this.onConnection?.(state);
  }

  private async fetchToken(): Promise<string> {
    const res = await fetch("/api/token", { cache: "no-store" });
    if (!res.ok) throw new Error("token fetch failed");
    const data = (await res.json()) as { token: string };
    return data.token;
  }

  private async connect(): Promise<void> {
    if (this.closed) return;
    this.setConn("connecting");
    try {
      this.token = await this.fetchToken();
    } catch {
      this.scheduleRetry();
      return;
    }

    const ws = new WebSocket(wsUrl());
    this.ws = ws;

    ws.addEventListener("open", () => {
      ws.send(
        JSON.stringify({
          type: "hello",
          role: "overlay",
          token: this.token,
        }),
      );
      this.retryMs = 500;
    });

    ws.addEventListener("message", (ev) => {
      let msg: ServerToClientMessage;
      try {
        msg = JSON.parse(String(ev.data)) as ServerToClientMessage;
      } catch {
        return;
      }
      this.handleServer(msg);
    });

    ws.addEventListener("close", () => {
      this.avatar.resetIdle("disconnect");
      this.avatar.setSource(this.demoActive ? "demo" : "idle");
      this.setConn(this.demoActive ? "demo" : "offline");
      this.scheduleRetry();
    });
  }

  private handleServer(msg: ServerToClientMessage): void {
    switch (msg.type) {
      case "status":
        this.onStatus?.(msg);
        if (msg.companionConnected && !this.demoActive) {
          this.setConn("live");
          this.avatar.setSource("live");
        } else if (this.demoActive) {
          this.setConn("demo");
          this.avatar.setSource("demo");
        } else {
          this.setConn(this.ws?.readyState === WebSocket.OPEN ? "offline" : "offline");
          // Socket may be up without companion — not "live input".
          this.avatar.setSource("idle");
        }
        break;
      case "input":
        if (this.demoActive) return; // demo preview supersedes live visuals when toggled
        // mouseMove is continuous presence — don't thrash source / idle resets
        if (msg.kind !== "mouseMove") {
          this.lastInputAt = Date.now();
          this.avatar.setSource("live");
        }
        this.avatar.handleInput(
          msg.kind,
          msg.phase,
          msg.held,
          msg.slot,
          msg.pressId,
          msg.dx,
          msg.dy,
        );
        break;
      case "mic":
        this.avatar.setMicLevel(msg.level, msg.talking);
        break;
      case "chat-line":
        this.avatar.say(msg.text);
        this.onChatLine?.(msg.text, msg.from);
        break;
      case "reset-idle":
        this.avatar.resetIdle(msg.reason);
        break;
      case "settings-updated":
      case "atm-preview":
      case "status":
      case "pong":
      case "error":
        break;
      default: {
        const _never: never = msg;
        void _never;
        break;
      }
    }
  }

  private scheduleRetry(): void {
    if (this.closed || this.demoOnly) return;
    window.setTimeout(() => {
      void this.connect();
    }, this.retryMs);
    this.retryMs = Math.min(5000, this.retryMs * 1.5);
  }
}

export function applyDemoInput(
  avatar: ReactiveAvatar,
  kind: InputMessage["kind"],
  phase: InputMessage["phase"],
  held: number,
  slot?: number,
  pressId?: number,
): void {
  avatar.setSource("demo");
  avatar.handleInput(kind, phase, held, slot, pressId);
}
