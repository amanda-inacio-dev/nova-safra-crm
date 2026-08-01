-- =============================================================
-- Migration 0026 — Dashboard e listas mestras (issue #13)
--
-- A lista mestra mostra duas informações que hoje a RLS esconde:
--
--   1. RESPONSÁVEL (nome de quem criou a cotação). A tabela `users` só
--      liberava "o próprio perfil" e "tudo, se for admin" — então, pro
--      Comercial, o join quotations -> users voltava nulo em toda cotação
--      criada por outra pessoa (mesmo problema que a migration 0021
--      corrigiu no join com `clients`).
--
--   2. ORIGEM / DESTINO (vêm de `quotation_legs`). A Operação não tinha
--      nenhuma policy de leitura nessa tabela — só o staff (migration 0007).
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (users/is_admin), 0002 (is_staff), 0007 (quotation_legs),
-- 0020 (is_operation), 0025 (operation_can_view_quotation).
-- =============================================================

-- -------------------------------------------------------------
-- 1. Equipe interna enxerga o cadastro básico dos colegas
--    (nome/e-mail/perfil — é o que aparece como "Responsável").
--    Escrita continua exclusiva do Admin: as policies de insert/update
--    da migration 0001 não são tocadas aqui.
-- -------------------------------------------------------------
drop policy if exists "users_select_team" on public.users;
create policy "users_select_team" on public.users
  for select using (public.is_staff() or public.is_operation());

-- -------------------------------------------------------------
-- 2. Operação lê os trechos das cotações que ela já pode ver
--    (mesma regra de visibilidade da própria cotação, sem ampliar nada).
-- -------------------------------------------------------------
drop policy if exists "quotation_legs_select_operation" on public.quotation_legs;
create policy "quotation_legs_select_operation" on public.quotation_legs
  for select using (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_legs.quotation_id
        and public.operation_can_view_quotation(q.status, q.id)
    )
  );
