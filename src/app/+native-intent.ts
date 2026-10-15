/**
 * expo-sharing hands native share-extension payloads back to the app through
 * `thannu://expo-sharing`. Route that handoff to the share status screen.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    const parsed = new URL(path, 'thannu://app')
    if (parsed.hostname === 'expo-sharing' || parsed.pathname === '/expo-sharing') {
      return '/share'
    }
  } catch {
    // Keep the original path when an external app sends a malformed URL.
  }

  return path
}
