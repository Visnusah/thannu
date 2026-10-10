# Thannu — design.md

> Save it. Get reminded. Never lose it again.

Design system + screen specs for the **Thannu iPhone app** (Expo Go, React Native).
Inspired by the *flow* of Tuckii's screenshots (share → organize → find), re-skinned with an original identity and extended with Thannu's differentiators: **reminders, notifications, and priority-flagged folders**.

> Originality rule: borrow the *patterns* (neo-brutalist stickers, collection grid, tag cloud, detail card). Do **not** copy Tuckii's mascot, logo, copy, or illustrations. Thannu gets its own mascot and palette accents (see §4).

---

## 1. What the Tuckii screenshots show (analysis)

| # | Screenshot | Observed pattern | What Thannu does with it |
|---|---|---|---|
| 1 | "Moving from Pocket?" (blue bg) | Settings screen: yellow **Plan card** with Pro badge + mascot; **Preferences** toggles (Haptic Feedback, *New Save Reminders*); **Your data** (Export / Restore backup, last-backup timestamp); **Import from other apps** (CSV / HTML / JSON); **Support → How To**. Rotated `#CSV #HTML #JSON` tag stickers as decoration | Keep the same sections. Expand Preferences with priority nudges, digest time, quiet hours |
| 2 | "It fills itself in." (orange bg) | **Link detail**: full-bleed hero image, back button (left) + **pin** button (right, yellow), overlapping white card: source chip, bold title + edit pencil, collection chip + timestamp, big yellow **Open link** button with URL + black arrow circle, 4-up action row **Share / Move / Refresh / Delete (red)**, Description (+ "Show more"), **Tags** chips with ✕ and "+ Add", **Notes** in cream box | Same layout. Add **Priority/Remind** row between action row and description |
| 3 | "Find anything by #tag." (green bg) | **Search** bar + Cancel; yellow **Your Library** stat card (Collections / Saves / Pinned / Tags — selected stat is highlighted); **tag cloud** of colorful, tilted, tag-shaped chips with count badges | Same. Add a 5th lens: **Due** (reminders pending) |
| 4 | "Every save. One home." (yellow bg) | **Home**: gear / add-folder / search icon buttons; huge title "Save now. Find anytime."; **quick-save field** (`#` icon, "Paste link to quick save", clipboard icon) + yellow `+`; **mint banner** "5 new saves waiting — Review now"; **My Collections** 2-col grid of cards with colored top tab, colored icon tile, item count, `NEW` badge, title bottom-left; some show "2 folders" (nested) | Same. Banner becomes **violet "Due" banner** when reminders are due; mint banner stays for unreviewed saves. Add flag badge on priority collections |
| 5 | "Share from any app / Organize without the busywork / Find it when you need it" | 3-step flow. iOS share sheet → pick collection **or let it wait in Unsorted** → one search box, filter by **links / images / pinned**. Collection grid with `5 NEW` chips. Link grid = 2-col image cards with colored **category label on image**, pin icon top-right, 2-line title, footer `TikTok • 23h` + kebab menu, `NEW` ribbon | Same flow. Add **"Remind me"** step to the save sheet |
| 6 | "Helpful guides" | Content marketing cards with mascot on pastel backgrounds | Out of scope for app; reuse pastel set for onboarding/empty states |

**Style DNA (shared by all screenshots):** thick near-black outlines · hard offset black drop-shadows (no blur) · big rounded corners · very heavy tight-tracked headline font · saturated flat colors (yellow, orange, blue, mint, lime, coral, violet, pink) · off-white app canvas · playful tilted "sticker" elements · square icon buttons · uppercase letter-spaced section labels.

**Structural DNA:** no bottom tab bar. Home is the hub; everything is reached from header icons, banner, cards, and sheets.

---

## 2. Design principles

1. **Sticker UI** — every interactive surface looks like a physical sticker: border + hard shadow + press-in.
2. **One-tap capture** — saving must never need more than: share/paste → (optional collection) → done.
3. **Nudge, don't nag** — reminders are warm, specific, and snoozable. Never more than the user's cadence allows.
4. **Priority is visible** — a flagged folder must be recognizable from across the room (flag badge + colored tab ring).
5. **Color = meaning** — each collection owns a color; priority has its own color scale; violet = reminders/due.
6. **Instant feedback** — haptics on save, pin, delete, snooze, done.

---

## 3. Design tokens

### 3.1 Colors

```ts
// src/design/tokens.ts
export const colors = {
  ink: '#121212',        // text, borders, shadows
  paper: '#F7F6F2',      // app canvas
  cream: '#FFF7E6',      // notes box, soft surfaces
  white: '#FFFFFF',      // cards

  sun: '#FFC93C',        // PRIMARY action (yellow)
  sunSoft: '#FFE29A',    // selected stat tile, hover
  blue: '#3B7BE8',
  orange: '#FF6B1A',
  mint: '#19BE95',
  mintSoft: '#E3F7EF',   // "new saves waiting" banner
  lime: '#A3E635',
  coral: '#FF5A5F',      // destructive + HIGH priority
  violet: '#7C4DFF',     // reminders / due  (Thannu signature)
  violetSoft: '#ECE5FF', // due banner bg
  pink: '#FFB4CC',
  brown: '#8B5A2B',
  tan: '#EBD9A8',
  slate: '#5E7A9E',

  textMuted: '#5B5B5B',
  line: '#D9D7D0',
} as const;

// Collection / tag palette (user-selectable)
export const palette = [
  'orange','blue','mint','lime','sun','coral','violet','pink','brown','tan','slate','ink',
] as const;

// Onboarding / hero backgrounds (rotate)
export const heroBg = { blue: '#3D7BE0', orange: '#FF6A1A', green: '#1ABC9C', yellow: '#FDC854' };

// Priority scale
export const priorityColor = {
  high: colors.coral,
  medium: colors.sun,
  low: colors.blue,
  none: colors.white,
} as const;
```

### 3.2 Typography

| Role | Font | Weight | Size/Line | Tracking |
|---|---|---|---|---|
| Display (home title) | Bricolage Grotesque | 800 | 40/42 | -1.2 |
| H1 | Bricolage Grotesque | 800 | 32/36 | -0.8 |
| H2 | Bricolage Grotesque | 800 | 24/28 | -0.5 |
| H3 / card title | Plus Jakarta Sans | 800 | 17/22 | -0.2 |
| Body | Plus Jakarta Sans | 500 | 15/22 | 0 |
| Body strong | Plus Jakarta Sans | 700 | 15/22 | 0 |
| Caption | Plus Jakarta Sans | 600 | 12/16 | 0 |
| Overline (section labels) | Plus Jakarta Sans | 800 | 11/14 | +1.2, UPPERCASE |

Load with `@expo-google-fonts/bricolage-grotesque` and `@expo-google-fonts/plus-jakarta-sans` via `expo-font`. Hold splash until loaded.

### 3.3 Spacing, radius, borders, shadow

```ts
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, huge: 32 };
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };
export const border = { thick: 2.5, thin: 2 };       // cards 2.5, chips 2

// Hard shadow (iOS supports shadowRadius: 0 — iPhone-only app, so use native props)
export const shadow = {
  md: { shadowColor: '#121212', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0 },
  sm: { shadowColor: '#121212', shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0 },
  none:{ shadowOpacity: 0 },
};
```

Screen padding: 20 horizontal. Grid gap: 14. Min touch target: 44×44.

### 3.4 Motion

- **Press-in**: `Pressable` → on press translate `(+2, +2)` and drop shadow to `sm`/`none`, 90 ms spring. Release springs back.
- **Sheet**: iOS `formSheet` with detents `[0.5, 0.9]`.
- **Save success**: scale-pop (1 → 1.08 → 1) on the saved card + `Haptics.notificationAsync(Success)`.
- **Tag cloud**: each tag tilted by a deterministic angle from its name hash, range −6°…+6°.
- Respect **Reduce Motion** (skip tilt animation and pops).

---

## 4. Brand

- **Name:** Thannu
- **Voice:** warm, quick, a little cheeky. Short sentences.
- **Mascot (original — do not reuse Tuckii's):** a small **bell-bookmark** character — a bookmark ribbon body with a tiny bell on top and a sleepy→awake face (sleepy when nothing due, awake/waving when reminders are due). Generate as flat vector with ink outline + hard shadow, in `sun` + `violet`.
- **App icon:** violet rounded square, ink outline, yellow bell-bookmark.
- **Signature colors:** `sun` (action) + `violet` (reminders). Tuckii leans yellow-only; violet is Thannu's identity.

---

## 5. Core components

| Component | Spec |
|---|---|
| `Button` | Variants `primary` (sun), `secondary` (white), `danger` (coral text on white), `ink` (black). Height 52, radius 16, border 2.5, shadow md, label H3. Left/right icon slot |
| `IconButton` | 44×44 white square, radius 14, border 2.5, shadow sm. Used for gear / add-folder / search / back / pin |
| `Card` | White, radius 22, border 2.5, shadow md |
| `Chip` | Pill, border 2, height 28, caption bold. Variants: neutral, colored, `NEW` (sun bg), source |
| `TagChip` | **Tag-shaped** (left edge pointed + punched hole circle), pastel/solid fill, `#name`, optional count badge (white circle, ink border), optional ✕. Draw via `react-native-svg` |
| `Badge` | `NEW` ribbon (sun), count circle, priority flag badge |
| `StatTile` | Icon + big number + label; selected = `sunSoft` bg + ink border |
| `Banner` | Row card: 40×40 icon tile (colored, bordered) + title (bold) + subtitle + chevron. Variants `mint` (new saves), `violet` (due) |
| `CollectionCard` | White card, **colored tab** on top-left (like a folder tab), colored 44px icon tile (bordered), `N items` caption (+ `N folders`), `NEW` chip top-right, title bottom-left (H3). **Priority**: flag badge top-right (coral/sun/blue) and tab gets a 2px ink dashed outline |
| `LinkCard` | Image on top (aspect 4:5, radius 16 inner), pin icon top-right (white square), collection label chip on image bottom-left (colored), `NEW` ribbon top-left, title 2 lines, footer: source glyph + `TikTok • 23h` + kebab. Placeholder when no image: solid source color + big source glyph |
| `SourceChip` | Glyph + name (Instagram, TikTok, YouTube, X, Reddit, Pinterest, Web). Use Ionicons logos |
| `ToggleRow` | Card row: leading icon, label, iOS-style switch with ink track when on |
| `SettingsRow` | Card row: icon, title, subtitle, chevron |
| `SectionLabel` | Overline text, `textMuted` |
| `PrioritySelector` | 4 segmented tiles: None / Low / Medium / High; selected tile filled with priority color + flag icon + cadence caption |
| `RemindPicker` | Chips: Tonight · Tomorrow · This weekend · Next week · Custom… · None |
| `EmptyState` | Mascot + title + subtitle + primary button on pastel bg |

---

## 6. Screens

Navigation: **Expo Router stack, no tab bar.** Modals use `presentation: 'formSheet'` where noted.

### 6.1 Onboarding (first launch only)

Three full-screen colored slides (blue → orange → green), headline in Display, one mockup/illustration each, Next button (primary), page dots.

1. **blue** — "Every save. One home." (TikTok, Instagram, Reddit, Chrome → one place)
2. **orange** — "Never forget what you saved." (reminder illustration with bell)
3. **green** — "Flag what matters." (priority folder with flag) → button **"Turn on reminders"** (requests notification permission) + "Maybe later".

Sign-in is **anonymous by default** (no friction). Account upgrade lives in Settings.

### 6.2 Home (`/`)

```
┌──────────────────────────────┐
│ [⚙]               [📁+] [🔍] │  IconButtons
│                              │
│ Save now.                    │  Display
│ Remember later.              │
│ ┌──────────────────────┐ ┌─┐ │
│ │ #  Paste link to…  📋│ │+│ │  quick-save field + sun "+"
│ └──────────────────────┘ └─┘ │
│ ┌──────────────────────────┐ │
│ │ [🔔] 3 saves due today   >│ │  violet banner (only if due)
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ [🔔] 5 new saves waiting >│ │  mint banner (only if unreviewed)
│ └──────────────────────────┘ │
│ My Collections       (sort▾) │
│ ┌────────┐  ┌────────┐       │
│ │▔ 🍴 3NEW│  │▔ ✈     │      │  CollectionCard grid, 2-col
│ │ 24 items│ │ 13 items│      │
│ │ Recipes │ │ Travel  │      │
│ │      [⚑]│ │         │      │  ⚑ = priority flag badge
│ └────────┘  └────────┘       │
└──────────────────────────────┘
```

- Quick-save: tap paste icon → reads clipboard → opens **Save sheet** prefilled. Also auto-detect a URL in clipboard on app focus → show small "Save copied link?" chip under the field.
- "Unsorted" is a pinned system collection (first in grid) for saves with no collection.
- Long-press a collection → context menu: Edit, Set priority, Delete.
- Collections with `priority ≠ none` sort first within the grid (user can override with manual order).

### 6.3 Save sheet (formSheet, from paste or share intent)

```
Save link
┌ preview ─────────────────────┐
│ [img] Title (editable)       │
│ instagram.com • Instagram    │
└──────────────────────────────┘
COLLECTION   [Recipes ▾]  or [Unsorted]
WHY?         (Read) (Watch) (Buy) (Try) (Reference)   ← intent chips (optional)
REMIND ME    (Tonight)(Tomorrow)(Weekend)(Custom)(None)
TAGS         #recipes ✕  + Add
NOTE         ┌───────────────┐
             └───────────────┘
[ Save ]  (primary)
```

- Collection dropdown shows flag badge for priority collections; if the collection is **High**, the Remind picker defaults to "Tomorrow" and shows hint "High-priority folder → daily nudge".
- Title/preview auto-fill ("It fills itself in"): skeleton shimmer while metadata loads; user can edit title.

### 6.4 Review inbox (`/review`) — "New saves waiting"

Card-stack triage (one save at a time, large preview).
Actions (bottom row, 4 sticker buttons): **Keep** (choose collection) · **Pin** · **Remind later** (opens RemindPicker) · **Delete**.
Header shows `3 of 5`. Finishing → mascot celebration + "Inbox zero".

### 6.5 Today / Due (`/today`) — Thannu differentiator

Reached from the violet banner. Sections: **Overdue**, **Today**, **Priority backlog** (High-flag items not yet done). Each row = compact LinkCard with swipe actions: **Done ✓** (mint), **Snooze ⏰** (violet), **Remove reminder**. Header summary: "3 due · 7 in priority folders".

### 6.6 Collection detail (`/collection/[id]`)

```
[←]   Recipes                [⚑][⋯]
 ▔ colored header strip (collection color)
 Priority: ⚑ High · Daily nudge at 09:00   (tap to edit)
 [All] [Links] [Images] [Pinned] [Unread]   ← filter chips
 Subfolders (if any): horizontal chips
 ┌────┐ ┌────┐
 │Link│ │Link│   2-col LinkCard grid (FlashList masonry-ish)
 └────┘ └────┘
```

- Flag button toggles priority menu: None / Low / Medium / High (bottom sheet with `PrioritySelector` + time picker).
- Empty state: mascot + "Nothing here yet — share a post to Thannu".

### 6.7 Link detail (`/link/[id]`)

Mirror of screenshot 2:

```
[←] hero image (full-bleed)                 [📌]
╭──────────────────────────────╮
│ [Instagram]                  │
│ Title (bold, 2–3 lines)  [✎] │
│ [■ Recipes]  04 Jul 2026     │
│ ┌ Open link ───────────── ↗ ┐│  sun button, URL under label
│ [Share][Move][Refresh][Delete]│  4-up segmented row (Delete = coral)
│ ┌ ⏰ Remind me · Tomorrow 9am ┐│  NEW: violet row → RemindPicker
│ │ ⚑ Priority: inherited High  ││  NEW: shows folder priority
│ DESCRIPTION  … Show more     │
│ TAGS  #recipes ✕ #weeknight ✕ + Add │
│ NOTES ┌──────────────────────┐│  cream box, editable
╰──────────────────────────────╯
```

- "Open link" uses `Linking.openURL` (deep-links to the source app when installed).
- "Mark done" appears as a toggle under the action row → sets `doneAt`, cancels reminders.

### 6.8 Search (`/search`, full-screen)

```
┌ 🔍 Find collections or saves… ┐ [Cancel]
╭ YOUR LIBRARY ───────── [Overview] ╮  sun card
│ 📁 35   🔗 231   📌 23   🏷 22   ⏰ 4 │  StatTiles; tapping switches the list below
╰───────────────────────────────────╯
🏷 TAGS
 tilted tag cloud (TagChip with counts)
```

Typing → live results (collections first, then saves). Filters: All · Links · Images · Pinned · Due. Matching on title, description, note, tag, source, collection name (client-side over cached list for MVP).

### 6.9 Collection editor (formSheet)

Name · Icon grid (16 icons) · Color swatches (12) · Parent folder (optional) · **Priority selector** · Cadence (auto from priority, overridable: Off / Daily / Every 3 days / Weekly) · Reminder time · [Save] · [Delete] (danger).

### 6.10 Settings (`/settings`)

Mirror of screenshot 1.

```
[←]        Settings
╭ YOUR PLAN ──────────────────╮  sun card + mascot
│ Thannu Free  [Upgrade to Pro]│
PREFERENCES
  Haptic feedback                [on]
  Reminders (master)             [on]
  New save reminders             [on]
  Priority nudges                [on]
  Daily digest time              9:00 AM >
  Quiet hours                    22:00–08:00 >
YOUR THANNU DATA
  Export backup                  JSON file >
  Restore from backup            Last backup: … >
IMPORT FROM OTHER APPS
  Import bookmarks               CSV, HTML or JSON >
ACCOUNT
  Sync across devices            Create account >   (links anonymous user)
SUPPORT
  How to · Privacy · Terms · Send feedback
```

Decorative rotated `#CSV #HTML #JSON` stickers near Import (tilted TagChips).

### 6.11 Paywall (stub for now)

Sun card, mascot, list of Pro perks (unlimited priority folders, custom cadence, unlimited per-link reminders, backup & sync). No real purchase in Expo Go — button shows "Coming soon".

---

## 7. Thannu-only UI: priority & reminders

| Priority | Color | Flag | Default cadence | Notification tone |
|---|---|---|---|---|
| High | `coral` | solid flag | Daily at digest time | "3 high-priority saves are waiting in **Recipes**" |
| Medium | `sun` | solid flag | Every 3 days | "Still want to check out **Travel**? 5 saves." |
| Low | `blue` | outline flag | Weekly digest | "Your weekly catch-up: 8 saves waiting" |
| None | — | — | Off | — |

Notification actions (iOS category `THANNU_REMINDER`): **Open**, **Snooze 1h**, **Tomorrow**, **Done**.

Visual cues:
- Collection card: flag badge + dashed tab outline.
- Link card in priority folder: thin colored left stripe (4px) in priority color.
- Home banners: violet = due, mint = unreviewed.

---

## 8. Key flows

```
SAVE      Share sheet / paste → Save sheet (collection, why, remind, tags, note) → Save → toast + haptic
REVIEW    Banner "N new saves waiting" → Review inbox → Keep / Pin / Remind later / Delete
REMIND    Notification → tap → /link/[id] or /collection/[id] → Done / Snooze / Open
PRIORITY  Collection → ⚑ → pick level → cadence auto-set → reminders rescheduled
FIND      Search icon → type / pick stat / tap tag → open link
IMPORT    Settings → Import → pick file → map folders → progress → done
BACKUP    Settings → Export → JSON file → iOS share sheet (Files, AirDrop…)
```

---

## 9. Microcopy

| Place | Copy |
|---|---|
| Home title | "Save now. Remember later." |
| Quick-save placeholder | "Paste link to quick save" |
| Clipboard chip | "Save copied link?" |
| Due banner | "3 saves due today" / "Open Today" |
| New banner | "5 new saves waiting" / "Review now" |
| Empty home | "Your home is empty. Share a post from any app." |
| Save success toast | "Saved to Recipes ✓" |
| Priority hint | "High priority — we'll nudge you daily." |
| Snooze toast | "Okay, back at 7 PM." |
| Inbox zero | "All caught up. Nice." |
| Delete confirm | "Delete this save? You can't undo this." |
| Permission pre-prompt | "Want a nudge before your saves go stale?" |

---

## 10. Iconography

- UI icons: `lucide-react-native` (stroke 2.25, ink).
- Brand glyphs: `@expo/vector-icons` Ionicons (`logo-instagram`, `logo-tiktok`, `logo-youtube`, `logo-twitter` for X, `logo-reddit`, `logo-pinterest`).
- Collection icon keys: `utensils, plane, zap, home, book-open, coffee, heart, dumbbell, tv, shopping-bag, briefcase, music, camera, gift, star, graduation-cap`.
- Source colors: Instagram `#E1306C`, TikTok `#121212`, YouTube `#FF0000`, X `#121212`, Reddit `#FF4500`, Pinterest `#E60023`, Web `slate`.

---

## 11. Accessibility

- Contrast: ink on every bright fill passes AA; never put white text on `sun`, `lime`, `mint`, `pink`.
- Dynamic Type: all text uses `allowFontScaling` with max multiplier 1.3 for headings.
- VoiceOver labels on all IconButtons; priority announced ("High priority folder").
- Don't rely on color alone for priority — always pair with a flag icon + text.
- Respect Reduce Motion and Haptics preference.

---

## 12. Originality checklist (before shipping)

- [ ] Own mascot, own icon, own illustrations
- [ ] Own copy (no phrases lifted from Tuckii)
- [ ] Violet reminder identity visible on Home
- [ ] Priority flag + cadence visible without opening settings
- [ ] Layout *flow* similar, but assets/branding distinct
