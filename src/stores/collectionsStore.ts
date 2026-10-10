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
}

// Initial mock data to show something if store is completely empty
const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: '1',
    name: 'Recipes',
    icon: 'restaurant-outline',
    color: thannuColors.orange,
    itemCount: 24,
    newCount: 3,
    priority: 'high',
    createdAt: Date.now() - 100000,
  },
  {
    id: '2',
    name: 'Travel',
    icon: 'airplane-outline',
    color: thannuColors.blue,
    itemCount: 13,
    newCount: 0,
    priority: 'none',
    createdAt: Date.now() - 50000,
  },
  {
    id: '3',
    name: 'Course',
    icon: 'flash-outline',
    color: thannuColors.violet,
    itemCount: 6,
    newCount: 0,
    priority: 'none',
    createdAt: Date.now() - 20000,
  },
  {
    id: '4',
    name: 'Tools',
    icon: 'folder-outline',
    color: thannuColors.ink,
    itemCount: 8,
    newCount: 1,
    priority: 'none',
    createdAt: Date.now() - 10000,
  },
]

type CollectionsState = {
  collections: Collection[]
  addCollection: (collection: { name: string; color: string; icon: string }) => void
  removeCollection: (id: string) => void
}

export const useCollectionsStore = create<CollectionsState>()(
  persist(
    (set) => ({
      collections: INITIAL_COLLECTIONS,
      addCollection: (data) =>
        set((state) => {
          const newCollection: Collection = {
            id: Math.random().toString(36).substring(2, 9),
            name: data.name,
            icon: data.icon,
            color: data.color,
            itemCount: 0,
            newCount: 0,
            priority: 'none',
            createdAt: Date.now(),
          }
          return { collections: [...state.collections, newCollection] }
        }),
      removeCollection: (id) =>
        set((state) => ({
          collections: state.collections.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'thannu-collections-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
