# Zone Overlay input companion

Lightweight Windows process that captures keyboard/mouse activity and sends **minimal animation signals** to the overlay over `ws://127.0.0.1:8787/ws`.

## Library: `uiohook-napi`

This companion uses [`uiohook-napi`](https://github.com/SnosMe/uiohook-napi), a Node binding around **libuiohook**.

Verified against the library’s published README/docs behavior:

- Global keyboard and mouse hooks without requiring the overlay browser source to be focused.
- Event delivery is observational (callbacks on key/mouse events). The companion does **not** call any APIs to synthesize, block, or modify input.
- Native addon — must be installed on the machine that runs the companion (`npm install` in this folder on Windows).

### Compatibility limitations (honest)

| Topic | Reality |
| --- | --- |
| OS | Practical target is **Windows** for OBS streaming PCs. libuiohook also exists on macOS/Linux, but this repo ships and documents the Windows path; non-Windows `npm start` exits with guidance. |
| Privileges / secure desktop (UIPI) | On Windows, a **non-elevated** companion cannot observe input while an **elevated** window is focused (User Interface Privilege Isolation). Run the companion at the same integrity level as the apps you care about, or accept gaps over UAC/admin games. |
| Anti-cheat / exclusive input | Some games or anti-cheat stacks can interfere with global hooks. There is no game-process injection fallback in this project (by design). |
| Injection APIs | `uiohook-napi` exposes `keyTap` / `keyToggle`; **this companion never calls them**. Capture is listen-only via `keydown`/`keyup`/`mousedown`/`mouseup` + `start()`. |
| Accessibility permissions | Not typically required on Windows the same way as macOS; if ported to macOS, Input Monitoring permission would be required. |
| Auto-repeat | OS key repeat is ignored so held keys keep a stable active pose (no jitter). |
| Wire format | Only `kind` (`key` / `mouseL` / `mouseR`), `phase` (`down` / `up`), opaque `pressId`, and `held` counts. **No characters, key names, or positions.** |
| Network | Connects to loopback only. The overlay server binds `127.0.0.1` and checks local Origin + a locally minted token (convenience gate, not internet auth). |

## Privacy

- Does not log or save keystrokes.
- Does not transmit input off the machine.
- Does not read game memory or attach to game processes.

## Run (Windows)

1. Start the overlay server from the repo root (`npm run preview` or `npm run dev`).
2. `cd companion && npm install && npm start`
3. Optional stdin: `p` pause, `r` resume, `q` quit.
4. Dashboard can also send pause/resume over the socket.

## Linux / CI verification

Do **not** expect global hooks here. Use the repo root script:

```bash
npm run test:protocol
```

That validates hello/token, pause/resume, input fan-out, disconnect → reset-idle, and reconnect without claiming Windows capture was executed.
