-- =============================================================
-- Migration 0002 — Clientes + Storage de logos
-- Nova Safra CRM — Issue #03
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

-- Tabela de clientes
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  cnpj       text,
  email      text,
  phone      text,
  logo_url   text,
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;

-- -------------------------------------------------------------
-- Função auxiliar: o usuário atual é Admin OU Comercial (ativo)?
-- (Operação não tem acesso aos clientes)
-- -------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role in ('ADMIN', 'COMMERCIAL')
      and active = true
  );
$$;

-- -------------------------------------------------------------
-- Políticas de RLS — apenas Admin e Comercial
-- -------------------------------------------------------------
drop policy if exists "clients_select_staff" on public.clients;
create policy "clients_select_staff" on public.clients
  for select using (public.is_staff());

drop policy if exists "clients_insert_staff" on public.clients;
create policy "clients_insert_staff" on public.clients
  for insert with check (public.is_staff());

drop policy if exists "clients_update_staff" on public.clients;
create policy "clients_update_staff" on public.clients
  for update using (public.is_staff());

-- -------------------------------------------------------------
-- Bucket público para as logos dos clientes
-- (uploads passam pelo service_role no servidor; leitura é pública)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('client-logos', 'client-logos', true)
on conflict (id) do nothing;
