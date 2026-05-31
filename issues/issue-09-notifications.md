# Issue #09 — Notificações (e-mail + in-app)

**Tipo:** AFK  
**Bloqueada por:** Issue #08

## What to build

Sistema de notificações automáticas disparadas em cada evento do ciclo da cotação. Notificações chegam dentro da plataforma (sino/badge) e por e-mail via Resend.

## Acceptance criteria

- [ ] Tabela `notifications`: id, user_id, quotation_id, type, read, created_at
- [ ] Notificação in-app: ícone com badge de não-lidas no header
- [ ] Marcar notificação como lida ao clicar
- [ ] E-mail + in-app quando cliente aprova cotação → notifica o Comercial responsável
- [ ] E-mail + in-app quando cliente reprova cotação → notifica o Comercial responsável
- [ ] E-mail + in-app quando cliente comenta → notifica o Comercial responsável
- [ ] E-mail + in-app quando cotação é encaminhada para Operação → notifica usuários selecionados
- [ ] E-mail + in-app quando Operação solicita revisão → notifica o Comercial responsável
- [ ] Notificações não são disparadas para usuários desativados
- [ ] Templates de e-mail com identidade visual Nova Safra

## Blocked by

Issue #08
