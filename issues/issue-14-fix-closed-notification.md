# Issue #14 — Bugfix: notificação de encerramento de cotação não chega ao comercial

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Quando a Operação encerra uma cotação (`closeQuotation` em `src/app/(dashboard)/cotacoes/[id]/operation-actions.ts`, linhas ~232-308), o status muda para `CONCLUIDA` mas o alerta (in-app + e-mail) para o comercial dono da cotação (`created_by`) não está chegando, mesmo o status aparecendo corretamente na tela.

A lógica de notificação já existe no código (`notifyUser` + `sendNotificationEmail`, adicionada pela migration `0024_quotation_closed_notification.sql`), então isto é bug de execução/infraestrutura, não feature ausente. Investigar e corrigir a causa raiz, e parar de falhar em silêncio nesse ponto.

## Acceptance criteria

- [ ] Confirmar se a migration `0024_quotation_closed_notification.sql` foi de fato aplicada no banco de produção (a constraint `notifications_type_check` precisa aceitar `'QUOTATION_CLOSED'`)
- [ ] Confirmar se `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `RESEND_FROM_EMAIL` estão configuradas no ambiente de produção (Vercel)
- [ ] `closeQuotation` deve tratar e logar erros de `notifyUser`/`sendNotificationEmail` (try/catch com log) em vez de descartar o retorno silenciosamente — sem impedir o encerramento da cotação em si
- [ ] Se o usuário `created_by` estiver com `active = false`, registrar isso de forma visível (log) em vez de pular silenciosamente como hoje
- [ ] Validação manual end-to-end: encerrar uma cotação de teste e confirmar que o comercial dono recebe a notificação no sino **e** por e-mail
- [ ] Testes: cobrir o caminho de erro (Resend indisponível não deve impedir o encerramento da cotação, mas deve ficar registrado em log)

## Blocked by

Nada — pode começar imediatamente
