-- =============================================================
-- Migration 0036 — Evento "Solicitar retorno ao cliente" (issue #17)
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0016/0020 (quotation_events).
-- =============================================================

alter table public.quotation_events drop constraint if exists quotation_events_type_check;
alter table public.quotation_events
  add constraint quotation_events_type_check
  check (type in (
    'APPROVED', 'REJECTED', 'COMMENTED', 'FORWARDED', 'REVISION_REQUESTED', 'CLOSED',
    'FOLLOWUP_REQUESTED'
  ));
