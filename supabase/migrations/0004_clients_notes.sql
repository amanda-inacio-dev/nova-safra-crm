-- =============================================================
-- Migration 0004 — Campo "Observações" no cliente
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

alter table public.clients
  add column if not exists notes text;
