# Match Legends — build the Android APK

This folder is a ready-to-go Capacitor project. The game is plain HTML/CSS/JS with no
build step and no bundler: `www/index.html` (UI, rendering, audio), plus

- `www/js/match-logic.js` — the pure game logic (board, matching, gravity, powers),
- `www/js/monster-tiles.js` — the SVG monster faces drawn on the tiles.

## Board versions

Match Legends is currently preserved in two board versions. **Neither is final** —
the board direction has not been decided, and neither replaces the other.

| Version | Branch | Direction document |
| --- | --- | --- |
| Hex | `develop` (this checkout) | [docs/DIRECTION-HEX.md](docs/DIRECTION-HEX.md) |
| Square | `square-board` | [docs/DIRECTION-SQUARE.md](docs/DIRECTION-SQUARE.md) |

Shared direction and the branch layout are in [docs/DIRECTION.md](docs/DIRECTION.md).
The Square branch ships `www/js/jewel-tiles.js` and `www/js/juice.js` instead of
`monster-tiles.js`; everything else about building the APK is the same.

## One-time setup on your computer
1. Install **Node.js 22 LTS** or newer — https://nodejs.org, or with nvm: `nvm install 22`
   (the repo's `.nvmrc` says 22). Node 18 is not supported: the test tooling needs 22.
2. Install **Android Studio** (free) — https://developer.android.com/studio
   During first launch, let it install the default Android SDK when prompted.

## Build the APK
```bash
cd match-legends
npm install
npx cap sync android
```
Then:
1. Open **Android Studio** → "Open" → select the `android` folder inside this project.
2. Let Gradle sync (first time takes a few minutes — it's downloading build tools).
3. Menu bar → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. When it finishes, click "locate" in the notification, or find it at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

## Install on a phone
Send that `.apk` file to your phone (email, Drive, USB, whatever's easiest) and to your
friend's phone. On the phone: tap the file → if blocked, enable "Install unknown apps"
for whichever app you opened it with (Files/Chrome/Gmail) → install.

## After you edit the game
Edit the files in `www/`, run the tests, then sync before rebuilding:
```bash
npm test
npx cap sync android
```
Then re-run the Build APK(s) step in Android Studio.

## Want to test *right now*, before setting up Android Studio?
Just open `www/index.html` (together with `www/js/`) in a phone's browser (AirDrop/email it to yourself),
or tap "Add to Home Screen" for an app-like icon. Same game, zero setup — useful while
Android Studio installs in the background.

## Notes
- Progress persists: gems, unlocked avatars, the chosen avatar and level progress
  are saved through native storage when installed and fall back to `localStorage` in
  a browser, so they survive a reload or an app restart.
- No real payments are wired up. Locked avatars have an `Unlock <price> (Test Mode)`
  button that just flips them unlocked for testing — swap this for real IAP before any
  launch.

## Tests
Requires **Node.js 22** or newer (`nvm use` picks it up from `.nvmrc`).
```bash
npm install
npx playwright install chromium     # once per machine
npm test                            # unit tests (node:test) + headless smoke test (Playwright)
npm run test:tasks                  # the ml-* acceptance tests (all currently pass)
```
- `tests/unit/` — unit tests of `www/js/match-logic.js` (Node's built-in test runner).
- `tests/smoke/` — one Playwright test: the game loads with no console errors, a level
  starts, and one scripted move works.
- `tests/tasks/` — the acceptance tests written for each `ml-*` task. They are kept
  out of `npm test` and run separately; see [tests/tasks/README.md](tests/tasks/README.md).
