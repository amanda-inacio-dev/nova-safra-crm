-- =============================================================
-- Migration 0017 — Listas salvas de Remetentes, Destinatários,
-- Origens e Destinos (sugestões reaproveitáveis na cotação)
--
-- 4 catálogos simples (mesmo formato de "Portos"), geridos em
-- Admin > Configurações. Usados como sugestão (datalist) nos campos
-- Remetente/Destinatário e Origem/Destino da cotação — não travam o
-- campo, só evitam redigitar do zero os nomes/rotas mais comuns.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (is_admin) e 0002 (is_staff).
-- =============================================================

create table if not exists public.senders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.recipients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.route_origins (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.route_destinations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.senders enable row level security;
alter table public.recipients enable row level security;
alter table public.route_origins enable row level security;
alter table public.route_destinations enable row level security;

-- Mesma regra das outras listas de domínio: leitura para Admin+Comercial
-- (usadas na cotação), escrita só para Admin.
do $$
declare
  t text;
begin
  foreach t in array array['senders', 'recipients', 'route_origins', 'route_destinations']
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
