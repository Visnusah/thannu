import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { CollectionPriority } from '@/stores/collectionsStore'

/**
 * The database schema used by the client. Keep this type in sync with the
 * migration in supabase/migrations; it makes accidental writes to unknown
 * columns a type error without putting any credentials in the bundle.
 */
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
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

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
  created_at: string
  updated_at: string
  is_pinned: boolean
}

type CollectionInsert = Omit<CollectionRow, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}
type CollectionUpdate = Partial<CollectionInsert>
type LinkInsert = Omit<LinkRow, 'created_at' | 'updated_at'> & {
  created_at?: string
  updated_at?: string
}
type LinkUpdate = Partial<LinkInsert>

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

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? ''
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? ''

/** True only when both public runtime configuration values are available. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

/**
 * Firebase Auth integration point.
 *
 * Firebase Auth can be initialized independently of this service. After the
 * Firebase session is available, register a provider such as:
 *
 *   setFirebaseTokenProvider(() => auth.currentUser?.getIdToken() ?? Promise.resolve(null))
 *
 * The Supabase project must be configured to accept the Firebase JWT (or the
 * app must exchange it for a Supabase-compatible JWT). The SQL policies use
 * the JWT `sub` claim as the owner id, so the value must match `user_id`.
 */
let firebaseTokenProvider: FirebaseTokenProvider | null = null

export function setFirebaseTokenProvider(provider: FirebaseTokenProvider | null): () => void {
  firebaseTokenProvider = provider

  return () => {
    if (firebaseTokenProvider === provider) {
      firebaseTokenProvider = null
    }
  }
}

/**
 * Optional client: local/offline builds can import this module before remote
 * configuration exists. Call getSupabaseClient() from sync code to receive a
 * useful configuration error instead of silently making unauthenticated calls.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishableKey, {
      // Firebase owns the session lifecycle; Supabase only receives a token
      // from the provider above for each request.
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

function requireOwnerId(ownerId: string): string {
  const normalizedOwnerId = ownerId.trim()
  if (!normalizedOwnerId) {
    throw new Error('A Firebase user id is required for an owner-scoped Supabase operation.')
  }

  return normalizedOwnerId
}

function toIsoDate(value: number | string | null | undefined): string | null {
  if (value == null) return null
  if (typeof value === 'string') return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date supplied to Supabase sync.')
  }

  return date.toISOString()
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(`Supabase request failed: ${error.message}`)
}

/** Fetch only collections owned by the supplied Firebase user id. */
export async function fetchCollections(ownerId: string): Promise<CollectionRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  throwIfError(error)
  return data ?? []
}

/** Fetch only links owned by the supplied Firebase user id. */
export async function fetchLinks(ownerId: string): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  const { data, error } = await getSupabaseClient()
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  throwIfError(error)
  return data ?? []
}

/** Upsert local collection records while always setting their owner id here. */
export async function upsertCollections(
  ownerId: string,
  collections: CollectionSyncInput[]
): Promise<CollectionRow[]> {
  const userId = requireOwnerId(ownerId)
  if (collections.length === 0) return []

  const rows: CollectionInsert[] = collections.map((collection) => ({
    id: collection.id,
    user_id: userId,
    name: collection.name,
    icon: collection.icon,
    color: collection.color,
    item_count: collection.itemCount ?? 0,
    new_count: collection.newCount ?? 0,
    priority: collection.priority ?? 'none',
    ...(collection.createdAt == null ? {} : { created_at: toIsoDate(collection.createdAt) as string }),
  }))

  const { data, error } = await getSupabaseClient()
    .from('collections')
    .upsert(rows, { onConflict: 'id' })
    .select()

  throwIfError(error)
  return data ?? []
}

/** Upsert local link records while always setting their owner id here. */
export async function upsertLinks(ownerId: string, links: LinkSyncInput[]): Promise<LinkRow[]> {
  const userId = requireOwnerId(ownerId)
  if (links.length === 0) return []

  const rows: LinkInsert[] = links.map((link) => ({
    id: link.id,
    user_id: userId,
    collection_id: link.collectionId === 'unsorted' ? null : link.collectionId ?? null,
    url: link.url,
    title: link.title ?? '',
    description: link.description ?? '',
    domain: link.domain ?? '',
    image_url: link.imageUrl ?? null,
    tags: link.tags ?? [],
    notes: link.notes ?? '',
    reviewed_at: toIsoDate(link.reviewedAt),
    created_at: toIsoDate(link.createdAt) ?? new Date().toISOString(),
    is_pinned: link.isPinned ?? false,
  }))

  const { data, error } = await getSupabaseClient()
    .from('links')
    .upsert(rows, { onConflict: 'id' })
    .select()

  throwIfError(error)
  return data ?? []
}

export async function deleteCollection(ownerId: string, collectionId: string): Promise<void> {
  const userId = requireOwnerId(ownerId)
  const { error } = await getSupabaseClient()
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId)

  throwIfError(error)
}

export async function deleteLink(ownerId: string, linkId: string): Promise<void> {
  const userId = requireOwnerId(ownerId)
  const { error } = await getSupabaseClient()
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', userId)

  throwIfError(error)
}
