begin;

create extension if not exists pgcrypto;

create table if not exists public.site_visitors (
  id bigint generated always as identity primary key,
  visitor_id text not null unique,
  first_page text default '/',
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.site_page_views (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  page_path text not null,
  created_at timestamptz default now()
);

alter table public.site_page_views
  add column if not exists page_path text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_page_views'
      and column_name = 'pathname'
  ) then
    execute '
      update public.site_page_views
      set page_path = pathname
      where page_path is null
        and pathname is not null
    ';
  end if;
end $$;

update public.site_page_views
set page_path = '/'
where page_path is null;

alter table public.site_page_views
  alter column page_path set not null;

alter table public.site_page_views
  drop column if exists pathname;

create table if not exists public.site_visitor_sessions (
  id bigint generated always as identity primary key,
  visitor_id text not null,
  session_id text not null,
  source_category text not null default 'direct',
  country_code text,
  session_started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (visitor_id, session_id)
);

create index if not exists site_page_views_visitor_id_idx
  on public.site_page_views (visitor_id);

create index if not exists site_page_views_page_path_idx
  on public.site_page_views (page_path);

create index if not exists site_page_views_created_at_idx
  on public.site_page_views (created_at);

create index if not exists site_visitor_sessions_visitor_id_idx
  on public.site_visitor_sessions (visitor_id);

create index if not exists site_visitor_sessions_source_category_idx
  on public.site_visitor_sessions (source_category);

create index if not exists site_visitor_sessions_country_code_idx
  on public.site_visitor_sessions (country_code);

create index if not exists site_visitor_sessions_last_activity_at_idx
  on public.site_visitor_sessions (last_activity_at);

alter table public.site_visitors enable row level security;
alter table public.site_page_views enable row level security;
alter table public.site_visitor_sessions enable row level security;

drop policy if exists "service role manages site visitors" on public.site_visitors;
create policy "service role manages site visitors" on public.site_visitors
  for all to service_role
  using (true)
  with check (true);

drop policy if exists "service role manages site page views" on public.site_page_views;
create policy "service role manages site page views" on public.site_page_views
  for all to service_role
  using (true)
  with check (true);

drop policy if exists "service role manages site visitor sessions" on public.site_visitor_sessions;
create policy "service role manages site visitor sessions" on public.site_visitor_sessions
  for all to service_role
  using (true)
  with check (true);

notify pgrst, 'reload schema';

commit;
