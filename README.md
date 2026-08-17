# Match Legends — build the Android APK

This folder is a ready-to-go Capacitor project. The whole game lives in one file:
`www/index.html` (plain HTML/CSS/JS, no build step, no bundler).

## One-time setup on your computer
1. Install **Node.js LTS** — https://nodejs.org
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
Every time you change the game, do this before rebuilding:
```bash
cp index.html www/index.html   # or edit www/index.html directly
npx cap sync android
```
Then re-run the Build APK(s) step in Android Studio.

## Want to test *right now*, before setting up Android Studio?
Just open `index.html` directly in a phone's browser (AirDrop/email it to yourself),
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
