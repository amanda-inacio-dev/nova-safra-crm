# Issue #03 — CRUD de clientes e upload de logo

**Tipo:** AFK  
**Bloqueada por:** Issue #02

## What to build

Tela de cadastro e gestão de clientes. Admin e Comercial podem criar, editar e listar clientes. Cada cliente tem dados cadastrais e logo, armazenada no Supabase Storage.

## Acceptance criteria

- [ ] Tabela `clients` no Supabase: id, name, cnpj, email, phone, logo_url, created_at
- [ ] Tela de listagem de clientes com busca por nome/CNPJ
- [ ] Formulário de criação de cliente (razão social, CNPJ, e-mail, telefone, logo)
- [ ] Upload de logo para Supabase Storage com preview
- [ ] Edição de cliente existente
- [ ] Somente Admin e Comercial acessam esta tela (Operação bloqueada)
- [ ] Validação de CNPJ no frontend

## Blocked by

Issue #02
