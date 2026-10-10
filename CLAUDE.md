# CLAUDE.md — Thannu

Project memory for Claude Code. Read this first, then `design.md` for all UI specs.

## 1. Project in one paragraph

**Thannu** is an **iPhone-only** app (built with **Expo Go**) that centralizes posts/links saved from Instagram, TikTok, YouTube, X, Reddit, Pinterest and the web — and **reminds you to actually revisit them**. Differentiators: (1) **reminders + notifications** on saves, (2) **priority flags on folders** that control reminder cadence. Backend: **Firebase** (Auth + Firestore). UI language: colorful neo-brutalist "sticker" style (see `design.md`).

**Who:** casual savers, shoppers, students, creators whose "Saved" tabs are graveyards.
**Why:** competitors (Tuckii etc.) solve *storage and search*; Thannu solves *forgetting*.
**What/How:** share/paste → organize into collections → priority + reminders → nudge → act.

## 2. Hard constraints (Expo Go, iPhone)

Expo Go can only run native code that ships inside Expo Go. Therefore:

| Do | Don't |
|---|---|
| Firebase **JS SDK** (`firebase` modular v10+) | `@react-native-firebase/*` (needs dev build) |
| `expo-notifications` **local** notifications | Remote push / APNs setup (not in MVP) |
| `expo-clipboard` paste-to-save | iOS **Share Extension** (needs dev build — see §12) |
| Anonymous + email/password auth | Google / Apple sign-in (needs dev build for reliable setup) |
| `expo-router`, `expo-haptics`, `expo-image`, `expo-linking` | Any library with custom native modules not in Expo Go |
| `expo-document-picker`, `expo-file-system`, `expo-sharing` for import/export | Payments (RevenueCat/StoreKit need dev build) → stub paywall |

Target: iOS only. Don't write Android-specific code or Platform checks for Android. Use iOS hard-shadow props directly (`shadowRadius: 0`).

## 3. Stack

- Expo (latest SDK supported by the current Expo Go from the App Store) + **TypeScript (strict)**
- **Expo Router** (file-based, stack navigation, no tab bar)
- State: **Zustand** (UI/session) + Firestore `onSnapshot` for data
- Firebase: Auth (anonymous → linkable to email), Firestore
- Lists: `@shopify/flash-list`
- Animation: `react-native-reanimated`, `react-native-gesture-handler`
- Icons: `lucide-react-native` + `react-native-svg`, brand glyphs from `@expo/vector-icons`
- Fonts: `@expo-google-fonts/bricolage-grotesque`, `@expo-google-fonts/plus-jakarta-sans`
- Dates: `date-fns`
- Validation: `zod`

### Setup commands

```bash
npx create-expo-app@latest thannu --template blank-typescript
cd thannu
npx expo install expo-router expo-notifications expo-haptics expo-clipboard expo-image \
  expo-linking expo-font expo-constants expo-document-picker expo-file-system expo-sharing \
  expo-splash-screen expo-status-bar react-native-reanimated react-native-gesture-handler \
  react-native-screens react-native-safe-area-context react-native-svg \
  @react-native-async-storage/async-storage @shopify/flash-list \
  @expo-google-fonts/bricolage-grotesque @expo-google-fonts/plus-jakarta-sans
npm i firebase zustand zod date-fns lucide-react-native
npx expo start        # scan QR with iPhone Camera → opens in Expo Go
```

Always install Expo-compatible versions with `npx expo install`, not plain `npm i`, for Expo packages.

## 4. Folder structure

```
thannu/
├─ app/                          # Expo Router
│  ├─ _layout.tsx                # fonts, auth gate, notification handlers
│  ├─ index.tsx                  # Home
│  ├─ onboarding.tsx
│  ├─ today.tsx                  # due + priority backlog
│  ├─ review.tsx                 # new saves inbox
│  ├─ search.tsx
│  ├─ settings.tsx
│  ├─ paywall.tsx                # stub
│  ├─ collection/[id].tsx
│  ├─ link/[id].tsx
│  ├─ save.tsx                   # formSheet
│  ├─ collection-editor.tsx      # formSheet
│  └─ remind.tsx                 # formSheet
├─ src/
│  ├─ design/                    # tokens.ts, fonts.ts
│  ├─ components/                # Button, IconButton, Card, Chip, TagChip, Banner,
│  │                             # CollectionCard, LinkCard, StatTile, PrioritySelector, …
│  ├─ firebase/                  # config.ts, auth.ts, firestore.ts (typed converters)
│  ├─ services/                  # collections.ts, links.ts, tags.ts, reminders.ts,
│  │                             # metadata.ts, importExport.ts
│  ├─ notifications/             # engine.ts, categories.ts, handlers.ts
│  ├─ store/                     # session.ts, ui.ts
│  ├─ hooks/                     # useCollections, useLinks, useDueLinks, useClipboardUrl
│  ├─ types/                     # models.ts (entities), enums.ts
│  └─ utils/                     # url.ts, hash.ts, dates.ts, parsers/{csv,html,json}.ts
├─ firestore.rules
├─ firestore.indexes.json
├─ .env                          # EXPO_PUBLIC_FIREBASE_* (never commit)
├─ design.md
└─ CLAUDE.md
```

Use path alias `@/` → `src/` (tsconfig `paths`).

## 5. Conventions

- TypeScript strict, **no `any`**. Zod-validate all data read from Firestore and imported files.
- Components: function components, named exports, props typed. Styles via `StyleSheet.create` using tokens from `@/design/tokens` — **no hard-coded colors/sizes**.
- Every pressable uses the shared `Pressable` wrapper with press-in animation + optional haptic.
- Firestore access only through `src/services/*` (screens never call Firestore directly).
- Timestamps: Firestore `Timestamp` in DB, `Date` in UI (convert in converters).
- Soft delete (`deletedAt`) for links; hard delete only on "empty trash"/account deletion.
- Batch writes ≤ 400 ops (Firestore limit 500).
- Keep files < 300 lines; split components.
- Commit style: `feat:`, `fix:`, `chore:`, `docs:`.
- Do not add dependencies that aren't Expo Go compatible. If unsure, check Expo docs/directory first.

## 6. Firebase setup

`.env`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

`src/firebase/config.ts`:
```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

const isNew = getApps().length === 0;
export const app = isNew ? initializeApp(firebaseConfig) : getApp();

export const auth = isNew
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : (await import('firebase/auth')).getAuth(app);

// Long-polling avoids flaky WebChannel connections in Expo Go
export const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
```
(If TypeScript complains about `getReactNativePersistence`, add a one-line `// @ts-ignore` — known typing gap. Avoid top-level await if the Metro target rejects it; use plain `getAuth` in a separate branch.)

Firebase console to-do: create project → add iOS app (bundle id placeholder) → enable **Authentication → Anonymous** and **Email/Password** → create **Firestore (production mode)** → deploy rules and indexes below.

**Known limits:** Firestore JS SDK in React Native has **no persistent offline cache** (memory only). Mitigate by caching last collections/links snapshot in AsyncStorage (zustand `persist`) so Home renders instantly offline.

## 7. Data model (Firestore)

All user data lives under `users/{uid}`. Doc IDs = Firestore auto IDs unless noted.

### 7.1 Entities overview

| Entity | Path | Purpose |
|---|---|---|
| **User** | `users/{uid}` | profile, plan, settings, counters |
| **Collection** | `users/{uid}/collections/{collectionId}` | folder with color/icon/**priority**/cadence; supports nesting |
| **Link** | `users/{uid}/links/{linkId}` | a saved post/link with metadata, tags, note, reminder info |
| **Tag** | `users/{uid}/tags/{tagId}` | tag name, color, usage count (id = slug) |
| **Reminder** | `users/{uid}/reminders/{reminderId}` | scheduled nudge (per-link or per-collection digest) |

Relationships: User 1—N Collection · Collection 1—N Link (`collectionId`, null = Unsorted) · Collection 1—N Collection (`parentId`) · Link N—N Tag (via `tags: string[]` of slugs) · Link/Collection 1—N Reminder.

### 7.2 Enums (`src/types/enums.ts`)

```ts
export type Priority = 'none' | 'low' | 'medium' | 'high';
export type Cadence = 'off' | 'daily' | 'every3days' | 'weekly';
export type SourceKey = 'instagram' | 'tiktok' | 'youtube' | 'x' | 'reddit' | 'pinterest' | 'web';
export type MediaType = 'link' | 'image' | 'video';
export type Intent = 'read' | 'watch' | 'buy' | 'try' | 'reference';
export type ColorKey = 'orange'|'blue'|'mint'|'lime'|'sun'|'coral'|'violet'|'pink'|'brown'|'tan'|'slate'|'ink';
export type IconKey = 'utensils'|'plane'|'zap'|'home'|'book-open'|'coffee'|'heart'|'dumbbell'|'tv'|'shopping-bag'|'briefcase'|'music'|'camera'|'gift'|'star'|'graduation-cap';
export type ReminderKind = 'link' | 'collection-digest' | 'new-saves';
export type ReminderStatus = 'scheduled' | 'fired' | 'snoozed' | 'done' | 'cancelled';
export type Plan = 'free' | 'pro';

export const DEFAULT_CADENCE: Record<Priority, Cadence> = {
  high: 'daily', medium: 'every3days', low: 'weekly', none: 'off',
};
```

### 7.3 User — `users/{uid}`

| Field | Type | Req | Notes |
|---|---|---|---|
| displayName | string \| null | | |
| email | string \| null | | null while anonymous |
| isAnonymous | boolean | ✓ | |
| plan | Plan | ✓ | default `free` |
| onboardingDone | boolean | ✓ | |
| settings.hapticsEnabled | boolean | ✓ | default true |
| settings.remindersEnabled | boolean | ✓ | master switch, default true |
| settings.newSaveReminders | boolean | ✓ | default true |
| settings.priorityNudges | boolean | ✓ | default true |
| settings.digestTime | string `HH:mm` | ✓ | default `09:00` |
| settings.quietHoursStart | string `HH:mm` \| null | | default `22:00` |
| settings.quietHoursEnd | string `HH:mm` \| null | | default `08:00` |
| settings.timezone | string (IANA) | ✓ | from device |
| counters.collections / links / pinned / tags | number | ✓ | maintained with `increment()` in the same batch as the write |
| lastBackupAt | Timestamp \| null | | shown in Settings |
| createdAt / updatedAt | Timestamp | ✓ | |

### 7.4 Collection — `users/{uid}/collections/{id}`

| Field | Type | Req | Notes |
|---|---|---|---|
| name | string (1–40) | ✓ | |
| icon | IconKey | ✓ | |
| color | ColorKey | ✓ | |
| parentId | string \| null | ✓ | one level of nesting max for MVP |
| **priority** | Priority | ✓ | default `none` |
| **cadence** | Cadence | ✓ | default from `DEFAULT_CADENCE[priority]`, overridable |
| **reminderTime** | string `HH:mm` \| null | | null → use `settings.digestTime` |
| itemCount | number | ✓ | active (non-deleted) links |
| newCount | number | ✓ | links with `reviewedAt == null` |
| sortOrder | number | ✓ | manual ordering |
| createdAt / updatedAt | Timestamp | ✓ | |
| archivedAt | Timestamp \| null | | |

"Unsorted" is **virtual** (`collectionId = null`), not a document.

### 7.5 Link — `users/{uid}/links/{id}`

| Field | Type | Req | Notes |
|---|---|---|---|
| url | string | ✓ | as shared |
| normalizedUrl | string | ✓ | strip tracking params (`utm_*`, `igshid`, `si`, …), lowercase host; used for duplicate detection |
| title | string | ✓ | auto-filled, user-editable |
| description | string | | |
| imageUrl | string \| null | | |
| siteName | string | | |
| source | SourceKey | ✓ | derived from host |
| mediaType | MediaType | ✓ | |
| collectionId | string \| null | ✓ | null = Unsorted |
| collectionPriority | Priority | ✓ | **denormalized** from collection; update all links when collection priority changes (batched) |
| tags | string[] | ✓ | tag slugs, lowercase |
| note | string | | |
| intent | Intent \| null | | "why I saved this" |
| isPinned | boolean | ✓ | |
| reviewedAt | Timestamp \| null | ✓ | null = "new" (shows NEW badge, counts in review inbox) |
| doneAt | Timestamp \| null | | set by "Mark done" → stops reminders |
| nextReminderAt | Timestamp \| null | | denormalized earliest pending per-link reminder |
| lastOpenedAt | Timestamp \| null | | |
| openCount | number | ✓ | default 0 |
| metaStatus | 'pending' \| 'ok' \| 'failed' | ✓ | |
| createdAt / updatedAt | Timestamp | ✓ | |
| deletedAt | Timestamp \| null | | soft delete |

### 7.6 Tag — `users/{uid}/tags/{slug}`

| Field | Type | Notes |
|---|---|---|
| name | string | display, e.g. `recipes` |
| color | ColorKey | assigned from palette by hash of slug |
| count | number | usage count (increment/decrement) |
| createdAt | Timestamp | |

### 7.7 Reminder — `users/{uid}/reminders/{id}`

| Field | Type | Notes |
|---|---|---|
| kind | ReminderKind | |
| linkId | string \| null | for `link` |
| collectionId | string \| null | for `collection-digest` |
| fireAt | Timestamp | next fire time |
| repeat | Cadence | `off` for one-shot |
| status | ReminderStatus | |
| snoozedUntil | Timestamp \| null | |
| notificationId | string \| null | `expo-notifications` local identifier (device-specific; re-created on each reschedule) |
| createdAt | Timestamp | |

### 7.8 Composite indexes (`firestore.indexes.json`)

- `links`: `collectionId ASC, deletedAt ASC, createdAt DESC`
- `links`: `isPinned ASC, deletedAt ASC, createdAt DESC`
- `links`: `reviewedAt ASC, deletedAt ASC, createdAt DESC` (review inbox)
- `links`: `tags ARRAY_CONTAINS, deletedAt ASC, createdAt DESC`
- `links`: `source ASC, deletedAt ASC, createdAt DESC`
- `links`: `collectionPriority ASC, doneAt ASC, createdAt DESC` (priority backlog)
- `links`: `nextReminderAt ASC, doneAt ASC` (due list)
- `collections`: `parentId ASC, sortOrder ASC`

### 7.9 Security rules (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{sub=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```
Tighten later with field validation (string lengths, enum membership, `plan` not client-writable once billing exists).

## 8. Reminder & notification engine (core differentiator)

Local notifications only (`expo-notifications`). Lives in `src/notifications/engine.ts`.

### 8.1 Rules

1. **iOS allows max 64 pending local notifications.** Budget **≤ 60**. Priority of slots: per-link one-shots > High digests > Medium > Low > new-saves nudge.
2. Use **digest notifications per priority collection**, not one per link. Count is computed at schedule time (body text can go slightly stale; refreshed on every app foreground).
3. Cadence → trigger:
   - `daily` → `DAILY` calendar trigger at `reminderTime ?? digestTime`
   - `weekly` → `WEEKLY` calendar trigger (weekday = day created, hour/min from time)
   - `every3days` → schedule the **next 8 one-shot date triggers** spaced 3 days apart; refill on each app open
   - `off` → nothing
4. **Quiet hours:** if a fire time falls inside quiet hours, shift to `quietHoursEnd`.
5. **Skip empty digests:** if a collection has 0 non-done, non-deleted links, don't schedule.
6. **New-saves nudge:** if any link has `reviewedAt == null` and `newSaveReminders` on → one date trigger ~3 h after the latest unreviewed save (respect quiet hours). Body: "5 new saves waiting".
7. **Per-link reminder** (RemindPicker): one-shot date trigger; writes a `Reminder` doc and sets `link.nextReminderAt`.
8. `rescheduleAll()` runs: on app launch, on foreground, and after any mutation affecting priority, cadence, links done/deleted, or settings. Implementation: cancel all app-scheduled notifications → recompute → schedule.
9. Master switch `remindersEnabled = false` → cancel everything.

### 8.2 Categories & actions

Register category `THANNU_REMINDER` with actions: **Open**, **Snooze 1h**, **Tomorrow**, **Done**. (Verify action behavior in Expo Go on a real iPhone; fall back to tap-to-open only if unsupported.)

Notification `data` payload: `{ type: 'link'|'collection'|'new', linkId?, collectionId? }`. Handler routes: link → `/link/[id]`, collection → `/collection/[id]`, new → `/review`, due → `/today`.

### 8.3 Permission flow

Ask only after the user sees value: onboarding slide 3 ("Turn on reminders") or first time they set a priority/remind. If denied: show inline "Reminders are off — enable in Settings" with `Linking.openSettings()`.

### 8.4 Foreground behavior

`Notifications.setNotificationHandler` → show banner + sound while app is open only for per-link reminders; suppress digests in foreground (show in-app Due banner instead).

## 9. Metadata fetching ("It fills itself in")

`src/services/metadata.ts` → `fetchMetadata(url): Promise<Meta>` — client-side, with timeout 6 s:

1. Normalize URL; derive `source` from host.
2. Source-specific oEmbed (no API key): **TikTok** `https://www.tiktok.com/oembed?url=…`, **YouTube** `https://www.youtube.com/oembed?url=…&format=json`.
3. Otherwise fetch HTML with a browser-like `User-Agent` and parse `og:title`, `og:description`, `og:image`, `og:site_name` (+ `twitter:*`, `<title>` fallback).
4. **Instagram / X / Reddit often block or return login walls** → on failure save with `metaStatus='failed'`, title = `"<Source> post"`, image null → render source-colored placeholder; user can edit title (pencil) and tap **Refresh** to retry.
5. Never block saving on metadata: write the link immediately with `metaStatus='pending'`, then update when the fetch resolves.
6. Optional later: Cloud Function proxy (needs Firebase Blaze plan) for reliability.

Duplicate detection: if `normalizedUrl` already exists → show "Already saved in <Collection>" with **Open** / **Save anyway**.

## 10. Import / export

- **Export:** JSON `{ version, exportedAt, collections[], links[], tags[] }` → `expo-file-system` write → `expo-sharing`. Update `lastBackupAt`.
- **Restore:** pick JSON → zod-validate → confirm (merge vs replace) → batched writes.
- **Import bookmarks:** CSV (`url,title,tags,collection`), Netscape **HTML** bookmarks (`<DT><A HREF ADD_DATE TAGS>` with `<H3>` folders), **JSON** (array of `{url,title,tags,collection}`). Imported links get `reviewedAt = now` (don't flood the review inbox). Show progress; batch ≤ 400.

## 11. Business rules (assumptions — validate)

- **Free:** unlimited saves & collections, up to **3 priority folders**, daily digest + one-shot reminders (max 20 active), export.
- **Pro (stub for now):** unlimited priority folders & reminders, custom cadence/time per folder, cross-device sync after account creation, backup restore, tags unlimited.
- Anonymous users can use everything in Free; "Create account" links the anonymous user via `linkWithCredential` so data isn't lost.

## 12. Known limitations & upgrade path

1. **Share sheet:** Expo Go can't register an iOS Share Extension. MVP uses **paste-to-save + clipboard detection**. To get "Share → Thannu", move to a **development build** (EAS) and add `expo-share-intent` (config plugin). Plan this right after MVP — it's the core capture UX.
2. **Remote push** (server-triggered nudges) needs a dev build + APNs credentials. Not needed while all reminders are local.
3. **Apple/Google sign-in & in-app purchase** → dev build.
4. **Firestore offline** is memory-only in RN JS SDK → cache snapshot locally.
5. Instagram metadata is unreliable (see §9).

## 13. Milestones (build in this order; each ends runnable in Expo Go)

| # | Milestone | Done when |
|---|---|---|
| M0 | Scaffold: Expo Router, TS strict, alias, fonts, tokens, Pressable w/ press-in + haptics | Dev screen shows all components in all variants |
| M1 | Firebase config + anonymous auth + user doc bootstrap + rules/indexes deployed | App launches, creates `users/{uid}` once |
| M2 | Collections CRUD (grid, editor sheet, icon/color picker, nesting) | Create/edit/delete collections; counts correct |
| M3 | Save flow: paste → Save sheet → metadata → write link; duplicate check | Paste a TikTok/YouTube/web URL → card appears with title+image |
| M4 | Collection detail + LinkCard grid + filters + Link detail (pin, move, refresh, delete, tags, notes) | Matches screenshot-2 layout |
| M5 | Search + Library stats + tag cloud + tag filtering | Live search across titles/tags/notes |
| M6 | Review inbox (Keep/Pin/Remind later/Delete) + `NEW` badges + mint banner | Inbox zero state works |
| M7 | **Priority folders** (selector, flag badge, cadence defaults, denormalized `collectionPriority`) | Changing priority updates all links in batch |
| M8 | **Reminder engine** (permissions, digests, one-shots, snooze, quiet hours, routing, Today screen, violet banner) | Set High on a folder → daily notification fires at chosen time; tap routes correctly |
| M9 | Settings (prefs, export/restore, import, account upgrade) | Round-trip backup works |
| M10 | Onboarding, empty states, paywall stub, polish, accessibility pass | Checklist in `design.md` §12 all ticked |

## 14. Definition of done (every task)

- Runs in Expo Go on a physical iPhone, no red/yellow screens.
- No TypeScript errors (`npx tsc --noEmit`) and lint passes.
- Uses design tokens; matches `design.md` for the screen.
- Firestore reads/writes go through services; indexes added if a new query needs one.
- Reminder-affecting changes call `rescheduleAll()`.
- Loading, empty, and error states handled.

## 15. Things Claude must NOT do

- Don't introduce native modules, `react-native-firebase`, or anything requiring a dev build without asking.
- Don't store secrets in code; use `EXPO_PUBLIC_*` env only for non-secret Firebase web config.
- Don't copy Tuckii's mascot, logo, copy or illustrations.
- Don't schedule one notification per link at scale (64-notification cap).
- Don't block the UI on metadata fetch.
- Don't write directly to Firestore from components.
- Don't use `localStorage`; use AsyncStorage.