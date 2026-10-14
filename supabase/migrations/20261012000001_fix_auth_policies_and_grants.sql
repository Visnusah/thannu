-- ============================================================
-- Migration 003 — Grants & RLS policies supporting both anon key
-- and Firebase third-party JWT authentication.
-- ============================================================

-- 1. Grant table and view permissions to anon & authenticated roles
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.collections to anon, authenticated;
grant select, insert, update, delete on table public.links to anon, authenticated;
grant select on public.user_stats to anon, authenticated;

-- 2. Update Collections RLS policies
drop policy if exists collections_select_own on public.collections;
create policy collections_select_own
on public.collections for select
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

drop policy if exists collections_insert_own on public.collections;
create policy collections_insert_own
on public.collections for insert
with check (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

drop policy if exists collections_update_own on public.collections;
create policy collections_update_own
on public.collections for update
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
)
with check (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

drop policy if exists collections_delete_own on public.collections;
create policy collections_delete_own
on public.collections for delete
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

-- 3. Update Links RLS policies
drop policy if exists links_select_own on public.links;
create policy links_select_own
on public.links for select
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

drop policy if exists links_insert_own on public.links;
create policy links_insert_own
on public.links for insert
with check (
  (auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id)
  and (
    collection_id is null
    or exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = links.user_id
    )
  )
);

drop policy if exists links_update_own on public.links;
create policy links_update_own
on public.links for update
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
)
with check (
  (auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id)
  and (
    collection_id is null
    or exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = links.user_id
    )
  )
);

drop policy if exists links_delete_own on public.links;
create policy links_delete_own
on public.links for delete
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
);

-- 4. Update helper functions with optional p_user_id
create or replace function public.delete_user_data(p_user_id text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id text;
begin
  v_user_id := coalesce(auth.jwt() ->> 'sub', p_user_id);
  if v_user_id is null or v_user_id = '' then
    raise exception 'delete_user_data: user_id is required';
  end if;

  delete from public.links   where user_id = v_user_id;
  delete from public.collections where user_id = v_user_id;
end;
$$;

create or replace function public.links_with_tag(p_tag text, p_user_id text default null)
returns setof public.links
language sql
security invoker
stable
as $$
  select *
  from public.links
  where (p_user_id is null or user_id = p_user_id)
    and p_tag = any(tags)
  order by created_at desc;
$$;

create or replace function public.search_links(p_query text, p_user_id text default null)
returns setof public.links
language sql
security invoker
stable
as $$
  select *
  from public.links
  where (p_user_id is null or user_id = p_user_id)
    and search_tsv @@ plainto_tsquery('english', p_query)
  order by ts_rank(search_tsv, plainto_tsquery('english', p_query)) desc;
$$;

grant execute on function public.delete_user_data(text) to anon, authenticated;
grant execute on function public.links_with_tag(text, text) to anon, authenticated;
grant execute on function public.search_links(text, text) to anon, authenticated;
