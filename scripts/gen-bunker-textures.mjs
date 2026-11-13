import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

const out = resolve("web/public/textures/bunker");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function make(name, w, h, paint) {
  const dataUrl = await page.evaluate(({ w, h, paint }) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    const fn = new Function("ctx", "w", "h", paint);
    fn(ctx, w, h);
    return c.toDataURL("image/png");
  }, { w, h, paint });
  const b64 = dataUrl.split(",")[1];
  writeFileSync(resolve(out, name), Buffer.from(b64, "base64"));
  console.log("wrote", name, w + "x" + h);
}

// soot plate — dark noise + blotches
await make("soot-plate.png", 512, 256, `
  const img = ctx.createImageData(w,h);
  for (let i=0;i<img.data.length;i+=4){
    const n = (Math.random()*40)|0;
    const v = 12 + n;
    img.data[i]=v; img.data[i+1]=v-1; img.data[i+2]=v-2; img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  ctx.globalCompositeOperation='multiply';
  for (let i=0;i<18;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const g=ctx.createRadialGradient(x,y,2,x,y,40+Math.random()*80);
    g.addColorStop(0,'rgba(0,0,0,0.85)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,120,0,6.28); ctx.fill();
  }
  ctx.globalCompositeOperation='source-over';
  for (let i=0;i<8;i++){
    ctx.strokeStyle='rgba(86,52,38,'+(0.15+Math.random()*0.25)+')';
    ctx.lineWidth=2+Math.random()*4;
    ctx.beginPath();
    const x=Math.random()*w; let y=-10;
    ctx.moveTo(x,y);
    while(y<h+20){ y+=8+Math.random()*18; ctx.lineTo(x+(Math.random()-0.5)*14,y); }
    ctx.stroke();
  }
`);

// metal grain charcoal
await make("metal-grain.png", 512, 256, `
  const img=ctx.createImageData(w,h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const i=(y*w+x)*4;
      const band=((x*0.15+y*0.02)|0)%7===0?8:0;
      const n=(Math.random()*28)|0;
      const v=28+n+band;
      img.data[i]=v; img.data[i+1]=v-1; img.data[i+2]=v-3; img.data[i+3]=255;
    }
  }
  ctx.putImageData(img,0,0);
  ctx.fillStyle='rgba(85,81,73,0.12)';
  for(let i=0;i<12;i++){
    ctx.fillRect(Math.random()*w, Math.random()*h, 40+Math.random()*90, 3+Math.random()*8);
  }
`);

// flaking paint / wear patches (transparent PNG)
await make("flaking-wear.png", 512, 256, `
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<14;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const rw=30+Math.random()*90, rh=12+Math.random()*40;
    ctx.fillStyle='rgba(200,191,168,'+(0.08+Math.random()*0.18)+')';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+rw*(0.3+Math.random()*0.4), y-rh*0.2);
    ctx.lineTo(x+rw, y+rh*0.3);
    ctx.lineTo(x+rw*0.7, y+rh);
    ctx.lineTo(x+rw*0.1, y+rh*0.8);
    ctx.closePath(); ctx.fill();
  }
  for(let i=0;i<10;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const g=ctx.createRadialGradient(x,y,1,x,y,20+Math.random()*40);
    g.addColorStop(0,'rgba(17,17,16,0.9)');
    g.addColorStop(1,'rgba(17,17,16,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,50,0,6.28); ctx.fill();
  }
`);

// corrosion blotches transparent
await make("corrosion.png", 256, 256, `
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<20;i++){
    const x=Math.random()*w, y=Math.random()*h;
    const r=8+Math.random()*36;
    const g=ctx.createRadialGradient(x,y,1,x,y,r);
    g.addColorStop(0,'rgba(86,52,38,'+(0.45+Math.random()*0.4)+')');
    g.addColorStop(0.55,'rgba(86,52,38,0.2)');
    g.addColorStop(1,'rgba(86,52,38,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,6.28); ctx.fill();
  }
`);

// water streaks
await make("water-streaks.png", 256, 512, `
  ctx.clearRect(0,0,w,h);
  for(let i=0;i<16;i++){
    const x=20+Math.random()*(w-40);
    ctx.strokeStyle='rgba(85,81,73,'+(0.12+Math.random()*0.22)+')';
    ctx.lineWidth=1+Math.random()*2.5;
    ctx.beginPath();
    let y=0; ctx.moveTo(x,y);
    while(y<h){ y+=10+Math.random()*24; ctx.lineTo(x+(Math.random()-0.5)*6,y); }
    ctx.stroke();
  }
  for(let i=0;i<6;i++){
    const x=Math.random()*w, y=Math.random()*h*0.3;
    const g=ctx.createRadialGradient(x,y,1,x,y,18);
    g.addColorStop(0,'rgba(17,17,16,0.55)');
    g.addColorStop(1,'rgba(17,17,16,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,18,0,6.28); ctx.fill();
  }
`);

// soot vent darkening
await make("soot-vent.png", 256, 128, `
  ctx.clearRect(0,0,w,h);
  const g=ctx.createRadialGradient(w*0.5,h*0.6,4,w*0.5,h*0.4,90);
  g.addColorStop(0,'rgba(8,8,7,0.95)');
  g.addColorStop(0.5,'rgba(17,17,16,0.55)');
  g.addColorStop(1,'rgba(17,17,16,0)');
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<30;i++){
    ctx.fillStyle='rgba(0,0,0,'+(0.2+Math.random()*0.4)+')';
    ctx.fillRect(Math.random()*w, Math.random()*h, 1+Math.random()*3, 1+Math.random()*2);
  }
`);

await browser.close();
console.log("textures ready");
