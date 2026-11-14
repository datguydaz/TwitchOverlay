/**
 * Streamlabs Socket API → overlay social names (follow / sub first slice).
 * Token stays on the server only. Overlay never sees STREAMLABS_SOCKET_TOKEN.
 */
import io from "socket.io-client";

type SlSocket = SocketIOClient.Socket;

export type EventsBridgeStatus =
  | "not_configured"
  | "connecting"
  | "connected"
  | "disconnected";

export type SocialPatch = {
  latestFollower?: string;
  latestSubscriber?: string;
};

export type StreamlabsBridgeHandlers = {
  /** Apply social name updates (persist + broadcast). Return false to skip. */
  applySocial: (patch: SocialPatch, meta: { source: string; rawType: string }) => void;
  onStatus: (status: EventsBridgeStatus, detail?: string) => void;
};

type SlMessage = Record<string, unknown>;

const DEDUPE_TTL_MS = 20_000;
const MAX_NAME = 48;

function cleanName(raw: unknown): string {
  const t = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
  if (!t || t === "—" || t === "--" || t === "-") return "";
  return t;
}

/** Parse Streamlabs `event` payload (object or JSON string; message may be array or string). */
export function parseStreamlabsEvent(raw: unknown): { type: string; messages: SlMessage[] } | null {
  let data: unknown = raw;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const type = String(obj.type || obj.event_type || "").toLowerCase();
  if (!type) return null;

  let messages: unknown = obj.message ?? obj.messages ?? obj.data;
  if (typeof messages === "string") {
    try {
      messages = JSON.parse(messages);
    } catch {
      messages = [{ name: messages }];
    }
  }
  if (!Array.isArray(messages)) {
    if (messages && typeof messages === "object") messages = [messages];
    else messages = [];
  }
  return { type, messages: messages as SlMessage[] };
}

/**
 * Map Streamlabs alert types → social plate updates.
 * Follow → latestFollower. Subscription / resub / gift → latestSubscriber.
 */
export function mapStreamlabsToSocial(
  type: string,
  messages: SlMessage[],
): SocialPatch | null {
  const t = type.toLowerCase();
  const first = messages[0] || {};
  const name =
    cleanName(first.name) ||
    cleanName(first.display_name) ||
    cleanName(first.from) ||
    cleanName(first.gifter) ||
    cleanName((first as { names?: unknown }).names);

  if (!name) return null;

  if (t === "follow" || t === "follower") {
    return { latestFollower: name };
  }

  // Twitch sub / resub / gifted sub (receiver or gifter → show recipient when present)
  if (
    t === "subscription" ||
    t === "resub" ||
    t === "submysterygift" ||
    t === "mysterygift" ||
    t === "prime_sub" ||
    t === "twitch_subscription" ||
    t === "gift_subscription" ||
    t === "gift_sub" ||
    t === "giftsub"
  ) {
    const recipient =
      cleanName(first.name) ||
      cleanName(first.display_name) ||
      cleanName(first.gifter) ||
      name;
    return { latestSubscriber: recipient };
  }

  return null;
}

export class StreamlabsBridge {
  private status: EventsBridgeStatus = "not_configured";
  private socket: SlSocket | null = null;
  private stopped = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private missingLogged = false;
  private readonly recent = new Map<string, number>();
  private readonly handlers: StreamlabsBridgeHandlers;
  private readonly token: string;

  constructor(token: string, handlers: StreamlabsBridgeHandlers) {
    this.token = (token || "").trim();
    this.handlers = handlers;
  }

  getStatus(): EventsBridgeStatus {
    return this.status;
  }

  start(): void {
    this.stopped = false;
    if (!this.token) {
      this.setStatus("not_configured", "STREAMLABS_SOCKET_TOKEN missing");
      if (!this.missingLogged) {
        console.log(
          "[streamlabs] No STREAMLABS_SOCKET_TOKEN - events bridge idle. Overlay works as before. Copy .env.example to .env.local and paste your Socket API token.",
        );
        this.missingLogged = true;
      }
      return;
    }
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.token) this.setStatus("disconnected", "stopped");
  }

  /** Test / mock inject — same path as a live socket `event`. */
  ingestRaw(raw: unknown): boolean {
    return this.handleEventPayload(raw);
  }

  private setStatus(next: EventsBridgeStatus, detail?: string): void {
    this.status = next;
    this.handlers.onStatus(next, detail);
  }

  private connect(): void {
    if (this.stopped || !this.token) return;
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.setStatus("connecting");
    const url = `https://sockets.streamlabs.com?token=${encodeURIComponent(this.token)}`;
    // Streamlabs still speaks socket.io v2 protocol
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: false, // we own backoff
      timeout: 15000,
    });
    this.socket = socket;

    socket.on("connect", () => {
      this.reconnectAttempt = 0;
      this.setStatus("connected");
      console.log("[streamlabs] Socket connected (follow/sub -> overlay plates)");
    });

    socket.on("event", (payload: unknown) => {
      this.handleEventPayload(payload);
    });

    socket.on("disconnect", (reason: string) => {
      if (this.stopped) return;
      this.setStatus("disconnected", String(reason || "disconnect"));
      console.log(`[streamlabs] Disconnected (${reason || "unknown"}) - will retry`);
      this.scheduleReconnect();
    });

    socket.on("connect_error", (err: Error) => {
      if (this.stopped) return;
      this.setStatus("disconnected", err?.message || "connect_error");
      console.log(`[streamlabs] Connect error: ${err?.message || err} - will retry`);
      this.scheduleReconnect();
    });

    socket.on("error", (err: Error) => {
      console.log(`[streamlabs] Socket error: ${err?.message || err}`);
    });
  }

  private scheduleReconnect(): void {
    if (this.stopped || !this.token) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    const attempt = this.reconnectAttempt++;
    const delay = Math.min(60_000, 1000 * Math.pow(2, Math.min(6, attempt)));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private isDuplicate(key: string): boolean {
    const now = Date.now();
    for (const [k, t] of this.recent) {
      if (now - t > DEDUPE_TTL_MS) this.recent.delete(k);
    }
    const prev = this.recent.get(key);
    if (prev != null && now - prev < DEDUPE_TTL_MS) return true;
    this.recent.set(key, now);
    return false;
  }

  private handleEventPayload(raw: unknown): boolean {
    const parsed = parseStreamlabsEvent(raw);
    if (!parsed) return false;
    const patch = mapStreamlabsToSocial(parsed.type, parsed.messages);
    if (!patch) return false;

    const first = parsed.messages[0] || {};
    const idHint =
      cleanName(first.event_id) ||
      cleanName(first._id) ||
      cleanName(first.id) ||
      "";
    const nameKey = patch.latestFollower || patch.latestSubscriber || "";
    const dedupeKey = idHint
      ? `id:${idHint}`
      : `${parsed.type}:${nameKey}:${patch.latestFollower ? "fol" : "sub"}`;
    if (this.isDuplicate(dedupeKey)) {
      console.log(`[streamlabs] Dedupe skip ${dedupeKey}`);
      return false;
    }

    this.handlers.applySocial(patch, { source: "streamlabs", rawType: parsed.type });
    console.log(
      `[streamlabs] ${parsed.type} -> ${
        patch.latestFollower
          ? `follower=${patch.latestFollower}`
          : `subscriber=${patch.latestSubscriber}`
      }`,
    );
    return true;
  }
}

export function createStreamlabsBridge(
  token: string,
  handlers: StreamlabsBridgeHandlers,
): StreamlabsBridge {
  return new StreamlabsBridge(token, handlers);
}
