import { chromium } from "playwright";
import { resolve } from "path";

const media = process.argv[2];
const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1720, height: 760 }, deviceScaleFactor: 1 })
).newPage();

async function shot(suffix) {
  const f = resolve(media, `avatar-proof-20261111-goals-${suffix}.png`);
  const stage = await page.locator("#uw-stage").boundingBox();
  await page.screenshot({ path: f, clip: stage, type: "png" });
  console.log("wrote", f);
}

await page.goto("http://127.0.0.1:8787/ultrawide.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(600);

const dump = await page.evaluate(() => {
  const fol = document.getElementById("uw-goal-follow");
  const sub = document.getElementById("uw-goal-sub");
  return {
    fol: !!fol,
    sub: !!sub,
    folSegs: fol?.querySelectorAll(".uw-goal-seg").length,
    filled: fol?.querySelectorAll(".uw-goal-seg.is-filled").length,
    folCur: fol?.querySelector(".uw-goal-cur")?.textContent,
    folTgt: fol?.querySelector(".uw-goal-tgt")?.textContent,
    hold: document.querySelector("#uw-bottom-text .uw-text-face")?.textContent,
    name: document.querySelector("[data-streamer-name]")?.textContent,
  };
});
console.log(JSON.stringify(dump, null, 2));

await page.evaluate(() => {
  document.getElementById("uw-stage").dataset.atm = "off";
  document.getElementById("uw-stage").dataset.textFx = "on";
  document.getElementById("uw-stage").dataset.goalsFx = "on";
});
await page.addStyleTag({ content: "html,body{background:#0a0a09!important}" });
await page.waitForTimeout(100);
await shot("idle");

// follow inc visual
await page.evaluate(() => {
  const fol = document.getElementById("uw-goal-follow");
  const cur = fol.querySelector(".uw-goal-cur");
  cur.textContent = "13";
  fol.classList.add("uw-goal-bump");
  const segs = [...fol.querySelectorAll(".uw-goal-seg")];
  segs.forEach((s, i) => {
    s.classList.toggle("is-filled", i < 5);
    s.classList.toggle("is-leading", i === 4);
  });
  fol.querySelector(".uw-goal-pct").textContent = "26%";
  document.querySelector('[data-text-fx="follow-name"]').dataset.fx = "activate";
  document.getElementById("uw-follower-name").textContent = "ZONE_SCOUT";
});
await page.waitForTimeout(80);
await shot("follow-inc");

// sub inc
await page.evaluate(() => {
  document.querySelectorAll("[data-text-fx]").forEach((el) => delete el.dataset.fx);
  document.getElementById("uw-goal-follow").classList.remove("uw-goal-bump");
  const sub = document.getElementById("uw-goal-sub");
  sub.querySelector(".uw-goal-cur").textContent = "4";
  sub.classList.add("uw-goal-bump");
  const segs = [...sub.querySelectorAll(".uw-goal-seg")];
  segs.forEach((s, i) => {
    s.classList.toggle("is-filled", i < 7);
    s.classList.toggle("is-leading", i === 6);
  });
  sub.querySelector(".uw-goal-pct").textContent = "40%";
  document.querySelector('[data-text-fx="sub-name"]').dataset.fx = "activate";
  document.getElementById("uw-subscriber-name").textContent = "RAID_READY";
});
await page.waitForTimeout(80);
await shot("sub-inc");

// complete
await page.evaluate(() => {
  document.querySelectorAll("[data-text-fx]").forEach((el) => delete el.dataset.fx);
  const fol = document.getElementById("uw-goal-follow");
  fol.classList.remove("uw-goal-bump");
  fol.dataset.state = "celebrate";
  fol.querySelector(".uw-goal-cur").textContent = "50";
  fol.querySelector(".uw-goal-pct").textContent = "100%";
  fol.querySelector(".uw-goal-status").textContent = "OBJECTIVE COMPLETE";
  [...fol.querySelectorAll(".uw-goal-seg")].forEach((s) => {
    s.classList.add("is-filled");
    s.classList.remove("is-leading");
  });
  document.querySelector('[data-text-fx="hold"]').dataset.fx = "lit-recover";
});
await page.waitForTimeout(80);
await shot("complete");

await page.addStyleTag({
  content: `html,body{background:radial-gradient(ellipse at 50% 60%, #2a2420 0%, #141210 55%, #080706 100%)!important}`,
});
await page.evaluate(() => {
  document.getElementById("uw-goal-follow").dataset.state = "complete";
  delete document.querySelector('[data-text-fx="hold"]').dataset.fx;
});
await page.waitForTimeout(60);
await shot("bunker");

await page.addStyleTag({
  content: `html,body{background:linear-gradient(180deg,#c8d0b8,#e8ecd8 40%,#b8c0a0)!important}`,
});
await page.waitForTimeout(60);
await shot("bright");

await browser.close();
