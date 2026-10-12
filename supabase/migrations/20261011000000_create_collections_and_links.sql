-- Thannu owner-scoped data model.
-- The client uses a Firebase token provider; policies read the JWT `sub`
-- claim so Firebase user IDs can remain text instead of being cast to UUID.

create table if not exists public.collections (
  id text primary key,
  user_id text not null,
  name text not null,
  icon text not null,
  color text not null,
  item_count integer not null default 0 check (item_count >= 0),
  new_count integer not null default 0 check (new_count >= 0),
  priority text not null default 'none' check (priority in ('high', 'medium', 'low', 'none')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.links (
  id text primary key,
  user_id text not null,
  collection_id text references public.collections(id) on delete set null,
  url text not null,
  title text not null default '',
  description text not null default '',
  domain text not null default '',
  image_url text,
  tags text[] not null default '{}',
  notes text not null default '',
  reviewed_at timestamptz,
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists collections_user_id_idx on public.collections(user_id);
create index if not exists collections_user_created_at_idx on public.collections(user_id, created_at);
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_collection_id_idx on public.links(collection_id);
create index if not exists links_user_created_at_idx on public.links(user_id, created_at desc);
create index if not exists links_user_reviewed_at_idx on public.links(user_id, reviewed_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists collections_set_updated_at on public.collections;
create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
before update on public.links
for each row execute function public.set_updated_at();

alter table public.collections enable row level security;
alter table public.links enable row level security;

drop policy if exists collections_select_own on public.collections;
create policy collections_select_own
on public.collections for select
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists collections_insert_own on public.collections;
create policy collections_insert_own
on public.collections for insert
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists collections_update_own on public.collections;
create policy collections_update_own
on public.collections for update
using ((auth.jwt() ->> 'sub') = user_id)
with check ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists collections_delete_own on public.collections;
create policy collections_delete_own
on public.collections for delete
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists links_select_own on public.links;
create policy links_select_own
on public.links for select
using ((auth.jwt() ->> 'sub') = user_id);

drop policy if exists links_insert_own on public.links;
create policy links_insert_own
on public.links for insert
with check (
  (auth.jwt() ->> 'sub') = user_id
  and (
    collection_id is null
    or exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = (auth.jwt() ->> 'sub')
    )
  )
);

drop policy if exists links_update_own on public.links;
create policy links_update_own
on public.links for update
using ((auth.jwt() ->> 'sub') = user_id)
with check (
  (auth.jwt() ->> 'sub') = user_id
  and (
    collection_id is null
    or exists (
      select 1
      from public.collections c
      where c.id = collection_id
        and c.user_id = (auth.jwt() ->> 'sub')
    )
  )
);

drop policy if exists links_delete_own on public.links;
create policy links_delete_own
on public.links for delete
using ((auth.jwt() ->> 'sub') = user_id);

grant select, insert, update, delete on table public.collections to authenticated;
grant select, insert, update, delete on table public.links to authenticated;
