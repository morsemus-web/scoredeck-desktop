# ScoreDeck Mobile (Android)

Expo/React Native companion app. Free with sign-in, $20/yr in-app to remove ads. iOS is not supported.

## Structure

```
mobile/
├── app/                 expo-router file-based routes
│   ├── _layout.tsx      root Stack navigator (dark theme)
│   ├── index.tsx        feed: sport tabs + score cards + ad banner + footer CTA
│   ├── auth.tsx         magic-link sign-in
│   └── account.tsx      subscription status + Dodo checkout + sign out
├── src/
│   └── lib/
│       ├── supabase.ts  Supabase client using SecureStore for session
│       └── api.ts       fetchSport(sport) → normalized MobileMatch[], plus fetchMe()
├── assets/              app icon, splash, adaptive icon (add before building)
├── app.json             Expo config (bundle id: pro.tryscoredeck.app)
├── eas.json             EAS build profiles (preview → .apk, production → .aab)
└── package.json
```

## Data flow

Every score comes from Scoreweb (`https://tryscoredeck.pro/api/{cricket,soccer,basketball,f1}`) using exactly the same routes the desktop widget uses — no duplication. Auth is Supabase magic-link; the session is stored in the OS keychain via `expo-secure-store`. Ad-free status is fetched via `GET /api/me` with the Supabase bearer token.

## One-time setup

1. Install Expo CLI + EAS CLI:
   ```
   npm install -g eas-cli
   ```
2. Register / sign in:
   ```
   eas login
   ```
3. Install app deps:
   ```
   cd mobile
   npm install
   ```
4. Fill in **`app.json → expo.extra`**:
   - `supabaseUrl` — same as web (`NEXT_PUBLIC_SUPABASE_URL`)
   - `supabaseAnonKey` — same as web (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `mobileProductId` — the Dodo product id for the $20/yr subscription (add this field alongside `apiBase`)
5. Add three brand images to `mobile/assets/`:
   - `icon.png` — 1024×1024, opaque
   - `adaptive-icon.png` — 1024×1024, foreground layer (transparent bg)
   - `splash.png` — 1284×2778 or similar
   You can start by copying `../build/icon.png` (the desktop placeholder) to `assets/icon.png` and `assets/adaptive-icon.png`.
6. Link the Expo project to EAS:
   ```
   eas init
   eas build:configure
   ```

## Build the .apk

```
npm run build:apk
```

EAS builds it in the cloud, hands back a download URL. Save the resulting file as `ScoreDeck.apk` and drop it in the website repo (`morsemus-web/hi`) at `public/downloads/ScoreDeck.apk` so `tryscoredeck.pro/download` serves it. That path is git-ignored so the binary won't bloat the repo — treat it as a deploy artifact.

## Configure Supabase for mobile

In Supabase → Authentication → URL Configuration:
- Add `scoredeck://` to the **Redirect URLs** allow-list so the magic link opens the app on tap.

## What's stubbed / TODO

- **Ads.** `src/components/AdBanner.tsx` shows a direct sponsor from `/api/ads/next` (impressions and clicks logged), otherwise Google AdMob (after Google's consent form, `src/lib/admob.ts`), otherwise the house ad. Before release, replace Google's **test** AdMob app ID in `app.json` and set `extra.admobBannerId`; see the website repo's `docs/ADS.md`. AdMob is a native module: use EAS builds, not Expo Go.
- **No in-app purchases.** Google Play requires Play Billing for buying ad removal inside the app, so the Account screen only explains that ad-free comes with a website subscription (Stripe). Signing in with the same email switches ads off.
- **Usage stats** (`src/lib/usage.ts`) are anonymous and controlled by Account → Privacy → "Share anonymous usage statistics" (off by default in the EU/UK/CH).
- **Score alerts are local, not push.** `src/lib/notifications.ts` checks favourites with `expo-background-fetch` and fires local notifications. Android throttles background fetch (often 15+ minutes), so alerts can be late. Instant alerts need a server-side sender (e.g. Supabase Cron + Expo Push).
- **Locale coverage** — the mobile app currently ships English only. Reuse Scoreweb's `messages/*.json` translations when adding i18n.
