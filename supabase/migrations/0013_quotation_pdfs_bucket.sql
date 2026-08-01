-- =============================================================
-- Migration 0013 — Bucket de Storage para os PDFs das cotações
-- Nova Safra CRM — Issue #07
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

insert into storage.buckets (id, name, public)
values ('quotation-pdfs', 'quotation-pdfs', true)
on conflict (id) do nothing;
