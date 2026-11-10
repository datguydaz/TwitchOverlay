import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";

const ts = process.env.PROOF_TS;
const mediaStore = process.env.MEDIA_STORE;
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2e24, #0c0e0a 72%)";
});
await page.waitForTimeout(400);

const meta = await page.evaluate(() => {
  const svg = document.querySelector(".avatar-root svg")?.innerHTML || "";
  const labels = [...document.querySelectorAll(".avatar-root .kb-label")].map((t) => t.textContent);
  return {
    slots: (svg.match(/id="kb-s\d+"/g) || []).length,
    hasAkring: labels.includes("Å"),
    hasOuml: labels.includes("Ö"),
    hasAuml: labels.includes("Ä"),
    labels: labels.join(""),
  };
});
console.log("meta", JSON.stringify(meta));

const box = await page.locator(".avatar-root").boundingBox();
const clip = {
  x: box.x + box.width * 0.02,
  y: box.y + box.height * 0.52,
  width: box.width * 0.72,
  height: box.height * 0.4,
};

// Idle Nordic board visible
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.source = "demo";
  r.dataset.active = "1";
  r.dataset.key = "0";
  const hand = r.querySelector("#hand-left");
  if (hand) hand.style.transform = "translate(0px, 0px)";
  r.querySelectorAll(".kb-key[data-pressed]").forEach((el) => el.removeAttribute("data-pressed"));
});
await page.waitForTimeout(120);
const idle = `avatar-proof-${ts}-nordic-kb.png`;
await page.screenshot({ path: resolve(mediaStore, idle), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", idle), clip, type: "png" });
console.log("wrote", resolve(mediaStore, idle));

// Press Å (slot 10) — hand aims that keycap
await page.evaluate(() => {
  const r = document.querySelector(".avatar-root");
  if (!r) return;
  r.dataset.key = "1";
  r.dataset.keySlot = "10";
  r.dataset.keyPulse = "1";
  const hand = r.querySelector("#hand-left");
  // slot 10 Å ≈ (191.1, 254.25) vs HAND_HOME (110, 255)
  if (hand) hand.style.transform = "translate(81px, 5px)";
  r.querySelector("#kb-s10")?.setAttribute("data-pressed", "1");
});
await page.waitForTimeout(150);
const press = `avatar-proof-${ts}-nordic-kb-aaring.png`;
await page.screenshot({ path: resolve(mediaStore, press), clip, type: "png" });
await page.screenshot({ path: resolve("_proofs", press), clip, type: "png" });
console.log("wrote", resolve(mediaStore, press));

await browser.close();
if (!meta.hasAkring || !meta.hasOuml || !meta.hasAuml || meta.slots !== 30) {
  console.error("Nordic keyboard proof checks failed", meta);
  process.exit(1);
}
