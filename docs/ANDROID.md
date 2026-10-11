# Android packaging

Match Legends is packaged for Android with Capacitor. The game itself is plain
HTML/CSS/JavaScript with no build step; `android/` is the Capacitor shell around it.

## One-time setup

1. Install **Node.js 22 LTS** or newer — https://nodejs.org, or with nvm:
   `nvm install 22` (the repo's `.nvmrc` says 22). Node 18 is not supported: the
   test tooling needs 22.
2. Install **Android Studio** (free) — https://developer.android.com/studio
   During first launch, let it install the default Android SDK when prompted.

## Build the APK

```bash
cd match-legends
npm install
npx cap sync android
```

Then:

1. Open **Android Studio** → "Open" → select the `android` folder inside this
   project.
2. Let Gradle sync (first time takes a few minutes — it's downloading build tools).
3. Menu bar → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
4. When it finishes, click "locate" in the notification, or find it at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

Equivalent npm scripts: `npm run sync` runs `cap sync android`, and
`npm run open:android` opens the project in Android Studio.

## Install on a phone

Send that `.apk` file to your phone (email, Drive, USB, whatever's easiest). On the
phone: tap the file → if blocked, enable "Install unknown apps" for whichever app
you opened it with (Files/Chrome/Gmail) → install.

## After you edit the game

Edit the files in `www/`, run the tests, then sync before rebuilding:

```bash
npm test
npx cap sync android
```

Then re-run the Build APK(s) step in Android Studio.

## Test without Android Studio

Open `www/index.html` (together with `www/js/`) in a phone's browser, or tap
"Add to Home Screen" for an app-like icon. Same game, zero setup.
