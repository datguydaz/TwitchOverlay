/**
 * Local custom event sounds under data/sounds/ (gitignored uploads).
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  readdirSync,
} from "node:fs";
import { join, extname, basename } from "node:path";
import { randomBytes } from "node:crypto";

export const MAX_SOUND_BYTES = 2 * 1024 * 1024;

const ALLOWED_EXT = new Set([".mp3", ".wav", ".ogg", ".webm", ".m4a"]);
const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".m4a": "audio/mp4",
};

export type SoundMeta = {
  id: string;
  name: string;
  filename: string;
  mime: string;
  bytes: number;
  createdAt: number;
};

type Manifest = { sounds: SoundMeta[] };

function safeExt(name: string, mime: string): string {
  const fromName = extname(name).toLowerCase();
  if (ALLOWED_EXT.has(fromName)) return fromName;
  const m = (mime || "").toLowerCase();
  if (m.includes("mpeg") || m.includes("mp3")) return ".mp3";
  if (m.includes("wav")) return ".wav";
  if (m.includes("ogg")) return ".ogg";
  if (m.includes("webm")) return ".webm";
  if (m.includes("mp4") || m.includes("m4a")) return ".m4a";
  return "";
}

function displayName(raw: string): string {
  const base = basename(String(raw || "sound")).replace(/[^\w.\- ()[\]]+/g, "_");
  return base.slice(0, 80) || "sound";
}

export class SoundsStore {
  private readonly dir: string;
  private readonly manifestPath: string;

  constructor(dataDir: string) {
    this.dir = join(dataDir, "sounds");
    this.manifestPath = join(this.dir, "manifest.json");
    mkdirSync(this.dir, { recursive: true });
    if (!existsSync(this.manifestPath)) {
      this.writeManifest({ sounds: [] });
    }
  }

  list(): SoundMeta[] {
    return this.readManifest().sounds.slice();
  }

  get(id: string): SoundMeta | null {
    return this.readManifest().sounds.find((s) => s.id === id) || null;
  }

  pathFor(meta: SoundMeta): string {
    return join(this.dir, meta.filename);
  }

  absoluteDir(): string {
    return this.dir;
  }

  addFromBase64(opts: {
    name: string;
    mime: string;
    dataBase64: string;
  }): SoundMeta {
    const ext = safeExt(opts.name, opts.mime);
    if (!ext) {
      throw Object.assign(new Error("Only mp3 / wav / ogg (or webm/m4a) allowed"), {
        status: 400,
      });
    }
    let buf: Buffer;
    try {
      buf = Buffer.from(String(opts.dataBase64 || ""), "base64");
    } catch {
      throw Object.assign(new Error("Invalid base64"), { status: 400 });
    }
    if (!buf.length) {
      throw Object.assign(new Error("Empty file"), { status: 400 });
    }
    if (buf.length > MAX_SOUND_BYTES) {
      throw Object.assign(new Error("File too large (max 2 MB)"), { status: 413 });
    }

    const id = `snd_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
    const filename = `${id}${ext}`;
    const mime = MIME_BY_EXT[ext] || opts.mime || "application/octet-stream";
    const meta: SoundMeta = {
      id,
      name: displayName(opts.name),
      filename,
      mime,
      bytes: buf.length,
      createdAt: Date.now(),
    };
    writeFileSync(join(this.dir, filename), buf);
    const man = this.readManifest();
    man.sounds.push(meta);
    this.writeManifest(man);
    return meta;
  }

  remove(id: string): boolean {
    const man = this.readManifest();
    const idx = man.sounds.findIndex((s) => s.id === id);
    if (idx < 0) return false;
    const [meta] = man.sounds.splice(idx, 1);
    this.writeManifest(man);
    const path = join(this.dir, meta.filename);
    if (existsSync(path)) {
      try {
        unlinkSync(path);
      } catch {
        /* ignore */
      }
    }
    return true;
  }

  /** Drop orphan files not listed in the manifest (best-effort). */
  pruneOrphans(): void {
    const known = new Set(this.list().map((s) => s.filename));
    known.add("manifest.json");
    known.add(".gitkeep");
    for (const name of readdirSync(this.dir)) {
      if (known.has(name)) continue;
      try {
        unlinkSync(join(this.dir, name));
      } catch {
        /* ignore */
      }
    }
  }

  private readManifest(): Manifest {
    try {
      const raw = JSON.parse(readFileSync(this.manifestPath, "utf8")) as Manifest;
      if (!raw || !Array.isArray(raw.sounds)) return { sounds: [] };
      return {
        sounds: raw.sounds.filter(
          (s) => s && typeof s.id === "string" && typeof s.filename === "string",
        ),
      };
    } catch {
      return { sounds: [] };
    }
  }

  private writeManifest(man: Manifest): void {
    writeFileSync(this.manifestPath, JSON.stringify(man, null, 2), "utf8");
  }
}
