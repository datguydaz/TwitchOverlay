import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await (
  await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 })
).newPage();
await page.goto("http://127.0.0.1:8787/avatar.html", { waitUntil: "networkidle" });
await page.reload({ waitUntil: "networkidle" });
await page.addStyleTag({
  content:
    "#idle-breath,#vest-front-breath,#idle-head{animation:none!important;transform:none!important}",
});
await page.waitForTimeout(200);

const report = await page.evaluate(() => {
  const svg = document.querySelector("svg");
  const left = document.getElementById("sleeve-left-fill");
  const right = document.getElementById("sleeve-right-fill");
  const vest = document.getElementById("plate-carrier") || document.querySelector("#vest-front path");

  function inFill(el, x, y) {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    return el.isPointInFill(p);
  }

  // Vest edges in SCREEN space then convert? Better: sample plate-carrier getBBox in its local space is wrong due to transforms.
  // Use screen rects and convert via inverse CTM of avatar-draw / svg.
  const vestR = document.getElementById("plate-carrier").getBoundingClientRect();
  const leftR = left.getBoundingClientRect();
  const rightR = right.getBoundingClientRect();

  // Convert screen -> SVG user (pre-scale avatar-draw is scale(3), paths in 400 space)
  const draw = document.getElementById("avatar-draw");
  const ctm = draw.getScreenCTM().inverse();
  function toLocal(sx, sy) {
    const p = svg.createSVGPoint();
    p.x = sx;
    p.y = sy;
    const l = p.matrixTransform(ctm);
    return { x: l.x, y: l.y };
  }
  const vestLocal = {
    left: toLocal(vestR.left, vestR.top + vestR.height * 0.25),
    right: toLocal(vestR.right, vestR.top + vestR.height * 0.25),
    top: toLocal(vestR.left + vestR.width / 2, vestR.top),
    box: {
      L: toLocal(vestR.left, vestR.top),
      R: toLocal(vestR.right, vestR.bottom),
    },
  };

  // At each y in local sleeve space, find sleeve body-side and vest olive edge via screen scan
  const rows = [];
  for (const y of [164, 170, 178, 188, 198, 208, 218, 228]) {
    // sleeve left: body side = max x in fill
    let lMin = null,
      lMax = null;
    let rMin = null,
      rMax = null;
    for (let x = 60; x <= 340; x += 1) {
      if (inFill(left, x, y)) {
        if (lMin === null) lMin = x;
        lMax = x;
      }
      if (inFill(right, x, y)) {
        if (rMin === null) rMin = x;
        rMax = x;
      }
    }
    // vest edge at this y: convert local y to screen, scan for olive
    // Approximate: use plate-carrier path isPointInFill in its own space — hard.
    // Screen scan at the CSS y corresponding to local (x=200,y)
    const mid = toLocal(0, 0); // dummy
    const p = svg.createSVGPoint();
    p.x = 200;
    p.y = y;
    const screenY = p.matrixTransform(draw.getScreenCTM()).y;
    // scan from left for olive-ish pixels via elementFromPoint hitting plate-carrier
    let vestLeftScreen = null,
      vestRightScreen = null;
    for (let sx = vestR.left - 40; sx <= vestR.right + 40; sx += 1) {
      const el = document.elementFromPoint(sx, screenY);
      const hit =
        el &&
        (el.id === "plate-carrier" ||
          el.closest?.("#vest-front") ||
          (el.getAttribute?.("fill") || "").includes("armor") ||
          el.parentElement?.id === "vest-front");
      // olive fill is url(#armorOlive) on plate-carrier
      const isVest =
        el &&
        (el.id === "plate-carrier" ||
          (el.tagName === "path" && el.closest("#vest-front") && el.id !== "sleeve-left-fill"));
      if (isVest) {
        if (vestLeftScreen === null) vestLeftScreen = sx;
        vestRightScreen = sx;
      }
    }
    const vestLeftLocal = vestLeftScreen != null ? toLocal(vestLeftScreen, screenY).x : null;
    const vestRightLocal = vestRightScreen != null ? toLocal(vestRightScreen, screenY).x : null;

    const leftGap =
      lMax != null && vestLeftLocal != null ? +(vestLeftLocal - lMax).toFixed(2) : null;
    // positive leftGap = sleeve body ends LEFT of vest edge = GREY CORRIDOR
    // negative = sleeve underlaps vest
    const rightUnder =
      rMin != null && vestRightLocal != null ? +(rMin - vestRightLocal).toFixed(2) : null;
    // negative rightUnder = sleeve starts LEFT of vest right edge = underlap depth
    // mouse underlap depth = vestRight - rMin when rMin < vestRight

    rows.push({
      y,
      lMin,
      lMax,
      rMin,
      rMax,
      vestLeftLocal: vestLeftLocal != null ? +vestLeftLocal.toFixed(2) : null,
      vestRightLocal: vestRightLocal != null ? +vestRightLocal.toFixed(2) : null,
      leftGapVsVest: leftGap,
      rightUnderlap: rightUnder != null && vestRightLocal != null && rMin != null ? +(vestRightLocal - rMin).toFixed(2) : null,
      // underlap positive when sleeve extends past vest edge toward center
    });
  }

  return {
    vestScreen: { x: vestR.x, y: vestR.y, w: vestR.width, h: vestR.height },
    leftScreen: { x: leftR.x, y: leftR.y, w: leftR.width, h: leftR.height },
    rightScreen: { x: rightR.x, y: rightR.y, w: rightR.width, h: rightR.height },
    vestLocal,
    leftD: left.getAttribute("d"),
    rightD: right.getAttribute("d"),
    rows,
  };
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
