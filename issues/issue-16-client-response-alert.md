# Issue #16 — Alerta de cotação sem retorno do cliente

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Ao enviar uma cotação ao cliente (`sendQuotationToClient` em `src/app/(dashboard)/cotacoes/actions.ts`), acrescentar ao formulário de envio a opção "Receber alerta se o cliente não responder?" (checkbox) e, quando marcada, um campo numérico "em quantos dias".

Criar uma rotina agendada (Vercel Cron, execução diária) que verifica cotações com status `AGUARDANDO_CLIENTE`, alerta habilitado, e cujo tempo desde o envio ultrapassou os dias configurados sem resposta do cliente — disparando `notifyUser` + `sendNotificationEmail` (mesmo padrão da issue #14) para o comercial dono da cotação, sem duplicar o alerta.

## Acceptance criteria

- [ ] Migration: `quotations.client_response_alert_enabled` (boolean, default `false`), `client_response_alert_days` (int, nullable), `client_response_alert_sent_at` (timestamptz, nullable)
- [ ] Checkbox "Receber alerta se o cliente não responder?" + campo de dias na tela/diálogo de envio ao cliente
- [ ] Novo tipo de notificação `NO_CLIENT_RESPONSE` adicionado ao `check` da tabela `notifications` e ao `NotificationType` em `src/types/index.ts`
- [ ] Rota de cron (ex.: `src/app/api/cron/client-response-alerts/route.ts`) protegida por segredo do Vercel Cron, executando diariamente e notificando cotações elegíveis, marcando `client_response_alert_sent_at` para não duplicar o alerta
- [ ] Se o cliente responder (aprovar/reprovar/comentar) antes do prazo configurado, o alerta agendado não deve mais disparar
- [ ] `vercel.json` com a configuração do cron job
- [ ] Testes: cálculo de elegibilidade (data de envio + dias configurados vs. data atual) e não duplicação de alerta já enviado

## Blocked by

Nada — pode começar imediatamente
