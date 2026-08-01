-- =============================================================
-- Migration 0022 — Corrige RLS de update da Operação em quotations
--
-- Bug real: a policy "quotations_update_operation" (migration 0020) só tinha
-- USING, sem WITH CHECK explícito. O Postgres, nesse caso, reaplica a MESMA
-- expressão do USING como WITH CHECK — ou seja, ela também exigia que o NOVO
-- status (depois do update) já estivesse em ('ENCAMINHADA','CONCLUIDA').
-- Isso bloqueava silenciosamente a própria transição que a Operação precisa
-- fazer em "Solicitar revisão" (ENCAMINHADA -> APROVADA): a Operação só podia
-- ver/editar linhas ENCAMINHADA/CONCLUIDA, mas não podia MUDAR o status pra
-- fora desse conjunto.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0020 (is_operation, quotations_update_operation).
-- =============================================================

drop policy if exists "quotations_update_operation" on public.quotations;
create policy "quotations_update_operation" on public.quotations
  for update
  using (public.is_operation() and status in ('ENCAMINHADA', 'CONCLUIDA'))
  with check (public.is_operation());
