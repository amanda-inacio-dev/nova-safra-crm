-- =============================================================
-- Migration 0014 — Frete, Pedágio, margens esquerda e ICMS por trecho
--
-- Reestruturação: Frete, Pedágio, as 3 "margens esquerda" e o ICMS
-- passam a ser calculados POR TRECHO (cada trecho tem sua própria
-- alíquota de ICMS, aplicada só sobre a soma daquele trecho). Os
-- demais adicionais (Estadia, Handling etc.) continuam por cotação.
--
-- Também adiciona o subtipo de operação "DTA+DI" (importação), com
-- os trechos podendo ser agrupados em "DTA" ou "DI".
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0007 (quotation_legs), 0006 (additionals/subtypes).
-- =============================================================

alter table public.quotation_legs
  add column if not exists toll_value       numeric(14, 2) not null default 0,
  add column if not exists icms_rate        numeric(6, 3),
  add column if not exists leg_group        text,
  add column if not exists freight_in_total boolean not null default true,
  add column if not exists toll_in_total    boolean not null default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'quotation_legs_leg_group_check') then
    alter table public.quotation_legs
      add constraint quotation_legs_leg_group_check
      check (leg_group is null or leg_group in ('DTA', 'DI'));
  end if;
end$$;

-- Adicionais por trecho (margens esquerda: Frete/Pedágio por trecho) — mesma forma
-- de public.quotation_additionals, só que ligado a um trecho em vez da cotação toda.
create table if not exists public.quotation_leg_additionals (
  id               uuid primary key default gen_random_uuid(),
  leg_id           uuid not null references public.quotation_legs (id) on delete cascade,
  additional_id    uuid references public.additionals (id),
  subtype_id       uuid references public.additional_subtypes (id),
  value            numeric(14, 2),
  observation      text,
  include_in_total boolean not null default true
);

alter table public.quotation_leg_additionals enable row level security;

drop policy if exists "quotation_leg_additionals_select_staff" on public.quotation_leg_additionals;
create policy "quotation_leg_additionals_select_staff" on public.quotation_leg_additionals
  for select using (public.is_staff());

drop policy if exists "quotation_leg_additionals_insert_staff" on public.quotation_leg_additionals;
create policy "quotation_leg_additionals_insert_staff" on public.quotation_leg_additionals
  for insert with check (public.is_staff());

drop policy if exists "quotation_leg_additionals_update_staff" on public.quotation_leg_additionals;
create policy "quotation_leg_additionals_update_staff" on public.quotation_leg_additionals
  for update using (public.is_staff());

drop policy if exists "quotation_leg_additionals_delete_staff" on public.quotation_leg_additionals;
create policy "quotation_leg_additionals_delete_staff" on public.quotation_leg_additionals
  for delete using (public.is_staff());
