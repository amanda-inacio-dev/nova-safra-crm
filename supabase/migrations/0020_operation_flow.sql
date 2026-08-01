-- =============================================================
-- Migration 0020 — Fluxo da operação (issue #11)
--
-- Encaminhar cotação aprovada pra Operação, Operação solicitar
-- revisão ou encerrar o processo com upload do CT-e.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (is_admin), 0002 (is_staff), 0007 (quotations),
-- 0016 (quotation_events).
-- =============================================================

-- Coluna do CT-e (PDF) que encerra o processo.
alter table public.quotations
  add column if not exists cte_url text;

-- -------------------------------------------------------------
-- Função auxiliar: o usuário atual é da Operação (ativo)?
-- -------------------------------------------------------------
create or replace function public.is_operation()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'OPERATION'
      and active = true
  );
$$;

-- -------------------------------------------------------------
-- Operação só vê/atualiza cotações ENCAMINHADA ou CONCLUIDA
-- (Comercial/Admin continuam com acesso total via is_staff()).
-- -------------------------------------------------------------
drop policy if exists "quotations_select_operation" on public.quotations;
create policy "quotations_select_operation" on public.quotations
  for select using (public.is_operation() and status in ('ENCAMINHADA', 'CONCLUIDA'));

drop policy if exists "quotations_update_operation" on public.quotations;
create policy "quotations_update_operation" on public.quotations
  for update using (public.is_operation() and status in ('ENCAMINHADA', 'CONCLUIDA'));

-- -------------------------------------------------------------
-- quotation_events: novos tipos para o histórico da operação +
-- acesso de leitura/escrita da Operação nas cotações que ela vê.
-- -------------------------------------------------------------
alter table public.quotation_events drop constraint if exists quotation_events_type_check;
alter table public.quotation_events
  add constraint quotation_events_type_check
  check (type in ('APPROVED', 'REJECTED', 'COMMENTED', 'FORWARDED', 'REVISION_REQUESTED', 'CLOSED'));

drop policy if exists "quotation_events_select_operation" on public.quotation_events;
create policy "quotation_events_select_operation" on public.quotation_events
  for select using (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_events.quotation_id
        and q.status in ('ENCAMINHADA', 'CONCLUIDA')
    )
  );

drop policy if exists "quotation_events_insert_operation" on public.quotation_events;
create policy "quotation_events_insert_operation" on public.quotation_events
  for insert with check (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_events.quotation_id
        and q.status in ('ENCAMINHADA', 'CONCLUIDA')
    )
  );

-- notifications: novos tipos (encaminhado pra Operação, revisão solicitada).
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in ('CLIENT_APPROVED', 'CLIENT_REJECTED', 'CLIENT_COMMENTED', 'FORWARDED_TO_OPERATION', 'REVISION_REQUESTED'));

-- Bucket público para o CT-e (upload via service_role, leitura pública).
insert into storage.buckets (id, name, public)
values ('cte-documents', 'cte-documents', true)
on conflict (id) do nothing;
