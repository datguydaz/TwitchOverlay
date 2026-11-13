/**
 * Live bar props for ultrawide-smoke: cables, duct/masking tape, terminal glass grit,
 * corner warning lamps, dog tags, and rare power surge. All stay inside bars.
 */

type Timer = number;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function ensure(parent: HTMLElement, sel: string, html: string): HTMLElement {
  let el = parent.querySelector(sel) as HTMLElement | null;
  if (!el) {
    const wrap = document.createElement("div");
    wrap.innerHTML = html.trim();
    el = wrap.firstElementChild as HTMLElement;
    parent.appendChild(el);
  }
  return el;
}

function decorateTerminals(stage: HTMLElement): void {
  stage.querySelectorAll<HTMLElement>(".smk-radio-screen").forEach((screen, idx) => {
    if (!screen.querySelector(".smk-radio-glass")) {
      const glass = document.createElement("span");
      glass.className = "smk-radio-glass";
      glass.setAttribute("aria-hidden", "true");
      glass.innerHTML =
        '<i class="smk-radio-grime"></i><i class="smk-radio-spider"></i><i class="smk-radio-deadpx"></i><i class="smk-radio-burn"></i>';
      screen.appendChild(glass);
      // Spider crack only on one terminal corner
      if (idx === 0) glass.classList.add("smk-has-spider");
    }
  });

  stage.querySelectorAll<HTMLElement>(".smk-plate.smk-crate").forEach((crate, idx) => {
    if (!crate.querySelector(".smk-duct")) {
      const duct = document.createElement("span");
      duct.className = "smk-duct";
      duct.setAttribute("aria-hidden", "true");
      crate.appendChild(duct);
    }
    if (!crate.querySelector(".smk-mask-label")) {
      const label = document.createElement("span");
      label.className = "smk-mask-label";
      label.setAttribute("aria-hidden", "true");
      label.textContent = idx === 0 ? "RX-OK" : "TX-OK";
      crate.appendChild(label);
    }
  });
}

function mountCables(stage: HTMLElement): void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  if (!top || top.querySelector(".smk-cables")) return;
  const host = document.createElement("div");
  host.className = "smk-cables";
  host.setAttribute("aria-hidden", "true");
  host.innerHTML = `
    <svg class="smk-cable smk-cable-l" viewBox="0 0 420 180" preserveAspectRatio="none">
      <path d="M40 20 C80 60 90 90 120 110 C160 140 200 150 260 155" fill="none" stroke="rgba(28,30,26,0.75)" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M48 18 C90 55 100 95 135 118 C170 140 210 148 255 152" fill="none" stroke="rgba(50,42,28,0.45)" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="120" cy="110" r="3.5" fill="rgba(36,34,28,0.9)"/>
      <circle cx="200" cy="150" r="3.2" fill="rgba(36,34,28,0.9)"/>
      <path d="M116 108 l8 6 M196 148 l8 5" stroke="rgba(70,62,40,0.55)" stroke-width="1.2"/>
    </svg>
    <svg class="smk-cable smk-cable-r" viewBox="0 0 420 180" preserveAspectRatio="none">
      <path d="M380 22 C340 58 330 95 300 118 C260 145 220 150 160 155" fill="none" stroke="rgba(28,30,26,0.75)" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M372 20 C330 55 320 95 285 120 C250 142 210 148 165 152" fill="none" stroke="rgba(50,42,28,0.45)" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="300" cy="118" r="3.5" fill="rgba(36,34,28,0.9)"/>
      <circle cx="220" cy="150" r="3.2" fill="rgba(36,34,28,0.9)"/>
      <path d="M304 116 l-8 6 M224 148 l-8 5" stroke="rgba(70,62,40,0.55)" stroke-width="1.2"/>
    </svg>`;
  top.appendChild(host);
}

function mountWarnLamps(top: HTMLElement, bot: HTMLElement): void {
  const spots: Array<[HTMLElement, string]> = [
    [top, "tl"],
    [top, "tr"],
    [bot, "bl"],
    [bot, "br"],
  ];
  for (const [bar, corner] of spots) {
    ensure(
      bar,
      `:scope > .smk-warn-lamp.smk-warn-${corner}`,
      `<div class="smk-warn-lamp smk-warn-${corner}" aria-hidden="true"><i></i></div>`,
    );
  }
}

function mountDogTags(top: HTMLElement): void {
  ensure(
    top,
    ":scope > .smk-dogtags",
    `<div class="smk-dogtags" aria-hidden="true">
      <span class="smk-dog-chain"></span>
      <span class="smk-dog-tag a"><em>DGZ</em></span>
      <span class="smk-dog-tag b"><em>OPs</em></span>
    </div>`,
  );
}

export function applySmokeBarProps(stage: HTMLElement): () => void {
  const top = stage.querySelector("#uw-top") as HTMLElement | null;
  const bot = stage.querySelector("#uw-bottom") as HTMLElement | null;
  if (!top || !bot) return () => {};

  decorateTerminals(stage);
  mountCables(stage);
  mountWarnLamps(top, bot);
  mountDogTags(top);

  const reduced =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers: Timer[] = [];
  let dead = false;

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      if (dead || document.hidden) return;
      fn();
    }, ms);
    timers.push(id);
  };

  // Rare corner lamp blink — mostly dead
  const lamps = stage.querySelectorAll<HTMLElement>(".smk-warn-lamp");
  const scheduleLamp = () => {
    if (dead || reduced) return;
    const lamp = lamps[Math.floor(Math.random() * lamps.length)];
    if (lamp && Math.random() < 0.55) {
      lamp.classList.add("smk-warn-on");
      later(() => lamp.classList.remove("smk-warn-on"), rand(80, 220));
      if (Math.random() < 0.35) {
        later(() => {
          lamp.classList.add("smk-warn-on");
          later(() => lamp.classList.remove("smk-warn-on"), rand(60, 140));
        }, rand(120, 280));
      }
    }
    later(scheduleLamp, rand(6000, 16000));
  };

  // Power surge: every ~3–6 min (or ?surge=1 once soon)
  const runSurge = () => {
    if (dead) return;
    stage.classList.add("smk-surge-flare");
    later(() => {
      stage.classList.remove("smk-surge-flare");
      stage.classList.add("smk-surge-shake");
      top.classList.add("smk-fx-on-sparks");
      bot.classList.add("smk-fx-on-sparks");
      later(() => {
        stage.classList.remove("smk-surge-shake");
        top.classList.remove("smk-fx-on-sparks");
        bot.classList.remove("smk-fx-on-sparks");
        stage.classList.add("smk-surge-brown");
        later(() => stage.classList.remove("smk-surge-brown"), 1000);
      }, 280);
    }, 180);
  };

  const scheduleSurge = () => {
    if (dead || reduced) return;
    later(() => {
      runSurge();
      scheduleSurge();
    }, rand(180000, 360000));
  };

  if (!reduced) {
    later(scheduleLamp, rand(4000, 9000));
    try {
      const force = new URLSearchParams(location.search).get("surge");
      if (force === "1" || force === "true") {
        later(runSurge, 900);
      }
    } catch {
      /* ignore */
    }
    later(scheduleSurge, rand(180000, 360000));
  }

  return () => {
    dead = true;
    for (const t of timers) window.clearTimeout(t);
    stage.classList.remove("smk-surge-flare", "smk-surge-shake", "smk-surge-brown");
    lamps.forEach((l) => l.classList.remove("smk-warn-on"));
    top.classList.remove("smk-fx-on-sparks");
    bot.classList.remove("smk-fx-on-sparks");
  };
}
