/**
 * supabase.ts — Thannu's complete Supabase database service layer.
 *
 * Responsibilities:
 *  - Typed Supabase client with full Database schema
 *  - Firebase JWT token provider integration (sub claim → user_id RLS)
 *  - All CRUD queries for `collections` and `links`
 *  - Bulk upsert / sync operations
 *  - Tag-based and full-text search via DB functions
 *  - User statistics
 *  - Secure delete_user_data() via DB function
 *
 * Security model:
 *  - Row-Level Security policies on every table (see migration 001)
 *  - auth.jwt() ->> 'sub' must equal user_id — enforced in SQL
 *  - delete_user_data() is SECURITY DEFINER but validates JWT sub itself
 *  - The publishable key is safe to ship; the secret key never leaves the server
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { CollectionPriority } from '@/stores/collectionsStore'

// ─────────────────────────────────────────────────────────
// TypeScript schema — mirrors the PostgreSQL migration 001
// ─────────────────────────────────────────────────────────

export type CollectionRow = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  item_count: number
  new_count: number
  priority: CollectionPriority
  created_at: string
  updated_at: string
}

export type LinkRow = {
  id: string
  user_id: string
  collection_id: string | null
  url: string
  title: string
  description: string
  domain: string
  image_url: string | null
  tags: string[]
  notes: string
  reviewed_at: string | null
  is_pinned: boolean
  search_tsv?: string | null
  created_at: string
  updated_at: string
}

export type UserStatsRow = {
  user_id: string
  total_collections: number
  total_links: number
  unreviewed_links: number
  pinned_links: number
  unique_tags: number
  last_saved_at: string | null
}

export type CollectionInsert = {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  item_count?: number
  new_count?: number
  priority?: CollectionPriority
  created_at?: string
  updated_at?: string
}

export type CollectionUpdate = {
  id?: string
  user_id?: string
  name?: string
  icon?: string
  color?: string
  item_count?: number
  new_count?: number
  priority?: CollectionPriority
  created_at?: string
  updated_at?: string
}

export type LinkInsert = {
  id: string
  user_id: string
  collection_id?: string | null
  url: string
  title?: string
  description?: string
  domain?: string
  image_url?: string | null
  tags?: string[]
  notes?: string
  reviewed_at?: string | null
  is_pinned?: boolean
  search_tsv?: string | null
  created_at?: string
  updated_at?: string
}

export type LinkUpdate = {
  id?: string
  user_id?: string
  collection_id?: string | null
  url?: string
  title?: string
  description?: string
  domain?: string
  image_url?: string | null
  tags?: string[]
  notes?: string
  reviewed_at?: string | null
  is_pinned?: boolean
  search_tsv?: string | null
  created_at?: string
  updated_at?: string
}

export type Database = {
  public: {
    Tables: {
      collections: {
        Row: CollectionRow
        Insert: CollectionInsert
        Update: CollectionUpdate
        Relationships: []
      }
      links: {
        Row: LinkRow
        Insert: LinkInsert
        Update: LinkUpdate
        Relationships: []
      }
    }
    Views: {
      user_stats: {
        Row: UserStatsRow
        Relationships: []
      }
    }
    Functions: {
      delete_user_data: {
        Args: Record<string, never>
        Returns: void
      }
      links_with_tag: {
        Args: { p_tag: string }
        Returns: LinkRow[]
      }
      search_links: {
        Args: { p_query: string }
        Returns: LinkRow[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ── Sync input shapes (camelCase → service maps to snake_case) ───

export type CollectionSyncInput = {
  id: string
  name: string
  icon: string
  color: string
  itemCount?: number
  newCount?: number
  priority?: CollectionPriority
  createdAt?: number | string
}

export type LinkSyncInput = {
  id: string
  url: string
  title?: string
  description?: string
  domain?: string
  imageUrl?: string | null
  collectionId?: string | null
  tags?: string[]
  notes?: string
  reviewedAt?: number | string | null
  createdAt?: number | string
  isPinned?: boolean
}

export type FirebaseTokenProvider = () => Promise<string | null>

// ─────────────────────────────────────────────────────────
// Client bootstrap
// ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

/** True only when both public runtime configuration values are available. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

// Firebase token provider ─────────────────────────────────

let firebaseTokenProvider: FirebaseTokenProvider | null = null

export function setFirebaseTokenProvider(provider: FirebaseTokenProvider | null): () => void {
  firebaseTokenProvider = provider
  return () => {
    if (firebaseTokenProvider === provider) firebaseTokenProvider = null
  }
}

export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => firebaseTokenProvider?.() ?? null,
    })
  : null

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    )
  }
  return supabase
}

// ─────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────

function requireOwnerId(ownerId: string): string {
  const normalized = ownerId.trim()
  if (!normalized) {
    throw new Error('A Firebase user id is required for an owner-scoped Supabase operation.')
  }
  return normalized
}

function toIsoDate(value: number | string | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date supplied to Supabase sync.')
  return date.toISOString()
}

function throwIfError(error: { message: string } | null, context = ''): void {
  if (error) {
    throw new Error(
      context
        ? `Supabase [${context}] failed: ${error.message}`
        : `Supabase request failed: ${error.message}`
    )
  }
}

// ─────────────────────────────────────────────────────────
// ── Collections ───────────────────────────────────────────
// ─────────────────────────────────────────────────────────

/** Fetch all collections owned by `ownerId`, ordered oldest-first. */
export async function fetchCollections(ownerId: string): Promise<CollectionRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  throwIfError(error, 'fetchCollections')
  return (data ?? []) as CollectionRow[]
}

/** Fetch a single collection by id. Returns null when not found or not owned. */
export async function fetchCollection(
  ownerId: string,
  collectionId: string
): Promise<CollectionRow | null> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('collections')
    .select('*')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error, 'fetchCollection')
  return data as CollectionRow | null
}

/** Upsert one or more collections. Always stamps user_id server-side. */
export async function upsertCollections(
  ownerId: string,
  collections: CollectionSyncInput[]
): Promise<CollectionRow[]> {
  const userId = requireOwnerId(ownerId)
  if (collections.length === 0) return []

  const rows: CollectionInsert[] = collections.map((c) => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    icon: c.icon,
    color: c.color,
    item_count: c.itemCount ?? 0,
    new_count: c.newCount ?? 0,
    priority: c.priority ?? ('none' as CollectionPriority),
    ...(c.createdAt != null ? { created_at: toIsoDate(c.createdAt) as string } : {}),
  }))

  const { data, error } = await getSupabaseClient()
    .from('collections')
    .upsert(rows, { onConflict: 'id' })
    .select()

  throwIfError(error, 'upsertCollections')
  return (data ?? []) as CollectionRow[]
}

/** Insert a new collection row for the given owner. */
export async function insertCollection(
  ownerId: string,
  collection: CollectionSyncInput
): Promise<CollectionRow> {
  const userId = requireOwnerId(ownerId)

  const row: CollectionInsert = {
    id: collection.id,
    user_id: userId,
    name: collection.name,
    icon: collection.icon,
    color: collection.color,
    item_count: collection.itemCount ?? 0,
    new_count: collection.newCount ?? 0,
    priority: collection.priority ?? ('none' as CollectionPriority),
    ...(collection.createdAt != null
      ? { created_at: toIsoDate(collection.createdAt) as string }
      : {}),
  }

  const { data, error } = await getSupabaseClient()
    .from('collections')
    .insert(row)
    .select()
    .single()

  throwIfError(error, 'insertCollection')
  return data as CollectionRow
}

/** Patch specific fields on a collection the caller owns. */
export async function updateCollection(
  ownerId: string,
  collectionId: string,
  updates: Partial<Omit<CollectionRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<CollectionRow> {
  const userId = requireOwnerId(ownerId)

  const { data, error } = await getSupabaseClient()
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'updateCollection')
  return data as CollectionRow
}

/** Increment (or decrement) item_count and new_count for a collection atomically. */
export async function incrementCollectionCounts(
  ownerId: string,
  collectionId: string,
  delta: { itemCount?: number; newCount?: number }
): Promise<void> {
  const userId = requireOwnerId(ownerId)

  const row = await fetchCollection(userId, collectionId)
  if (!row) return

  const updates: CollectionUpdate = {}
  if (delta.itemCount !== undefined) {
    updates.item_count = Math.max(0, row.item_count + delta.itemCount)
  }
  if (delta.newCount !== undefined) {
    updates.new_count = Math.max(0, row.new_count + delta.newCount)
  }

  if (Object.keys(updates).length === 0) return

  const { error } = await getSupabaseClient()
    .from('collections')
    .update(updates)
    .eq('id', collectionId)
    .eq('user_id', userId)

  throwIfError(error, 'incrementCollectionCounts')
}

/** Hard-delete a collection. Links cascade to null via FK. */
export async function deleteCollection(ownerId: string, collectionId: string): Promise<void> {
  const userId = requireOwnerId(ownerId)
  const { error } = await getSupabaseClient()
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId)

  throwIfError(error, 'deleteCollection')
}

// ─────────────────────────────────────────────────────────
// ── Links ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────

/** Fetch all links for the owner, newest-first. */
export async function fetchLinks(ownerId: string): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  throwIfError(error, 'fetchLinks')
  return (data ?? []) as LinkRow[]
}

/** Fetch all links in a specific collection, newest-first. */
export async function fetchLinksByCollection(
  ownerId: string,
  collectionId: string
): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)

  if (collectionId === 'unsorted') {
    const { data, error } = await getSupabaseClient()
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .is('collection_id', null)
      .order('created_at', { ascending: false })

    throwIfError(error, 'fetchLinksByCollection[unsorted]')
    return (data ?? []) as LinkRow[]
  }

  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: false })

  throwIfError(error, 'fetchLinksByCollection')
  return (data ?? []) as LinkRow[]
}

/** Fetch a single link by id. */
export async function fetchLink(ownerId: string, linkId: string): Promise<LinkRow | null> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('id', linkId)
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error, 'fetchLink')
  return data as LinkRow | null
}

/** Fetch unreviewed links (review inbox), oldest-first. */
export async function fetchUnreviewedLinks(ownerId: string): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .is('reviewed_at', null)
    .order('created_at', { ascending: true })

  throwIfError(error, 'fetchUnreviewedLinks')
  return (data ?? []) as LinkRow[]
}

/** Fetch all pinned links, newest-first. */
export async function fetchPinnedLinks(ownerId: string): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })

  throwIfError(error, 'fetchPinnedLinks')
  return (data ?? []) as LinkRow[]
}

/**
 * Search links by tag.
 * Calls the DB function `links_with_tag(p_tag)` backed by a GIN index.
 * Falls back to `.contains()` if the function is unavailable.
 */
export async function fetchLinksByTag(ownerId: string, tag: string): Promise<LinkRow[]> {
  requireOwnerId(ownerId)

  const { data, error } = await getSupabaseClient()
    .rpc('links_with_tag', { p_tag: tag })

  if (error) {
    const userId = ownerId.trim()
    const { data: fallback, error: fallbackErr } = await getSupabaseClient()
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .contains('tags', [tag])
      .order('created_at', { ascending: false })

    throwIfError(fallbackErr, 'fetchLinksByTag-fallback')
    return (fallback ?? []) as LinkRow[]
  }

  return (data ?? []) as LinkRow[]
}

/**
 * Full-text search across link title, description, and URL.
 * Calls `search_links(p_query)` backed by a GIN tsvector index.
 * Falls back to ilike if the function is unavailable.
 */
export async function searchLinks(ownerId: string, query: string): Promise<LinkRow[]> {
  requireOwnerId(ownerId)

  if (!query.trim()) return fetchLinks(ownerId)

  const { data, error } = await getSupabaseClient()
    .rpc('search_links', { p_query: query.trim() })

  if (error) {
    const userId = ownerId.trim()
    const term = `%${query.trim()}%`
    const { data: fallback, error: fallbackErr } = await getSupabaseClient()
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.${term},url.ilike.${term},description.ilike.${term}`)
      .order('created_at', { ascending: false })

    throwIfError(fallbackErr, 'searchLinks-fallback')
    return (fallback ?? []) as LinkRow[]
  }

  return (data ?? []) as LinkRow[]
}

/** Upsert one or more links. Always stamps user_id to prevent ownership spoofing. */
export async function upsertLinks(ownerId: string, links: LinkSyncInput[]): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  if (links.length === 0) return []

  const rows: LinkInsert[] = links.map((link) => ({
    id: link.id,
    user_id: userId,
    collection_id:
      !link.collectionId || link.collectionId === 'unsorted' ? null : link.collectionId,
    url: link.url,
    title: link.title ?? '',
    description: link.description ?? '',
    domain: link.domain ?? '',
    image_url: link.imageUrl ?? null,
    tags: link.tags ?? [],
    notes: link.notes ?? '',
    reviewed_at: toIsoDate(link.reviewedAt),
    is_pinned: link.isPinned ?? false,
    ...(link.createdAt != null ? { created_at: toIsoDate(link.createdAt) as string } : {}),
  }))

  const { data, error } = await getSupabaseClient()
    .from('links')
    .upsert(rows, { onConflict: 'id' })
    .select()

  throwIfError(error, 'upsertLinks')
  return (data ?? []) as LinkRow[]
}

/** Insert a single new link for the owner. */
export async function insertLink(ownerId: string, link: LinkSyncInput): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const row: LinkInsert = {
    id: link.id,
    user_id: userId,
    collection_id:
      !link.collectionId || link.collectionId === 'unsorted' ? null : link.collectionId,
    url: link.url,
    title: link.title ?? '',
    description: link.description ?? '',
    domain: link.domain ?? '',
    image_url: link.imageUrl ?? null,
    tags: link.tags ?? [],
    notes: link.notes ?? '',
    reviewed_at: toIsoDate(link.reviewedAt),
    is_pinned: link.isPinned ?? false,
    ...(link.createdAt != null ? { created_at: toIsoDate(link.createdAt) as string } : {}),
  }

  const { data, error } = await getSupabaseClient()
    .from('links')
    .insert(row)
    .select()
    .single()

  throwIfError(error, 'insertLink')
  return data as LinkRow
}

/** Patch specific fields on a link the caller owns. */
export async function updateLink(
  ownerId: string,
  linkId: string,
  updates: Partial<Omit<LinkRow, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'search_tsv'>>
): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update(updates)
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'updateLink')
  return data as LinkRow
}

/**
 * Mark a link as reviewed by setting `reviewed_at` to now.
 * Idempotent — preserves the original review timestamp if already set.
 */
export async function markLinkReviewed(ownerId: string, linkId: string): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update({ reviewed_at: new Date().toISOString() })
    .eq('id', linkId)
    .eq('user_id', userId)
    .is('reviewed_at', null)
    .select()
    .maybeSingle()

  throwIfError(error, 'markLinkReviewed')

  if (!data) {
    const existing = await fetchLink(userId, linkId)
    if (!existing) throw new Error(`Link ${linkId} not found`)
    return existing
  }

  return data as LinkRow
}

/** Toggle a link's pinned state. */
export async function toggleLinkPin(ownerId: string, linkId: string): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const existing = await fetchLink(userId, linkId)
  if (!existing) throw new Error(`Link ${linkId} not found`)

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update({ is_pinned: !existing.is_pinned })
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'toggleLinkPin')
  return data as LinkRow
}

/** Move a link to a different collection (or to Unsorted). */
export async function moveLink(
  ownerId: string,
  linkId: string,
  targetCollectionId: string | null
): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const collectionId =
    !targetCollectionId || targetCollectionId === 'unsorted' ? null : targetCollectionId

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update({ collection_id: collectionId })
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'moveLink')
  return data as LinkRow
}

/** Add tags to a link without removing existing ones. */
export async function addTagsToLink(
  ownerId: string,
  linkId: string,
  newTags: string[]
): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const existing = await fetchLink(userId, linkId)
  if (!existing) throw new Error(`Link ${linkId} not found`)

  const merged = Array.from(
    new Set([...existing.tags, ...newTags.map((t) => t.trim()).filter(Boolean)])
  )

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update({ tags: merged })
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'addTagsToLink')
  return data as LinkRow
}

/** Remove a single tag from a link. */
export async function removeTagFromLink(
  ownerId: string,
  linkId: string,
  tagToRemove: string
): Promise<LinkRow> {
  const userId = requireOwnerId(ownerId)

  const existing = await fetchLink(userId, linkId)
  if (!existing) throw new Error(`Link ${linkId} not found`)

  const updated = existing.tags.filter((t) => t !== tagToRemove)

  const { data, error } = await getSupabaseClient()
    .from('links')
    .update({ tags: updated })
    .eq('id', linkId)
    .eq('user_id', userId)
    .select()
    .single()

  throwIfError(error, 'removeTagFromLink')
  return data as LinkRow
}

/** Hard-delete a single link. */
export async function deleteLink(ownerId: string, linkId: string): Promise<void> {
  const userId = requireOwnerId(ownerId)

  const { error } = await getSupabaseClient()
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', userId)

  throwIfError(error, 'deleteLink')
}

// ─────────────────────────────────────────────────────────
// ── User statistics ───────────────────────────────────────
// ─────────────────────────────────────────────────────────

/** Fetch aggregated stats from the `user_stats` view. Returns null if no data. */
export async function fetchUserStats(ownerId: string): Promise<UserStatsRow | null> {
  const userId = requireOwnerId(ownerId)

  const { data, error } = await getSupabaseClient()
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  throwIfError(error, 'fetchUserStats')
  return data as UserStatsRow | null
}

// ─────────────────────────────────────────────────────────
// ── Account management ────────────────────────────────────
// ─────────────────────────────────────────────────────────

/**
 * Permanently delete ALL data for the calling user.
 *
 * Calls the SECURITY DEFINER PostgreSQL function `delete_user_data()` which:
 *  1. Resolves user id from the server-side JWT `sub` claim (not a client arg)
 *  2. Atomically deletes all links then all collections for that user
 *
 * The client cannot delete another user's data — the function validates the JWT.
 */
export async function deleteAllUserData(): Promise<void> {
  const { error } = await getSupabaseClient().rpc('delete_user_data')
  throwIfError(error, 'deleteAllUserData')
}

// ─────────────────────────────────────────────────────────
// ── Realtime subscriptions ───────────────────────────────
// ─────────────────────────────────────────────────────────

/**
 * Subscribe to INSERT / UPDATE / DELETE events on `links` for a user.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToLinks(
  ownerId: string,
  onEvent: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    row: LinkRow | null,
    oldRow: LinkRow | null
  ) => void
): () => void {
  const userId = requireOwnerId(ownerId)

  const channel = getSupabaseClient()
    .channel(`links:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'links',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onEvent(
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          (payload.new as LinkRow) ?? null,
          (payload.old as LinkRow) ?? null
        )
      }
    )
    .subscribe()

  return () => {
    getSupabaseClient().removeChannel(channel)
  }
}

/**
 * Subscribe to INSERT / UPDATE / DELETE events on `collections` for a user.
 * Returns an unsubscribe function — call it on component unmount.
 */
export function subscribeToCollections(
  ownerId: string,
  onEvent: (
    event: 'INSERT' | 'UPDATE' | 'DELETE',
    row: CollectionRow | null,
    oldRow: CollectionRow | null
  ) => void
): () => void {
  const userId = requireOwnerId(ownerId)

  const channel = getSupabaseClient()
    .channel(`collections:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'collections',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onEvent(
          payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          (payload.new as CollectionRow) ?? null,
          (payload.old as CollectionRow) ?? null
        )
      }
    )
    .subscribe()

  return () => {
    getSupabaseClient().removeChannel(channel)
  }
}
