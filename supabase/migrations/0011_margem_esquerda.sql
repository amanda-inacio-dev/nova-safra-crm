-- =============================================================
-- Migration 0011 — Adicionais de "margem esquerda"
--
-- Três adicionais do tipo SUBTYPES, cada um com os subtipos
-- "Frete" e "Pedágio" (cada subtipo recebe valor + observação
-- no formulário da cotação).
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0006 (additionals/additional_subtypes).
-- =============================================================

-- Adicionais (idempotente por nome)
insert into public.additionals (name, input_type)
select v.name, 'SUBTYPES'
from (
  values
    ('Retirada margem esquerda'),
    ('Entrega margem esquerda'),
    ('Retirada e entrega margem esquerda')
) as v (name)
where not exists (
  select 1 from public.additionals a where a.name = v.name
);

-- Subtipos Frete / Pedágio (idempotente por adicional + nome)
insert into public.additional_subtypes (additional_id, name)
select a.id, s.name
from public.additionals a
join (
  values
    ('Retirada margem esquerda', 'Frete'),
    ('Retirada margem esquerda', 'Pedágio'),
    ('Entrega margem esquerda', 'Frete'),
    ('Entrega margem esquerda', 'Pedágio'),
    ('Retirada e entrega margem esquerda', 'Frete'),
    ('Retirada e entrega margem esquerda', 'Pedágio')
) as s (additional_name, name) on s.additional_name = a.name
where not exists (
  select 1 from public.additional_subtypes x
  where x.additional_id = a.id and x.name = s.name
);
