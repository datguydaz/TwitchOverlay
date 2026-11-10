# Zone Overlay (Twitch / Kick OBS)

Exclusion-zone streaming overlay for **OBS Browser Sources** — charcoal / olive / dirty beige field-terminal aesthetic, reactive scavenger avatar, and a Windows input companion so the avatar works without browser focus.

Default streamer name: **datguydaz** (editable in the dashboard). Built for Pontus Lund.

## Stack

| Piece | Choice |
| --- | --- |
| Overlay + dashboard | Vite + TypeScript (multi-page), lightweight DOM/CSS/SVG |
| Local server | Express + `ws` on **127.0.0.1:8787** (settings API + input socket) |
| Input companion | Node + [`uiohook-napi`](https://github.com/SnosMe/uiohook-napi) (Windows) |
| Platform events | Modular stub only — sample alerts, no fake “connected” status |

## Quick start (Windows streaming PC)

```bash
git clone https://github.com/datguydaz/TwitchOverlay.git
cd TwitchOverlay
npm install
npm run preview
```

Open the **dashboard** (not an OBS source):

- http://127.0.0.1:8787/dashboard.html

In another terminal, start the companion (Windows):

```bash
cd companion
npm install
npm start
```

### Preview elsewhere (macOS / Linux)

You can run `npm run dev` or `npm run preview` and use **demo mode** on the dashboard to preview every avatar animation. Global input capture is Windows-first; on other OSes use `npm run test:protocol` to verify the socket protocol.

Dev mode (hot reload):

```bash
npm install
npm run dev
```

- Vite UI: http://127.0.0.1:5173/ (proxies `/api` + `/ws` → 8787)
- API/WS: http://127.0.0.1:8787/

## OBS browser sources

Add a **Browser** source per scene. Common settings:

| Setting | Value |
| --- | --- |
| Width | `1920` |
| Height | `1080` |
| Control audio via OBS | unchecked (unless you want page audio) |
| Shutdown source when not visible | **checked** for non-active scenes |
| Refresh browser when scene becomes active | optional |
| Transparent background | **checked** for gameplay + avatar-only |

Custom CSS (optional, usually empty):

```css
body { background-color: rgba(0,0,0,0); margin: 0; overflow: hidden; }
```

### URLs (production preview server on port 8787)

| Scene | URL | Background |
| --- | --- | --- |
| Gameplay | `http://127.0.0.1:8787/gameplay.html` | Transparent |
| Starting Soon | `http://127.0.0.1:8787/starting-soon.html` | Opaque terminal |
| Be Right Back | `http://127.0.0.1:8787/brb.html` | Opaque |
| Stream Ending | `http://127.0.0.1:8787/ending.html` | Opaque |
| Avatar only | `http://127.0.0.1:8787/avatar.html` | Transparent |

In `npm run dev`, replace port **8787** with **5173**.

**Do not** add `dashboard.html` as an OBS browser source — controls stay off-stream.

## Reactive avatar

Original SVG scavenger (hood, gas mask, desk). Layered hands / head / torso:

- Keyboard → left hand tap (holds stay active without jitter; OS repeat ignored in companion)
- Left / right click → distinct right-hand feedback
- Idle breathing + occasional head movement
- Optional amber equipment lights on activity

### Demo mode vs companion

| Mode | How | Badge |
| --- | --- | --- |
| Demo | Dashboard → **Enable demo preview** + demo buttons | Amber **DEMO INPUT** — never reported as live companion |
| Live | Windows companion connected; capture not paused | Olive **LIVE INPUT** |

Disconnect/pause returns the avatar to idle; reconnect resumes cleanly.

## Input capture (limitations)

OBS cannot rely on keyboard focus. The companion listens globally and sends only:

```json
{ "type": "input", "kind": "key|mouseL|mouseR", "phase": "down|up", "pressId": 1, "held": 1 }
```

No characters, key names, or mouse coordinates on the wire. Loopback bind only. Local token + Origin checks are a convenience gate — **not** internet authentication.

See [`companion/README.md`](./companion/README.md) for `uiohook-napi` details, UIPI/elevation limits, and privacy notes. **Windows global hooks were not executed on Linux CI/dev VMs** — protocol/pause/reconnect are verified with `npm run test:protocol`.

## Settings

Dashboard persists settings via `PUT /api/settings` to `data/settings.json` (server-side so every OBS browser source can read the same values). Modules: visibility, position (`x`/`y`), scale. Avatar intensity + lights. Countdown + scene copy.

## Twitch & Kick

Visual overlay works on either platform. Live follower/sub/donation integrations are **not** implemented. Dashboard **Sample** alerts are labelled `SAMPLE // NOT LIVE`.

To add real events later: run a local bridge that holds Twitch EventSub / Kick credentials and pushes normalized alerts over the existing localhost WebSocket. Keep secrets out of browser/overlay code.

## Performance

No 3D, no particle storms. CSS animations are capped; countdown/settings polling pauses heavy work while `document.hidden`. Hide unused modules in the dashboard.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite + server |
| `npm run preview` | Build + serve dist on 8787 |
| `npm run test:protocol` | Loopback WS/settings verification |
| `npm run companion` | Attempts companion from root (Windows) |

## License / art

Original overlay artwork and code in this repository. Do not drop copyrighted game logos or ripped STALKER/Tarkov assets into the project.
