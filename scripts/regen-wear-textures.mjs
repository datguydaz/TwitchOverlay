import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";
const out = resolve("web/public/textures/bunker");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function make(name, w, h, paint) {
  const dataUrl = await page.evaluate(({ w, h, paint }) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    new Function("ctx", "w", "h", paint)(ctx, w, h);
    return c.toDataURL("image/png");
  }, { w, h, paint });
  writeFileSync(resolve(out, name), Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log("wrote", name);
}

// Surface-bound wear: soft grime, edge chips, water stains, scratches — NO polygons
await make("flaking-wear.png", 512, 256, `
  ctx.clearRect(0,0,w,h);
  // soft grime clouds along edges
  for (let i=0;i<10;i++){
    const edge = i%4;
    let x,y;
    if(edge===0){x=Math.random()*w;y=Math.random()*28;}
    else if(edge===1){x=Math.random()*w;y=h-10-Math.random()*30;}
    else if(edge===2){x=Math.random()*24;y=Math.random()*h;}
    else {x=w-10-Math.random()*28;y=Math.random()*h;}
    const r=18+Math.random()*50;
    const g=ctx.createRadialGradient(x,y,1,x,y,r);
    g.addColorStop(0,'rgba(20,18,14,'+(0.35+Math.random()*0.35)+')');
    g.addColorStop(1,'rgba(20,18,14,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill();
  }
  // faint water stains (soft vertical ellipses)
  for (let i=0;i<6;i++){
    const x=40+Math.random()*(w-80), y=Math.random()*h*0.4;
    const g=ctx.createRadialGradient(x,y,2,x,y+40,12+Math.random()*18);
    g.addColorStop(0,'rgba(85,81,73,0.22)');
    g.addColorStop(1,'rgba(85,81,73,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(x,y+30,6+Math.random()*8,40+Math.random()*50,0,0,6.28); ctx.fill();
  }
  // varied soft scratches (thin lines, not dashed spam)
  for (let i=0;i<9;i++){
    ctx.strokeStyle='rgba(200,191,168,'+(0.06+Math.random()*0.12)+')';
    ctx.lineWidth=0.8+Math.random()*1.4;
    ctx.beginPath();
    const x=Math.random()*w, y=20+Math.random()*(h-40);
    const len=30+Math.random()*90;
    ctx.moveTo(x,y);
    ctx.lineTo(x+len,y+(Math.random()-0.5)*8);
    ctx.stroke();
  }
  // edge chips as soft dark bites (no hard polygons)
  for (let i=0;i<7;i++){
    const top=Math.random()<0.5;
    const x=30+Math.random()*(w-60);
    const y=top?2:h-4;
    const g=ctx.createRadialGradient(x,y,0.5,x,y,8+Math.random()*10);
    g.addColorStop(0,'rgba(8,8,7,0.85)');
    g.addColorStop(1,'rgba(8,8,7,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,12,0,6.28); ctx.fill();
  }
`);

// Corrosion: soft blotches only (keep but soften if polygonal)
await make("corrosion.png", 256, 256, `
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<16;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const r=10+Math.random()*32;
    const g=ctx.createRadialGradient(x,y,1,x,y,r);
    g.addColorStop(0,'rgba(86,52,38,'+(0.4+Math.random()*0.35)+')');
    g.addColorStop(0.6,'rgba(86,52,38,0.15)');
    g.addColorStop(1,'rgba(86,52,38,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill();
  }
`);

await browser.close();
console.log("wear textures regenerated");
