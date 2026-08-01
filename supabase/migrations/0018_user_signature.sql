-- =============================================================
-- Migration 0018 — Assinatura (imagem) do usuário no e-mail da cotação
--
-- Cada usuário (Admin/Comercial) pode subir sua própria imagem de
-- assinatura, que passa a aparecer no e-mail enviado ao cliente.
--
-- Como aplicar:
--   1. Supabase > seu projeto > SQL Editor > New query
--   2. Cole TODO este arquivo e clique em "Run"
-- =============================================================

alter table public.users
  add column if not exists signature_url text;

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', true)
on conflict (id) do nothing;

-- RLS de "users" só permite update por Admin (users_update_admin) — não dá pra
-- abrir "update na própria linha" direto sem risco (o usuário poderia mudar o
-- próprio `role`). Uma função seguindo o mesmo padrão de next_quotation_number:
-- só toca a coluna signature_url, só na própria linha (auth.uid()).
create or replace function public.update_my_signature(p_signature_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set signature_url = p_signature_url where id = auth.uid();
end;
$$;

grant execute on function public.update_my_signature(text) to authenticated;
