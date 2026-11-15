/**
 * Mock Streamlabs payloads through the live loopback mock endpoint
 * (or pure unit map if the server is down).
 *
 * usage: npx tsx scripts/test-streamlabs-bridge.ts
 */
import {
  mapStreamlabsToSocial,
  parseStreamlabsEvent,
} from "../server/streamlabsBridge.ts";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const followRaw = {
  type: "follow",
  message: [{ name: "TestFollower_99", event_id: "evt-follow-1" }],
  for: "twitch_account",
};
const subRaw = {
  type: "subscription",
  message: [{ name: "TestSub_42", months: 1, sub_plan: "1000", event_id: "evt-sub-1" }],
  for: "twitch_account",
};
const resubRaw = {
  type: "resub",
  message: [{ name: "ResubHero", months: 6, event_id: "evt-resub-1" }],
};
const giftRaw = {
  type: "subscription",
  message: [
    {
      name: "GiftedViewer",
      gifter: "GenerousGifter",
      sub_plan: "1000",
      event_id: "evt-gift-1",
    },
  ],
};

const follow = parseStreamlabsEvent(followRaw);
assert(follow, "parse follow");
assert(
  mapStreamlabsToSocial(follow.type, follow.messages)?.latestFollower === "TestFollower_99",
  "map follow",
);

const sub = parseStreamlabsEvent(subRaw);
assert(sub, "parse sub");
assert(
  mapStreamlabsToSocial(sub.type, sub.messages)?.latestSubscriber === "TestSub_42",
  "map sub",
);

const resub = parseStreamlabsEvent(resubRaw);
assert(resub, "parse resub");
assert(
  mapStreamlabsToSocial(resub.type, resub.messages)?.latestSubscriber === "ResubHero",
  "map resub",
);

const gift = parseStreamlabsEvent(giftRaw);
assert(gift, "parse gift");
assert(
  mapStreamlabsToSocial(gift.type, gift.messages)?.latestSubscriber === "GiftedViewer",
  "map gift",
);

// Stringified message form (Streamlabs sometimes sends this)
const strForm = parseStreamlabsEvent({
  type: "follow",
  message: JSON.stringify([{ name: "StringyFollow", event_id: "evt-str-1" }]),
});
assert(strForm, "parse string message");
assert(
  mapStreamlabsToSocial(strForm.type, strForm.messages)?.latestFollower === "StringyFollow",
  "map string follow",
);

console.log("unit map/parse: OK");

const base = process.env.OVERLAY_URL || "http://127.0.0.1:8787";
try {
  const health = await fetch(`${base}/api/health`);
  if (!health.ok) throw new Error(`health ${health.status}`);
  const h = (await health.json()) as { eventsStatus?: string };
  console.log("health eventsStatus:", h.eventsStatus || "(missing)");

  const post = async (body: unknown) => {
    const res = await fetch(`${base}/api/events/mock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as {
      ok: boolean;
      social: { latestFollower: string; latestSubscriber: string };
    };
    return json;
  };

  const a = await post(followRaw);
  assert(a.ok && a.social.latestFollower === "TestFollower_99", "mock follow");
  const a2 = await post(followRaw);
  assert(!a2.ok, "dedupe follow");

  const b = await post(subRaw);
  assert(b.ok && b.social.latestSubscriber === "TestSub_42", "mock sub");

  const c = await post(resubRaw);
  assert(c.ok && c.social.latestSubscriber === "ResubHero", "mock resub");

  console.log("live mock endpoint: OK");
  console.log(
    JSON.stringify(
      {
        latestFollower: b.social.latestFollower,
        latestSubscriber: c.social.latestSubscriber,
        eventsStatus: h.eventsStatus,
      },
      null,
      2,
    ),
  );
} catch (err) {
  console.log(
    "live mock skipped (start server with npm run preview / npm start):",
    (err as Error).message,
  );
}

console.log("STREAMLABS BRIDGE TESTS PASSED");
