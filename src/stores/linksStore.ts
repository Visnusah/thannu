import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export const UNSORTED_COLLECTION_ID = 'unsorted'

export type LinkRecord = {
  id: string
  url: string
  title: string
  description: string
  domain: string
  imageUrl: string | null
  collectionId: string
  tags: string[]
  notes: string
  reviewedAt: number | null
  createdAt: number
  isPinned: boolean
}

type AddLinkInput = {
  url: string
  collectionId?: string
  title?: string
  description?: string
  domain?: string
  imageUrl?: string | null
  tags?: string[]
  notes?: string
}

type LinkUpdates = Partial<Omit<LinkRecord, 'id' | 'createdAt'>>

type LinksState = {
  links: LinkRecord[]
  addLink: (input: AddLinkInput) => string
  updateLink: (id: string, updates: LinkUpdates) => void
  removeLink: (id: string) => void
  markReviewed: (id: string) => void
  markAllReviewed: () => void
  moveLink: (id: string, collectionId: string) => void
  clearLinks: () => void
}

export function getLinkDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function getLinkTitle(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function isValidLinkUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useLinksStore = create<LinksState>()(
  persist(
    (set) => ({
      links: [],
      addLink: (input) => {
        const url = input.url.trim()
        const id = createId()
        const link: LinkRecord = {
          id,
          url,
          title: input.title?.trim() || getLinkTitle(url),
          description: input.description?.trim() || '',
          domain: input.domain?.trim() || getLinkDomain(url),
          imageUrl: input.imageUrl ?? null,
          collectionId: input.collectionId || UNSORTED_COLLECTION_ID,
          tags: input.tags || [],
          notes: input.notes?.trim() || '',
          reviewedAt: null,
          createdAt: Date.now(),
          isPinned: false,
        }

        set((state) => ({ links: [link, ...state.links] }))
        return id
      },
      updateLink: (id, updates) =>
        set((state) => ({
          links: state.links.map((link) => (link.id === id ? { ...link, ...updates } : link)),
        })),
      removeLink: (id) =>
        set((state) => ({ links: state.links.filter((link) => link.id !== id) })),
      markReviewed: (id) =>
        set((state) => ({
          links: state.links.map((link) =>
            link.id === id ? { ...link, reviewedAt: link.reviewedAt || Date.now() } : link
          ),
        })),
      markAllReviewed: () =>
        set((state) => ({
          links: state.links.map((link) =>
            link.reviewedAt === null ? { ...link, reviewedAt: Date.now() } : link
          ),
        })),
      moveLink: (id, collectionId) =>
        set((state) => ({
          links: state.links.map((link) => (link.id === id ? { ...link, collectionId } : link)),
        })),
      clearLinks: () => set({ links: [] }),
    }),
    {
      name: 'thannu-links-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
