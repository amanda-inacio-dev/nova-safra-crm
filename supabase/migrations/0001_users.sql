-- =============================================================
-- Migration 0001 — Tabela de usuários, perfis (roles) e RLS
-- Nova Safra CRM — Issue #02 (Autenticação)
--
-- Como aplicar:
--   1. Abra o Supabase > seu projeto > SQL Editor
--   2. Clique em "New query"
--   3. Cole TODO este arquivo e clique em "Run"
-- =============================================================

-- Tipo enum dos perfis de usuário
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('ADMIN', 'COMMERCIAL', 'OPERATION');
  end if;
end$$;

-- Tabela de perfis, espelhando auth.users (1:1 pelo id)
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null default '',
  email      text not null,
  role       public.user_role not null default 'COMMERCIAL',
  active      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- -------------------------------------------------------------
-- Função auxiliar: o usuário atual é um ADMIN ativo?
-- SECURITY DEFINER evita recursão de RLS (consulta a própria tabela)
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'ADMIN'
      and active = true
  );
$$;

-- -------------------------------------------------------------
-- Políticas de Row Level Security
-- -------------------------------------------------------------

-- Cada usuário pode ler o próprio perfil
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

-- Admins podem ler todos os perfis
drop policy if exists "users_select_admin" on public.users;
create policy "users_select_admin" on public.users
  for select using (public.is_admin());

-- Admins podem inserir perfis
drop policy if exists "users_insert_admin" on public.users;
create policy "users_insert_admin" on public.users
  for insert with check (public.is_admin());

-- Admins podem atualizar qualquer perfil
drop policy if exists "users_update_admin" on public.users;
create policy "users_update_admin" on public.users
  for update using (public.is_admin());

-- -------------------------------------------------------------
-- Trigger: ao criar um usuário no Auth, cria o perfil correspondente
-- O nome e o role podem vir do user_metadata informado na criação
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'COMMERCIAL')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
