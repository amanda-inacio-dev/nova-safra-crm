-- =============================================================
-- Migration 0027 — Operação não enxerga a conversa com o cliente
--
-- A Operação acompanha o processo interno (encaminhamento, pedido de
-- revisão, encerramento com CT-e). A negociação comercial — aprovação,
-- reprovação e comentários do cliente — não é assunto dela.
--
-- A tela já deixou de mostrar esses eventos; esta policy garante o mesmo
-- no banco, para que também não venham por consulta direta à API.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0020 (is_operation) e 0025 (operation_can_view_quotation).
-- =============================================================

drop policy if exists "quotation_events_select_operation" on public.quotation_events;
create policy "quotation_events_select_operation" on public.quotation_events
  for select using (
    public.is_operation()
    -- Eventos do cliente ficam de fora (o resto do histórico continua visível).
    and type not in ('APPROVED', 'REJECTED', 'COMMENTED')
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_events.quotation_id
        and public.operation_can_view_quotation(q.status, q.id)
    )
  );

-- Nota: `operation_can_view_quotation` continua funcionando normalmente — ela
-- é SECURITY DEFINER e consulta os eventos por fora da RLS, então a Operação
-- não perde a visibilidade das cotações que ela mesma mandou revisar.
