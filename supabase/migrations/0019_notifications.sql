-- =============================================================
-- Migration 0019 — Notificações (issue #09)
--
-- Só os gatilhos que já existem hoje: cliente aprova/reprova/comenta
-- pelo portal público → notifica o Comercial responsável (created_by
-- da cotação). Os gatilhos de "encaminhada para Operação" e "Operação
-- solicita revisão" ficam para quando a issue #11 (fluxo da operação)
-- existir de verdade — hoje esses status/ações não existem no sistema.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users (id) on delete cascade,
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  type         text not null check (type in ('CLIENT_APPROVED', 'CLIENT_REJECTED', 'CLIENT_COMMENTED')),
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- Só o próprio usuário lê/marca como lida a própria notificação. A criação é
-- sempre feita pelo servidor com a service_role key (ver src/lib/notifications/),
-- então não precisa de policy de insert para o client autenticado.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid());
