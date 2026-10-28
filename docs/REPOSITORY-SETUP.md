# Running a source checkout

Use Node.js 18 or newer. Run `npm install`, `npm test`, then `npm start`. Open http://127.0.0.1:4173. Browser tests use the development dependency playwright-core1.58.2 and an installed Chrome; set CHROME_PATH when its executable is outside the standard macOS location. With the server running, `node tests/browser.mjs` and `node tests/advanced-browser.mjs` exercise the editor in separate profiles. PLAYWRIGHT_MODULE can point to an existing playwright-core module when needed.

## Building the Apple Silicon desktop app

The tested runtime is Electron40.10.6 for macOS arm64. Download `electron-v40.10.6-darwin-arm64.zip` from the official Electron GitHub release https://github.com/electron/electron/releases/tag/v40.10.6 and extract it inside `dist/runtime/`, so `dist/runtime/Electron.app` exists. Then run:

```sh
python3 scripts/build-desktop.py
open 'dist/Lumen Studio.app'
```

Python3, macOS codesign, and ditto are required. For a later build, close the app and use `python3 scripts/build-desktop.py --replace`; it preserves the previous bundle. The build is locally ad-hoc signed and is not notarized for broad distribution. The runtime and built app are excluded from Git. Desktop tests require a built app.

## Research and validation archives

The reports document the REA investigation. Lumen validation screenshots are included; captured Adobe research images remain local. Raw tool sessions, captured Adobe images, and captured third-party JavaScript remain local and are excluded from this repository, as are generated photo exports and failed-run screenshots. Original app source is in src/ and desktop/.
