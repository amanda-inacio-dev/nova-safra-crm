-- =============================================================
-- Migration 0024 — Notifica o Comercial quando a Operação encerra
--
-- Faltava avisar o Comercial (in-app + e-mail) quando a Operação
-- conclui o processo e anexa o CT-e — só o evento ficava registrado
-- no histórico, sem notificação.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0019 (notifications).
-- =============================================================

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'CLIENT_APPROVED', 'CLIENT_REJECTED', 'CLIENT_COMMENTED',
    'FORWARDED_TO_OPERATION', 'REVISION_REQUESTED', 'QUOTATION_CLOSED'
  ));
