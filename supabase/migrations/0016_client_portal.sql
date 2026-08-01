-- =============================================================
-- Migration 0016 — Portal do cliente (link único + resposta)
-- Nova Safra CRM — Issue #08
--
-- Tabela quotation_events (registro de aprovação/reprovação/comentário
-- do cliente) + garante que client_token seja único (o link público
-- depende disso para achar a cotação certa).
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0007 (quotations).
-- =============================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotations_client_token_key') then
    alter table public.quotations
      add constraint quotations_client_token_key unique (client_token);
  end if;
end$$;

create table if not exists public.quotation_events (
  id             uuid primary key default gen_random_uuid(),
  quotation_id   uuid not null references public.quotations (id) on delete cascade,
  type           text not null check (type in ('APPROVED', 'REJECTED', 'COMMENTED')),
  -- Nulo quando o evento vem do cliente pelo portal público (não é um usuário do sistema).
  actor_id       uuid references public.users (id),
  client_comment text,
  created_at     timestamptz not null default now()
);

alter table public.quotation_events enable row level security;

-- A escrita do portal público passa pelo client de service_role (bypassa RLS,
-- validado só pela posse do token) — estas políticas cobrem o uso autenticado
-- (Comercial/Admin acompanhando a resposta do cliente no dashboard).
drop policy if exists "quotation_events_select_staff" on public.quotation_events;
create policy "quotation_events_select_staff" on public.quotation_events
  for select using (public.is_staff());

drop policy if exists "quotation_events_insert_staff" on public.quotation_events;
create policy "quotation_events_insert_staff" on public.quotation_events
  for insert with check (public.is_staff());

drop policy if exists "quotation_events_update_staff" on public.quotation_events;
create policy "quotation_events_update_staff" on public.quotation_events
  for update using (public.is_staff());

drop policy if exists "quotation_events_delete_staff" on public.quotation_events;
create policy "quotation_events_delete_staff" on public.quotation_events
  for delete using (public.is_staff());
