// Lets side-effect CSS imports (e.g. `import '@/global.css'` in app/_layout.tsx,
// used for web output) typecheck on a FRESH checkout. The generated
// expo-env.d.ts normally provides this, but it is gitignored and doesn't exist
// until the Expo CLI has run — and `npm run typecheck` must pass straight
// after download. Merges harmlessly with expo-env.d.ts once that appears.
declare module '*.css'
