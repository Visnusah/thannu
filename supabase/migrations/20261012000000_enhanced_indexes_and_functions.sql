-- ============================================================
-- Migration 002 — Enhanced indexes, tag search, stats view,
-- and secure delete_user_data() function.
-- Requires migration 001 (20261011000000) to already be applied.
-- ============================================================

-- -----------------------------------------------
-- 1. GIN index for fast tag array searches
-- -----------------------------------------------
create index if not exists links_tags_gin_idx
  on public.links using gin (tags);

-- -----------------------------------------------
-- 2. Partial index: unreviewed links per user
--    (WHERE reviewed_at IS NULL avoids scanning reviewed rows)
-- -----------------------------------------------
create index if not exists links_user_unreviewed_idx
  on public.links (user_id, created_at desc)
  where reviewed_at is null;

-- -----------------------------------------------
-- 3. Partial index: pinned links per user
-- -----------------------------------------------
create index if not exists links_user_pinned_idx
  on public.links (user_id, created_at desc)
  where is_pinned = true;

-- -----------------------------------------------
-- 4. Composite index: links per collection, newest first
-- -----------------------------------------------
create index if not exists links_collection_created_idx
  on public.links (collection_id, created_at desc)
  where collection_id is not null;

-- -----------------------------------------------
-- 5. Full-text search index for title + description
-- -----------------------------------------------
alter table public.links
  add column if not exists search_tsv tsvector
    generated always as (
      to_tsvector('english',
        coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, '')
      )
    ) stored;

create index if not exists links_search_fts_idx
  on public.links using gin (search_tsv);

-- -----------------------------------------------
-- 6. User-level statistics view
--    Policies on the base tables protect row access;
--    the view inherits them automatically (security_invoker).
-- -----------------------------------------------
create or replace view public.user_stats
  with (security_invoker = true)
as
with user_ids as (
  select user_id from public.collections
  union
  select user_id from public.links
),
link_stats as (
  select
    user_id,
    count(*)::integer                               as total_links,
    count(*) filter (where reviewed_at is null)::integer as unreviewed_links,
    count(*) filter (where is_pinned = true)::integer    as pinned_links,
    max(created_at)                                 as last_saved_at
  from public.links
  group by user_id
),
tag_stats as (
  select
    l.user_id,
    count(distinct t.tag)::integer as unique_tags
  from public.links l
  cross join lateral unnest(l.tags) as t(tag)
  group by l.user_id
),
collection_stats as (
  select
    user_id,
    count(*)::integer as total_collections
  from public.collections
  group by user_id
)
select
  u.user_id,
  coalesce(cs.total_collections, 0)::integer as total_collections,
  coalesce(ls.total_links, 0)::integer       as total_links,
  coalesce(ls.unreviewed_links, 0)::integer  as unreviewed_links,
  coalesce(ls.pinned_links, 0)::integer      as pinned_links,
  coalesce(ts.unique_tags, 0)::integer       as unique_tags,
  ls.last_saved_at
from user_ids u
left join collection_stats cs on cs.user_id = u.user_id
left join link_stats ls       on ls.user_id = u.user_id
left join tag_stats ts        on ts.user_id = u.user_id;

-- Grant read access to authenticated users
-- (view rows still filtered by security_invoker RLS on base tables)
grant select on public.user_stats to authenticated;

-- -----------------------------------------------
-- 7. Secure delete_user_data() — wipes all rows for the caller
--    Uses SECURITY DEFINER so it can bypass the per-row RLS check
--    without granting the caller elevated table privileges.
--    The caller's Firebase `sub` claim gates entry.
-- -----------------------------------------------
create or replace function public.delete_user_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
begin
  -- Resolve the calling user's id from the JWT sub claim
  v_user_id := (auth.jwt() ->> 'sub');

  if v_user_id is null or v_user_id = '' then
    raise exception 'delete_user_data: unauthenticated call rejected';
  end if;

  -- Delete links first (FK references collections)
  delete from public.links   where user_id = v_user_id;
  delete from public.collections where user_id = v_user_id;
end;
$$;

-- Only the authenticated role may call this function
revoke execute on function public.delete_user_data() from public;
grant  execute on function public.delete_user_data() to authenticated;

-- -----------------------------------------------
-- 8. Helper function: search links by tag for a user
-- -----------------------------------------------
create or replace function public.links_with_tag(p_tag text)
returns setof public.links
language sql
security invoker
stable
as $$
  select *
  from public.links
  where user_id = (auth.jwt() ->> 'sub')
    and p_tag = any(tags)
  order by created_at desc;
$$;

grant execute on function public.links_with_tag(text) to authenticated;

-- -----------------------------------------------
-- 9. Helper function: full-text search across links
-- -----------------------------------------------
create or replace function public.search_links(p_query text)
returns setof public.links
language sql
security invoker
stable
as $$
  select *
  from public.links
  where user_id = (auth.jwt() ->> 'sub')
    and search_tsv @@ plainto_tsquery('english', p_query)
  order by ts_rank(search_tsv, plainto_tsquery('english', p_query)) desc;
$$;

grant execute on function public.search_links(text) to authenticated;
