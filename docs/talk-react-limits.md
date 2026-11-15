# Talk-react limits (current)

Short status of what the scavenger avatar can and cannot do when “talking.”

## Works now

- **Mic levels only** — dashboard mic capture sends a 0–1 amplitude over localhost WS. Nothing is recorded or transcribed.
- **Level poses** — louder levels open the mouth/filter vent, lean the torso, and nod the head (`data-talk` / `data-talkNod`).
- **ACK bubbles** — after sustained speech (~0.9s of hot levels), a random short ACK line may appear in the Zone Ops chat box (`Copy that.`, `Affirm.`, etc.). These are canned, not content-aware.
- **Topic react (dashboard demo)** — typing a topic runs a **local keyword map** (raid / extract / hello / loot / help / gg). Not live Twitch chat, not STT.

## Does not work yet

- **No speech-to-text** — mic audio is never turned into words.
- **No Twitch/Kick chat AI** — chat messages are not read or answered automatically.
- **No game-state react** — kills, raids, or in-game events do not drive talk poses.
- **No LLM / free-form reply** — topic react is a fixed keyword table only.

## Intentional boundary

Mic talk react is **stream-safe level animation**. Understanding speech or chat needs a later STT and/or chat API pass — keep that separate from the level pipeline.
