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
alter table public.field_logs
add column if not exists media jsonb default '[]'::jsonb;

create table if not exists public.translation_cache (
  id uuid primary key default gen_random_uuid(),
  content_key text not null,
  text_hash text not null,
  source_language text not null,
  target_language text not null,
  translated_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (content_key, text_hash, source_language, target_language)
);

create table if not exists public.daily_attachments (
  id uuid primary key default gen_random_uuid(),
  daily_id uuid not null references public.field_logs(id) on delete cascade,
  storage_bucket text not null default 'daily-collection',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text default '',
  size_bytes bigint default 0,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists daily_attachments_daily_id_idx on public.daily_attachments (daily_id);
create index if not exists daily_attachments_uploaded_by_idx on public.daily_attachments (uploaded_by);

alter table public.daily_attachments enable row level security;

drop policy if exists "public reads public daily attachments" on public.daily_attachments;
create policy "public reads public daily attachments" on public.daily_attachments for select using (
  is_public = true
  and exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.is_public = true
  )
);

drop policy if exists "owner reads own daily attachments" on public.daily_attachments;
create policy "owner reads own daily attachments" on public.daily_attachments for select to authenticated using (
  auth.uid() = uploaded_by
  or exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.user_id = auth.uid()
  )
);

drop policy if exists "owner inserts own daily attachments" on public.daily_attachments;
create policy "owner inserts own daily attachments" on public.daily_attachments for insert to authenticated with check (
  auth.uid() = uploaded_by
  and exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.user_id = auth.uid()
  )
);

drop policy if exists "owner updates own daily attachments" on public.daily_attachments;
create policy "owner updates own daily attachments" on public.daily_attachments for update to authenticated using (
  auth.uid() = uploaded_by
  and exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.user_id = auth.uid()
  )
) with check (
  auth.uid() = uploaded_by
  and exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.user_id = auth.uid()
  )
);

drop policy if exists "owner deletes own daily attachments" on public.daily_attachments;
create policy "owner deletes own daily attachments" on public.daily_attachments for delete to authenticated using (
  auth.uid() = uploaded_by
  and exists (
    select 1
    from public.field_logs
    where field_logs.id = daily_id
      and field_logs.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('daily-collection', 'daily-collection', false)
on conflict (id) do nothing;

drop policy if exists "authenticated uploads daily collection files" on storage.objects;
create policy "authenticated uploads daily collection files" on storage.objects for insert to authenticated with check (
  bucket_id = 'daily-collection'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "authenticated updates daily collection files" on storage.objects;
create policy "authenticated updates daily collection files" on storage.objects for update to authenticated using (
  bucket_id = 'daily-collection'
  and split_part(name, '/', 1) = auth.uid()::text
) with check (
  bucket_id = 'daily-collection'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "authenticated deletes daily collection files" on storage.objects;
create policy "authenticated deletes daily collection files" on storage.objects for delete to authenticated using (
  bucket_id = 'daily-collection'
  and split_part(name, '/', 1) = auth.uid()::text
);
