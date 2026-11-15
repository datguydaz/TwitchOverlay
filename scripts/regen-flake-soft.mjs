import { chromium } from "playwright";
import { writeFileSync, statSync } from "fs";
import { resolve } from "path";
const out = resolve("web/public/textures/bunker/flaking-wear.png");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const dataUrl = await page.evaluate(() => {
  const w=512,h=256;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  ctx.clearRect(0,0,w,h);
  // soft edge grime only — radial blobs, no paths/lines/polygons
  const blobs=[
    [0,0,80],[40,8,55],[120,4,70],[220,6,50],[340,10,90],[450,0,70],[500,20,60],
    [10,240,70],[80,250,55],[200,248,80],[320,252,60],[420,245,75],[500,250,65],
    [0,80,50],[0,160,60],[512,90,55],[512,180,70],
    [160,40,45],[280,200,50],[380,120,40]
  ];
  for (const [x,y,r] of blobs){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,"rgba(14,13,11,0.55)");
    g.addColorStop(0.55,"rgba(14,13,11,0.18)");
    g.addColorStop(1,"rgba(14,13,11,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
  }
  // soft water stains
  for (const [x,y] of [[90,30],[210,20],[360,40],[450,25]]){
    const g=ctx.createRadialGradient(x,y,2,x,y+50,16);
    g.addColorStop(0,"rgba(60,56,50,0.2)");
    g.addColorStop(1,"rgba(60,56,50,0)");
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y+40,7,48,0,0,Math.PI*2); ctx.fill();
  }
  return c.toDataURL("image/png");
});
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log("rewrote", out, statSync(out).size);
await browser.close();
