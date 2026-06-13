-- =============================================================
-- Migration 0005 — Área administrativa
-- Adicionais, Portos/Pátios, Certificações e Configurações da empresa
-- Nova Safra CRM — Issue #04
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende das migrations 0001 (is_admin) e 0002 (is_staff).
-- =============================================================

-- Adicionais (custo extra: pedágio, escolta, seguro, etc.)
create table if not exists public.additionals (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  value      numeric(12, 2) not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Portos e pátios (lista fixa para "container vazio")
create table if not exists public.ports (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Certificações (banco de logos para o PDF)
create table if not exists public.certifications (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  image_url  text,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- Configurações gerais (linha única)
create table if not exists public.app_settings (
  id           int primary key default 1,
  company_name text,
  logo_url     text,
  constraint app_settings_singleton check (id = 1)
);

insert into public.app_settings (id, company_name, logo_url)
values (1, 'Nova Safra Gestão Logística', null)
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
alter table public.additionals enable row level security;
alter table public.ports enable row level security;
alter table public.certifications enable row level security;
alter table public.app_settings enable row level security;

-- Listas de domínio: leitura para Admin+Comercial (usadas na cotação),
-- escrita só para Admin.
do $$
declare
  t text;
begin
  foreach t in array array['additionals', 'ports', 'certifications']
  loop
    execute format('drop policy if exists "%1$s_select_staff" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_select_staff" on public.%1$s for select using (public.is_staff());', t);

    execute format('drop policy if exists "%1$s_insert_admin" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_insert_admin" on public.%1$s for insert with check (public.is_admin());', t);

    execute format('drop policy if exists "%1$s_update_admin" on public.%1$s;', t);
    execute format(
      'create policy "%1$s_update_admin" on public.%1$s for update using (public.is_admin());', t);
  end loop;
end$$;

-- Configurações: leitura para qualquer autenticado, escrita só Admin.
drop policy if exists "app_settings_select_auth" on public.app_settings;
create policy "app_settings_select_auth" on public.app_settings
  for select using (auth.uid() is not null);

drop policy if exists "app_settings_update_admin" on public.app_settings;
create policy "app_settings_update_admin" on public.app_settings
  for update using (public.is_admin());

-- -------------------------------------------------------------
-- Storage: bucket público para logos de certificações e branding
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certifications', 'certifications', true)
on conflict (id) do nothing;
