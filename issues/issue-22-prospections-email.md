# Issue #22 — Envio de prospecções por e-mail

**Tipo:** AFK
**Bloqueada por:** Issue #15, Issue #21

## What to build

Enviar a prospecção por e-mail no mesmo estilo do envio de cotação (mesmo remetente/Resend), mas **sem PDF anexado** — o texto vai integralmente no corpo do e-mail, pré-carregado a partir do template configurável (issue #15) conforme o segmento (`prospection_industria` ou `prospection_cafe`), editável antes de enviar. Ao enviar, muda o status da prospecção para `ENVIADA` e registra em `prospection_events`.

## Acceptance criteria

- [ ] Server action `sendProspection` que monta o e-mail com o corpo vindo do template do segmento (issue #15), editável no momento do envio
- [ ] Sem anexo de PDF — texto integralmente no corpo do e-mail
- [ ] Envio muda status da prospecção para `ENVIADA` e registra evento em `prospection_events`
- [ ] Se o Resend falhar, seguir o mesmo padrão de fallback do envio de cotação (retornar aviso em vez de bloquear)
- [ ] Testes: corpo do e-mail usa o template do segmento correto (indústria vs. café)

## Blocked by

Issue #15, Issue #21
