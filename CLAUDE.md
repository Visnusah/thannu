# CLAUDE.md — Thannu App Architecture & Specification

Project memory and technical specification for Thannu. Read this document first, then `design.md` for UI specifications.

---

## 1. Project Overview & Mission

**Thannu** is an iOS & Web application (built with Expo Go & React Native) that centralizes posts, links, and content saved from Instagram, TikTok, YouTube, X (Twitter), Reddit, Pinterest, and the open web — while actively nudging users to revisit them.

### Core Differentiators
1. **Priority-Driven Nudges:** Folder-level priority flags (`high`, `medium`, `low`) drive intelligent notification cadences.
2. **Review Inbox ("Save Waiting"):** Unreviewed saves land in a clean inbox for quick sorting, tagging, or reviewing.
3. **Cloud Synchronization:** Cloud persistence via **Supabase** for collections, links, tags, and notes, paired with **Firebase Authentication**.
4. **Rich Export & Sharing:** Multi-format exports (**ZIP**, **CSV**, **JSON**) for single items, collections, or entire library backups.
5. **Strict Security & Encryption Standard:** Complete transport protection (HTTPS/TLS), AES email encryption at rest, and secure password hashing.

---

## 2. Technology Stack & Cloud Integrations

| Layer | Technology | Usage & Notes |
|---|---|---|
| **Framework** | Expo (SDK 57) + React Native + TypeScript | Native mobile & web cross-platform execution |
| **Routing** | Expo Router (File-based navigation) | Stack & Tab layout architecture |
| **UI Design** | Vanilla CSS / StyleSheet + Reanimated 3 | Neo-brutalist sticker styling with responsive touch feedback |
| **Authentication** | Firebase Auth (v10 JS SDK) | Email/Password, Google OAuth, and Demo Mode (`test@gmail.com` / `12345`) |
| **Cloud Database** | Supabase (PostgreSQL + Realtime JS Client) | Production cloud persistence for links, collections, tags, and notes |
| **Local Backup State** | Zustand + AsyncStorage | Instant offline fallback & theme hydration |
| **File Systems & Export**| `expo-file-system`, `expo-sharing`, `expo-clipboard` | CSV, ZIP, and JSON export/import handlers |
| **Icons & Fonts** | `@expo/vector-icons`, Ionicons | High-contrast neo-brutalist glyph set |

---

## 3. Directory Structure

```
thannu/
├── app/                           # Expo Router Screens & Layouts
│   ├── _layout.tsx                # Root Stack Navigator (Theme, Auth Gate, Security Audit)
│   ├── (tabs)/                    # Main Navigation Tabs
│   │   ├── _layout.tsx            # Tab Bar Component Wrapper
│   │   ├── index.tsx              # Home Screen (Collections Grid, Quick Save, Banner)
│   │   └── settings.tsx           # Full Settings & Data Management Screen
│   ├── login.tsx                  # Minimalist Email & Google Login Screen
│   ├── register.tsx               # User Registration & Verification Screen
│   ├── collection/[id].tsx        # Collection Detail View & Save Item Grid
│   ├── save/[id].tsx              # Link Detail View (Tags, Notes, Metadata, Actions)
│   └── review.tsx                 # Save Waiting / Review Inbox Flow
├── src/
│   ├── components/                # Modular UI Components
│   │   ├── ui/                    # Text, Button, Input, Card Primitives
│   │   ├── Screen.tsx             # Responsive Safe-area Screen Layout Wrapper
│   │   ├── CreateCollectionModal.tsx # Collection Creation & Editing Sheet
│   │   └── ActionClusterModal.tsx # Pop-out Action Cluster (Edit, Share, Delete)
│   ├── services/                  # Business Logic & Backend Handlers
│   │   ├── supabase.ts            # Supabase DB Client & Cloud Storage Service
│   │   ├── firebase.ts            # Firebase Auth & Session Handler
│   │   ├── security.ts            # AES Email Encryption & Password Hashing Core
│   │   ├── exportImport.ts        # CSV, ZIP, JSON Exporter & File Builder
│   │   └── metadata.ts            # Web / Social Media Metadata Extractor
│   ├── stores/                    # Zustand State Management
│   │   ├── collectionsStore.ts    # Collections State & Local Persistence
│   │   ├── linksStore.ts          # Links, Tags & Notes State
│   │   └── settingsStore.ts       # Haptics, Notifications & App Preferences
│   ├── hooks/                     # Custom React Hooks
│   │   ├── useResponsive.ts       # Screen Breakpoint & Layout Hooks
│   │   ├── useColors.ts           # Dynamic Light/Dark Theme Color Tokens
│   │   └── useAuth.ts             # Firebase Authentication & Session State
│   └── lib/                       # Styling Tokens, Constants, Utilities
│       ├── theme.ts               # Neo-brutalist Palette & Layout Constants
│       └── encryption.ts          # AES-256 Crypto Utilities
├── CLAUDE.md                      # Architecture Memory & Technical Roadmap
└── design.md                      # Visual Design Specifications & Component Standards
```

---

## 4. Security & Encryption Specification

The application implements enterprise-grade security controls to ensure data protection in transit and at rest.

### 4.1 Transport Layer Security (HTTPS/TLS)
- All client-to-backend communication (Supabase API, Firebase Auth, and Metadata API) is conducted strictly over **HTTPS (TLS 1.2 / TLS 1.3)**.
- HTTP traffic is denied; HTTP request upgrade policies are enforced.

### 4.2 AES Email Storage Encryption
- User email addresses are encrypted before being written to persistent storage using **AES-256 (Advanced Encryption Standard in Galois/Counter Mode)**.
- Decryption is performed in-memory only during authenticated user session rendering.

### 4.3 Password Hashing & Auth Integrity
- Passwords are **never stored or transmitted in plain text**.
- Password hashing is enforced using strong cryptographic salt algorithms (e.g., PBKDF2 / SHA-256 salted hashing via Firebase Auth and Supabase Auth).
- Valid email format validation (`^[^\s@]+@[^\s@]+\.[^\s@]+$`) is enforced prior to auth submission.

### 4.4 Demo Credentials & Testing Rules
- Demo login credentials: `test@gmail.com` / `12345`.
- **UI Privacy Constraint:** Demo password and credentials must **never** be rendered in plaintext on public authentication UI screens.

### 4.5 Security Proof of Concept (PoC) & Wireshark Audit Guidelines
To document and verify the security controls:
1. **Wireshark Capture Scenario:** Capture network interfaces during user Signup and Login flows.
2. **TLS Verification:** Verify that packet payloads display TLS Encrypted Application Data (`Application Data Protocol: Hypertext Transfer Protocol`).
3. **Plaintext Search:** Perform string search for passwords or unencrypted emails in packet captures; confirm zero matches.
4. **Audit Report PDF:** Document SSL/TLS certificate chain, AES encryption function implementations, password hash verification, and Wireshark screenshot evidence.

---

## 5. Cloud Data Model (Supabase & Local Sync)

### 5.1 Collections Schema (`collections`)
- `id` (UUID / text, primary key)
- `user_id` (text, owner foreign key)
- `name` (text, collection label)
- `icon` (text, Ionicons key)
- `color` (text, hex or color token)
- `item_count` (integer, default 0)
- `new_count` (integer, default 0)
- `priority` (`high` | `medium` | `low` | `none`)
- `created_at` (timestamp with time zone)

### 5.2 Links Schema (`links`)
- `id` (UUID / text, primary key)
- `user_id` (text, owner foreign key)
- `collection_id` (text, foreign key to collections, nullable for Unsorted)
- `url` (text, target link URL)
- `title` (text, headline)
- `description` (text, body excerpt)
- `domain` (text, e.g. Instagram, YouTube)
- `image_url` (text, thumbnail preview)
- `tags` (jsonb / array of strings, e.g. `["dsa", "recipes"]`)
- `notes` (text, user personal notes)
- `reviewed_at` (timestamp, null if unreviewed/new)
- `created_at` (timestamp with time zone)

---

## 6. Functional Specifications & Feature Modules

### 6.1 Authentication & Registration Flow
- **Minimalist Auth Screen (`/login`, `/register`):** Modern neo-brutalist card styling with high-contrast inputs.
- **Email & Password Login:** Verifies credentials against securely hashed auth stores.
- **Google OAuth:** One-tap social sign-in integration.
- **Registration Flow:** Validates email format -> creates AES-encrypted user record -> redirects directly to `/` (Home) upon completion.

### 6.2 Collections Management & Folder Editing
- **Create & Edit Collection Modal:** Customize folder `Name`, select `Color` swatch, choose `Icon`, and set `Priority Flag`.
- **Priority Cadence:** High priority folders highlight with dashed borders and flag indicators.

### 6.3 Link Details Screen (`/save/[id]`)
- **Tags System:** Inline tag addition and removal with colored pills.
- **Notes Editor:** Editable multi-line notes area persisted to cloud storage.
- **Domain & Hero Media:** Custom media header with domain favicon.
- **Action Cluster:**
  - `Open Link`: Opens external link via system browser.
  - `Share`: Generates shareable payload in text, CSV, or ZIP format.
  - `Move`: Re-assigns link to a different collection.
  - `Refresh`: Re-fetches website Open Graph metadata.
  - `Delete`: Soft/hard deletes link entry.

### 6.4 Pop-out Action Cluster
- Long-pressing a collection or link card activates a floating action cluster:
  - **Pencil Icon:** Quick Edit folder/link properties.
  - **Share Icon:** Triggers pop-out share dialog (ZIP / CSV / Formatted Text).
  - **Trash Icon:** Prompts delete confirmation.

### 6.5 Import & Export Engine
- **Export Formats:**
  - **CSV Export:** Generates standardized `.csv` containing URL, Title, Collection, Tags, and Notes.
  - **ZIP Archive Export:** Bundles collection manifest, `.csv`, and `.json` data into a single `.zip` file using `expo-file-system` and `expo-sharing`.
  - **JSON Export:** Structured backup payload for complete data restoration.
- **Import Engine:** Supports CSV, HTML bookmarks, and JSON backup restoration.

### 6.6 Full Settings Page Functionality
All buttons and triggers on `/settings` are fully wired:
- **Preferences:** Haptic feedback toggle, New Save reminders toggle, Dark mode toggle.
- **Data Management:** Export Backup (ZIP/CSV/JSON picker), Restore Backup (File picker), Import Bookmarks.
- **Account Actions:** Delete All Data (with double confirmation dialog).

---

## 7. Quality Assurance & Definition of Done

Each feature implementation must meet the following criteria:
- **TypeScript:** Strict compilation with zero errors (`npm run typecheck`).
- **Web & Native Compatibility:** Runs without layout breaking on iOS, Android, and Web (`npx expo export --platform web`).
- **Persistence Verification:** Data operations reflect instantly in UI state and synchronize with Supabase/AsyncStorage.
- **Security Validation:** Encryption and HTTPS requirements verified.