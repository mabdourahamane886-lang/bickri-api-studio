create extension if not exists pgcrypto;

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  key_hash text not null unique,
  key_prefix text not null,
  mode text not null check (mode in ('test', 'live')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index if not exists api_keys_status_mode_idx on public.api_keys (status, mode);
alter table public.api_keys enable row level security;

-- No public policies: access is restricted to trusted server-side service-role operations.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to browser code.
