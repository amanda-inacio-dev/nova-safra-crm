# Issue #16 — Alerta de cotação sem retorno do cliente

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Ao enviar uma cotação ao cliente (`sendQuotationToClient` em `src/app/(dashboard)/cotacoes/actions.ts`), acrescentar ao formulário de envio a opção "Receber alerta se o cliente não responder?" (checkbox) e, quando marcada, um campo numérico "em quantos dias".

Criar uma rotina agendada (Vercel Cron, execução diária) que verifica cotações com status `AGUARDANDO_CLIENTE`, alerta habilitado, e cujo tempo desde o envio ultrapassou os dias configurados sem resposta do cliente — disparando `notifyUser` + `sendNotificationEmail` (mesmo padrão da issue #14) para o comercial dono da cotação, sem duplicar o alerta.

## Acceptance criteria

- [x] Migration: `quotations.client_response_alert_enabled`, `client_response_alert_days`, `sent_to_client_at`, `client_response_alert_sent_at`
- [x] Checkbox "Receber alerta se o cliente não responder?" + campo de dias na tela de envio ao cliente
- [x] Novo tipo de notificação `NO_CLIENT_RESPONSE` adicionado ao `check` da tabela `notifications` e ao `NotificationType` em `src/types/index.ts`
- [x] Rota de cron (`src/app/api/cron/client-response-alerts/route.ts`) protegida por `CRON_SECRET`, executando diariamente e notificando cotações elegíveis, marcando `client_response_alert_sent_at` para não duplicar o alerta
- [x] Se o cliente responder (aprovar/reprovar/comentar) antes do prazo configurado, o alerta agendado não deve mais disparar
- [x] `vercel.json` com a configuração do cron job
- [x] Testes: cálculo de elegibilidade (data de envio + dias configurados vs. data atual) e não duplicação de alerta já enviado
- [x] Status visual "Sem retorno" na listagem de cotações (badge + filtro), sem alterar o status real no banco — mesmo padrão do "Comentada" (pedido extra da usuária após o teste)

## Bugs encontrados e corrigidos durante o teste desta issue

- `emptyLeg()` (função de um arquivo `'use client'`) era chamada direto de um Server Component ao editar uma cotação sem nenhum trecho salvo — quebrava a tela com erro 500. Movida para `src/app/(dashboard)/cotacoes/nova/leg-types.ts` (sem `'use client'`).
- O middleware (`src/proxy.ts`) interceptava `/api/cron/*` e redirecionava pra `/login` antes mesmo de checar o `CRON_SECRET` — a rotina automática da Vercel Cron nunca teria funcionado. Rotas de API agora ficam fora do matcher do middleware.

## Blocked by

Nada — pode começar imediatamente
