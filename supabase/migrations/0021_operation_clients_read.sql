-- =============================================================
-- Migration 0021 — Operação precisa ver o nome do cliente
--
-- A lista de cotações e a tela de revisão mostram o cliente via
-- join (quotations -> clients). RLS de "clients" só liberava
-- is_staff() (Admin/Comercial) — por isso a Operação via "—" no
-- lugar do nome. Libera leitura de clients pra Operação também
-- (só leitura; ela continua sem acesso à tela de Clientes).
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0002 (clients) e 0020 (is_operation).
-- =============================================================

drop policy if exists "clients_select_operation" on public.clients;
create policy "clients_select_operation" on public.clients
  for select using (public.is_operation());
