-- Optional one-time cleanup.
-- The UI already displays legacy Reflection entries as Idea without this SQL.
-- Run this only if you also want the stored database value changed from reflection to idea.

update public.archive_items
set type = 'idea'
where lower(trim(coalesce(type, ''))) = 'reflection';

do $$
begin
  if to_regclass('public.archive_entries') is not null then
    execute $sql$
      update public.archive_entries
      set type = 'idea'
      where lower(trim(coalesce(type, ''))) = 'reflection'
    $sql$;
  end if;
end $$;
