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
  insertCollection,
  insertLink,
  updateCollection,
  updateLink,
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
    collectionId: l.collectionId,
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

  // ── pushCollection ────────────────────────────────────

  const pushCollection = useCallback(
    async (collection: Collection): Promise<void> => {
      const uid = guard('pushCollection')
      if (collection.isSystem) return // never sync system collections

      await insertCollection(uid, collectionToSyncInput(collection)).catch(async (err) => {
        // If insert fails due to conflict, fall back to update
        if (err?.message?.includes('duplicate') || err?.message?.includes('conflict')) {
          await updateCollection(uid, collection.id, {
            name: collection.name,
            icon: collection.icon,
            color: collection.color,
            item_count: collection.itemCount,
            new_count: collection.newCount,
            priority: collection.priority,
          })
        } else {
          throw err
        }
      })
    },
    [guard]
  )

  // ── pushLink ──────────────────────────────────────────

  const pushLink = useCallback(
    async (link: LinkRecord): Promise<void> => {
      const uid = guard('pushLink')

      await insertLink(uid, linkToSyncInput(link)).catch(async (err) => {
        if (err?.message?.includes('duplicate') || err?.message?.includes('conflict')) {
          await updateLink(uid, link.id, {
            title: link.title,
            description: link.description,
            domain: link.domain,
            image_url: link.imageUrl,
            collection_id: link.collectionId === UNSORTED_COLLECTION_ID ? null : link.collectionId,
            tags: link.tags,
            notes: link.notes,
            reviewed_at: link.reviewedAt ? new Date(link.reviewedAt).toISOString() : null,
            is_pinned: link.isPinned,
          })
        } else {
          throw err
        }
      })
    },
    [guard]
  )

  // ── deleteCollection ──────────────────────────────────

  const deleteCollection = useCallback(
    async (id: string): Promise<void> => {
      const uid = guard('deleteCollection')
      await dbDeleteCollection(uid, id)
      // Remove from local store
      collectionsStoreRef.current.removeCollection(id)
    },
    [guard]
  )

  // ── deleteLink ────────────────────────────────────────

  const deleteLink = useCallback(
    async (id: string): Promise<void> => {
      const uid = guard('deleteLink')
      await dbDeleteLink(uid, id)
      linksStoreRef.current.removeLink(id)
    },
    [guard]
  )

  // ── markLinkReviewed ──────────────────────────────────

  const markLinkReviewed = useCallback(
    async (id: string): Promise<void> => {
      const uid = guard('markLinkReviewed')
      const row = await dbMarkLinkReviewed(uid, id)
      linksStoreRef.current.updateLink(id, { reviewedAt: new Date(row.reviewed_at!).getTime() })
    },
    [guard]
  )

  // ── toggleLinkPin ─────────────────────────────────────

  const toggleLinkPin = useCallback(
    async (id: string): Promise<void> => {
      const uid = guard('toggleLinkPin')
      const row = await dbToggleLinkPin(uid, id)
      linksStoreRef.current.updateLink(id, { isPinned: row.is_pinned })
    },
    [guard]
  )

  // ── moveLink ──────────────────────────────────────────

  const moveLink = useCallback(
    async (linkId: string, targetCollectionId: string | null): Promise<void> => {
      const uid = guard('moveLink')
      await dbMoveLink(uid, linkId, targetCollectionId)
      linksStoreRef.current.moveLink(
        linkId,
        targetCollectionId ?? UNSORTED_COLLECTION_ID
      )
    },
    [guard]
  )

  // ── addTagsToLink ─────────────────────────────────────

  const addTagsToLink = useCallback(
    async (linkId: string, tags: string[]): Promise<void> => {
      const uid = guard('addTagsToLink')
      const row = await dbAddTags(uid, linkId, tags)
      linksStoreRef.current.updateLink(linkId, { tags: row.tags })
    },
    [guard]
  )

  // ── removeTagFromLink ─────────────────────────────────

  const removeTagFromLink = useCallback(
    async (linkId: string, tag: string): Promise<void> => {
      const uid = guard('removeTagFromLink')
      const row = await dbRemoveTag(uid, linkId, tag)
      linksStoreRef.current.updateLink(linkId, { tags: row.tags })
    },
    [guard]
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
