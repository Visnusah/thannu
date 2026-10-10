import AsyncStorage from '@react-native-async-storage/async-storage'

// Typed JSON helpers over AsyncStorage for one-off persistence.
// For global state that should persist, prefer a Zustand store with the
// persist middleware (see src/stores/themeStore.ts).
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key)
    return raw != null ? (JSON.parse(raw) as T) : null
  },

  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value))
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key)
  },
}
