-- =============================================================
-- Migration 0008 — Adicionais: percentual (ICMS), unidade e manuais
--
-- 1) Novo comportamento PERCENT (ex.: ICMS = alíquota %)
-- 2) Flag has_unit_basis: exibe a opção "por veículo / por container"
--    no formulário (ligada na Estadia)
-- 3) Seed do adicional ICMS (PERCENT)
-- 4) quotation_additionals: adicionais manuais (sem catálogo),
--    unidade (veículo/container) e alíquota (%)
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0006 (additionals/input_type) e 0007 (quotation_additionals).
-- =============================================================

-- -------------------------------------------------------------
-- 1) Comportamento PERCENT no catálogo de adicionais
-- -------------------------------------------------------------
alter table public.additionals drop constraint if exists additionals_input_type_check;
alter table public.additionals
  add constraint additionals_input_type_check
  check (input_type in ('VALUE', 'SUBTYPES', 'OBSERVATION', 'PERCENT'));

-- -------------------------------------------------------------
-- 2) Flag de unidade (por veículo / por container)
-- -------------------------------------------------------------
alter table public.additionals
  add column if not exists has_unit_basis boolean not null default false;

update public.additionals set has_unit_basis = true where name = 'Estadia';

-- -------------------------------------------------------------
-- 3) Seed do ICMS (percentual) — idempotente por nome
-- -------------------------------------------------------------
insert into public.additionals (name, input_type)
select 'ICMS', 'PERCENT'
where not exists (select 1 from public.additionals a where a.name = 'ICMS');

-- -------------------------------------------------------------
-- 4) quotation_additionals: manuais, unidade e alíquota
-- -------------------------------------------------------------
-- Adicional manual não referencia o catálogo
alter table public.quotation_additionals alter column additional_id drop not null;

alter table public.quotation_additionals
  add column if not exists custom_name text,
  add column if not exists unit_basis  text,
  add column if not exists percent     numeric(6, 3);

-- Deve referenciar um adicional do catálogo OU ter um nome próprio (manual)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotation_additionals_ref_check') then
    alter table public.quotation_additionals
      add constraint quotation_additionals_ref_check
      check (additional_id is not null or custom_name is not null);
  end if;
end$$;

-- Unidade válida
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotation_additionals_unit_basis_check') then
    alter table public.quotation_additionals
      add constraint quotation_additionals_unit_basis_check
      check (unit_basis is null or unit_basis in ('POR_VEICULO', 'POR_CONTAINER'));
  end if;
end$$;
