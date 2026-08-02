-- =============================================================
-- Migration 0033 — Nome da empresa: "Nova Safra Transportes"
--
-- "Gestão Logística" aparece só na LOGO; o nome usado nos textos do
-- sistema, nos e-mails e no PDF é "Nova Safra Transportes".
--
-- O código já usa o nome novo como padrão, mas o valor cadastrado em
-- `app_settings` tem prioridade sobre ele — por isso a atualização aqui.
-- Só troca se ainda estiver com o texto semeado na migration 0005: se
-- alguém já ajustou o nome pela tela de Configurações, nada é sobrescrito.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

update public.app_settings
set company_name = 'Nova Safra Transportes'
where id = 1
  and company_name = 'Nova Safra Gestão Logística';
