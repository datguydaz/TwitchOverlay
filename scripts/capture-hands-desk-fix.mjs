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
await page.waitForTimeout(350);

const meta = await page.evaluate(() => {
  const op = document.querySelector("#operator");
  const kids = op ? [...op.children].map((el) => el.id || el.tagName) : [];
  const idx = (id) => kids.indexOf(id);
  const orderOk =
    idx("layer-torso") < idx("desk") &&
    idx("layer-head") < idx("desk") &&
    idx("desk") < idx("prop-keyboard") &&
    idx("prop-keyboard") < idx("hand-left") &&
    idx("prop-mouse") < idx("hand-left") &&
    idx("prop-mouse") < idx("hand-right") &&
    idx("prop-frag") > idx("desk") &&
    idx("prop-frag") < idx("hand-left") &&
    idx("prop-pistol") > idx("desk") &&
    idx("prop-pistol") < idx("hand-left") &&
    !kids.includes("arm-bridge-left") &&
    !kids.includes("arm-bridge-right");

  const leftSit = document.querySelector("#hand-left-sit");
  const rightSit = document.querySelector("#hand-right-sit");
  const noBadHandOffset =
    !(leftSit?.getAttribute("transform") || "").match(/translate\(0 [1-9]/) &&
    !(rightSit?.getAttribute("transform") || "").match(/translate\(0 [1-9]/);

  const leftPalm = document.querySelector("#hand-left-sit > path");
  const rightPalm = document.querySelector("#hand-right-sit > path");
  const leftBox = leftPalm?.getBBox?.();
  const rightBox = rightPalm?.getBBox?.();
  const kbBox = document.querySelector("#prop-keyboard")?.getBBox?.();
  const mouseBox = document.querySelector("#prop-mouse")?.getBBox?.();
  const deskTop = document.querySelector("#desk-top");
  const apronEl = document.querySelector("#desk-apron");
  const apron = apronEl?.getBBox?.();
  const leftOnKb =
    leftBox &&
    kbBox &&
    leftBox.y < kbBox.y + kbBox.height &&
    leftBox.y + leftBox.height > kbBox.y &&
    leftBox.x + leftBox.width > kbBox.x &&
    leftBox.x < kbBox.x + kbBox.width &&
    (!apron || leftBox.y + leftBox.height <= apron.y + 2);

  const rightOnMouse =
    rightBox &&
    mouseBox &&
    rightBox.y < mouseBox.y + mouseBox.height &&
    rightBox.y + rightBox.height > mouseBox.y &&
    rightBox.x + rightBox.width > mouseBox.x &&
    rightBox.x < mouseBox.x + mouseBox.width &&
    (!apron || rightBox.y + rightBox.height <= apron.y + 2);

  const stanag = [...document.querySelectorAll("#chest-rig [id^=stanag-]")].map((el) =>
    el.getAttribute("transform"),
  );
  const killa = document.querySelector("#chest-killa-main");
  const killaGroup = document.querySelector("#chest-killa");
  const chestRig = document.querySelector("#chest-rig");
  const coreKids = [...(document.querySelector("#torso-core")?.children || [])].map(
    (el) => el.id || el.tagName,
  );
  const killaIdx = coreKids.indexOf("chest-killa");
  const rigIdx = coreKids.indexOf("chest-rig");
  const killaY = Number(killa?.getAttribute("y") || 0);
  const pouchY = Number(
    (document.querySelector("#stanag-0")?.getAttribute("transform") || "").match(
      /translate\(\s*[\d.]+\s+([\d.]+)/,
    )?.[1] || 0,
  );
  const kb = document.querySelector("#prop-keyboard > rect");
  const molle = document.querySelector("#molle-plate");
  const deskFill = deskTop?.getAttribute("fill") || "";

  return {
    kids,
    orderOk,
    noBadHandOffset,
    leftOnKb: !!leftOnKb,
    rightOnMouse: !!rightOnMouse,
    leftBox: leftBox
      ? { y: +leftBox.y.toFixed(1), bottom: +(leftBox.y + leftBox.height).toFixed(1) }
      : null,
    rightBox: rightBox
      ? { y: +rightBox.y.toFixed(1), bottom: +(rightBox.y + rightBox.height).toFixed(1) }
      : null,
    hasDeskTop: !!deskTop,
    hasApron: !!apronEl,
    stanag,
    stanagCentered: stanag.length === 4 && stanag.every((t) => /translate\(\s*\d+\s+18[68]\)/.test(t || "")),
    killaAbovePouches: killaIdx >= 0 && rigIdx > killaIdx && killaY > 0 && pouchY > killaY,
    killaY: killa?.getAttribute("y"),
    killaSize: killa?.getAttribute("font-size"),
    killaTextLength: killa?.getAttribute("textLength"),
    // Fabric chest patch readable at overlay size, not giant stencil / not covered by pouches
    killaWide: (() => {
      const size = Number(killa?.getAttribute("font-size") || 0);
      const patch = killaGroup?.querySelector("rect");
      const pw = Number(patch?.getAttribute("width") || 0);
      return size >= 8 && size <= 13 && pw >= 40 && pw <= 72;
    })(),
    hasPaddedCollar: !!document.querySelector("#padded-collar"),
    oliveVest: (() => {
      const stops = [...document.querySelectorAll("#armorOlive stop")].map((s) =>
        (s.getAttribute("stop-color") || "").toLowerCase(),
      );
      // Must not be pure gray — olive/khaki channel
      return stops.some((c) => /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/.test(c) && c !== "#2a2a2a");
    })(),
    hasKilla: killa?.textContent === "KILLA",
    hasMolle: !!molle,
    hasVestWear: !!document.querySelector("#vest-wear"),
    deskCharcoal: deskFill.includes("deskTopGrad"),
    kbIsRect: kb?.tagName.toLowerCase() === "rect",
    kbStroke: kb?.getAttribute("stroke"),
    hasMousepad: !!document.querySelector("#prop-mousepad"),
    torsoSit: document.querySelector("#torso-sit")?.getAttribute("transform") || "",
    torsoClip: document.querySelector("#torso-core")?.getAttribute("clip-path") || "",
    torsoScale: document.querySelector("#torso-scale")?.getAttribute("transform") || "",
    torsoScaleVal: (document.querySelector("#torso-scale")?.getAttribute("transform") || "").match(
      /scale\(([\d.]+)\)/,
    )?.[1] || "",
    headScale: document.querySelector("#head-scale")?.getAttribute("transform") || "",
    headSmaller: (() => {
      const t = document.querySelector("#head-scale")?.getAttribute("transform") || "";
      const v = Number((t.match(/scale\(([\d.]+)\)/) || [])[1] || 0);
      const torso = Number(
        (
          (document.querySelector("#torso-scale")?.getAttribute("transform") || "").match(
            /scale\(([\d.]+)\)/,
          ) || []
        )[1] || 0,
      );
      // Heavy wearable Maska — smaller than torso, not mascot-exploding
      return v > 0.7 && v <= 0.86 && torso >= 0.82 && torso <= 0.92 && v <= torso;
    })(),
    headScaleVal: (document.querySelector("#head-scale")?.getAttribute("transform") || "").match(
      /scale\(([\d.]+)\)/,
    )?.[1] || "",
    // Gold/glow desk strip removed — battered olive steel workbench
    noDeskGoldStrip:
      !document.querySelector("#desk-rgb") &&
      !document.querySelector(".desk-led-chase") &&
      !document.querySelector("#desk-led-core"),
    hasDeskBolts: !!document.querySelector("#desk-bolts"),
    hasFrag: !!document.querySelector("#prop-frag"),
    hasPistol: !!document.querySelector("#prop-pistol"),
    hasMouseCable: !!document.querySelector("#mouse-cable"),
    kbAmberOnly: (() => {
      const leds = document.querySelectorAll("#kb-amber-leds .kb-led");
      if (!leds.length) return true;
      return [...leds].every((el) => /c7923a|a87830|6a5020/i.test(el.getAttribute("fill") || ""));
    })(),
    continuousArms: (() => {
      const left = document.querySelector("#arm-left");
      const right = document.querySelector("#arm-right");
      const sleeveL = document.querySelector("#sleeve-left-fill");
      const sleeveR = document.querySelector("#sleeve-right-fill");
      const noForearmOverlay =
        !document.querySelector("#forearm-left") && !document.querySelector("#forearm-right");
      return (
        !!left &&
        !!right &&
        !!document.querySelector("#hand-left-sit")?.contains(left) &&
        !!document.querySelector("#hand-right-sit")?.contains(right) &&
        !!document.querySelector("#hand-left-aim") &&
        !!document.querySelector("#hand-right-aim") &&
        !!left.contains(sleeveL) &&
        !!right.contains(sleeveR) &&
        noForearmOverlay &&
        !document.querySelector("#shoulder-left") &&
        !document.querySelector("#shoulder-right")
      );
    })(),
    helmWhiteMatch: (() => {
      const killa = (document.querySelector("#chest-killa-main")?.getAttribute("fill") || "").toLowerCase();
      const sleeve = (document.querySelector("#sleeve-stripes-left")?.getAttribute("stroke") || "").toLowerCase();
      const helmStripe = (
        document.querySelector("#helm-stripes")?.getAttribute("fill") ||
        document.querySelector("#helm-stripe-c")?.getAttribute("fill") ||
        "#f2ece0"
      ).toLowerCase();
      const cream = (c) => /^#(efe6d2|f2ece0|f5f0e6|f0ebe0|e8e2d4)$/.test(c);
      // KILLA + sleeve + helm stripes share cream/white (literal ref)
      return cream(killa) && cream(sleeve) && (cream(helmStripe) || helmStripe === "");
    })(),
    helmCoversHead: (() => {
      const dome = document.querySelector("#helm-dome");
      const plate = document.querySelector("#helm-faceplate");
      const stripes = document.querySelector("#helm-stripes");
      const slit = document.querySelector("#eye-slit");
      const eyes = document.querySelector("#eyes");
      const bolts = document.querySelector("#helm-bolts");
      const sil = document.querySelector("#helm-silhouette");
      if (!dome || !plate || !stripes || !slit || !eyes || !bolts || !sil) return false;
      // Maska: path dome (NOT circle) + separate thick path plate; ~1w×1.2h
      const domeIsPath = dome.tagName.toLowerCase() === "path";
      const plateIsPath = plate.tagName.toLowerCase() === "path";
      const noSphere = !document.querySelector("#head-scale ellipse#helm-dome");
      const boltCircles = bolts.querySelectorAll("circle").length;
      const stripePaths = stripes.querySelectorAll("path[id^=helm-stripe-]").length;
      const slitOverStripes = !!(stripes.compareDocumentPosition(eyes) & Node.DOCUMENT_POSITION_FOLLOWING);
      const slitH = Number(slit.getAttribute("height") || 0);
      const silBox = sil.getBBox?.();
      const plateBox = plate.getBBox?.();
      const ratio = silBox && silBox.width > 0 ? silBox.height / silBox.width : 0;
      // Target ~1×1.2 — shallow dome, not skinny pill / not sphere
      const proportionOk = ratio >= 1.12 && ratio <= 1.32 && silBox.width >= 68 && silBox.width <= 96;
      const plateProud = !!plateBox && plateBox.height >= silBox.height * 0.55;
      const noCartoonEyes =
        !document.querySelector(".eye-white") && !document.querySelector(".pupil");
      const noMouth =
        !document.querySelector("#mouth-slats") &&
        ((document.querySelector("#mouth-vent")?.getAttribute("opacity") || "1") === "0" ||
          !document.querySelector("#mouth-vent")?.children?.length);
      const plateOpaque = (plate.getAttribute("opacity") || "1") !== "0";
      const uniformScale = !/scale\([^)]+,[^)]+\)/.test(
        document.querySelector("#head-scale")?.getAttribute("transform") || "",
      );
      return (
        domeIsPath &&
        plateIsPath &&
        noSphere &&
        plateOpaque &&
        proportionOk &&
        plateProud &&
        noCartoonEyes &&
        noMouth &&
        uniformScale &&
        boltCircles >= 6 &&
        stripePaths >= 3 &&
        slitOverStripes &&
        slitH > 0 &&
        slitH <= 6
      );
    })(),
    noFingerGlowCss: (() => {
      const css = [...document.styleSheets]
        .map((s) => {
          try {
            return [...(s.cssRules || [])].map((r) => r.cssText).join("\n");
          } catch {
            return "";
          }
        })
        .join("\n");
      // Must not amber the fingers on mouse hold
      return !/#finger-lmb[^\{]*\{[^\}]*c7923a/i.test(css) && !/data-mouse-l="1"[^\{]*#finger-lmb/i.test(css);
    })(),
    fullStripes: (() => {
      const sleeve = document.querySelector("#sleeve-left-fill")?.getAttribute("d") || "";
      const stripe = document.querySelector("#sleeve-stripes-left path")?.getAttribute("d") || "";
      return !!sleeve && stripe === sleeve;
    })(),
    straightArms: (() => {
      const d = document.querySelector("#sleeve-left-fill")?.getAttribute("d") || "";
      // Line segments preferred; reject heavy oval Q-noodle paths
      return d.includes("L") && !/Q\s*\d+\s+\d+\s+\d+\s+\d+\s+Q/i.test(d);
    })(),
    vestRootedShort: (() => {
      const left = document.querySelector("#sleeve-left-fill")?.getAttribute("d") || "";
      const right = document.querySelector("#sleeve-right-fill")?.getAttribute("d") || "";
      const pivotL = document.querySelector("#hand-left-pivot")?.getAttribute("transform") || "";
      const yL = Number((left.match(/M\s*[\d.]+\s+([\d.]+)/) || [])[1] || 0);
      const yR = Number((right.match(/M\s*[\d.]+\s+([\d.]+)/) || [])[1] || 0);
      // Mid-vest roots (below helm ~180); short path ends near wrist ~268
      return (
        yL >= 212 &&
        yL <= 235 &&
        yR >= 212 &&
        yR <= 235 &&
        pivotL.includes("220") &&
        left.includes("268") &&
        right.includes("268")
      );
    })(),
    noPizzaBoxes:
      !document.querySelector("#floor-clutter") &&
      !document.querySelector("#pizza-box-1") &&
      !document.querySelector("#pizza-box-2") &&
      !document.querySelector("#pizza-box-3"),
    glyphsUpsideDown: (() => {
      const label = document.querySelector(".kb-label");
      const num = document.querySelector(".kb-labels-num text");
      const deco = document.querySelector(".kb-deco-label");
      const rot = (el) => {
        if (!el) return false;
        const t = getComputedStyle(el).transform;
        // rotate(180deg) → matrix(-1, 0, 0, -1, …)
        return !!t && t !== "none" && t.startsWith("matrix(-1");
      };
      return rot(label) && rot(num) && rot(deco);
    })(),
    svgPolarAim: (() => {
      // Left aim must use SVG transform attr only. Chromium reports SVG attr via
      // getComputedStyle — so only reject real CSS/inline style transforms.
      const aim = document.querySelector("#hand-left-aim");
      if (!aim) return false;
      const inline = (aim.style?.transform || "").trim();
      const styleAttr = aim.getAttribute("style") || "";
      const hasCssInline = !!inline && inline !== "none";
      const hasStyleTx = /(?:^|;)\s*transform\s*:/.test(styleAttr);
      return !hasCssInline && !hasStyleTx;
    })(),
    skinHands: (() => {
      const p = document.querySelector("#hand-left-sit > path");
      const fill = p?.getAttribute("fill") || "";
      return fill === "#c4a07a" || fill.toLowerCase().includes("c4a07a");
    })(),
  };
});
console.log("meta", JSON.stringify(meta, null, 2));

const box = await page.locator(".avatar-root").boundingBox();
const shot = async (name, clip) => {
  const file = `avatar-proof-${ts}-${name}.png`;
  await page.screenshot({ path: resolve(mediaStore, file), clip, type: "png" });
  await page.screenshot({ path: resolve("_proofs", file), clip, type: "png" });
  console.log("wrote", resolve(mediaStore, file));
  return file;
};

const files = [];

// Silhouette-first proof: plain helm shape only (no stripes/texture/photo)
await page.evaluate(() => {
  const photo = document.querySelector("#helm-photo");
  const detail = document.querySelector("#helm-detail");
  const drawn = document.querySelector("#helm-drawn");
  if (photo) photo.setAttribute("opacity", "0");
  if (detail) detail.setAttribute("opacity", "0");
  if (drawn) drawn.setAttribute("opacity", "1");
  document.documentElement.dataset.proofSilhouette = "1";
});
await page.waitForTimeout(80);
files.push(
  await shot("helm-silhouette", {
    x: box.x + box.width * 0.28,
    y: box.y + box.height * 0.08,
    width: box.width * 0.44,
    height: box.height * 0.42,
  }),
);
// Restore final look (prefer painted asset when present)
await page.evaluate(() => {
  const detail = document.querySelector("#helm-detail");
  if (detail) detail.setAttribute("opacity", "1");
  delete document.documentElement.dataset.proofSilhouette;
  const root = document.querySelector(".avatar-root");
  if (root?.dataset.helmPhoto === "1") {
    const photo = document.querySelector("#helm-photo");
    const drawn = document.querySelector("#helm-drawn");
    if (photo) photo.setAttribute("opacity", "1");
    if (drawn) drawn.setAttribute("opacity", "0");
  }
});
await page.waitForTimeout(80);

files.push(
  await shot("full-sit", {
    x: box.x,
    y: box.y + box.height * 0.02,
    width: box.width,
    height: box.height * 0.98,
  }),
);
files.push(
  await shot("desk-hands-zoom", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.4,
    width: box.width * 0.96,
    height: box.height * 0.52,
  }),
);
files.push(
  await shot("table-surface-zoom", {
    x: box.x + box.width * 0.05,
    y: box.y + box.height * 0.48,
    width: box.width * 0.9,
    height: box.height * 0.42,
  }),
);
files.push(
  await shot("chest-stanag-killa", {
    x: box.x + box.width * 0.12,
    y: box.y + box.height * 0.28,
    width: box.width * 0.76,
    height: box.height * 0.4,
  }),
);
files.push(
  await shot("kb-glyphs", {
    x: box.x + box.width * 0.08,
    y: box.y + box.height * 0.52,
    width: box.width * 0.55,
    height: box.height * 0.28,
  }),
);

// Exact palm landing: rotate lean + residual translate (matches reactiveAvatar)
const aimToSlot = (slotCx, slotCy) => {
  const shoulder = { x: 128, y: 220 };
  const home = { cx: 118, cy: 268 };
  const kbMinX = 64,
    kbMaxX = 214,
    kbMinY = 266,
    kbMaxY = 282;
  const targetCx = Math.min(kbMaxX, Math.max(kbMinX, slotCx));
  const targetCy = Math.min(kbMaxY, Math.max(kbMinY, slotCy - 6));
  const homeAng = Math.atan2(home.cy - shoulder.y, home.cx - shoulder.x);
  const tgtAng = Math.atan2(targetCy - shoulder.y, targetCx - shoulder.x);
  const rotDeg = ((tgtAng - homeAng) * 180) / Math.PI;
  const hx = home.cx - shoulder.x;
  const hy = home.cy - shoulder.y;
  const rad = (rotDeg * Math.PI) / 180;
  const tipX = shoulder.x + hx * Math.cos(rad) - hy * Math.sin(rad);
  const tipY = shoulder.y + hx * Math.sin(rad) + hy * Math.cos(rad);
  const dx = targetCx - tipX;
  const dy = targetCy - tipY;
  return {
    tx: `translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rotDeg.toFixed(2)})`,
    rotDeg,
    dx,
    dy,
    targetCx,
    targetCy,
  };
};

const keyAim = await page.evaluate((aims) => {
  const root = document.querySelector(".avatar-root");
  const aim = document.querySelector("#hand-left-aim");
  if (!root || !aim) return { ok: false };
  const sleeve = document.querySelector("#sleeve-left-fill");
  const sleeveD = sleeve?.getAttribute("d") || "";
  const rootY = Number((sleeveD.match(/M\s*[\d.]+\s+([\d.]+)/) || [])[1] || 0);
  const sleeveInHand = !!document.querySelector("#hand-left-sit #arm-left #sleeve-left-fill");
  const vestRooted = rootY >= 212 && rootY <= 235;

  const applySvg = (tx) => {
    aim.style.transform = "";
    aim.style.transition = "";
    aim.setAttribute("transform", tx);
  };

  applySvg(aims.near.tx);
  const nearTx = aim.getAttribute("transform") || "";
  applySvg(aims.far.tx);
  const farTx = aim.getAttribute("transform") || "";
  const hasTranslate = (t) => t.includes("translate(") && t.includes("rotate(");
  const noScale = (t) => !t.includes("scale(");
  // CSS style.transform must stay empty (SVG attr only). getComputedStyle may mirror SVG matrix — ignore it.
  const noCssTx = !aim.style.transform;
  return {
    ok: sleeveInHand && vestRooted && hasTranslate(nearTx) && hasTranslate(farTx) && noScale(nearTx) && noScale(farTx) && noCssTx,
    nearTx,
    farTx,
    sleeveInHand,
    rootY,
    vestRooted,
    noCssTx,
  };
}, {
  near: aimToSlot(76, 268), // Z / near
  far: aimToSlot(210.5, 273.8), // Ä / far
});
await page.waitForTimeout(120);
files.push(
  await shot("key-aim-arm", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.35,
    width: box.width * 0.96,
    height: box.height * 0.55,
  }),
);
meta.keyAim = keyAim;

// W press (slot 1 @ 81.75,279.5) — CTM-mapped palm on KB near W, not past desk lip
const wPress = await page.evaluate((aimInfo) => {
  const aim = document.querySelector("#hand-left-aim");
  const root = document.querySelector(".avatar-root");
  const svg = document.querySelector(".avatar-root svg");
  if (!aim || !root || !svg) return { ok: false };
  root.dataset.key = "1";
  root.dataset.keySlot = "1";
  aim.style.removeProperty("transform");
  aim.style.removeProperty("transition");
  aim.setAttribute("transform", aimInfo.tx);
  // Force layout so getCTM sees the new SVG transform
  void aim.getBoundingClientRect();
  const palm = document.querySelector("#hand-left-sit > path");
  const kb = document.querySelector("#prop-keyboard");
  const apron = document.querySelector("#desk-apron");
  let onKb = false;
  let nearW = false;
  let palmScreen = null;
  let notPastLip = true;
  if (palm && kb) {
    const bb = palm.getBBox();
    const ctm = palm.getCTM();
    const pt = svg.createSVGPoint();
    pt.x = bb.x + bb.width / 2;
    pt.y = bb.y + bb.height / 2;
    const sp = pt.matrixTransform(ctm);
    palmScreen = { x: +sp.x.toFixed(1), y: +sp.y.toFixed(1) };
    const kbb = kb.getBBox();
    const kctm = kb.getCTM();
    const corners = [
      [kbb.x, kbb.y],
      [kbb.x + kbb.width, kbb.y],
      [kbb.x, kbb.y + kbb.height],
      [kbb.x + kbb.width, kbb.y + kbb.height],
    ].map(([x, y]) => {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      return p.matrixTransform(kctm);
    });
    const minX = Math.min(...corners.map((c) => c.x));
    const maxX = Math.max(...corners.map((c) => c.x));
    const minY = Math.min(...corners.map((c) => c.y));
    const maxY = Math.max(...corners.map((c) => c.y));
    onKb = sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY;
    // Palm near W target in pre-scale user space (viewBox is ×3)
    const localX = sp.x / 3;
    const localY = sp.y / 3;
    nearW = Math.hypot(localX - aimInfo.targetCx, localY - aimInfo.targetCy) < 14;
    if (apron) {
      const abb = apron.getBBox();
      const actm = apron.getCTM();
      const ap = svg.createSVGPoint();
      ap.x = abb.x;
      ap.y = abb.y;
      const as = ap.matrixTransform(actm);
      notPastLip = sp.y <= as.y + 6;
    }
  }
  const noCssTx = !aim.style.transform;
  const tx = aim.getAttribute("transform") || "";
  return {
    ok: onKb && nearW && notPastLip && noCssTx && tx.includes("translate(") && !tx.includes("scale("),
    onKb,
    nearW,
    notPastLip,
    noCssTx,
    tx,
    palmScreen,
    target: { x: aimInfo.targetCx, y: aimInfo.targetCy },
  };
}, aimToSlot(81.75, 279.5));
await page.waitForTimeout(160);
files.push(
  await shot("w-key-on-desk", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.4,
    width: box.width * 0.7,
    height: box.height * 0.45,
  }),
);
meta.wPress = wPress;

// Near-slot (Shift/Z) stays on KB
const nearPress = await page.evaluate((aimInfo) => {
  const aim = document.querySelector("#hand-left-aim");
  const root = document.querySelector(".avatar-root");
  if (!aim || !root) return { ok: false };
  root.dataset.key = "1";
  root.dataset.keySlot = "22";
  aim.style.transform = "";
  aim.setAttribute("transform", aimInfo.tx);
  // Use CTM-mapped palm center — getBBox ignores ancestor transforms
  const palm = document.querySelector("#hand-left-sit > path");
  const svg = document.querySelector(".avatar-root svg");
  const kb = document.querySelector("#prop-keyboard");
  let onKb = false;
  let palmScreen = null;
  if (palm && svg && kb) {
    const bb = palm.getBBox();
    const ctm = palm.getCTM();
    const pt = svg.createSVGPoint();
    pt.x = bb.x + bb.width / 2;
    pt.y = bb.y + bb.height / 2;
    const sp = pt.matrixTransform(ctm);
    palmScreen = { x: +sp.x.toFixed(1), y: +sp.y.toFixed(1) };
    const kbb = kb.getBBox();
    const kctm = kb.getCTM();
    const corners = [
      [kbb.x, kbb.y],
      [kbb.x + kbb.width, kbb.y],
      [kbb.x, kbb.y + kbb.height],
      [kbb.x + kbb.width, kbb.y + kbb.height],
    ].map(([x, y]) => {
      const p = svg.createSVGPoint();
      p.x = x;
      p.y = y;
      return p.matrixTransform(kctm);
    });
    const minX = Math.min(...corners.map((c) => c.x));
    const maxX = Math.max(...corners.map((c) => c.x));
    const minY = Math.min(...corners.map((c) => c.y));
    const maxY = Math.max(...corners.map((c) => c.y));
    onKb = sp.x >= minX && sp.x <= maxX && sp.y >= minY && sp.y <= maxY;
  }
  return {
    ok: onKb && !String(aim.getAttribute("transform")).includes("scale("),
    onKb,
    tx: aim.getAttribute("transform"),
    palmScreen,
    target: { x: aimInfo.targetCx, y: aimInfo.targetCy },
  };
}, aimToSlot(76, 268));
await page.waitForTimeout(120);
files.push(
  await shot("near-key-reach", {
    x: box.x + box.width * 0.02,
    y: box.y + box.height * 0.4,
    width: box.width * 0.7,
    height: box.height * 0.45,
  }),
);
meta.nearPress = nearPress;

// LMB: button amber + overlay visible; fingers stay skin (no hand glow)
const mouseLmb = await page.evaluate(() => {
  const root = document.querySelector(".avatar-root");
  const outer = document.querySelector("#hand-right");
  const aim = document.querySelector("#hand-right-aim");
  const sleeve = document.querySelector("#hand-right-sit #sleeve-right-fill");
  const lmb = document.querySelector("#mouse-lmb");
  const overlay = document.querySelector("#mouse-lmb-overlay");
  const finger = document.querySelector("#finger-lmb");
  if (!root || !outer || !aim || !sleeve || !lmb || !overlay || !finger) return { ok: false };
  root.setAttribute("data-lights", "1");
  root.setAttribute("data-mouse-r", "0");
  root.setAttribute("data-mouse-l", "1");
  root.setAttribute("data-mouse-l-pulse", "1");
  overlay.setAttribute("fill-opacity", "1");
  overlay.style.setProperty("fill-opacity", "1", "important");
  lmb.setAttribute("fill", "#c7923a");
  lmb.style.setProperty("fill", "#c7923a", "important");
  finger.style.setProperty("fill", "#b89068", "important");
  const csOuter = getComputedStyle(outer).transform;
  const csAim = getComputedStyle(aim).transform;
  const fingerFill = getComputedStyle(finger).fill || "";
  const lmbFill = getComputedStyle(lmb).fill || lmb.getAttribute("fill") || "";
  const overOp =
    overlay.style.fillOpacity ||
    overlay.getAttribute("fill-opacity") ||
    getComputedStyle(overlay).fillOpacity;
  const amber = (s) => /c7923a|199,\s*146,\s*58/i.test(String(s));
  const skin = (s) => /b89068|184,\s*144,\s*104/i.test(String(s));
  const outerIdle = !csOuter || csOuter === "none";
  const aimMoving = !!csAim && csAim !== "none";
  const stillContinuous = !!document.querySelector("#hand-right-sit")?.contains(sleeve);
  const overlayOn = Number(overOp) > 0.5;
  // Overlay on top of hand is the visible button shine; fingers must stay skin
  return {
    ok: outerIdle && aimMoving && stillContinuous && skin(fingerFill) && overlayOn,
    outerIdle,
    aimMoving,
    stillContinuous,
    fingerFill,
    lmbFill,
    overlayOn,
    buttonAmber: amber(lmbFill) || overlayOn,
    csAim,
  };
});
await page.waitForTimeout(140);
files.push(
  await shot("mouse-lmb-amber", {
    x: box.x + box.width * 0.45,
    y: box.y + box.height * 0.42,
    width: box.width * 0.5,
    height: box.height * 0.45,
  }),
);
meta.mouseLmb = mouseLmb;

const mouseRmb = await page.evaluate(() => {
  const root = document.querySelector(".avatar-root");
  const rmb = document.querySelector("#mouse-rmb");
  const overlay = document.querySelector("#mouse-rmb-overlay");
  const finger = document.querySelector("#finger-rmb");
  if (!root || !rmb || !overlay || !finger) return { ok: false };
  root.setAttribute("data-mouse-l", "0");
  root.removeAttribute("data-mouse-l-pulse");
  root.setAttribute("data-mouse-r", "1");
  root.setAttribute("data-mouse-r-pulse", "1");
  overlay.setAttribute("fill-opacity", "1");
  overlay.style.setProperty("fill-opacity", "1", "important");
  rmb.setAttribute("fill", "#c7923a");
  rmb.style.setProperty("fill", "#c7923a", "important");
  finger.style.setProperty("fill", "#b89068", "important");
  const fingerFill = getComputedStyle(finger).fill || "";
  const rmbFill = getComputedStyle(rmb).fill || rmb.getAttribute("fill") || "";
  const overOp =
    overlay.style.fillOpacity ||
    overlay.getAttribute("fill-opacity") ||
    getComputedStyle(overlay).fillOpacity;
  const amber = (s) => /c7923a|199,\s*146,\s*58/i.test(String(s));
  const skin = (s) => /b89068|184,\s*144,\s*104/i.test(String(s));
  const overlayOn = Number(overOp) > 0.5;
  return {
    ok: skin(fingerFill) && overlayOn,
    fingerFill,
    rmbFill,
    overlayOn,
    buttonAmber: amber(rmbFill) || overlayOn,
  };
});
await page.waitForTimeout(120);
files.push(
  await shot("mouse-rmb-amber", {
    x: box.x + box.width * 0.45,
    y: box.y + box.height * 0.42,
    width: box.width * 0.5,
    height: box.height * 0.45,
  }),
);
meta.mouseRmb = mouseRmb;

// Helm coverage close-up
files.push(
  await shot("helm-coverage", {
    x: box.x + box.width * 0.22,
    y: box.y + box.height * 0.08,
    width: box.width * 0.56,
    height: box.height * 0.42,
  }),
);

meta.mousePress = mouseLmb;

await browser.close();

const pass =
  meta.orderOk &&
  meta.noBadHandOffset &&
  meta.leftOnKb &&
  meta.rightOnMouse &&
  meta.hasDeskTop &&
  meta.hasApron &&
  meta.stanagCentered &&
  meta.killaAbovePouches &&
  meta.killaWide &&
  meta.hasKilla &&
  meta.hasMolle &&
  meta.hasVestWear &&
  meta.hasPaddedCollar &&
  meta.oliveVest &&
  meta.kbIsRect &&
  meta.kbStroke === "#4a4a4a" &&
  meta.hasMousepad &&
  String(meta.torsoClip).includes("torso-above-desk") &&
  Number(meta.torsoScaleVal) > 0.85 &&
  Number(meta.torsoScaleVal) < 0.96 &&
  meta.headSmaller &&
  meta.noDeskGoldStrip &&
  meta.hasDeskBolts &&
  meta.hasFrag &&
  meta.hasPistol &&
  meta.hasMouseCable &&
  meta.kbAmberOnly &&
  meta.continuousArms &&
  meta.helmWhiteMatch &&
  meta.helmCoversHead &&
  meta.noFingerGlowCss &&
  meta.fullStripes &&
  meta.straightArms &&
  meta.vestRootedShort &&
  meta.noPizzaBoxes &&
  meta.glyphsUpsideDown &&
  meta.svgPolarAim &&
  meta.skinHands &&
  meta.keyAim?.ok &&
  meta.wPress?.ok &&
  meta.nearPress?.ok &&
  meta.mouseLmb?.ok &&
  meta.mouseRmb?.ok;

const note = { ts, pass, meta, files };
writeFileSync(resolve(mediaStore, `avatar-proof-${ts}-hands-desk-fix-note.json`), JSON.stringify(note, null, 2));
writeFileSync(resolve("_proofs", `avatar-proof-${ts}-hands-desk-fix-note.json`), JSON.stringify(note, null, 2));
console.log(
  pass ? "PROOF_OK" : "PROOF_FAIL",
  JSON.stringify({
    pass,
    orderOk: meta.orderOk,
    leftOnKb: meta.leftOnKb,
    rightOnMouse: meta.rightOnMouse,
    killaAbovePouches: meta.killaAbovePouches,
    hasPaddedCollar: meta.hasPaddedCollar,
    oliveVest: meta.oliveVest,
    headSmaller: meta.headSmaller,
    headScaleVal: meta.headScaleVal,
    torsoScaleVal: meta.torsoScaleVal,
    continuousArms: meta.continuousArms,
    helmWhiteMatch: meta.helmWhiteMatch,
    helmCoversHead: meta.helmCoversHead,
    noFingerGlowCss: meta.noFingerGlowCss,
    fullStripes: meta.fullStripes,
    straightArms: meta.straightArms,
    vestRootedShort: meta.vestRootedShort,
    noPizzaBoxes: meta.noPizzaBoxes,
    glyphsUpsideDown: meta.glyphsUpsideDown,
    svgPolarAim: meta.svgPolarAim,
    keyAim: meta.keyAim,
    wPress: meta.wPress,
    nearPress: meta.nearPress,
    mouseLmb: meta.mouseLmb,
    mouseRmb: meta.mouseRmb,
    noDeskGoldStrip: meta.noDeskGoldStrip,
    hasFrag: meta.hasFrag,
    hasPistol: meta.hasPistol,
    skinHands: meta.skinHands,
  }),
);
process.exit(pass ? 0 : 1);
