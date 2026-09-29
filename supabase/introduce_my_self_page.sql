begin;

create table if not exists public.site_pages (
  slug text primary key,
  title text not null default '',
  content text not null default '',
  user_id uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_pages (slug, title, content, user_id)
values ('introduce-my-self', 'Introduce my self', '', null)
on conflict (slug) do nothing;

alter table public.site_pages enable row level security;

drop policy if exists "public reads site pages" on public.site_pages;
create policy "public reads site pages"
on public.site_pages
for select
using (true);

drop policy if exists "authenticated inserts own site pages" on public.site_pages;
create policy "authenticated inserts own site pages"
on public.site_pages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "owner updates site pages" on public.site_pages;
create policy "owner updates site pages"
on public.site_pages
for update
to authenticated
using (user_id is null or auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';

commit;
