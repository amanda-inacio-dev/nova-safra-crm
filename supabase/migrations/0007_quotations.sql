-- =============================================================
-- Migration 0007 — Cotações
-- Tabelas quotations, quotation_legs, quotation_additionals,
-- quotation_certifications + geração de código única.
-- Nova Safra CRM — Issue #05
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
--
-- Depende de 0001 (is_admin), 0002 (is_staff/clients), 0005/0006 (additionals).
-- =============================================================

-- Cotação
create table if not exists public.quotations (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique,
  version                 int not null default 1,
  parent_id               uuid references public.quotations (id) on delete set null,
  client_id               uuid not null references public.clients (id),
  created_by              uuid not null references public.users (id),
  status                  text not null default 'RASCUNHO'
                            check (status in ('RASCUNHO','PRONTA','AGUARDANDO_CLIENTE',
                                              'APROVADA','REPROVADA','ENCAMINHADA','CONCLUIDA')),
  segment                 text check (segment in ('CAFE','INDUSTRIA')),
  product                 text,
  vehicle_type            text check (vehicle_type in ('CARRETA_LS','RODOTREM','BITRUCK')),
  value_type              text check (value_type in ('POR_CONTAINER','POR_VEICULO','POR_OPERACAO')),
  operation_type          text check (operation_type in ('IMPORTACAO','EXPORTACAO')),
  operation_subtype       text,
  operation_detail        text,
  empty_container_port_id uuid references public.ports (id),
  sender                  text,
  recipient               text,
  total_value             numeric(14, 2) not null default 0,
  pdf_url                 text,
  client_token            uuid,
  created_at              timestamptz not null default now()
);

-- Trechos
create table if not exists public.quotation_legs (
  id           uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  origin       text,
  destination  text,
  value        numeric(14, 2) not null default 0,
  leg_order    int not null default 0
);

-- Adicionais selecionados (1 linha por valor/observação; 1 por subtipo marcado)
create table if not exists public.quotation_additionals (
  id            uuid primary key default gen_random_uuid(),
  quotation_id  uuid not null references public.quotations (id) on delete cascade,
  additional_id uuid not null references public.additionals (id),
  subtype_id    uuid references public.additional_subtypes (id),
  value         numeric(14, 2),
  observation   text
);

-- Certificações selecionadas para o PDF
create table if not exists public.quotation_certifications (
  quotation_id     uuid not null references public.quotations (id) on delete cascade,
  certification_id uuid not null references public.certifications (id),
  primary key (quotation_id, certification_id)
);

-- -------------------------------------------------------------
-- Geração de código única e sem colisão
-- -------------------------------------------------------------
create sequence if not exists public.quotation_imp_seq;
create sequence if not exists public.quotation_exp_seq;

create or replace function public.next_quotation_number(op_type text)
returns int
language plpgsql
security definer
set search_path = public
as $$
begin
  if op_type = 'IMPORTACAO' then
    return nextval('public.quotation_imp_seq');
  else
    return nextval('public.quotation_exp_seq');
  end if;
end;
$$;

grant execute on function public.next_quotation_number(text) to authenticated;

-- -------------------------------------------------------------
-- RLS — Admin + Comercial (a visibilidade da Operação é da issue #11)
-- -------------------------------------------------------------
alter table public.quotations enable row level security;
alter table public.quotation_legs enable row level security;
alter table public.quotation_additionals enable row level security;
alter table public.quotation_certifications enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['quotations','quotation_legs','quotation_additionals','quotation_certifications']
  loop
    execute format('drop policy if exists "%1$s_select_staff" on public.%1$s;', t);
    execute format('create policy "%1$s_select_staff" on public.%1$s for select using (public.is_staff());', t);

    execute format('drop policy if exists "%1$s_insert_staff" on public.%1$s;', t);
    execute format('create policy "%1$s_insert_staff" on public.%1$s for insert with check (public.is_staff());', t);

    execute format('drop policy if exists "%1$s_update_staff" on public.%1$s;', t);
    execute format('create policy "%1$s_update_staff" on public.%1$s for update using (public.is_staff());', t);

    execute format('drop policy if exists "%1$s_delete_staff" on public.%1$s;', t);
    execute format('create policy "%1$s_delete_staff" on public.%1$s for delete using (public.is_staff());', t);
  end loop;
end$$;
