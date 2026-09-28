-- Repair the Archive attachment schema expected by the current SOFTSYSTEMS code.
--
-- Why this exists:
-- The application writes new Archive records to public.archive_items and expects
-- archive_attachments to use the columns below. An earlier manually-created
-- archive_attachments table used different column names and referenced
-- public.archive_entries instead, so attachment metadata could not be saved.
--
-- This migration preserves any incompatible existing table by renaming it to a
-- timestamped archive_attachments_legacy_* backup before creating the canonical
-- table. It does not delete that backup.

begin;

do $$
declare
  needs_rebuild boolean := false;
  backup_name text;
begin
  if to_regclass('public.archive_attachments') is not null then
    select
      not (
        exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'id'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'archive_id'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'user_id'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'storage_bucket'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'storage_path'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'original_filename'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'mime_type'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'size_bytes'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'attachment_type'
        )
        and exists (
          select 1 from information_schema.columns
          where table_schema = 'public'
            and table_name = 'archive_attachments'
            and column_name = 'created_at'
        )
      )
      into needs_rebuild;

    -- Even if the column names look right, the canonical table must reference
    -- archive_items because that is where the current UI saves new entries.
    if not needs_rebuild then
      select not exists (
        select 1
        from pg_constraint c
        join pg_class child on child.oid = c.conrelid
        join pg_namespace child_ns on child_ns.oid = child.relnamespace
        join pg_class parent on parent.oid = c.confrelid
        join pg_namespace parent_ns on parent_ns.oid = parent.relnamespace
        where c.contype = 'f'
          and child_ns.nspname = 'public'
          and child.relname = 'archive_attachments'
          and parent_ns.nspname = 'public'
          and parent.relname = 'archive_items'
      ) into needs_rebuild;
    end if;

    if needs_rebuild then
      backup_name := 'archive_attachments_legacy_' ||
        to_char(clock_timestamp(), 'YYYYMMDDHH24MISS');

      -- Move the incompatible table (and its indexes) out of public first so
      -- canonical index/constraint names can be reused safely.
      execute 'create schema if not exists softsystems_backup';

      if to_regclass('softsystems_backup.archive_attachments') is not null then
        execute format(
          'alter table softsystems_backup.archive_attachments rename to %I',
          'archive_attachments_interrupted_' ||
            to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS')
        );
      end if;

      execute 'alter table public.archive_attachments set schema softsystems_backup';
      execute format(
        'alter table softsystems_backup.archive_attachments rename to %I',
        backup_name
      );

      raise notice 'Existing incompatible archive_attachments table preserved as softsystems_backup.%', backup_name;
    end if;
  end if;
end $$;

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

-- Use a dedicated private bucket for Archive attachments. The browser uploads
-- directly, while reads are served through the signed-URL API route.
insert into storage.buckets (id, name, public)
values ('archive-files', 'archive-files', false)
on conflict (id) do update set public = excluded.public;

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

commit;

-- Refresh the Data API schema cache after the DDL changes.
notify pgrst, 'reload schema';
select pg_notification_queue_usage();

-- Verification: this should return the canonical columns.
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'archive_attachments'
order by ordinal_position;
