/**
 * Bar-only bunker HUD for ultrawide-smoke:
 * - Hanging bulb glow (sway + flicker / brownout)
 * - Radio chatter ticker (seamless loop + letter static)
 * - Live local clock + raid/stream uptime
 * Stage hole stays a=0. No bright yellow — dirty sickly off-white / muted tungsten.
 */

type Timer = number;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatClock(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function formatRaid(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function resolveRaidStart(): number {
  try {
    const params = new URLSearchParams(location.search);
    const raw = params.get("raidStart") || params.get("streamStart");
    if (raw) {
      const n = Number(raw);
      if (Number.isFinite(n) && n > 0) return n < 1e12 ? n * 1000 : n;
      const parsed = Date.parse(raw);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return Date.now();
}

const CHATTER = [
  "CONTACT NORTH",
  "EXTRACT 04:12",
  "SIGNAL LOST",
  "OPERATOR DATGUYDAZ ONLINE",
  "SCAV ACTIVITY EAST",
  "POWER FLICKER SECTOR 3",
  "RAID TIMER SYNC",
  "COMMS DEGRADED",
  "HOLD POSITION",
  "NO VISUAL",
].join("  //  ");

function ensureEl(parent: HTMLElement, sel: string, html: string): HTMLElement {
  let el = parent.querySelector(sel) as HTMLElement | null;
  if (!el) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    el = wrap.firstElementChild as HTMLElement;
    parent.appendChild(el);
  }
  return el;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function applySmokeBunkerHud(stage: HTMLElement): () => void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  const bot = stage.querySelector("#uw-bottom") as HTMLElement | null;
  if (!top || !bot) return () => {};

  // —— Bunker hanging bulbs ——
  ensureEl(
    top,
    ":scope > .smk-bunker-light",
    `<div class="smk-bunker-light smk-bunker-light-main smk-bunker-light-corner" aria-hidden="true">
      <span class="smk-bulb-cord"></span>
      <span class="smk-bulb-cage" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </span>
      <span class="smk-bulb"></span>
      <span class="smk-bulb-glow"></span>
      <span class="smk-bulb-pass"></span>
    </div>`,
  );
  ensureEl(
    bot,
    ":scope > .smk-bunker-light",
    `<div class="smk-bunker-light smk-bunker-light-faint" aria-hidden="true">
      <span class="smk-bulb-cord"></span>
      <span class="smk-bulb"></span>
      <span class="smk-bulb-glow"></span>
      <span class="smk-bulb-pass"></span>
    </div>`,
  );

  // —— Radio chatter (bottom only) ——
  const tickerHost = ensureEl(
    bot,
    ":scope > .smk-chatter",
    `<div class="smk-chatter" aria-hidden="true">
      <div class="smk-chatter-track">
        <span class="smk-chatter-text"></span>
        <span class="smk-chatter-text" aria-hidden="true"></span>
      </div>
    </div>`,
  );
  const line = `${CHATTER}  //  `;
  tickerHost.querySelectorAll(".smk-chatter-text").forEach((el) => {
    el.textContent = line;
  });

  // —— Corner clocks ——
  const mkClock = (bar: HTMLElement, side: "tl" | "tr" | "bl" | "br", kind: "loc" | "raid") => {
    const cls = `smk-chrono smk-chrono-${side}`;
    return ensureEl(
      bar,
      `:scope > .smk-chrono-${side}`,
      `<div class="${cls}" aria-hidden="true">
        <span class="smk-chrono-label">${kind === "loc" ? "LOC" : "RAID"}</span>
        <span class="smk-chrono-val" data-chrono="${kind}"></span>
      </div>`,
    );
  };
  mkClock(top, "tl", "loc");
  mkClock(top, "tr", "raid");
  mkClock(bot, "bl", "loc");
  mkClock(bot, "br", "raid");

  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timeouts: Timer[] = [];
  const intervals: Timer[] = [];
  let dead = false;
  const raidStart = resolveRaidStart();

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      if (dead || document.hidden) return;
      fn();
    }, ms);
    timeouts.push(id);
  };

  const tickChrono = () => {
    if (dead) return;
    const now = new Date();
    const loc = formatClock(now);
    const raid = formatRaid(Date.now() - raidStart);
    stage.querySelectorAll<HTMLElement>('[data-chrono="loc"]').forEach((el) => {
      el.textContent = loc;
    });
    stage.querySelectorAll<HTMLElement>('[data-chrono="raid"]').forEach((el) => {
      el.textContent = raid;
    });
    // slight flicker class every ~few seconds
    if (Math.random() < 0.08) {
      stage.querySelectorAll(".smk-chrono").forEach((el) => el.classList.add("smk-chrono-flick"));
      later(() => {
        stage.querySelectorAll(".smk-chrono").forEach((el) => el.classList.remove("smk-chrono-flick"));
      }, 80 + Math.random() * 100);
    }
  };

  tickChrono();
  intervals.push(window.setInterval(tickChrono, 1000));

  // Chatter letter static glitch
  const glitchChatter = () => {
    if (dead || reduced) return;
    const texts = tickerHost.querySelectorAll<HTMLElement>(".smk-chatter-text");
    texts.forEach((el) => {
      const raw = el.textContent || "";
      if (!raw) return;
      const chars = [...raw];
      const n = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < n; i++) {
        const idx = Math.floor(Math.random() * chars.length);
        if (chars[idx] === " " || chars[idx] === "/") continue;
        chars[idx] = "█░▒▓"[Math.floor(Math.random() * 4)];
      }
      el.textContent = chars.join("");
      later(() => {
        el.textContent = line;
      }, 60 + Math.random() * 90);
    });
    later(glitchChatter, rand(2800, 7000));
  };

  // Bulb brownout / flicker
  const bulbs = stage.querySelectorAll<HTMLElement>(".smk-bunker-light");
  const scheduleBulb = () => {
    if (dead || reduced) return;
    const roll = Math.random();
    if (roll < 0.55) {
      bulbs.forEach((b) => b.classList.add("smk-bulb-flick"));
      later(() => bulbs.forEach((b) => b.classList.remove("smk-bulb-flick")), rand(60, 140));
    } else if (roll < 0.82) {
      bulbs.forEach((b) => b.classList.add("smk-bulb-brown"));
      later(() => bulbs.forEach((b) => b.classList.remove("smk-bulb-brown")), rand(180, 420));
    } else {
      // double stutter
      bulbs.forEach((b) => b.classList.add("smk-bulb-flick"));
      later(() => {
        bulbs.forEach((b) => b.classList.remove("smk-bulb-flick"));
        later(() => {
          bulbs.forEach((b) => b.classList.add("smk-bulb-brown"));
          later(() => bulbs.forEach((b) => b.classList.remove("smk-bulb-brown")), rand(120, 280));
        }, 90);
      }, 70);
    }
    later(scheduleBulb, rand(3500, 9000));
  };

  if (!reduced) {
    later(glitchChatter, rand(2000, 4000));
    later(scheduleBulb, rand(2500, 5000));
  }

  return () => {
    dead = true;
    for (const t of timeouts) window.clearTimeout(t);
    for (const t of intervals) window.clearInterval(t);
    bulbs.forEach((b) => b.classList.remove("smk-bulb-flick", "smk-bulb-brown"));
  };
}
