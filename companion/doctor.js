import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

console.log("platform:", process.platform);
console.log("node:", process.version);
console.log("token file:", existsSync(resolve(ROOT, "data/local-token.txt")) ? "present" : "missing");
console.log("uiohook-napi:", existsSync(resolve(__dirname, "node_modules/uiohook-napi")) ? "installed" : "not installed");

if (process.platform === "win32") {
  try {
    const pkg = JSON.parse(
      readFileSync(resolve(__dirname, "node_modules/uiohook-napi/package.json"), "utf8"),
    );
    console.log("uiohook-napi version:", pkg.version);
  } catch {
    console.log("Install with: npm install (inside companion/)");
  }
} else {
  console.log("Note: global capture is Windows-oriented; protocol tests run everywhere.");
}
