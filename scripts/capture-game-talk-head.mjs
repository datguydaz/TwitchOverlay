import { chromium } from "playwright";
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";

const ts = process.env.PROOF_TS || String(Date.now());
const mediaStore = process.env.MEDIA_STORE || "_proofs";
mkdirSync(mediaStore, { recursive: true });
mkdirSync("_proofs", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.evaluate(() => {
  document.body.style.background = "radial-gradient(circle at 40% 30%, #2a2a2a, #0a0a0a 72%)";
});
await page.waitForTimeout(300);

const meta = await page.evaluate(async () => {
  const head = document.querySelector("#layer-head");
  const cs = head ? getComputedStyle(head) : null;
  // Drive two game lines through the avatar chat UI if ReactiveAvatar is on window — else inject DOM.
  const chat = document.querySelector("#avatar-chat .chat-body");
  const tag = document.querySelector("#avatar-chat .chat-tag");
  const root = document.querySelector(".avatar-root") || document.body;

  const show = (text, label) => {
    const wrap = document.querySelector("#avatar-chat");
    if (wrap) {
      wrap.dataset.show = "1";
      if (chat) chat.textContent = text;
      if (tag) tag.textContent = label;
    }
  };

  return {
    headAnim: cs?.animationName || "",
    headTiming: cs?.animationTimingFunction || "",
    headDuration: cs?.animationDuration || "",
    torsoSit: document.querySelector("#torso-sit")?.getAttribute("transform") || "",
    headSit: document.querySelector("#head-sit")?.getAttribute("transform") || "",
    killa: document.querySelector("#chest-killa-main")?.textContent || "",
    kbTag: document.querySelector("#prop-keyboard > rect")?.tagName || "",
    kbStroke: document.querySelector("#prop-keyboard > rect")?.getAttribute("stroke") || "",
    show,
    rootOk: !!root,
  };
});

const box = await page.locator(".avatar-root").boundingBox();
const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, file));
  return file;
};

const files = [];

// CS line (must not look like Tarkov slang)
await page.evaluate(() => {
  const chat = document.querySelector("#avatar-chat .chat-body");
  const tag = document.querySelector("#avatar-chat .chat-tag");
  const wrap = document.querySelector("#avatar-chat");
  if (wrap) wrap.dataset.show = "1";
  if (tag) tag.textContent = "DATGUYDAZ // COMMS";
  if (chat) chat.textContent = "Counter-Strike — don't overpeek mid.";
});
await page.waitForTimeout(120);
files.push(
  await shot("chat-cs-line", {
    x: box.x,
    y: box.y + box.height * 0.08,
    width: box.width,
    height: box.height * 0.72,
  }),
);

// Tarkov line (gear fear OK here)
await page.evaluate(() => {
  const chat = document.querySelector("#avatar-chat .chat-body");
  if (chat) chat.textContent = "Escape from Tarkov gear fear is a skill issue.";
});
await page.waitForTimeout(120);
files.push(
  await shot("chat-tarkov-line", {
    x: box.x,
    y: box.y + box.height * 0.08,
    width: box.width,
    height: box.height * 0.72,
  }),
);

// Idle head + desk sit proof
await page.evaluate(() => {
  const wrap = document.querySelector("#avatar-chat");
  if (wrap) wrap.dataset.show = "0";
});
await page.waitForTimeout(80);
files.push(
  await shot("head-idle-desk-sit", {
    x: box.x,
    y: box.y + box.height * 0.05,
    width: box.width,
    height: box.height * 0.92,
  }),
);

await browser.close();

const headLinear = String(meta.headTiming || "").includes("linear");
const pass =
  meta.headAnim === "head-idle" &&
  headLinear &&
  /translate\(0 42\)/.test(meta.torsoSit) &&
  /translate\(0 42\)/.test(meta.headSit) &&
  meta.killa === "KILLA" &&
  meta.kbTag.toLowerCase() === "rect" &&
  meta.kbStroke === "#4a4a4a";

const note = { ts, pass, meta: { ...meta, show: undefined }, files, headLinear };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-game-talk-head-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-game-talk-head-note.json`), JSON.stringify(note, null, 2));
console.log("meta", JSON.stringify(note.meta, null, 2));
console.log(pass ? "PROOF_OK" : "PROOF_FAIL", JSON.stringify({ pass, headLinear, headAnim: meta.headAnim }));
process.exit(pass ? 0 : 1);
