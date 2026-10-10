# thannu


Built with [Expo](https://expo.dev) and React Native. Uses **[development builds](https://docs.expo.dev/develop/development-builds/introduction/)**: you compile the app once (locally or in the cloud with EAS), install it on your simulator or phone, and from then on iterate with instant JavaScript reloads. Expo Go is not supported — this app ships native modules, and the Expo Go app in the stores lags behind SDK 56.

## What's inside

- **Expo SDK 56** (React Native 0.85, React 19.2.3) with **expo-router** file-based routing and typed routes
- **Development-build workflow** — `expo-dev-client` plus an `eas.json` with development, preview, and production build profiles
- **Design token theme system** — semantic colors, spacing, typography, and radius scales in `src/lib/theme.ts`, with full light/dark support
- **Persisted theme picker** — light/dark/system mode on the Settings tab, stored with Zustand + AsyncStorage and restored on launch (the splash screen holds until the saved theme loads, so there's no wrong-theme flash)
- **UI primitives** — `Button`, `Card`, `Input`, and `Text` components built on the theme tokens, exercised by a "Design preview" section on the home screen so a restyle is visible immediately
- **Shared `Screen` scaffold** — safe areas, tab-bar clearance, and wide-screen max width handled in one place
- **Error boundaries** — a global boundary in the root layout plus a `ScreenErrorBoundary` wrapping every screen
- **Local storage** — `@react-native-async-storage/async-storage` with typed helpers in `src/lib/storage.ts`
- **Common device capabilities pre-installed** — camera, photo picker, media library, location, haptics, video, SVG, gradients, blur, clipboard, sharing, file system, and WebView, with permissions pre-configured — their native code is already in your development build, so reaching for them never requires a rebuild
- **TypeScript strict mode**, ESLint, and the **React Compiler** (automatic memoization)
- **CLAUDE.md** — project conventions so your AI assistant writes correct, current Expo code

## Requirements

- [Node.js](https://nodejs.org) 22.13 or newer
- For local builds: Xcode (Mac only) for iOS, Android Studio for Android
- Or a free [Expo account](https://expo.dev) to compile in the cloud with [EAS Build](https://docs.expo.dev/build/introduction/) — no Xcode or Android Studio needed

## Get started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Build and install the app once. Locally, with Xcode / Android Studio installed:

   ```bash
   npm run ios       # iOS Simulator
   npm run android   # Android Emulator
   ```

   Or in the cloud with EAS (link your Expo account first, then build):

   ```bash
   npm install -g eas-cli   # once
   eas init
   eas build --profile development --platform ios       # iPhone
   eas build --profile development --platform android   # Android device
   ```

3. Develop:

   ```bash
   npm start
   ```

   The dev server connects to your installed development build — from here on it's instant reloads. Press `w` to open the web version.

You only need to rebuild the native app when you add a library containing native code that isn't already pre-installed — the common ones already are.

## Project structure

```
src/
├── app/            # Screens — each file is a route (Home, Settings)
├── components/
│   ├── ui/         # Button, Card, Input, Text
│   ├── error/      # Error boundaries
│   ├── AppTabs     # Tab bar (native + web variants)
│   └── Screen      # Shared screen scaffold (safe areas, tab insets, max width)
├── hooks/          # useColors, useIsDark, useColorScheme
├── lib/            # theme.ts (design tokens), storage.ts (AsyncStorage helpers)
└── stores/         # Zustand stores (theme mode, persisted on device)
```

## Where to make changes

- Screens live in `src/app/` — each file is a route ([file-based routing](https://docs.expo.dev/router/introduction/)); wrap screen content in the shared `Screen` component
- Colors, spacing, and typography all come from `src/lib/theme.ts` — change the tokens there and the whole app follows
- Reusable components live in `src/components/ui/`
- Global state goes in `src/stores/` (see `themeStore.ts` for the persisted-store pattern)

Add new libraries with `npx expo install <package>` (not plain `npm install`) so versions stay compatible with the SDK.

## Useful commands

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript
```

## License

© Kealy Studio. Provided to students of the App Dev with AI course for use in their own projects. Not for redistribution as a starter kit.
