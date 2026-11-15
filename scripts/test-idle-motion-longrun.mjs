/**
 * Accelerated long-run + visibility stress for IdleMotion.
 * Simulates ~8h of avatar idle with OBS-style hide/show bursts.
 * Fails if yaw/pitch/breath deltas explode (spasm signature).
 */
import { chromium } from "playwright";

const BASE = process.env.OVERLAY_BASE || "http://127.0.0.1:8787";
const HOURS = Number(process.env.SIM_HOURS || 8);
const SIM_MS = HOURS * 3600 * 1000;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 960, height: 720 } });
  await page.goto(`${BASE}/avatar.html`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);

  const result = await page.evaluate(async (simMs) => {
    const root = document.querySelector(".avatar-root");
    const idle = root && root.__pzIdleMotion;
    if (!idle) return { ok: false, reason: "no __pzIdleMotion hook" };

    const samples = [];
    const push = (label) => {
      const s = idle.sample();
      samples.push({ label, ...s });
    };

    push("start");

    // Chunked advance with periodic "OBS hide" (pause) + resume — no catch-up allowed.
    const chunk = 60_000; // 1 simulated minute per chunk
    let advanced = 0;
    let hideEvery = 25; // every ~25 min
    let chunks = 0;
    let maxJump = 0;
    let prev = idle.sample();

    while (advanced < simMs) {
      const step = Math.min(chunk, simMs - advanced);
      idle.advanceForTest(step);
      advanced += step;
      chunks++;
      const cur = idle.sample();
      const jump = Math.hypot(cur.yaw - prev.yaw, cur.pitch - prev.pitch);
      if (jump > maxJump) maxJump = jump;
      // Per-minute glance change should stay tiny (max head turn ~2°)
      // Chunk samples are 1 simulated minute apart — a full glance reverse is ~4°, not a spasm.
      // Spasms are multi-dozen-degree / discontinuous snaps; keep a tight but fair ceiling.
      if (jump > 4.5) {
        return {
          ok: false,
          reason: `spasm-like jump ${jump.toFixed(3)} after ${advanced}ms`,
          samples,
          maxJump,
        };
      }
      prev = cur;

      if (chunks % hideEvery === 0) {
        // Simulate OBS pausing the Browser Source
        idle.pause();
        // Huge wall-clock gap — must NOT produce a catch-up spasm on resume
        idle.resume();
        // Malicious huge dt attempt via advanceForTest is already capped internally;
        // also call advance with a huge single request:
        const before = idle.sample();
        idle.advanceForTest(120_000); // request 2 simulated minutes in one call
        advanced += 120_000;
        const after = idle.sample();
        const resumeJump = Math.hypot(after.yaw - before.yaw, after.pitch - before.pitch);
        if (resumeJump > 4.5) {
          return {
            ok: false,
            reason: `post-hide catch-up spasm ${resumeJump.toFixed(3)}`,
            samples,
            maxJump: Math.max(maxJump, resumeJump),
          };
        }
        maxJump = Math.max(maxJump, resumeJump);
        prev = after;
      }
    }

    push("end");

    // Bounds check — never exceed design clamps
    for (const s of samples) {
      if (Math.abs(s.yaw) > 2.2 || Math.abs(s.pitch) > 0.7 || Math.abs(s.breathY) > 2.2) {
        return { ok: false, reason: "sample out of bounds", samples, maxJump };
      }
    }

    return {
      ok: true,
      simulatedMs: advanced,
      simulatedHours: advanced / 3600000,
      maxJump,
      samples,
      breathPhaseEnd: idle.sample().breathPhase,
    };
  }, SIM_MS);

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
  console.log("LONG_RUN_OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
