# Match Legends — build the Android APK

This folder is a ready-to-go Capacitor project. The game is plain HTML/CSS/JS with no
build step and no bundler: `www/index.html` (UI, rendering, audio) and
`www/js/match-logic.js` (the pure game logic: square grid, matching, gravity, powers).

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

## Notes on this MVP
- No real payments are wired up. Locked avatars have an "Unlock (Test Mode)" button
  that just flips them unlocked for testing — swap this for real IAP before any launch.
- Progress (gems, unlocked avatars, level progress) is kept in memory only when run as
  a real installed app (outside Claude's own preview sandbox), so it resets on app
  restart for now. Easy next step: swap the `Storage` object in the script for
  `localStorage` (works fine in a real installed app, just not inside Claude.ai's
  artifact preview) or a small backend if you want it to persist.

## Tests
Requires **Node.js 22** or newer (`nvm use` picks it up from `.nvmrc`).
```bash
npm install
npx playwright install chromium     # once per machine
npm test                            # unit tests (node:test) + headless smoke test (Playwright)
npm run test:tasks                  # PENDING task acceptance tests: expected to fail until each task is done
```
- `tests/unit/` — unit tests of `www/js/match-logic.js` (Node's built-in test runner).
- `tests/smoke/` — one Playwright test: the game loads with no console errors, a level
  starts, and one scripted move works.
- `tests/tasks/` — acceptance tests for planned tasks, written before the work. They are
  **expected to fail** until their task is done, and `npm test` does not run them.
