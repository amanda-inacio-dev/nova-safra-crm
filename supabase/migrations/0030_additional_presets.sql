-- =============================================================
-- Migration 0030 — Textos padrão de observação nos adicionais
--
-- Adicionais que só têm campo de texto livre (Limite de permanência,
-- Prazo de pagamento, Escolta…) passam a poder ter respostas prontas
-- cadastradas no Admin — ex.: "15 dias" no Limite de permanência.
--
-- No formulário da cotação a pessoa clica na resposta pronta em vez de
-- digitar, e continua livre para alterar o texto depois. O campo de
-- observação NÃO muda: continua sendo texto livre.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0006 (additionals).
-- =============================================================

create table if not exists public.additional_presets (
  id            uuid primary key default gen_random_uuid(),
  additional_id uuid not null references public.additionals (id) on delete cascade,
  text          text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists additional_presets_additional_id_idx
  on public.additional_presets (additional_id);

alter table public.additional_presets enable row level security;

-- Mesma regra dos outros catálogos: a equipe lê, o Admin mantém.
drop policy if exists "additional_presets_select_staff" on public.additional_presets;
create policy "additional_presets_select_staff" on public.additional_presets
  for select using (public.is_staff() or public.is_operation());

drop policy if exists "additional_presets_insert_admin" on public.additional_presets;
create policy "additional_presets_insert_admin" on public.additional_presets
  for insert with check (public.is_admin());

drop policy if exists "additional_presets_update_admin" on public.additional_presets;
create policy "additional_presets_update_admin" on public.additional_presets
  for update using (public.is_admin());

drop policy if exists "additional_presets_delete_admin" on public.additional_presets;
create policy "additional_presets_delete_admin" on public.additional_presets
  for delete using (public.is_admin());
