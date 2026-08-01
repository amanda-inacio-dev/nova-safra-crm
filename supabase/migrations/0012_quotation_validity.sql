-- =============================================================
-- Migration 0012 — Validade da cotação
--
-- Campo de texto livre (ex.: "10 dias", "até 30/08") exibido no
-- cabeçalho do PDF, digitado pelo Comercial no formulário.
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

alter table public.quotations
  add column if not exists validity text;
