-- =============================================================
-- Migration 0006 — Redesenho dos Adicionais
-- Remove o valor do catálogo, adiciona comportamento (input_type)
-- e a tabela de subtipos. Popula os adicionais de exemplo.
-- Nova Safra CRM
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende das migrations 0001 (is_admin), 0002 (is_staff) e 0005 (additionals).
-- =============================================================

-- O valor passa a ser informado no formulário da cotação, não no catálogo.
alter table public.additionals drop column if exists value;

-- Comportamento do adicional no formulário:
--   VALUE       -> um campo de valor
--   SUBTYPES    -> opções (subtipos), com um valor para cada marcada
--   OBSERVATION -> um campo de texto livre, sem valor
alter table public.additionals
  add column if not exists input_type text not null default 'VALUE';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'additionals_input_type_check') then
    alter table public.additionals
      add constraint additionals_input_type_check
      check (input_type in ('VALUE', 'SUBTYPES', 'OBSERVATION'));
  end if;
end$$;

-- Subtipos de um adicional (ex.: 20", 40", Reefer...)
create table if not exists public.additional_subtypes (
  id            uuid primary key default gen_random_uuid(),
  additional_id uuid not null references public.additionals (id) on delete cascade,
  name          text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.additional_subtypes enable row level security;

drop policy if exists "additional_subtypes_select_staff" on public.additional_subtypes;
create policy "additional_subtypes_select_staff" on public.additional_subtypes
  for select using (public.is_staff());

drop policy if exists "additional_subtypes_insert_admin" on public.additional_subtypes;
create policy "additional_subtypes_insert_admin" on public.additional_subtypes
  for insert with check (public.is_admin());

drop policy if exists "additional_subtypes_update_admin" on public.additional_subtypes;
create policy "additional_subtypes_update_admin" on public.additional_subtypes
  for update using (public.is_admin());

-- -------------------------------------------------------------
-- Seed dos adicionais de exemplo (idempotente por nome)
-- -------------------------------------------------------------
insert into public.additionals (name, input_type)
select v.name, v.input_type
from (
  values
    ('Seguro', 'OBSERVATION'),
    ('Valor para efeito do contêiner', 'SUBTYPES'),
    ('Estadia', 'SUBTYPES'),
    ('Handling in/out', 'SUBTYPES'),
    ('Taxa extra para entrega aos finais de semana', 'VALUE'),
    ('Limite de permanência', 'OBSERVATION'),
    ('Valor por dia após o limite', 'VALUE'),
    ('Escolta armada', 'OBSERVATION')
) as v (name, input_type)
where not exists (
  select 1 from public.additionals a where a.name = v.name
);

-- Seed dos subtipos (idempotente por adicional + nome)
insert into public.additional_subtypes (additional_id, name)
select a.id, s.name
from public.additionals a
join (
  values
    ('Valor para efeito do contêiner', '20"'),
    ('Valor para efeito do contêiner', '40"'),
    ('Valor para efeito do contêiner', 'Reefer'),
    ('Valor para efeito do contêiner', 'Open Top'),
    ('Estadia', 'Após free time de 6 horas'),
    ('Estadia', 'Após free time de 12 horas'),
    ('Estadia', 'Após free time de 24 horas'),
    ('Handling in/out', 'Contêiner vazio 20"'),
    ('Handling in/out', 'Contêiner vazio 40"'),
    ('Handling in/out', 'Contêiner cheio 20"'),
    ('Handling in/out', 'Contêiner cheio 40"')
) as s (additional_name, name) on s.additional_name = a.name
where not exists (
  select 1 from public.additional_subtypes x
  where x.additional_id = a.id and x.name = s.name
);
