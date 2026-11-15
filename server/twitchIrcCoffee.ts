/**
 * Anonymous Twitch IRC (!coffee easter egg) via justinfan — no OAuth token.
 * Read-only JOIN to a channel; emits when someone says !coffee.
 */
import { WebSocket } from "ws";

export type CoffeeHit = { user: string; channel: string };

export type TwitchIrcCoffeeHandlers = {
  onCoffee: (hit: CoffeeHit) => void;
  onStatus?: (detail: string) => void;
};

const IRC_URL = "wss://irc-ws.chat.twitch.tv:443";

export class TwitchIrcCoffee {
  private ws: WebSocket | null = null;
  private stopped = false;
  private channel = "datguydaz";
  private enabled = true;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handlers: TwitchIrcCoffeeHandlers;
  private readonly userCooldownMs: () => number;
  private readonly globalCooldownMs: () => number;
  private lastGlobal = 0;
  private readonly lastUser = new Map<string, number>();

  constructor(
    handlers: TwitchIrcCoffeeHandlers,
    opts: {
      userCooldownMs: () => number;
      globalCooldownMs: () => number;
    },
  ) {
    this.handlers = handlers;
    this.userCooldownMs = opts.userCooldownMs;
    this.globalCooldownMs = opts.globalCooldownMs;
  }

  configure(channel: string, enabled: boolean): void {
    const next = String(channel || "datguydaz")
      .trim()
      .replace(/^#/, "")
      .toLowerCase()
      .slice(0, 32);
    const chChanged = next !== this.channel;
    const enChanged = enabled !== this.enabled;
    this.channel = next || "datguydaz";
    this.enabled = enabled;
    if (!enabled) {
      this.stop();
      return;
    }
    if (chChanged || enChanged || !this.ws) {
      this.stop();
      this.stopped = false;
      this.connect();
    }
  }

  start(): void {
    this.stopped = false;
    if (!this.enabled) return;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }
  }

  private connect(): void {
    if (this.stopped || !this.enabled) return;
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* ignore */
      }
      this.ws = null;
    }

    const nick = `justinfan${Math.floor(10000 + Math.random() * 80000)}`;
    const ws = new WebSocket(IRC_URL);
    this.ws = ws;

    ws.on("open", () => {
      this.reconnectAttempt = 0;
      ws.send("PASS SCHMOOPIIE");
      ws.send(`NICK ${nick}`);
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send(`JOIN #${this.channel}`);
      this.handlers.onStatus?.(`irc joined #${this.channel} as ${nick}`);
      console.log(`[coffee-irc] joined #${this.channel} as ${nick}`);
    });

    ws.on("message", (data) => {
      const text = String(data);
      for (const line of text.split(/\r?\n/)) {
        if (!line) continue;
        if (line.startsWith("PING ")) {
          ws.send(`PONG ${line.slice(5)}`);
          continue;
        }
        this.handleLine(line);
      }
    });

    ws.on("close", () => {
      this.ws = null;
      if (this.stopped || !this.enabled) return;
      this.scheduleReconnect();
    });

    ws.on("error", (err) => {
      console.log(`[coffee-irc] error: ${(err as Error)?.message || err}`);
    });
  }

  private scheduleReconnect(): void {
    if (this.stopped || !this.enabled) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const attempt = this.reconnectAttempt++;
    const delay = Math.min(60_000, 2000 * Math.pow(2, Math.min(5, attempt)));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private handleLine(line: string): void {
    // @tags :user!user@user.tmi.twitch.tv PRIVMSG #chan :message
    if (!line.includes(" PRIVMSG #")) return;
    const privIdx = line.indexOf(" PRIVMSG #");
    const after = line.slice(privIdx + " PRIVMSG #".length);
    const space = after.indexOf(" ");
    if (space < 0) return;
    const chan = after.slice(0, space).toLowerCase();
    if (chan !== this.channel) return;
    let msg = after.slice(space + 1);
    if (msg.startsWith(":")) msg = msg.slice(1);
    const trimmed = msg.trim();
    if (!/^!coffee\b/i.test(trimmed)) return;

    let user = "viewer";
    const bang = line.indexOf("!");
    const colon = line.indexOf(" :");
    // Prefer display-name / user-type tags if present
    if (line.startsWith("@")) {
      const tagEnd = line.indexOf(" :");
      const tags = line.slice(1, tagEnd > 0 ? tagEnd : line.length);
      const dn = /display-name=([^;]+)/i.exec(tags);
      if (dn?.[1]) user = decodeURIComponent(dn[1]).slice(0, 32);
      else {
        const login = /user-id=|login=/.test(tags)
          ? /login=([^;]+)/i.exec(tags)?.[1]
          : null;
        if (login) user = login.slice(0, 32);
      }
    }
    if (user === "viewer" && colon > 0 && bang > colon) {
      user = line.slice(colon + 2, bang).slice(0, 32) || "viewer";
    }

    const now = Date.now();
    if (now - this.lastGlobal < this.globalCooldownMs()) return;
    const prev = this.lastUser.get(user.toLowerCase()) || 0;
    if (now - prev < this.userCooldownMs()) return;
    this.lastGlobal = now;
    this.lastUser.set(user.toLowerCase(), now);
    this.handlers.onCoffee({ user, channel: this.channel });
    console.log(`[coffee-irc] !coffee from ${user} in #${this.channel}`);
  }
}
