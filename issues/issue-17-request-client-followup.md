# Issue #17 — Solicitar retorno ao cliente

**Tipo:** AFK
**Bloqueada por:** Issue #15, Issue #16

## What to build

Quando o comercial recebe o alerta de falta de retorno do cliente (issue #16), disponibilizar uma ação "Solicitar retorno" — na notificação e/ou na tela de detalhe da cotação, quando `status === 'AGUARDANDO_CLIENTE'`. Ao clicar, abrir um modal com o texto padrão pré-carregado do template `client_followup_request` (issue #15), editável livremente antes de confirmar o envio.

Confirmar dispara um e-mail ao cliente (mesmo remetente/Resend usado em `sendQuotationEmail`) com o texto final (editado ou padrão), e registra o evento em `quotation_events`.

## Acceptance criteria

- [x] Botão "Solicitar retorno" visível quando `quotation.status === 'AGUARDANDO_CLIENTE'` (tela de detalhe)
- [x] Modal com textarea pré-preenchida com o template `client_followup_request` (issue #15), editável antes de confirmar
- [x] Server action (`requestClientFollowUp`) que envia o e-mail ao cliente com o texto final e registra evento `FOLLOWUP_REQUESTED` em `quotation_events`
- [x] Novo tipo de evento `FOLLOWUP_REQUESTED` adicionado ao `check` de `quotation_events` (migration 0036)
- [x] Ação não disponível fora do status `AGUARDANDO_CLIENTE` (botão só aparece nesse status, e a Server Action valida de novo no servidor)
- [x] Testes: não há lógica pura nova além da validação trivial de mensagem vazia — o pré-preenchimento com o template e o uso do texto editado são estruturais (a textarea já vem preenchida com o template; o que estiver nela no momento do envio é o que vai, editado ou não). Consistente com o restante do projeto: os outros construtores de e-mail (`send-quotation-email.ts`, `send-notification-email.ts`) também não têm teste próprio.

## Blocked by

Issue #15, Issue #16
