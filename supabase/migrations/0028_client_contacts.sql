-- =============================================================
-- Migration 0028 — Vários contatos (e vários e-mails) por cliente
--
-- Um cliente costuma ter mais de uma pessoa envolvida na cotação
-- (comprador, logística, financeiro). Antes só cabia um contato e um
-- e-mail nas colunas de `clients`.
--
-- Os campos antigos NÃO foram removidos: eles continuam valendo como o
-- "contato principal" do cliente, e são usados por telas que já existiam.
-- Esta tabela guarda os contatos ADICIONAIS.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0002 (clients, is_staff).
-- =============================================================

create table if not exists public.client_contacts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  name       text not null default '',
  email      text,
  phone      text,
  -- Cargo/área da pessoa (ex.: "Logística", "Financeiro") — texto livre.
  role       text,
  created_at timestamptz not null default now()
);

create index if not exists client_contacts_client_id_idx
  on public.client_contacts (client_id);

alter table public.client_contacts enable row level security;

-- Mesma regra de `clients`: Admin e Comercial gerenciam; a Operação não
-- precisa dos contatos comerciais do cliente.
drop policy if exists "client_contacts_select_staff" on public.client_contacts;
create policy "client_contacts_select_staff" on public.client_contacts
  for select using (public.is_staff());

drop policy if exists "client_contacts_insert_staff" on public.client_contacts;
create policy "client_contacts_insert_staff" on public.client_contacts
  for insert with check (public.is_staff());

drop policy if exists "client_contacts_update_staff" on public.client_contacts;
create policy "client_contacts_update_staff" on public.client_contacts
  for update using (public.is_staff());

drop policy if exists "client_contacts_delete_staff" on public.client_contacts;
create policy "client_contacts_delete_staff" on public.client_contacts
  for delete using (public.is_staff());
