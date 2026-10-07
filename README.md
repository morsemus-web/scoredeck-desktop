# ScoreDeck — Desktop & Mobile Apps

ScoreDeck puts live sports scores in a small always-on-top bar on your desktop, with an Android companion app. Built and operated by **Titan Orbyt Technologies LLC** (Dubai, UAE).

This repository contains:

| Folder | App | Tech |
|---|---|---|
| repo root | **Desktop widget** (Windows, macOS, Linux) | Electron 42 + React 19 + Vite |
| `mobile/` | **Android app** | Expo 52 / React Native. See [mobile/README.md](mobile/README.md). |

The website and the score API live in a separate repository, `morsemus-web/hi` (tryscoredeck.pro). Its `docs/` folder describes the full system, including [ARCHITECTURE.md](https://github.com/morsemus-web/hi/blob/main/docs/ARCHITECTURE.md) and [DATA_PROVIDERS.md](https://github.com/morsemus-web/hi/blob/main/docs/DATA_PROVIDERS.md).

## How the desktop app works

- A frameless, always-on-top window shows the current live match. It rotates between live matches every 8 seconds and can expand for detail.
- Scores come from `https://tryscoredeck.pro/api/{soccer,cricket,basketball}` and refresh every 12 seconds. The app never calls a sports data provider directly, so switching providers needs no app update.
- When nothing is live, the widget says "No live matches right now". It never shows placeholder or invented matches.
- A setup screen chooses sports, the display to show on, visibility (`always` or `live-only`) and start-on-boot.
- A tray icon controls the widget. A sponsor strip under the bar shows direct sponsors from `/api/ads/next`, or a ScoreDeck house ad. Google ads are not allowed in desktop software.
- **Anonymous usage stats** (`src/usage.ts`) send app opens, a 5-minute heartbeat and match expands to `/api/track`. Setup has a **Share anonymous usage statistics** checkbox: ticked by default outside the EU/UK/CH, unticked inside until the user opts in.
- Auto-updates use `electron-updater`, checking the feed at `https://tryscoredeck.pro/releases/` (the `build.publish` URL in `package.json`).

```
electron/
├── main.js        window, tray, IPC (resize, startup, displays), auto-updater
└── preload.cjs    safe bridge exposed to the renderer as window.electronAPI
src/
├── App.tsx        switches between Setup and Widget
├── Setup.tsx      first-run and settings screen
├── Widget.tsx     the score bar
├── api.ts         fetches and normalises scores from the ScoreDeck API
├── ads.ts         ad requests and impression/click events
├── usage.ts       anonymous usage stats (respects the Setup opt-in)
└── AdSlot.tsx     sponsor strip
build/             icon and NSIS installer script
```

## Development

```bash
npm install
npm run electron:dev      # Vite dev server + Electron with hot reload
```

To point at a local or staging API, set `VITE_API_BASE_URL` (default `https://tryscoredeck.pro`):

```bash
VITE_API_BASE_URL=http://localhost:3000 npm run electron:dev
```

## Building installers

```bash
npm run dist:win     # release/ScoreDeck-Setup-<version>.exe (NSIS)
npm run dist:mac     # universal .dmg
npm run dist:linux   # AppImage + .deb
```

**Releases through CI:** pushing a tag like `v0.2.0` runs `.github/workflows/release.yml`, which builds all three platforms and attaches them to a GitHub Release.

Bump `version` in `package.json` before tagging. The auto-updater compares versions.

### Code signing

Builds are currently **unsigned**, so Windows SmartScreen shows "Unknown publisher". The plan:

1. Buy an OV code-signing certificate with cloud signing in the name of **Titan Orbyt Technologies LLC**.
2. Add the signing credentials as GitHub Actions secrets.
3. Enable signing in `release.yml` and in the `build.win` section of `package.json`.

For macOS, notarisation needs an Apple Developer **organisation** account, which requires a D-U-N-S number.

## Publisher details

`package.json` sets `author` and `build.copyright` to Titan Orbyt Technologies LLC. Once signing is enabled, the publisher name comes from the certificate and must match the trade licence exactly.
