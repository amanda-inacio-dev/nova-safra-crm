-- =============================================================
-- Migration 0015 — Campo "Referência do processo" na cotação
--
-- Texto livre, opcional, digitado na Identificação da cotação.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

alter table public.quotations
  add column if not exists process_reference text;
