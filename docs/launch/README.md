# Launch checklist: App Store and Google Play

Steps 5 (developer accounts) and 6 (go live) of the roadmap. ✅ means done in the repo; ☐ is still to do. **Owner** says who does it.

| Doc | What's in it |
| --- | --- |
| [1-developer-accounts.md](1-developer-accounts.md) | Apple and Google signup steps (Swali) |
| [2-native-apps.md](2-native-apps.md) | How the iOS and Android apps are built and released |
| [3-store-listing.md](3-store-listing.md) | Store text, privacy answers, review notes |

## ⚠️ Read first: what could block approval

The native wrapping is ready, but **as the app stands today, Apple is likely to reject it**, and Google may too:

1. **Simulated bookings.** App Review rejects apps that look like demos or have features that don't really work (Apple guideline 2.1 "App Completeness" and 2.3 "Accurate Metadata"). A travel app where "Book" and "Pay" are fake is the textbook case. Roadmap steps 2 to 4 (backend, real flight, hotel and visa partners, payments) fix this. The alternative is to launch v1 as a **trip planner and visa checker** that hides the Book and Pay buttons, with no fake checkouts.
2. **"It's just a website."** Apple guideline 4.2 rejects apps that are only a website in a frame. The app looks and feels native, which helps. Real native features help more: push notifications for trip updates, Face ID for the wallet, offline tickets. Plan at least one for v1.
3. **Travel together with real people** (once the backend connects real users) needs report and block, content filtering, and an age rating of 17+ on iOS (guideline 1.2), plus in-app **account deletion** (5.1.1(v)) once accounts exist.
4. **Sign-in:** if you add Google or Facebook login, iOS also needs **Sign in with Apple**.

## Checklist

### Accounts (Swali)
- ☐ Choose personal or organisation account; get a D-U-N-S number if organisation
- ☐ Apple Developer Program enrolled (US$99/yr)
- ☐ App Store Connect Free Apps agreement accepted
- ☐ Google Play Console account verified (US$25)
- ☐ 12 Android testers lined up (new personal Play accounts only)
- ☐ Mac available, or a cloud build service chosen

### App readiness (Claude)
- ✅ Capacitor iOS and Android projects (`ios/`, `android/`), bundle ID `app.unthinked.travel`
- ✅ App icon, Android adaptive icon and splash screens from the orb logo
- ✅ Offline fallback screen, Android back button, status bar, portrait lock
- ✅ Privacy policy `/privacy`, terms `/terms`, support `/support`, linked from Profile
- ✅ Store copy, privacy-label answers and review notes drafted
- ✅ Draft screenshots (`store/screenshots/`) and Play graphics (`store/`)
- ☐ Confirm the bundle ID (it can't change after the first upload)
- ☐ Production deployment with a real domain and HTTPS
- ☐ Set `NEXT_PUBLIC_LEGAL_NAME` and `NEXT_PUBLIC_SUPPORT_EMAIL` on the deployment
- ☐ Fix the review blockers above (real bookings, or planner-only v1)
- ☐ At least one native feature (push notifications recommended)
- ☐ Final screenshots with real content and captions

### Go live (together, Swali approves each submission)
- ☐ `UNTHINKED_APP_URL=<prod url> npm run native:sync`
- ☐ Android: signed `.aab` → Play Console **Internal testing** → **Closed testing** (12 testers × 14 days if required) → **Production**
- ☐ iOS: Archive in Xcode → **TestFlight** → test on real iPhones → **Submit for Review**
- ☐ Fill in the App Privacy label and Data safety form from `3-store-listing.md`
- ☐ Review usually takes 1 to 3 days on Apple and up to 7 days for a new Google app
- ☐ Release, then watch crash reports and reviews for the first week
