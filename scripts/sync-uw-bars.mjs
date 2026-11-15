import { readFileSync, writeFileSync } from "fs";
const full = readFileSync("web/ultrawide.html","utf8");
const headFonts = full.match(/<link rel="preconnect"[\s\S]*?ultrawide\.css" \/>/)[0];
const topBar = full.match(/<div class="uw-bar uw-bar-top"[\s\S]*?<\/div>\s*<div class="uw-bar uw-bar-bottom"/)[0].replace(/\s*<div class="uw-bar uw-bar-bottom"/,"");
const botBar = full.match(/<div class="uw-bar uw-bar-bottom"[\s\S]*?<\/div>\s*<\/div>\s*<script/)[0].replace(/\s*<\/div>\s*<script/,"");

const top = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ultrawide Top Bar</title>
    ${headFonts}
  </head>
  <body class="uw-bar-only" data-uw-mode="top">
    <div id="uw-stage" data-atm="on" data-vfx="on" data-text-fx="on">
      ${topBar}
    </div>
    <script type="module" src="/src/pages/ultrawide.ts"><\/script>
  </body>
</html>
`;
const bottom = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ultrawide Bottom Bar</title>
    ${headFonts}
  </head>
  <body class="uw-bar-only" data-uw-mode="bottom">
    <div id="uw-stage" data-atm="on" data-vfx="on" data-text-fx="on">
      ${botBar}
    </div>
    <script type="module" src="/src/pages/ultrawide.ts"><\/script>
  </body>
</html>
`;
writeFileSync("web/ultrawide-top.html", top);
writeFileSync("web/ultrawide-bottom.html", bottom);
console.log("synced top/bottom");
