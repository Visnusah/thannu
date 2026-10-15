/**
 * useSupabaseSync.ts
 *
 * Bidirectional sync bridge between Zustand local stores and Supabase.
 *
 * On sign-in  → pulls remote state → hydrates local Zustand stores
 * On mutation → pushes local state  → writes to Supabase
 * On sign-out → clears local stores
 *
 * All Supabase calls are guarded by `isSupabaseConfigured` so the app
 * works in offline/demo mode without throwing.
 *
 * Usage:
 *   const sync = useSupabaseSync()
 *   // Initial pull after auth:
 *   await sync.pull()
 *   // After adding a collection:
 *   await sync.pushCollection(collection)
 */

import { useCallback, useEffect, useRef } from 'react'

import { useAuth } from '@/hooks/useAuth'
import {
  fetchCollections,
  fetchLinks,
  upsertCollections,
  upsertLinks,
  deleteCollection as dbDeleteCollection,
  deleteLink as dbDeleteLink,
  markLinkReviewed as dbMarkLinkReviewed,
  toggleLinkPin as dbToggleLinkPin,
  moveLink as dbMoveLink,
  addTagsToLink as dbAddTags,
  removeTagFromLink as dbRemoveTag,
  searchLinks as dbSearchLinks,
  fetchLinksByTag as dbFetchByTag,
  fetchUnreviewedLinks as dbFetchUnreviewed,
  fetchPinnedLinks as dbFetchPinned,
  fetchUserStats,
  deleteAllUserData as dbDeleteAllData,
  subscribeToCollections,
  subscribeToLinks,
  isSupabaseConfigured,
  type LinkRow,
  type CollectionRow,
  type UserStatsRow,
} from '@/services/supabase'
import { useCollectionsStore, type Collection } from '@/stores/collectionsStore'
import { useLinksStore, type LinkRecord, UNSORTED_COLLECTION_ID } from '@/stores/linksStore'

// ─────────────────────────────────────────────────────────
// Mappers: Supabase rows ↔ Zustand shapes
// ─────────────────────────────────────────────────────────

function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    color: row.color,
    itemCount: row.item_count,
    newCount: row.new_count,
    priority: row.priority,
    parentId: row.parent_id,
    createdAt: new Date(row.created_at).getTime(),
  }
}

function rowToLink(row: LinkRow): LinkRecord {
  return {
    id: row.id,
    url: row.url,
    title: row.title,
    description: row.description,
    domain: row.domain,
    imageUrl: row.image_url,
    collectionId: row.collection_id ?? UNSORTED_COLLECTION_ID,
    tags: row.tags,
    notes: row.notes,
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    isPinned: row.is_pinned,
  }
}

function collectionToSyncInput(c: Collection) {
  return {
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    itemCount: c.itemCount,
    newCount: c.newCount,
    priority: c.priority,
    parentId: c.parentId ?? null,
    createdAt: c.createdAt,
  }
}

function linkToSyncInput(l: LinkRecord) {
  return {
    id: l.id,
    url: l.url,
    title: l.title,
    description: l.description,
    domain: l.domain,
    imageUrl: l.imageUrl,
    collectionId: l.collectionId && l.collectionId !== UNSORTED_COLLECTION_ID ? l.collectionId : null,
    tags: l.tags,
    notes: l.notes,
    reviewedAt: l.reviewedAt,
    createdAt: l.createdAt,
    isPinned: l.isPinned,
  }
}

// ─────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────

export type SupabaseSyncHook = {
  /** Pull remote state for the current user and hydrate the Zustand stores */
  pull: () => Promise<void>

  /** Push a collection to Supabase (insert or update) */
  pushCollection: (collection: Collection) => Promise<void>

  /** Push a link to Supabase (insert or update) */
  pushLink: (link: LinkRecord) => Promise<void>

  /** Delete a collection from Supabase and the local store */
  deleteCollection: (id: string) => Promise<void>

  /** Delete a link from Supabase and the local store */
  deleteLink: (id: string) => Promise<void>

  /** Mark a link reviewed in Supabase and the local store */
  markLinkReviewed: (id: string) => Promise<void>

  /** Mark all unreviewed links as reviewed */
  markAllReviewed: () => Promise<void>

  /** Toggle pin state of a link */
  toggleLinkPin: (id: string) => Promise<void>

  /** Move a link to a different collection */
  moveLink: (linkId: string, targetCollectionId: string | null) => Promise<void>

  /** Add tags to a link */
  addTagsToLink: (linkId: string, tags: string[]) => Promise<void>

  /** Remove a tag from a link */
  removeTagFromLink: (linkId: string, tag: string) => Promise<void>

  /** Full-text search across links */
  searchLinks: (query: string) => Promise<LinkRecord[]>

  /** Fetch links that have a given tag */
  fetchLinksByTag: (tag: string) => Promise<LinkRecord[]>

  /** Fetch unreviewed links (review inbox) */
  fetchUnreviewed: () => Promise<LinkRecord[]>

  /** Fetch pinned links */
  fetchPinned: () => Promise<LinkRecord[]>

  /** Fetch user statistics */
  fetchStats: () => Promise<UserStatsRow | null>

  /** Permanently delete ALL data for the current user */
  deleteAllData: () => Promise<void>

  /** Whether Supabase is configured in this environment */
  configured: boolean
}

export function useSupabaseSync(): SupabaseSyncHook {
  const { user } = useAuth()
  const userId = user?.uid ?? null

  // Access store actions without subscribing to state (avoids re-renders)
  const collectionsStoreRef = useRef(useCollectionsStore.getState())
  const linksStoreRef = useRef(useLinksStore.getState())

  // Keep refs up to date without subscribing in the render cycle
  useEffect(() => {
    const unsubCollections = useCollectionsStore.subscribe((state) => {
      collectionsStoreRef.current = state
    })
    const unsubLinks = useLinksStore.subscribe((state) => {
      linksStoreRef.current = state
    })
    return () => {
      unsubCollections()
      unsubLinks()
    }
  }, [])

  // ── Guard: no-op when not configured or not authed ──

  const guard = useCallback(
    (context: string): string => {
      if (!isSupabaseConfigured) throw new Error(`Supabase not configured [${context}]`)
      if (!userId) throw new Error(`Not authenticated [${context}]`)
      return userId
    },
    [userId]
  )

  // ── pull ─────────────────────────────────────────────

  const pull = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured || !userId) return

    const [remoteCollections, remoteLinks] = await Promise.all([
      fetchCollections(userId),
      fetchLinks(userId),
    ])

    // Hydrate collections store
    const mappedCollections = remoteCollections.map(rowToCollection)
    // Preserve the system 'unsorted' collection
    const store = collectionsStoreRef.current
    const systemCollections = store.collections.filter((c) => c.isSystem)
    const mergedCollections = [
      ...systemCollections,
      ...mappedCollections.filter((c) => !systemCollections.some((s) => s.id === c.id)),
    ]

    // Update collections store via direct state mutation (Zustand allows this)
    useCollectionsStore.setState({ collections: mergedCollections })

    // Hydrate links store
    const mappedLinks = remoteLinks.map(rowToLink)
    useLinksStore.setState({ links: mappedLinks })
  }, [userId])

  // ── Automatic initial pull & Realtime synchronization ──
  useEffect(() => {
    if (!isSupabaseConfigured || !userId) return

    pull().catch((err) => {
      console.warn('[useSupabaseSync] Initial pull failed:', err)
    })

    const unsubCollections = subscribeToCollections(userId, (event, newRow, oldRow) => {
      if (event === 'INSERT' || event === 'UPDATE') {
        if (newRow) {
          const mapped = rowToCollection(newRow)
          useCollectionsStore.setState((state) => {
            const exists = state.collections.some((c) => c.id === mapped.id)
            return {
              collections: exists
                ? state.collections.map((c) => (c.id === mapped.id ? mapped : c))
                : [...state.collections, mapped],
            }
          })
        }
      } else if (event === 'DELETE') {
        if (oldRow) {
          useCollectionsStore.setState((state) => ({
            collections: state.collections.filter((c) => c.id !== oldRow.id || c.isSystem),
          }))
        }
      }
    })

    const unsubLinks = subscribeToLinks(userId, (event, newRow, oldRow) => {
      if (event === 'INSERT' || event === 'UPDATE') {
        if (newRow) {
          const mapped = rowToLink(newRow)
          useLinksStore.setState((state) => {
            const exists = state.links.some((l) => l.id === mapped.id)
            return {
              links: exists
                ? state.links.map((l) => (l.id === mapped.id ? mapped : l))
                : [mapped, ...state.links],
            }
          })
        }
      } else if (event === 'DELETE') {
        if (oldRow) {
          useLinksStore.setState((state) => ({
            links: state.links.filter((l) => l.id !== oldRow.id),
          }))
        }
      }
    })

    return () => {
      unsubCollections()
      unsubLinks()
    }
  }, [userId, pull])

  // ── pushCollection ────────────────────────────────────

  const pushCollection = useCallback(
    async (collection: Collection): Promise<void> => {
      if (collection.isSystem) return // never sync system collections
      if (!isSupabaseConfigured || !userId) return
      await upsertCollections(userId, [collectionToSyncInput(collection)])
    },
    [userId]
  )

  // ── pushLink ──────────────────────────────────────────

  const pushLink = useCallback(
    async (link: LinkRecord): Promise<void> => {
      if (!isSupabaseConfigured || !userId) return
      await upsertLinks(userId, [linkToSyncInput(link)])
    },
    [userId]
  )

  // ── deleteCollection ──────────────────────────────────

  const deleteCollection = useCallback(
    async (id: string): Promise<void> => {
      const deletedCollectionIds = new Set([id])
      let changed = true
      while (changed) {
        changed = false
        for (const collection of collectionsStoreRef.current.collections) {
          if (collection.parentId && deletedCollectionIds.has(collection.parentId) && !deletedCollectionIds.has(collection.id)) {
            deletedCollectionIds.add(collection.id)
            changed = true
          }
        }
      }

      // Remove from local store first
      collectionsStoreRef.current.removeCollection(id)
      useLinksStore.setState((state) => ({
        links: state.links.map((link) =>
          deletedCollectionIds.has(link.collectionId)
            ? { ...link, collectionId: UNSORTED_COLLECTION_ID }
            : link
        ),
      }))
      if (!isSupabaseConfigured || !userId) return
      await dbDeleteCollection(userId, id)
    },
    [userId]
  )

  // ── deleteLink ────────────────────────────────────────

  const deleteLink = useCallback(
    async (id: string): Promise<void> => {
      linksStoreRef.current.removeLink(id)
      if (!isSupabaseConfigured || !userId) return
      await dbDeleteLink(userId, id)
    },
    [userId]
  )

  // ── markLinkReviewed ──────────────────────────────────

  const markLinkReviewed = useCallback(
    async (id: string): Promise<void> => {
      linksStoreRef.current.updateLink(id, { reviewedAt: Date.now() })
      if (!isSupabaseConfigured || !userId) return
      const row = await dbMarkLinkReviewed(userId, id)
      if (row?.reviewed_at) {
        linksStoreRef.current.updateLink(id, { reviewedAt: new Date(row.reviewed_at).getTime() })
      }
    },
    [userId]
  )

  // ── markAllReviewed ───────────────────────────────────

  const markAllReviewed = useCallback(async (): Promise<void> => {
    const unreviewed = linksStoreRef.current.links.filter((l) => l.reviewedAt === null)
    linksStoreRef.current.markAllReviewed()
    if (!isSupabaseConfigured || !userId) return
    await Promise.all(
      unreviewed.map((l) => dbMarkLinkReviewed(userId, l.id).catch(() => {}))
    )
  }, [userId])

  // ── toggleLinkPin ─────────────────────────────────────

  const toggleLinkPin = useCallback(
    async (id: string): Promise<void> => {
      const current = linksStoreRef.current.links.find((l) => l.id === id)
      if (current) {
        linksStoreRef.current.updateLink(id, { isPinned: !current.isPinned })
      }
      if (!isSupabaseConfigured || !userId) return
      const row = await dbToggleLinkPin(userId, id)
      linksStoreRef.current.updateLink(id, { isPinned: row.is_pinned })
    },
    [userId]
  )

  // ── moveLink ──────────────────────────────────────────

  const moveLink = useCallback(
    async (linkId: string, targetCollectionId: string | null): Promise<void> => {
      linksStoreRef.current.moveLink(
        linkId,
        targetCollectionId ?? UNSORTED_COLLECTION_ID
      )
      if (!isSupabaseConfigured || !userId) return
      await dbMoveLink(userId, linkId, targetCollectionId)
    },
    [userId]
  )

  // ── addTagsToLink ─────────────────────────────────────

  const addTagsToLink = useCallback(
    async (linkId: string, tags: string[]): Promise<void> => {
      const current = linksStoreRef.current.links.find((l) => l.id === linkId)
      if (current) {
        const merged = Array.from(new Set([...current.tags, ...tags]))
        linksStoreRef.current.updateLink(linkId, { tags: merged })
      }
      if (!isSupabaseConfigured || !userId) return
      const row = await dbAddTags(userId, linkId, tags)
      linksStoreRef.current.updateLink(linkId, { tags: row.tags })
    },
    [userId]
  )

  // ── removeTagFromLink ─────────────────────────────────

  const removeTagFromLink = useCallback(
    async (linkId: string, tag: string): Promise<void> => {
      const current = linksStoreRef.current.links.find((l) => l.id === linkId)
      if (current) {
        linksStoreRef.current.updateLink(linkId, { tags: current.tags.filter((t) => t !== tag) })
      }
      if (!isSupabaseConfigured || !userId) return
      const row = await dbRemoveTag(userId, linkId, tag)
      linksStoreRef.current.updateLink(linkId, { tags: row.tags })
    },
    [userId]
  )

  // ── searchLinks ───────────────────────────────────────

  const searchLinks = useCallback(
    async (query: string): Promise<LinkRecord[]> => {
      const uid = guard('searchLinks')
      const rows = await dbSearchLinks(uid, query)
      return rows.map(rowToLink)
    },
    [guard]
  )

  // ── fetchLinksByTag ───────────────────────────────────

  const fetchLinksByTag = useCallback(
    async (tag: string): Promise<LinkRecord[]> => {
      const uid = guard('fetchLinksByTag')
      const rows = await dbFetchByTag(uid, tag)
      return rows.map(rowToLink)
    },
    [guard]
  )

  // ── fetchUnreviewed ───────────────────────────────────

  const fetchUnreviewed = useCallback(async (): Promise<LinkRecord[]> => {
    const uid = guard('fetchUnreviewed')
    const rows = await dbFetchUnreviewed(uid)
    return rows.map(rowToLink)
  }, [guard])

  // ── fetchPinned ───────────────────────────────────────

  const fetchPinned = useCallback(async (): Promise<LinkRecord[]> => {
    const uid = guard('fetchPinned')
    const rows = await dbFetchPinned(uid)
    return rows.map(rowToLink)
  }, [guard])

  // ── fetchStats ────────────────────────────────────────

  const fetchStats = useCallback(async (): Promise<UserStatsRow | null> => {
    const uid = guard('fetchStats')
    return fetchUserStats(uid)
  }, [guard])

  // ── deleteAllData ─────────────────────────────────────

  const deleteAllData = useCallback(async (): Promise<void> => {
    guard('deleteAllData')

    await dbDeleteAllData()

    // Clear local stores
    const systemCollections = collectionsStoreRef.current.collections.filter((c) => c.isSystem)
    useCollectionsStore.setState({ collections: systemCollections })
    useLinksStore.setState({ links: [] })
  }, [guard])

  return {
    pull,
    pushCollection,
    pushLink,
    deleteCollection,
    deleteLink,
    markLinkReviewed,
    markAllReviewed,
    toggleLinkPin,
    moveLink,
    addTagsToLink,
    removeTagFromLink,
    searchLinks,
    fetchLinksByTag,
    fetchUnreviewed,
    fetchPinned,
    fetchStats,
    deleteAllData,
    configured: isSupabaseConfigured,
  }
}
