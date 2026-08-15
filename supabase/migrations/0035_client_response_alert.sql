-- =============================================================
-- Migration 0035 — Alerta de cotação sem retorno do cliente (issue #16)
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0007 (quotations) e 0019/0024 (notifications).
-- =============================================================

alter table public.quotations
  add column if not exists client_response_alert_enabled boolean not null default false,
  add column if not exists client_response_alert_days int,
  -- Quando a cotação foi enviada (ou reenviada) ao cliente — é a partir daqui
  -- que os dias configurados são contados.
  add column if not exists sent_to_client_at timestamptz,
  -- Quando o alerta de "sem retorno" foi de fato disparado — evita notificar
  -- duas vezes a mesma cotação. Reiniciado a cada novo envio ao cliente.
  add column if not exists client_response_alert_sent_at timestamptz;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'CLIENT_APPROVED', 'CLIENT_REJECTED', 'CLIENT_COMMENTED',
    'FORWARDED_TO_OPERATION', 'REVISION_REQUESTED', 'QUOTATION_CLOSED',
    'NO_CLIENT_RESPONSE'
  ));
