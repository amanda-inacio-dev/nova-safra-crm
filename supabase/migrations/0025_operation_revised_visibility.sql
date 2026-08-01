-- =============================================================
-- Migration 0025 — Operação continua vendo cotações que ela mesma
-- pediu revisão, mesmo depois do status voltar pra APROVADA
--
-- Antes, assim que "Solicitar revisão" mudava o status pra APROVADA,
-- a Operação perdia a visibilidade da cotação na hora (RLS só
-- liberava ENCAMINHADA/CONCLUIDA) — ela sumia da lista, mesmo tendo
-- sido a própria Operação que pediu a revisão. Agora ela continua
-- aparecendo (com o rótulo "Revisão solicitada"), até o Comercial
-- ajustar e reencaminhar.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0020 (is_operation, quotations_select_operation).
-- =============================================================

create or replace function public.operation_can_view_quotation(p_status text, p_quotation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_status in ('ENCAMINHADA', 'CONCLUIDA')
    or (
      p_status = 'APROVADA'
      and exists (
        select 1 from public.quotation_events e
        where e.quotation_id = p_quotation_id and e.type = 'REVISION_REQUESTED'
      )
    );
$$;

drop policy if exists "quotations_select_operation" on public.quotations;
create policy "quotations_select_operation" on public.quotations
  for select using (public.is_operation() and public.operation_can_view_quotation(status, id));

drop policy if exists "quotation_events_select_operation" on public.quotation_events;
create policy "quotation_events_select_operation" on public.quotation_events
  for select using (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_events.quotation_id
        and public.operation_can_view_quotation(q.status, q.id)
    )
  );
