-- =============================================================
-- Migration 0010 — Impostos suspensos como percentual
--
-- Impostos suspensos passam a ser informados em % (alíquota).
-- O valor em R$ continua em `suspended_taxes` (calculado:
-- valor da mercadoria × alíquota%). A nova coluna guarda a alíquota.
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0009 (insurance_estimate).
-- =============================================================

alter table public.quotations
  add column if not exists suspended_taxes_rate numeric(6, 3);
