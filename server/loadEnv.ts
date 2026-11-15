import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Load KEY=VALUE lines into process.env without overwriting existing vars.
 * Used for local Streamlabs token (.env.local) — never sent to the browser.
 */
export function loadEnvFiles(root: string, files = [".env.local", ".env"]): void {
  for (const name of files) {
    const path = join(root, name);
    if (!existsSync(path)) continue;
    let text: string;
    try {
      text = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      if (process.env[key] != null && process.env[key] !== "") continue;
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}
