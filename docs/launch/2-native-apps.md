# Building the iOS and Android apps

The app is wrapped with [Capacitor 8](https://capacitorjs.com). The native projects live in `ios/` and `android/`.

## How it works

Unthinked has server code (the AI chat at `/api/chat`), so it can't be packed into the app as static files. The native app instead opens the deployed site full screen, with native splash screen, status bar and Android back-button handling (`src/components/unthinked/native-bridge.tsx`). When the phone is offline it shows `native-shell/index.html`.

This means **the web deployment must be live before the store builds work**, and most updates ship by deploying the site, with no store review. Change the native shell (plugins, icons, permissions) only through a new store build.

## One-time setup

1. Deploy the Next.js app (Vercel is simplest) and note its HTTPS URL. Set these environment variables on the deployment:
   - `AI_GATEWAY_API_KEY` for the live assistant
   - `NEXT_PUBLIC_LEGAL_NAME` for your name or company, shown on the privacy and terms pages
   - `NEXT_PUBLIC_SUPPORT_EMAIL` for your support email
2. Sync the native projects with that URL:
   ```bash
   UNTHINKED_APP_URL=https://your-app.vercel.app npm run native:sync
   ```
   Run this again whenever you change the URL, `capacitor.config.ts` or a Capacitor plugin.

## Android (Windows, Mac or Linux)

1. Install [Android Studio](https://developer.android.com/studio).
2. `npm run android` opens the project. Press Run to try it on a phone or emulator.
3. To release: **Build → Generate Signed App Bundle → Android App Bundle**. Create a new upload key when asked and **back up the `.jks` file and its passwords**; you can't update the app without them. Upload the `.aab` to Play Console.

## iOS (Mac only)

1. Install Xcode from the Mac App Store.
2. `npm run ios` opens the project.
3. In **Signing & Capabilities**, select your Apple developer team.
4. To release: choose **Any iOS Device**, then **Product → Archive → Distribute App → App Store Connect**.

## Icons and splash

The source art is in `assets/`, drawn from the orb logo in `src/lib/orb-icon.tsx`.

```bash
npm run native:icons    # redraw assets/*.png and the store art from the orb
npm run native:assets   # generate every iOS and Android size from assets/
```

## Settings to know

| Setting | Where | Value |
| --- | --- | --- |
| Bundle ID / package name | `capacitor.config.ts`, `ios/App/App.xcodeproj`, `android/app/build.gradle` | `app.unthinked.travel` (permanent after first upload) |
| Version | Xcode `MARKETING_VERSION` / Android `versionName` | `1.0` |
| Build number | Xcode `CURRENT_PROJECT_VERSION` / Android `versionCode` | `1`; raise it for every upload |
| Devices | Xcode `TARGETED_DEVICE_FAMILY` | iPhone only for v1 (no iPad screenshots needed) |
| Orientation | `Info.plist`, `AndroidManifest.xml` | Portrait |
| Export compliance | `Info.plist` `ITSAppUsesNonExemptEncryption` | `false` (standard HTTPS only) |
