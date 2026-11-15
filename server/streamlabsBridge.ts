/**
 * Streamlabs Socket API → overlay social names + operator reactions.
 * Token stays on the server only. Overlay never sees STREAMLABS_SOCKET_TOKEN.
 */
import io from "socket.io-client";
import type { OperatorReactionKind } from "../shared/protocol.ts";

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

export type StreamlabsReactionEvent = {
  reaction: OperatorReactionKind;
  name?: string;
  amount?: number;
  currency?: string;
  viewers?: number;
  count?: number;
  rawType: string;
};

export type StreamlabsBridgeHandlers = {
  /** Apply social name updates (persist + broadcast). */
  applySocial: (patch: SocialPatch, meta: { source: string; rawType: string }) => void;
  /** Raid / bits / donation / gift-bomb (and similar) plate reactions. */
  onReaction: (ev: StreamlabsReactionEvent) => void;
  onStatus: (status: EventsBridgeStatus, detail?: string) => void;
};

type SlMessage = Record<string, unknown>;

const DEDUPE_TTL_MS = 20_000;
const MAX_NAME = 48;
const GIFT_WINDOW_MS = 2800;

function cleanName(raw: unknown): string {
  const t = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);
  if (!t || t === "—" || t === "--" || t === "-") return "";
  return t;
}

function numField(raw: unknown, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
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

function isGiftType(t: string): boolean {
  return (
    t === "submysterygift" ||
    t === "mysterygift" ||
    t === "gift_subscription" ||
    t === "gift_sub" ||
    t === "giftsub" ||
    t === "gift" ||
    t === "communitygift"
  );
}

function isSubType(t: string): boolean {
  return (
    t === "subscription" ||
    t === "resub" ||
    t === "prime_sub" ||
    t === "twitch_subscription" ||
    isGiftType(t)
  );
}

/**
 * Sender / raider / gifter display name across Streamlabs platforms.
 * Twitch bits/cheers, donations, YouTube superchat, etc. use different keys.
 */
function firstName(messages: SlMessage[]): string {
  const first = messages[0] || {};
  const nestedRaw = (first as { message?: unknown }).message;
  const nest: SlMessage =
    nestedRaw && typeof nestedRaw === "object"
      ? (nestedRaw as SlMessage)
      : {};
  return (
    cleanName(first.name) ||
    cleanName(first.display_name) ||
    cleanName(first.displayName) ||
    cleanName(first.from) ||
    cleanName(first.from_name) ||
    cleanName(first.donor) ||
    cleanName(first.donator) ||
    cleanName(first.username) ||
    cleanName(first.user_name) ||
    cleanName(first.user) ||
    cleanName(first.gifter) ||
    cleanName(first.gifter_display_name) ||
    cleanName(first.raider) ||
    cleanName(first.channel) ||
    cleanName(nest.name) ||
    cleanName(nest.display_name) ||
    cleanName(nest.from) ||
    cleanName((first as { names?: unknown }).names)
  );
}

/**
 * Map Streamlabs alert types → social plate updates and/or reactions.
 */
export function mapStreamlabsEvent(
  type: string,
  messages: SlMessage[],
): { social?: SocialPatch; reaction?: Omit<StreamlabsReactionEvent, "rawType"> } | null {
  const t = type.toLowerCase();
  const first = messages[0] || {};
  const name = firstName(messages);

  if (t === "follow" || t === "follower") {
    if (!name) return null;
    return { social: { latestFollower: name } };
  }

  if (t === "raid" || t === "host" || t === "twitch_raid") {
    if (!name) return null;
    const viewers = Math.max(
      1,
      Math.round(
        numField(first.raiders, 0) ||
          numField(first.viewers, 0) ||
          numField(first.viewer_count, 0) ||
          numField(first.amount, 0) ||
          1,
      ),
    );
    return { reaction: { reaction: "raid", name, viewers } };
  }

  if (
    t === "bits" ||
    t === "cheer" ||
    t === "twitch_bits" ||
    t === "donation" ||
    t === "streamlabs" ||
    t === "tiltifydonation" ||
    t === "patreon" ||
    t === "superchat" ||
    t === "youtube_superchat" ||
    t === "merch"
  ) {
    const amount =
      numField(first.amount, 0) ||
      numField(first.bits, 0) ||
      numField(first.donatedAmount, 0) ||
      numField((first as { money?: { amount?: unknown } }).money?.amount, 0);
    const currency =
      cleanName(first.currency) ||
      cleanName((first as { money?: { currency?: unknown } }).money?.currency) ||
      (t.includes("bit") || t === "cheer" || t === "twitch_bits" ? "bits" : "USD");
    const reaction: OperatorReactionKind =
      t.includes("bit") || t === "cheer" || t === "twitch_bits" ? "bits" : "donation";
    return {
      reaction: {
        reaction,
        name: name || "ANONYMOUS",
        amount: amount > 0 ? amount : reaction === "bits" ? 100 : 5,
        currency,
      },
    };
  }

  if (isGiftType(t)) {
    // Handled by gift aggregator in the bridge class
    return { social: name ? { latestSubscriber: name } : undefined };
  }

  if (isSubType(t)) {
    if (!name) return null;
    return { social: { latestSubscriber: name } };
  }

  return null;
}

/** @deprecated use mapStreamlabsEvent — kept for older tests */
export function mapStreamlabsToSocial(
  type: string,
  messages: SlMessage[],
): SocialPatch | null {
  return mapStreamlabsEvent(type, messages)?.social ?? null;
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

  /** Gift-sub burst aggregator → giftbomb when threshold met. */
  private giftBuf: { name: string; rawType: string }[] = [];
  private giftTimer: ReturnType<typeof setTimeout> | null = null;
  private giftBombThreshold = 5;
  private giftBombsEnabled = true;

  constructor(token: string, handlers: StreamlabsBridgeHandlers) {
    this.token = (token || "").trim();
    this.handlers = handlers;
  }

  setGiftBombConfig(enabled: boolean, threshold: number): void {
    this.giftBombsEnabled = enabled;
    this.giftBombThreshold = Math.max(3, Math.min(50, Math.round(threshold) || 5));
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
    if (this.giftTimer) {
      clearTimeout(this.giftTimer);
      this.giftTimer = null;
    }
    this.flushGifts(true);
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
    const socket = io(url, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 15000,
    });
    this.socket = socket;

    socket.on("connect", () => {
      this.reconnectAttempt = 0;
      this.setStatus("connected");
      console.log(
        "[streamlabs] Socket connected (follow/sub/raid/bits/gifts -> overlay)",
      );
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

  private queueGift(name: string, rawType: string): void {
    this.giftBuf.push({ name: name || "ANONYMOUS", rawType });
    if (this.giftTimer) clearTimeout(this.giftTimer);
    this.giftTimer = setTimeout(() => {
      this.giftTimer = null;
      this.flushGifts(false);
    }, GIFT_WINDOW_MS);
  }

  private flushGifts(forceIndividual: boolean): void {
    const batch = this.giftBuf.splice(0, this.giftBuf.length);
    if (!batch.length) return;
    const count = batch.length;
    const last = batch[batch.length - 1]!;
    if (
      !forceIndividual &&
      this.giftBombsEnabled &&
      count >= this.giftBombThreshold
    ) {
      this.handlers.onReaction({
        reaction: "giftbomb",
        count,
        name: last.name || "ANONYMOUS",
        rawType: last.rawType,
      });
      // No applySocial — replaces N sub type-ins; keep existing plate name
      console.log(`[streamlabs] giftbomb ×${count} from ${last.name || "ANONYMOUS"}`);
      return;
    }
    for (const g of batch) {
      this.handlers.applySocial(
        { latestSubscriber: g.name },
        { source: "streamlabs", rawType: g.rawType },
      );
    }
  }

  private handleEventPayload(raw: unknown): boolean {
    const parsed = parseStreamlabsEvent(raw);
    if (!parsed) return false;

    const first = parsed.messages[0] || {};
    const idHint =
      cleanName(first.event_id) ||
      cleanName(first._id) ||
      cleanName(first.id) ||
      "";

    if (isGiftType(parsed.type)) {
      const name = firstName(parsed.messages) || "ANONYMOUS";
      const dedupeKey = idHint
        ? `id:${idHint}`
        : `gift:${name}:${Date.now()}`;
      // Soft dedupe for gifts — allow bursts, skip exact id repeats
      if (idHint && this.isDuplicate(dedupeKey)) {
        console.log(`[streamlabs] Dedupe skip ${dedupeKey}`);
        return false;
      }
      if (idHint) this.recent.set(dedupeKey, Date.now());
      this.queueGift(name, parsed.type);
      return true;
    }

    const mapped = mapStreamlabsEvent(parsed.type, parsed.messages);
    if (!mapped) return false;

    const nameKey =
      mapped.social?.latestFollower ||
      mapped.social?.latestSubscriber ||
      mapped.reaction?.name ||
      "";
    const dedupeKey = idHint
      ? `id:${idHint}`
      : `${parsed.type}:${nameKey}`;
    if (this.isDuplicate(dedupeKey)) {
      console.log(`[streamlabs] Dedupe skip ${dedupeKey}`);
      return false;
    }

    if (mapped.reaction) {
      this.handlers.onReaction({ ...mapped.reaction, rawType: parsed.type });
      console.log(
        `[streamlabs] ${parsed.type} -> reaction=${mapped.reaction.reaction}`,
      );
    }
    if (mapped.social) {
      this.handlers.applySocial(mapped.social, {
        source: "streamlabs",
        rawType: parsed.type,
      });
      console.log(
        `[streamlabs] ${parsed.type} -> ${
          mapped.social.latestFollower
            ? `follower=${mapped.social.latestFollower}`
            : `subscriber=${mapped.social.latestSubscriber}`
        }`,
      );
    }
    return true;
  }
}

export function createStreamlabsBridge(
  token: string,
  handlers: StreamlabsBridgeHandlers,
): StreamlabsBridge {
  return new StreamlabsBridge(token, handlers);
}
