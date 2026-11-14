/**
 * Tarkov bar narrative scenes for follow/sub (ultrawide-smoke).
 * Idle = hosts hidden, no timers/canvas. CSS anims only while data-esc is set.
 */
import type {
  EventSceneSettings,
  FollowEventScene,
  SubEventScene,
} from "../../../shared/settings.ts";
import { DEFAULT_EVENT_SCENES } from "../../../shared/settings.ts";

export type SocialKind = "follow" | "sub";
export type EventSceneId = FollowEventScene | SubEventScene;

export type EventSceneHooks = {
  onEventStart?: (kind: SocialKind, scene: EventSceneId) => void;
  onTypeChar?: (kind: SocialKind, char: string) => void;
  onTypeDone?: (kind: SocialKind) => void;
  /** Scene-specific SFX cues (telex chatter, chain, chute, alarm…). */
  onSceneCue?: (cue: EventSceneCue, kind: SocialKind) => void;
};

export type EventSceneCue =
  | "telex-chatter"
  | "telex-tear"
  | "telex-pin"
  | "chain-jingle"
  | "engrave-spark"
  | "chute-flap"
  | "airdrop-thud"
  | "flare-hiss"
  | "alarm-klaxon"
  | "door-slam"
  | "door-grind";

type PlayOpts = {
  name: string;
  restoreTo?: string;
  el: HTMLElement;
  nameEl: HTMLElement;
};

function fitName(nameEl: HTMLElement): void {
  const parent = nameEl.parentElement;
  if (!parent) return;
  nameEl.style.fontSize = "";
  const base = Number.parseFloat(getComputedStyle(nameEl).fontSize) || 28;
  let size = base;
  const min = Math.max(13, base * 0.42);
  const maxW = Math.max(40, parent.clientWidth - 12);
  let guard = 0;
  while (nameEl.scrollWidth > maxW && size > min && guard++ < 60) {
    size -= 0.75;
    nameEl.style.fontSize = `${size}px`;
  }
}

export class EventScenePlayer {
  private stage: HTMLElement;
  private cfg: EventSceneSettings = { ...DEFAULT_EVENT_SCENES };
  private hooks: EventSceneHooks;
  private timers: number[] = [];
  private urlFollow: FollowEventScene | null = null;
  private urlSub: SubEventScene | null = null;

  constructor(stage: HTMLElement, hooks: EventSceneHooks = {}) {
    this.stage = stage;
    this.hooks = hooks;
  }

  applyConfig(cfg: EventSceneSettings): void {
    this.cfg = {
      follow: cfg.follow || "telex",
      sub: cfg.sub || "airdrop",
    };
  }

  applyUrlParams(params: URLSearchParams): void {
    const fol = (params.get("followfx") || "").trim().toLowerCase();
    const sub = (params.get("subfx") || "").trim().toLowerCase();
    if (fol === "telex" || fol === "dogtag" || fol === "classic") this.urlFollow = fol;
    if (sub === "airdrop" || sub === "lockdown" || sub === "classic") this.urlSub = sub;
  }

  resolve(kind: SocialKind): EventSceneId {
    if (kind === "follow") return this.urlFollow || this.cfg.follow || "telex";
    return this.urlSub || this.cfg.sub || "airdrop";
  }

  /** True when classic plate type-in should run instead. */
  isClassic(kind: SocialKind): boolean {
    return this.resolve(kind) === "classic";
  }

  async play(kind: SocialKind, opts: PlayOpts): Promise<void> {
    const scene = this.resolve(kind);
    if (scene === "classic") return;

    const name = (opts.name || "").trim();
    if (!name) return;

    opts.nameEl.textContent = "";
    opts.el.dataset.socialFx = "scene";

    try {
      if (scene === "telex") await this.playTelex(kind, name, opts);
      else if (scene === "dogtag") await this.playDogtag(kind, name, opts);
      else if (scene === "airdrop") await this.playAirdrop(kind, name, opts);
      else if (scene === "lockdown") await this.playLockdown(kind, name, opts);
    } finally {
      delete opts.el.dataset.socialFx;
      if (opts.restoreTo !== undefined) {
        opts.nameEl.textContent = opts.restoreTo;
      }
      fitName(opts.nameEl);
      this.clearHosts();
    }
  }

  dispose(): void {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    this.clearHosts();
  }

  private host(id: string): HTMLElement | null {
    return this.stage.querySelector<HTMLElement>(`#${id}`);
  }

  private clearHosts(): void {
    for (const id of ["esc-telex", "esc-dogtag", "esc-airdrop", "esc-lockdown"]) {
      const h = this.host(id);
      if (!h) continue;
      delete h.dataset.esc;
      h.removeAttribute("data-phase");
      h.hidden = true;
      const print = h.querySelector<HTMLElement>(".esc-print, .esc-tag-name, .esc-rise-name, .esc-vault-name");
      if (print) print.textContent = "";
    }
  }

  private setHost(id: string, phase: string): HTMLElement | null {
    const h = this.host(id);
    if (!h) return null;
    h.hidden = false;
    h.dataset.esc = "1";
    h.dataset.phase = phase;
    return h;
  }

  private cue(c: EventSceneCue, kind: SocialKind): void {
    this.hooks.onSceneCue?.(c, kind);
  }

  private wait(ms: number): Promise<void> {
    return new Promise((r) => {
      this.timers.push(window.setTimeout(r, ms));
    });
  }

  private async typeOnto(
    kind: SocialKind,
    target: HTMLElement,
    name: string,
    perCharMs: number,
    alsoCue?: EventSceneCue,
  ): Promise<void> {
    let built = "";
    for (const ch of [...name]) {
      built += ch;
      target.textContent = built;
      this.hooks.onTypeChar?.(kind, ch);
      if (alsoCue) this.cue(alsoCue, kind);
      await this.wait(perCharMs + Math.floor(Math.random() * 12));
    }
    this.hooks.onTypeDone?.(kind);
  }

  /** Follow A — telex/receipt printer near follower plate. */
  private async playTelex(kind: SocialKind, name: string, opts: PlayOpts): Promise<void> {
    const host = this.setHost("esc-telex", "idle");
    if (!host) return;
    const print = host.querySelector<HTMLElement>(".esc-print");
    if (!print) return;

    // Chatter + feed
    this.setHost("esc-telex", "chatter");
    this.cue("telex-chatter", kind);
    await this.wait(280);

    this.setHost("esc-telex", "feed");
    print.textContent = "";
    await this.typeOnto(kind, print, name, 38);
    await this.wait(180);

    this.setHost("esc-telex", "tear");
    this.cue("telex-tear", kind);
    await this.wait(320);

    this.setHost("esc-telex", "pin");
    const pin = host.querySelector<HTMLElement>(".esc-telex-pin");
    if (pin) pin.textContent = name;
    this.cue("telex-pin", kind);
    opts.nameEl.textContent = name;
    fitName(opts.nameEl);
    opts.el.dataset.socialFx = "scene-pin";
    await this.wait(2200);

    this.setHost("esc-telex", "fade");
    await this.wait(480);
    opts.el.dataset.socialFx = "settle";
    await this.wait(360);
  }

  /** Follow B — dog tag on ball chain from top edge. */
  private async playDogtag(kind: SocialKind, name: string, opts: PlayOpts): Promise<void> {
    const host = this.setHost("esc-dogtag", "drop");
    if (!host) return;
    const tagName = host.querySelector<HTMLElement>(".esc-tag-name");
    if (!tagName) return;

    this.cue("chain-jingle", kind);
    await this.wait(420);

    this.setHost("esc-dogtag", "swing");
    await this.wait(380);

    this.setHost("esc-dogtag", "engrave");
    tagName.textContent = "";
    await this.typeOnto(kind, tagName, name, 42, "engrave-spark");
    await this.wait(220);

    this.setHost("esc-dogtag", "settle");
    opts.nameEl.textContent = name;
    fitName(opts.nameEl);
    opts.el.dataset.socialFx = "scene-pin";
    await this.wait(1600);

    this.setHost("esc-dogtag", "fade");
    await this.wait(500);
    opts.el.dataset.socialFx = "settle";
    await this.wait(320);
  }

  /** Sub A — Tarkov airdrop into bottom bar only. */
  private async playAirdrop(kind: SocialKind, name: string, opts: PlayOpts): Promise<void> {
    const host = this.setHost("esc-airdrop", "descend");
    if (!host) return;
    const rise = host.querySelector<HTMLElement>(".esc-rise-name");
    if (!rise) return;

    this.cue("chute-flap", kind);
    await this.wait(1100);

    this.setHost("esc-airdrop", "land");
    this.cue("airdrop-thud", kind);
    await this.wait(280);

    this.setHost("esc-airdrop", "flare");
    this.cue("flare-hiss", kind);
    await this.wait(420);

    this.setHost("esc-airdrop", "open");
    await this.wait(360);

    this.setHost("esc-airdrop", "reveal");
    rise.textContent = "";
    await this.typeOnto(kind, rise, name, 36);
    await this.wait(400);

    opts.nameEl.textContent = name;
    fitName(opts.nameEl);
    opts.el.dataset.socialFx = "scene-pin";
    opts.el.dataset.typeMark = "1";

    this.setHost("esc-airdrop", "handoff");
    await this.wait(900);

    this.setHost("esc-airdrop", "fade");
    await this.wait(500);
    opts.el.dataset.socialFx = "settle";
    await this.wait(400);
  }

  /** Sub B — lockdown shutters over sub plate. */
  private async playLockdown(kind: SocialKind, name: string, opts: PlayOpts): Promise<void> {
    const host = this.setHost("esc-lockdown", "alarm");
    if (!host) return;
    const vault = host.querySelector<HTMLElement>(".esc-vault-name");
    if (!vault) return;

    this.cue("alarm-klaxon", kind);
    this.stage.dataset.barSurge = "1";
    await this.wait(520);

    this.setHost("esc-lockdown", "slam");
    this.cue("door-slam", kind);
    opts.el.dataset.socialFx = "scene-shake";
    await this.wait(480);

    this.setHost("esc-lockdown", "hold");
    await this.wait(280);

    this.setHost("esc-lockdown", "grind");
    this.cue("door-grind", kind);
    vault.textContent = name;
    // Type cue during grind open (sync clacks with reveal)
    let built = "";
    for (const ch of [...name]) {
      built += ch;
      vault.textContent = built;
      this.hooks.onTypeChar?.(kind, ch);
      await this.wait(28 + Math.floor(Math.random() * 18));
    }
    this.hooks.onTypeDone?.(kind);

    opts.nameEl.textContent = name;
    fitName(opts.nameEl);
    opts.el.dataset.socialFx = "scene-pin";
    opts.el.dataset.typeMark = "1";
    await this.wait(700);

    this.setHost("esc-lockdown", "open");
    await this.wait(900);

    this.setHost("esc-lockdown", "fade");
    delete this.stage.dataset.barSurge;
    await this.wait(420);
    opts.el.dataset.socialFx = "settle";
    await this.wait(360);
  }
}

export function createEventScenePlayer(
  stage: HTMLElement,
  hooks?: EventSceneHooks,
): EventScenePlayer {
  return new EventScenePlayer(stage, hooks);
}
