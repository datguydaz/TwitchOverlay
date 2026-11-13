/**
 * Subtle bar-only Tarkov/CRT FX for ultrawide-smoke.
 * All layers live inside #uw-top / #uw-bottom — stage hole stays a=0.
 *
 * Triggers (live, when motion allowed):
 * - Analog static burst: random every ~3.5–8s, lasts 70–160ms
 * - Name horizontal glitch tear: every ~7–14s, lasts ~100–180ms
 * - Scanline shimmer: continuous low opacity; intensifies during static/dropout
 * - CRT signal dropout: every ~8–15s, lasts 160–380ms
 * - Sparks: sparse pops every ~5–11s inside bars
 */

type Timer = number;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ensureFxLayers(bar: HTMLElement): void {
  const layers: Array<[string, string]> = [
    ["smk-fx-static", ""],
    ["smk-fx-scan", ""],
    ["smk-fx-dropout", ""],
    ["smk-fx-sparks", "<i></i><i></i><i></i><i></i><i></i><i></i>"],
  ];
  for (const [cls, html] of layers) {
    let el = bar.querySelector(`:scope > .${cls}`) as HTMLElement | null;
    if (!el) {
      el = document.createElement("div");
      el.className = cls;
      el.setAttribute("aria-hidden", "true");
      if (html) el.innerHTML = html;
      bar.appendChild(el);
    }
  }
}

export function applySmokeBarFx(stage: HTMLElement): () => void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  const bot = stage.querySelector("#uw-bottom") as HTMLElement | null;
  const nameplate = stage.querySelector(".smk-nameplate") as HTMLElement | null;
  if (!top || !bot) return () => {};

  ensureFxLayers(top);
  ensureFxLayers(bot);

  if (!nameplate?.querySelector(".smk-name-tear")) {
    const tear = document.createElement("span");
    tear.className = "smk-name-tear";
    tear.setAttribute("aria-hidden", "true");
    nameplate?.appendChild(tear);
  }

  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return () => {};

  const timers: Timer[] = [];
  let dead = false;

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      if (dead || document.hidden) return;
      fn();
    }, ms);
    timers.push(id);
    return id;
  };

  const pulseClass = (els: HTMLElement[], cls: string, ms: number) => {
    for (const el of els) el.classList.add(cls);
    later(() => {
      for (const el of els) el.classList.remove(cls);
    }, ms);
  };

  const scheduleStatic = () => {
    later(() => {
      if (dead) return;
      const dur = rand(70, 160);
      pulseClass([top, bot], "smk-fx-on-static", dur);
      scheduleStatic();
    }, rand(3500, 8000));
  };

  const scheduleNameTear = () => {
    later(() => {
      if (dead || !nameplate) return;
      const dur = rand(100, 180);
      nameplate.classList.add("smk-fx-on-tear");
      later(() => nameplate.classList.remove("smk-fx-on-tear"), dur);
      scheduleNameTear();
    }, rand(7000, 14000));
  };

  const scheduleDropout = () => {
    later(() => {
      if (dead) return;
      const dur = rand(160, 380);
      pulseClass([top, bot], "smk-fx-on-dropout", dur);
      // Brief static ride-along
      pulseClass([top, bot], "smk-fx-on-static", Math.min(dur, 120));
      scheduleDropout();
    }, rand(8000, 15000));
  };

  const scheduleSparks = () => {
    later(() => {
      if (dead) return;
      const target = Math.random() > 0.45 ? top : bot;
      target.classList.add("smk-fx-on-sparks");
      later(() => target.classList.remove("smk-fx-on-sparks"), rand(220, 480));
      scheduleSparks();
    }, rand(5000, 11000));
  };

  // Stagger first hits so boot isn't a storm
  later(() => scheduleStatic(), rand(1800, 3200));
  later(() => scheduleNameTear(), rand(4000, 7000));
  later(() => scheduleDropout(), rand(6000, 10000));
  later(() => scheduleSparks(), rand(2500, 5000));

  return () => {
    dead = true;
    for (const t of timers) window.clearTimeout(t);
    top.classList.remove("smk-fx-on-static", "smk-fx-on-dropout", "smk-fx-on-sparks");
    bot.classList.remove("smk-fx-on-static", "smk-fx-on-dropout", "smk-fx-on-sparks");
    nameplate?.classList.remove("smk-fx-on-tear");
  };
}
