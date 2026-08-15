-- =============================================================
-- Migration 0034 — Textos padrão de e-mail configuráveis (issue #15)
--
-- Tabela genérica de templates, usada por: solicitação de retorno ao
-- cliente (issue #17), envio de prospecções por segmento (issue #22)
-- e mensagem de aniversário (issue #25). Cada finalidade é uma linha
-- fixa identificada por `key` — não é um CRUD aberto, o Admin edita
-- os textos das chaves já existentes.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (is_admin) e 0002 (is_staff).
-- =============================================================

create table if not exists public.email_templates (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  subject    text not null default '',
  body       text not null default '',
  image_url  text,
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;

-- Leitura para qualquer usuário staff (precisa pra montar o e-mail antes de
-- enviar), escrita só Admin — mesmo padrão de additionals/ports/certifications.
drop policy if exists "email_templates_select_staff" on public.email_templates;
create policy "email_templates_select_staff" on public.email_templates
  for select using (public.is_staff());

drop policy if exists "email_templates_update_admin" on public.email_templates;
create policy "email_templates_update_admin" on public.email_templates
  for update using (public.is_admin());

-- Seed das chaves conhecidas — o texto de fábrica também está espelhado em
-- src/lib/email-templates/get-template.ts como fallback caso a linha não
-- exista (ex.: ambiente onde a migration ainda não rodou).
insert into public.email_templates (key, subject, body) values
  (
    'client_followup_request',
    'Retomando o contato sobre sua cotação',
    'Olá! Passando para saber se você teve a oportunidade de avaliar a cotação que enviamos. Ficamos à disposição para esclarecer qualquer dúvida ou ajustar o que for necessário.'
  ),
  (
    'prospection_industria',
    'Nova Safra Gestão Logística — Apresentação',
    'Olá! Somos a Nova Safra Gestão Logística, transportadora especializada em frete de container e carga solta. Gostaríamos de apresentar nossos serviços e entender como podemos atender a sua operação.'
  ),
  (
    'prospection_cafe',
    'Nova Safra Gestão Logística — Apresentação',
    'Olá! Somos a Nova Safra Gestão Logística, transportadora especializada em frete de café para exportação. Gostaríamos de apresentar nossos serviços e entender como podemos atender a sua operação.'
  ),
  (
    'birthday_message',
    'Feliz aniversário!',
    'A equipe Nova Safra Gestão Logística deseja um feliz aniversário e um ano repleto de conquistas!'
  )
on conflict (key) do nothing;
