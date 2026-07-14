create table if not exists public.field_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  pace text default 'Normal',
  state jsonb default '{}'::jsonb,
  nourishment jsonb default '{}'::jsonb,
  body text[] default '{}',
  work jsonb default '{}'::jsonb,
  learning text[] default '{}',
  media jsonb default '[]'::jsonb,
  observation text default '',
  alignment text default '',
  tomorrow text[] default '{}',
  is_public boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.archive_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'reference',
  title text not null,
  creator text default '',
  date text default '',
  link text default '',
  notes text default '',
  tags text[] default '{}',
  file_url text default '',
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.field_logs enable row level security;
alter table public.archive_items enable row level security;

drop policy if exists "public reads public logs" on public.field_logs;
create policy "public reads public logs" on public.field_logs for select using (is_public = true);

drop policy if exists "owner reads own logs" on public.field_logs;
create policy "owner reads own logs" on public.field_logs for select to authenticated using (auth.uid() = user_id);

drop policy if exists "owner inserts own logs" on public.field_logs;
create policy "owner inserts own logs" on public.field_logs for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owner updates own logs" on public.field_logs;
create policy "owner updates own logs" on public.field_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner deletes own logs" on public.field_logs;
create policy "owner deletes own logs" on public.field_logs for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "public reads public archive" on public.archive_items;
create policy "public reads public archive" on public.archive_items for select using (is_public = true);

drop policy if exists "owner reads own archive" on public.archive_items;
create policy "owner reads own archive" on public.archive_items for select to authenticated using (auth.uid() = user_id);

drop policy if exists "owner inserts own archive" on public.archive_items;
create policy "owner inserts own archive" on public.archive_items for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "owner updates own archive" on public.archive_items;
create policy "owner updates own archive" on public.archive_items for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "owner deletes own archive" on public.archive_items;
create policy "owner deletes own archive" on public.archive_items for delete to authenticated using (auth.uid() = user_id);


create table if not exists public.video_archive (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, youtube_url text not null, video_id text default '', thumbnail_url text default '',
  date date, description text default '', tags text[] default '{}', is_public boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now());
alter table public.video_archive enable row level security;
drop policy if exists "public reads public videos" on public.video_archive;
create policy "public reads public videos" on public.video_archive for select using (is_public = true);
drop policy if exists "owner reads own videos" on public.video_archive;
create policy "owner reads own videos" on public.video_archive for select to authenticated using (auth.uid() = user_id);
drop policy if exists "owner inserts own videos" on public.video_archive;
create policy "owner inserts own videos" on public.video_archive for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "owner updates own videos" on public.video_archive;
create policy "owner updates own videos" on public.video_archive for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "owner deletes own videos" on public.video_archive;
create policy "owner deletes own videos" on public.video_archive for delete to authenticated using (auth.uid() = user_id);
