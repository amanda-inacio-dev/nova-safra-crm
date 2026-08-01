-- =============================================================
-- Migration 0029 — Excluir cliente (somente Admin)
--
-- A tabela `clients` nunca teve policy de DELETE, então ninguém
-- conseguia excluir. Liberado só para Admin — Comercial cadastra e
-- edita, mas não apaga.
--
-- Importante: cliente COM cotações continua não podendo ser excluído.
-- A chave estrangeira `quotations.client_id` barra a exclusão, e é
-- proposital: apagar o cliente levaria junto o histórico comercial.
-- A tela avisa quantas cotações existem em vez de deixar o erro cru
-- aparecer.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (is_admin) e 0002 (clients).
-- =============================================================

drop policy if exists "clients_delete_admin" on public.clients;
create policy "clients_delete_admin" on public.clients
  for delete using (public.is_admin());
