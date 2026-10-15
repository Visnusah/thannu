-- Support nested collections while keeping existing collections at the root.
alter table public.collections
  add column if not exists parent_id text references public.collections(id) on delete cascade;

create index if not exists collections_parent_id_idx
  on public.collections(parent_id);

-- A child collection may only point to a collection owned by the same user.
-- Keep the policy shape compatible with the project's optional Firebase JWT
-- mode while preventing cross-user parent references when a JWT is present.
create or replace function public.collection_belongs_to_user(
  p_collection_id text,
  p_user_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collections
    where id = p_collection_id and user_id = p_user_id
  );
$$;

grant execute on function public.collection_belongs_to_user(text, text) to anon, authenticated;

drop policy if exists collections_insert_own on public.collections;
create policy collections_insert_own
on public.collections for insert
with check (
  (auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id)
  and (
    parent_id is null
    or public.collection_belongs_to_user(parent_id, user_id)
  )
);

drop policy if exists collections_update_own on public.collections;
create policy collections_update_own
on public.collections for update
using (
  auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id
)
with check (
  (auth.jwt() is null or auth.jwt() ->> 'sub' is null or (auth.jwt() ->> 'sub') = user_id)
  and (
    parent_id is null
    or public.collection_belongs_to_user(parent_id, user_id)
  )
);
