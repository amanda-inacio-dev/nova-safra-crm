-- =============================================================
-- Migration 0023 — Função dedicada pra "Solicitar revisão"
--
-- As migrations 0020/0022 tentaram resolver isso via RLS genérica
-- (policy de UPDATE), mas mesmo com o WITH CHECK certo gravado
-- (confirmado via pg_policy), a transição ENCAMINHADA -> APROVADA
-- pela Operação continuava sendo barrada — provavelmente por causa
-- da combinação com a policy "quotations_update_staff" (que não tem
-- WITH CHECK explícito). Em vez de continuar depurando a interação
-- entre as duas policies, uso o mesmo padrão já comprovado no projeto
-- (next_quotation_number, update_my_signature): uma função SECURITY
-- DEFINER que faz exatamente essa mudança, sem depender de RLS.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0020 (is_operation).
-- =============================================================

create or replace function public.operation_request_revision(p_quotation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_operation() then
    raise exception 'not authorized';
  end if;

  update public.quotations
  set status = 'APROVADA'
  where id = p_quotation_id
    and status = 'ENCAMINHADA';

  if not found then
    raise exception 'quotation not found or not in ENCAMINHADA status';
  end if;
end;
$$;

grant execute on function public.operation_request_revision(uuid) to authenticated;
