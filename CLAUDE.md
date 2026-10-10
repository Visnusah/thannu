# CLAUDE.md

Expo SDK 56 app — React Native 0.85, React 19.2.3, TypeScript (strict), file-based routing via expo-router. Runs on iOS, Android, and web with no backend. Uses **development builds** — Expo Go is NOT supported and must never be suggested (the app pre-installs native modules, and the Expo Go app in the stores lags behind SDK 56).

## App identity

This app is **thannu**. It is already configured:
- `app.json`: `name` and `slug` are `thannu`, `scheme` is `thannu`, `ios.bundleIdentifier` and `android.package` are `com.visnusah.thannu`
- `package.json`: `name` is `thannu`

No renaming is needed. Start building features directly.

## Expo has changed — check the docs first

Your training data on Expo is likely stale. Consult the official docs before writing code — do not use patterns from older SDKs from memory:

- https://docs.expo.dev/llms.txt — index of all AI-formatted documentation files
- https://docs.expo.dev/llms-full.txt — complete Expo docs (Expo Router, development process)
- https://docs.expo.dev/llms-sdk.txt — complete Expo SDK module docs
- https://docs.expo.dev/versions/v56.0.0/ — versioned docs for this exact SDK

## Development builds & EAS

The app runs in a development build (`expo-dev-client`), installed once per simulator/device:

- **Local build**: `npm run ios` / `npm run android` (`expo run:*`). Needs Xcode / Android Studio. Native projects are generated on the fly; `ios/` and `android/` stay gitignored (CNG).
- **Cloud build**: needs the EAS CLI installed globally — `npm install -g eas-cli` (the package is `eas-cli`; `npx eas` does not work). `eas init` links the project to the user's Expo account (it writes `extra.eas.projectId` and `owner` into `app.json` — let `eas init` write them; never hardcode them by hand). Then `eas build --profile development` and install the build on the device (internal distribution). Build profiles live in `eas.json` — there are exactly three: `development`, `production` (store submission), and `release` (a production-grade Android `.apk` for internal distribution — `eas build --platform android --profile release` — installable and shareable directly, unlike the Play-Store-only `.aab` that `production` produces on Android).
- **Day-to-day**: once a build is installed, `npm start` is all that's needed. A native rebuild is only required when adding a package with native code that isn't already pre-installed (see Installed libraries — the common ones are).

## Commands

- `npm start` — start the dev server; connects to the installed development build (press `w` for web)
- `npm run ios` / `npm run android` — compile and install the native app locally (first run, or after adding a new native module)
- `npm run lint` — ESLint via `expo lint`
- `npm run typecheck` — TypeScript check via `tsc --noEmit`

Install libraries with `npx expo install <package>` — never plain `npm install` for runtime packages. It picks versions compatible with SDK 56.

## Project structure

```
src/
├── app/                  # Expo Router file-based routing
│   ├── _layout.tsx       # Root layout: ErrorBoundary, ThemeProvider, tabs, splash gating
│   ├── index.tsx         # Home screen
│   └── settings.tsx      # Settings screen (theme mode picker)
├── components/
│   ├── ui/               # UI primitives (Button, Card, Input, Text)
│   ├── error/            # Error boundaries (ErrorBoundary, ScreenErrorBoundary)
│   ├── AppTabs.tsx       # Tab bar (native tabs; AppTabs.web.tsx for web)
│   └── Screen.tsx        # Shared screen scaffold (safe areas, tab insets, max width)
├── hooks/                # Global hooks (useColors, useIsDark, useColorScheme)
├── lib/                  # theme.ts (design tokens), storage.ts (AsyncStorage helpers)
└── stores/               # Global Zustand stores (themeStore)
```

- Path aliases: `@/*` → `src/*`, `@/assets/*` → `assets/*` (see `tsconfig.json`).
- **Barrels are each folder's public API.** From outside a folder, import through its `index.ts` barrel — `@/components/ui`, `@/components/error`, `@/components` (shared components like `Screen`, `AppTabs`), `@/hooks`, `@/stores`, `@/lib`. Within a folder, use relative imports. When you add a module, export it from its folder's barrel.
- Platform-specific files: `Component.web.tsx` overrides `Component.tsx` on web (see `AppTabs`, `useColorScheme`). Prefer this over inline `Platform.OS` branching for anything non-trivial.
- New features with data logic go in `src/features/<feature>/` with hooks (e.g. `src/features/notes/hooks/useNotes.ts`), keeping screens thin.

## Theme system — CRITICAL

**All colors, spacing, typography, and border radius values MUST come from `src/lib/theme.ts`.** Never use inline colors or hardcoded style values without explicit user approval.

Tokens: `lightColors` / `darkColors` (`background`, `surface`, `text`, `secondary`, `tertiary`, `border`, `primary`, `accent`, `danger`, `warning`, `success`, `onDanger`), `spacing` (xs–xl), `fontSize` (xs–3xl), `fontWeight`, `borderRadius` (sm/md/lg/full), `Fonts` (per-platform font stacks), and the layout constants `BottomTabInset`, `TopTabInset`, `MaxContentWidth`.

Get theme-aware colors with the `useColors()` hook, and follow the `createStyles` pattern:

```tsx
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { useColors } from '@/hooks'
import { spacing, borderRadius, type Colors } from '@/lib'

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderColor: colors.border,
    },
  })

function MyComponent() {
  const colors = useColors()
  const styles = useMemo(() => createStyles(colors), [colors])

  return <View style={styles.container}>…</View>
}
```

Acceptable exceptions (no token needed): layout props (`flex`, `flexDirection`, `alignItems`, `justifyContent`, positioning), relative sizing (`width: '100%'`), fixed dimensions for images, icons, and decorative elements (and small layout maxima like a button column's `maxWidth`), platform shadow values, and `opacity` for pressed/disabled states or subtle decorative accents.

The theme mode (light/dark/system) lives in `src/stores/themeStore.ts`, persisted with AsyncStorage. The Settings screen changes it; `useColors()`/`useIsDark()` respect it everywhere automatically. In non-hook contexts (class components), resolve colors with `resolveIsDark` + `getColors` from `@/lib` — see `ErrorBoundary` for the pattern.

## Component architecture

- **Screen scaffold** (`src/components/Screen.tsx`): every screen renders its content inside `Screen`. It provides the themed background, safe-area padding, clearance for the floating tab bars, and a centered max-width column on wide viewports. Props: `scroll` (wraps content in a ScrollView) and `centered` (vertically centers hero-style content). Don't hand-roll safe-area or tab-inset handling in screens.
- **UI primitives** (`src/components/ui/`): `Button` (variants: primary, secondary, outline, ghost, danger; sizes sm/md/lg; `loading`, `fullWidth`, `leftIcon`), `Card` (surface container: padded, bordered panel with a `gap` between children), `Input` (label, error, hint, icons, password toggle), `Text` (variants: h1, h2, h3, body, bodySmall, caption, label, code; `color` and `weight` props — each `color` value maps to the theme token of the same name). Import from the barrel: `import { Button, Text } from '@/components/ui'`.
- **Error boundaries** (`src/components/error/`): the root layout is wrapped in `ErrorBoundary`. Always wrap screen components with `ScreenErrorBoundary`:

```tsx
export default function MyScreen() {
  return (
    <ScreenErrorBoundary screenName="My Screen">
      <MyScreenContent />
    </ScreenErrorBoundary>
  )
}

function MyScreenContent() {
  return <Screen scroll>…</Screen>
}
```

- **Screen-specific components** stay in the screen file. Only extract to `src/components/` when reused across screens.

## State & persistence

- **Client state**: Zustand stores in `src/stores/`. For state that should survive restarts, use the `persist` middleware with AsyncStorage — see `themeStore.ts` for the pattern. The root layout holds the splash screen until the theme store has rehydrated (`useThemeHydration`), so the first frame renders in the correct theme.
- **One-off persistence**: the typed `storage` helper in `src/lib/storage.ts` (JSON over AsyncStorage).
- There is no backend in this app. Data lives on-device.

## Installed libraries

Use these for their respective purposes. Do not introduce alternatives without explicit user approval.

| Purpose | Library |
|---------|---------|
| Navigation | `expo-router` (file-based; native tabs in `AppTabs.tsx`, web tabs in `AppTabs.web.tsx`) |
| Development builds | `expo-dev-client` |
| Images | `expo-image` — always use instead of React Native's `Image` |
| Animations | `react-native-reanimated` |
| Gestures | `react-native-gesture-handler` |
| Storage | `@react-native-async-storage/async-storage` |
| State management | `zustand` (stores in `src/stores/`) |
| Icons | `@expo/vector-icons` (Ionicons); native tab icons use `sf`/`md` props on `NativeTabs.Trigger.Icon` |
| Camera | `expo-camera` (permissions configured in `app.json`) |
| Photo picking | `expo-image-picker` |
| Photo library | `expo-media-library` |
| Location | `expo-location` |
| Local notifications | `expo-notifications` — for on-device scheduled/local notifications only; push (remote) notifications are not set up |
| Haptics | `expo-haptics` |
| Video playback | `expo-video` |
| SVG | `react-native-svg` |
| Gradients / blur | `expo-linear-gradient`, `expo-blur` |
| Web content | `react-native-webview` |
| Utilities | `expo-clipboard`, `expo-sharing`, `expo-file-system` |

The device-capability modules (camera, location, media, etc.) are pre-installed even though the app code doesn't use them yet — this is deliberate, so their native code is already included in every development and EAS build and adding a feature never requires a rebuild. Use these instead of introducing alternatives. Pure-JS libraries can be added freely at any time.

## Conventions

- **React Compiler is enabled** (`experiments.reactCompiler` in `app.json`) — it handles memoization automatically. The explicit `useMemo` in the `createStyles` pattern is part of the shared convention; don't add further manual memoization.
- **Typed routes are enabled** (`experiments.typedRoutes`). Route strings passed to `Link` / `router` are type-checked; run the dev server once to regenerate types after adding routes.
- **React 19**: `ref` is a regular prop on function components — don't use `forwardRef` (see `Input` for the pattern).
- File naming: PascalCase for components (`Button.tsx`, `AppTabs.tsx`), camelCase for hooks/stores/lib (`useColors.ts`, `themeStore.ts`).
- **No test framework is set up.** If the user asks for tests, propose a setup (e.g. Jest + React Native Testing Library) and agree on it before adding dependencies.
- App config lives in `app.json` (name, slug, scheme, icons, splash screen) and `eas.json` (build profiles). `app.json` changes require restarting the dev server; changes that add native configuration require a new development build.
