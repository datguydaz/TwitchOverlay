import { chromium } from "playwright";

async function probe(path) {
  const browser = await chromium.launch({ headless: true });
  const page = await (
    await browser.newContext({ viewport: { width: 1720, height: 760 } })
  ).newPage();
  const url = `http://127.0.0.1:8787${path}?diag=${Date.now()}`;
  const res = await page.goto(url, { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  const cssHrefs = await page.$$eval("link[rel=stylesheet]", (els) => els.map((e) => e.href));
  await page.evaluate(() => {
    document.getElementById("uw-follower-name").textContent = "RYSEABOVEIT";
    document.getElementById("uw-subscriber-name").textContent = "ACTYR:[6]";
  });
  await page.waitForTimeout(250);
  const dump = await page.evaluate(() => {
    const stage = document.getElementById("uw-stage");
    const scale = stage.getBoundingClientRect().width / stage.offsetWidth;
    const meas = (id) => {
      const el = document.getElementById(id);
      const well = el.querySelector(".uw-glass-well");
      const name = el.querySelector(".uw-glass-name");
      const slot = el.parentElement;
      const rg = document.createRange();
      rg.selectNodeContents(name);
      const g = rg.getBoundingClientRect();
      const wcs = getComputedStyle(well);
      const ncs = getComputedStyle(name);
      const rcs = getComputedStyle(el);
      return {
        name: name.textContent,
        wellDesignW: well.offsetWidth,
        wellVisualW: Math.round(well.getBoundingClientRect().width),
        glyphVisualW: Math.round(g.width),
        glyphDesignW: Math.round(g.width / scale),
        padDesign:
          id === "uw-follower"
            ? Math.round(well.getBoundingClientRect().right / scale - g.right / scale)
            : Math.round(g.left / scale - well.getBoundingClientRect().left / scale),
        wellCssW: wcs.width,
        wellMin: wcs.minWidth,
        wellMax: wcs.maxWidth,
        nameCssW: ncs.width,
        readoutCssW: rcs.width,
        readoutMax: rcs.maxWidth,
        slotDesignW: slot.offsetWidth,
        ratio: +(well.offsetWidth / slot.offsetWidth).toFixed(3),
      };
    };
    let hugRule = false;
    for (const ss of document.styleSheets) {
      try {
        for (const r of ss.cssRules) {
          if (
            r.selectorText?.includes("uw-glass-well") &&
            r.cssText?.includes("max-content")
          ) {
            hugRule = true;
          }
        }
      } catch {
        /* cross-origin */
      }
    }
    return {
      scale,
      hugRule,
      fol: meas("uw-follower"),
      sub: meas("uw-subscriber"),
      deltaWellDesign: null,
    };
  });
  dump.deltaWellDesign = dump.fol.wellDesignW - dump.sub.wellDesignW;
  console.log("\n===", path, "status", res.status(), "===");
  console.log(
    "css",
    cssHrefs.filter((h) => /ultrawide|zone\.css/.test(h)),
  );
  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
  return dump;
}

const a = await probe("/ultrawide.html");
const b = await probe("/ultrawide-top.html");
console.log(
  "\nSUMMARY ultrawide.html delta",
  a.deltaWellDesign,
  "top delta",
  b.deltaWellDesign,
  "hug",
  a.hugRule,
  b.hugRule,
);
