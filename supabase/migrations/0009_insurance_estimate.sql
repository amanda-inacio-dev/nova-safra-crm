-- =============================================================
-- Migration 0009 — Seguro, ICMS por dentro e seleção de campos do total
--
-- 1) quotations: valor da mercadoria, taxa/valor do seguro,
--    impostos suspensos (DTA), alíquota/valor do ICMS e flags de
--    inclusão de frete/seguro no total.
-- 2) quotation_additionals: flag de inclusão no total.
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0007 (quotations) e 0008 (adicionais extra).
-- =============================================================

alter table public.quotations
  add column if not exists merchandise_value  numeric(14, 2),
  add column if not exists insurance_rate     numeric(7, 4),
  add column if not exists suspended_taxes    numeric(14, 2),
  add column if not exists insurance_value    numeric(14, 2),
  add column if not exists icms_rate          numeric(6, 3),
  add column if not exists icms_value         numeric(14, 2),
  add column if not exists freight_in_total   boolean not null default true,
  add column if not exists insurance_in_total boolean not null default true;

alter table public.quotation_additionals
  add column if not exists include_in_total boolean not null default true;
