-- =============================================================
-- Migration 0031 — Ordem dos adicionais no PDF
--
-- A ordem em que os adicionais aparecem no PDF passa a ser escolhida
-- na própria cotação (setas ↑/↓ no formulário), em vez de sair na
-- ordem em que o banco devolveu.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0007 (quotation_additionals).
-- =============================================================

alter table public.quotation_additionals
  add column if not exists sort_order int not null default 0;

-- Cotações antigas ficam com 0 em tudo; nesse caso o sistema mantém a ordem
-- que já usava (por nome), então nada muda até alguém reordenar.
