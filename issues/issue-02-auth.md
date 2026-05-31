# Issue #02 — Autenticação e controle de acesso por perfil

**Tipo:** AFK  
**Bloqueada por:** Issue #01

## What to build

Sistema completo de autenticação usando Supabase Auth, com controle de acesso baseado em perfis (Admin, Comercial, Operação). Inclui login, logout, recuperação de senha e proteção de rotas por perfil.

## Acceptance criteria

- [ ] Tela de login com e-mail e senha
- [ ] Logout funcionando e redirecionando para login
- [ ] Recuperação de senha por e-mail (via Resend)
- [ ] Tabela `users` no Supabase com campos: id, name, email, role (ADMIN | COMMERCIAL | OPERATION), active
- [ ] Perfil do usuário disponível em toda a aplicação via contexto/hook
- [ ] Rotas protegidas: redireciona para login se não autenticado
- [ ] Rotas com restrição de perfil: retorna 403 se perfil não autorizado
- [ ] Admin pode criar, editar e desativar usuários
- [ ] Admin pode alterar o perfil de qualquer usuário
- [ ] Usuário desativado não consegue fazer login
- [ ] Testes: validação JWT, rejeição de token inválido, bloqueio por perfil

## Blocked by

Issue #01
