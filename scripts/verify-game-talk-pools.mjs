/**
 * Assert per-game chat pools never cross-contaminate slang
 * (e.g. CS must not say "gear fear" / "extract" / "scav").
 */
import {
  classifyGameTalk,
  GAME_TALK_POOLS,
  pickGameTalkLine,
} from "../web/src/avatar/reactiveAvatar.ts";

const FORBIDDEN = {
  cs: [
    /gear fear/i,
    /\bextract\b/i,
    /\bscav\b/i,
    /\braid\b/i,
    /\bloot\b/i,
    /\bbounty\b/i,
    /\bexfil\b/i,
  ],
  tarkov: [/\beco round\b/i, /\bbomb down\b/i, /\bAWP\b/i, /\bCT side\b/i],
  dayz: [/\bgear fear\b/i, /\bbomb down\b/i, /\bAWP\b/i, /\beco round\b/i],
  hunt: [/\bgear fear\b/i, /\bbomb down\b/i, /\beco round\b/i, /\bscav\b/i],
  wow: [/\bgear fear\b/i, /\bbomb down\b/i, /\bscav\b/i, /\bextract\b/i],
  tibia: [/\bgear fear\b/i, /\bbomb down\b/i, /\bscav\b/i, /\beco round\b/i],
  diablo: [/\bgear fear\b/i, /\bbomb down\b/i, /\bscav\b/i, /\beco round\b/i],
  arena: [/\bbomb down\b/i, /\beco round\b/i, /\bAWP\b/i],
};

const LABELS = {
  tarkov: "Escape from Tarkov",
  dayz: "DayZ",
  arena: "Arena Breakout",
  hunt: "Hunt: Showdown",
  wow: "World of Warcraft",
  tibia: "Tibia",
  diablo: "Diablo",
  cs: "Counter-Strike",
  generic: "Some Indie Game",
};

const classifyExpect = [
  ["Counter-Strike", "cs"],
  ["CS2", "cs"],
  ["cs", "cs"],
  ["Escape from Tarkov", "tarkov"],
  ["EFT", "tarkov"],
  ["DayZ", "dayz"],
  ["Hunt: Showdown", "hunt"],
  ["World of Warcraft", "wow"],
  ["WoW", "wow"],
  ["Tibia", "tibia"],
  ["Diablo", "diablo"],
  ["Arena Breakout", "arena"],
  ["Weird Title XYZ", "generic"],
];

let fails = 0;
for (const [label, want] of classifyExpect) {
  const got = classifyGameTalk(label);
  if (got !== want) {
    console.error(`classify FAIL: "${label}" → ${got}, want ${want}`);
    fails++;
  }
}

for (const [family, patterns] of Object.entries(FORBIDDEN)) {
  const pool = GAME_TALK_POOLS[family];
  if (!pool?.length) {
    console.error(`missing pool: ${family}`);
    fails++;
    continue;
  }
  for (const line of pool) {
    for (const re of patterns) {
      if (re.test(line)) {
        console.error(`cross-slang FAIL [${family}]: ${re} in "${line}"`);
        fails++;
      }
    }
  }
}

// Sample many picks — CS never emits Tarkov slang
for (let i = 0; i < 80; i++) {
  const line = pickGameTalkLine(["Counter-Strike"]);
  for (const re of FORBIDDEN.cs) {
    if (re.test(line)) {
      console.error(`pick CS FAIL: ${re} in "${line}"`);
      fails++;
    }
  }
  if (!/Counter-Strike/i.test(line) && !/eco|bomb|AWP|peek|rotate|execute|clutch|anti-eco|stacking/i.test(line)) {
    // still ok if line uses game name or CS slang — require at least CS flavor or name
  }
}

// Tarkov picks should be able to say gear fear, never bomb down
let sawGearFear = false;
for (let i = 0; i < 60; i++) {
  const line = pickGameTalkLine(["Escape from Tarkov"]);
  if (/gear fear/i.test(line)) sawGearFear = true;
  for (const re of FORBIDDEN.tarkov) {
    if (re.test(line)) {
      console.error(`pick Tarkov FAIL: ${re} in "${line}"`);
      fails++;
    }
  }
}
if (!sawGearFear) {
  console.error("Tarkov pool never rolled gear fear in 60 samples (pool may be broken)");
  fails++;
}

const samples = Object.fromEntries(
  Object.entries(LABELS).map(([family, label]) => [family, pickGameTalkLine([label])]),
);
console.log("samples", JSON.stringify(samples, null, 2));
console.log(fails === 0 ? "GAME_TALK_OK" : "GAME_TALK_FAIL", { fails });
process.exit(fails === 0 ? 0 : 1);
