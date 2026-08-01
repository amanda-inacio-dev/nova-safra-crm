-- =============================================================
-- Migration 0032 — Vários CT-es por cotação (com DTA/DI separados)
--
-- Antes cabia um CT-e só (coluna `quotations.cte_url`). Uma operação
-- pode gerar vários, e numa DTA+DI eles são de etapas diferentes —
-- por isso cada anexo pode ser marcado como DTA, DI ou geral.
--
-- A coluna antiga NÃO é removida: as cotações já encerradas continuam
-- com o link lá, e o CT-e delas é copiado para a nova tabela abaixo.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0020 (cte_url, is_operation) e 0025 (operation_can_view_quotation).
-- =============================================================

create table if not exists public.quotation_ctes (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  file_url     text not null,
  -- Nome do arquivo enviado, para a pessoa reconhecer o anexo na lista.
  file_name    text,
  -- Etapa da operação: null = CT-e único/geral; DTA ou DI nas cotações DTA+DI.
  leg_group    text check (leg_group in ('DTA', 'DI')),
  uploaded_by  uuid references public.users (id),
  created_at   timestamptz not null default now()
);

create index if not exists quotation_ctes_quotation_id_idx
  on public.quotation_ctes (quotation_id);

-- Traz o CT-e das cotações já encerradas para a nova tabela (uma vez só).
insert into public.quotation_ctes (quotation_id, file_url)
select q.id, q.cte_url
from public.quotations q
where q.cte_url is not null
  and not exists (
    select 1 from public.quotation_ctes c where c.quotation_id = q.id
  );

alter table public.quotation_ctes enable row level security;

-- Admin e Comercial enxergam tudo (é o documento que encerra o processo).
drop policy if exists "quotation_ctes_select_staff" on public.quotation_ctes;
create policy "quotation_ctes_select_staff" on public.quotation_ctes
  for select using (public.is_staff());

-- A Operação vê e anexa nas cotações que ela já acompanha.
drop policy if exists "quotation_ctes_select_operation" on public.quotation_ctes;
create policy "quotation_ctes_select_operation" on public.quotation_ctes
  for select using (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_ctes.quotation_id
        and public.operation_can_view_quotation(q.status, q.id)
    )
  );

drop policy if exists "quotation_ctes_insert_operation" on public.quotation_ctes;
create policy "quotation_ctes_insert_operation" on public.quotation_ctes
  for insert with check (
    public.is_operation()
    and exists (
      select 1 from public.quotations q
      where q.id = quotation_ctes.quotation_id
        and public.operation_can_view_quotation(q.status, q.id)
    )
  );

-- Anexo errado pode ser removido por quem o enviou (ou por um Admin).
drop policy if exists "quotation_ctes_delete_own" on public.quotation_ctes;
create policy "quotation_ctes_delete_own" on public.quotation_ctes
  for delete using (public.is_admin() or uploaded_by = auth.uid());
