-- Run in the SQL Editor of a DEDICATED Supabase project for Sypher.
-- All tables are PRIVATE. Only the Vercel backend secret key accesses them.
create table if not exists public.sypher_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.sypher_inquiries (
  id uuid primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists sypher_inquiries_recent_idx on public.sypher_inquiries (created_at desc);
create table if not exists public.sypher_sessions (
  token_hash text primary key,
  expires_at timestamptz not null
);
create table if not exists public.sypher_rate_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists sypher_rate_recent_idx on public.sypher_rate_events(key,created_at desc);
alter table public.sypher_content enable row level security;
alter table public.sypher_inquiries enable row level security;
alter table public.sypher_sessions enable row level security;
alter table public.sypher_rate_events enable row level security;
-- Do not add anonymous/authenticated RLS policies for these tables.
-- The backend, NOT the browser, reads/writes them using a secret key.
revoke all on public.sypher_content from anon, authenticated;
revoke all on public.sypher_inquiries from anon, authenticated;
revoke all on public.sypher_sessions from anon, authenticated;
revoke all on public.sypher_rate_events from anon, authenticated;
revoke all on sequence public.sypher_rate_events_id_seq from anon, authenticated;
grant select, insert, update, delete on public.sypher_content to service_role;
grant select, insert, update, delete on public.sypher_inquiries to service_role;
grant select, insert, update, delete on public.sypher_sessions to service_role;
grant select, insert, update, delete on public.sypher_rate_events to service_role;
grant usage, select on sequence public.sypher_rate_events_id_seq to service_role;
-- Maintenance (optional): run occasionally in the SQL Editor
-- delete from public.sypher_sessions where expires_at < now();
-- delete from public.sypher_rate_events where created_at < now() - interval '30 days';
