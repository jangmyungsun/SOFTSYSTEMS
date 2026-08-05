create table if not exists public.archive_attachments (
  id uuid primary key default gen_random_uuid(),
  archive_id uuid not null references public.archive_items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'archive-files',
  storage_path text not null unique,
  original_filename text not null,
  mime_type text default '',
  size_bytes bigint default 0,
  attachment_type text not null check (attachment_type in ('image', 'book', 'document')),
  created_at timestamptz not null default now()
);

create index if not exists archive_attachments_archive_id_idx
  on public.archive_attachments (archive_id);

create index if not exists archive_attachments_user_id_idx
  on public.archive_attachments (user_id);

alter table public.archive_attachments enable row level security;

drop policy if exists "public reads public archive attachments" on public.archive_attachments;
create policy "public reads public archive attachments"
on public.archive_attachments
for select
using (
  exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.is_public = true
  )
);

drop policy if exists "owner reads own archive attachments" on public.archive_attachments;
create policy "owner reads own archive attachments"
on public.archive_attachments
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.user_id = auth.uid()
  )
);

drop policy if exists "owner inserts own archive attachments" on public.archive_attachments;
create policy "owner inserts own archive attachments"
on public.archive_attachments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.user_id = auth.uid()
  )
);

drop policy if exists "owner updates own archive attachments" on public.archive_attachments;
create policy "owner updates own archive attachments"
on public.archive_attachments
for update
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.user_id = auth.uid()
  )
);

drop policy if exists "owner deletes own archive attachments" on public.archive_attachments;
create policy "owner deletes own archive attachments"
on public.archive_attachments
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.archive_items
    where archive_items.id = archive_id
      and archive_items.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('archive-files', 'archive-files', false)
on conflict (id) do nothing;

drop policy if exists "authenticated uploads archive files" on storage.objects;
create policy "authenticated uploads archive files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'archive-files'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "authenticated updates archive files" on storage.objects;
create policy "authenticated updates archive files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'archive-files'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'archive-files'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "authenticated deletes archive files" on storage.objects;
create policy "authenticated deletes archive files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'archive-files'
  and split_part(name, '/', 1) = auth.uid()::text
);
