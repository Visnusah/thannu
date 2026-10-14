import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { thannuColors } from '@/lib'

export type CollectionPriority = 'high' | 'medium' | 'low' | 'none'

export type Collection = {
  id: string
  name: string
  icon: string
  color: string
  itemCount: number
  newCount: number
  priority: CollectionPriority
  createdAt: number
  isSystem?: boolean
}

export const UNSORTED_COLLECTION: Collection = {
  id: 'unsorted',
  name: 'Unsorted',
  icon: 'file-tray-outline',
  color: thannuColors.slate,
  itemCount: 0,
  newCount: 0,
  priority: 'none',
  createdAt: 0,
  isSystem: true,
}

// Initial default collection — system unsorted inbox only
const INITIAL_COLLECTIONS: Collection[] = [UNSORTED_COLLECTION]

const MOCK_COLLECTION_IDS = new Set(['1', '2', '3', '4'])

type CollectionsState = {
  collections: Collection[]
  addCollection: (collection: { name: string; color: string; icon: string }) => Collection
  removeCollection: (id: string) => void
  clearNonSystemCollections: () => void
  ensureUnsortedCollection: () => Collection
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      collections: INITIAL_COLLECTIONS,
      addCollection: (data) => {
        const newCollection: Collection = {
          id: `col_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          name: data.name,
          icon: data.icon,
          color: data.color,
          itemCount: 0,
          newCount: 0,
          priority: 'none',
          createdAt: Date.now(),
        }
        set((state) => ({ collections: [...state.collections, newCollection] }))
        return newCollection
      },
      removeCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id || c.isSystem),
        })),
      clearNonSystemCollections: () =>
        set((state) => ({
          collections: state.collections.filter((c) => c.isSystem),
        })),
      ensureUnsortedCollection: () => {
        let found: Collection | undefined
        set((state) => {
          found = state.collections.find(
            (c) => c.id === 'unsorted' || c.name.toLowerCase() === 'unsorted'
          )
          if (found) return state
          found = UNSORTED_COLLECTION
          return { collections: [UNSORTED_COLLECTION, ...state.collections] }
        })
        return found ?? UNSORTED_COLLECTION
      },
    }),
    {
      name: 'thannu-collections-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as { collections?: Collection[] } | undefined
        if (state?.collections) {
          const collections = state.collections
            .filter((c) => c.isSystem || !MOCK_COLLECTION_IDS.has(c.id))
            .map((c) => (c.icon === 'inbox-outline' ? { ...c, icon: 'file-tray-outline' } : c))
          return { ...state, collections }
        }
        return state
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const clean = state.collections
            .filter((c) => c.isSystem || !MOCK_COLLECTION_IDS.has(c.id))
            .map((c) => (c.icon === 'inbox-outline' ? { ...c, icon: 'file-tray-outline' } : c))
          const hasChanged =
            clean.length !== state.collections.length ||
            state.collections.some((c) => c.icon === 'inbox-outline')
          if (hasChanged) {
            useCollectionsStore.setState({ collections: clean })
          }
        }
      },
    }
  )
)
