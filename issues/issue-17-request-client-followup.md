# Issue #17 — Solicitar retorno ao cliente

**Tipo:** AFK
**Bloqueada por:** Issue #15, Issue #16

## What to build

Quando o comercial recebe o alerta de falta de retorno do cliente (issue #16), disponibilizar uma ação "Solicitar retorno" — na notificação e/ou na tela de detalhe da cotação, quando `status === 'AGUARDANDO_CLIENTE'`. Ao clicar, abrir um modal com o texto padrão pré-carregado do template `client_followup_request` (issue #15), editável livremente antes de confirmar o envio.

Confirmar dispara um e-mail ao cliente (mesmo remetente/Resend usado em `sendQuotationEmail`) com o texto final (editado ou padrão), e registra o evento em `quotation_events`.

## Acceptance criteria

- [ ] Botão "Solicitar retorno" visível quando `quotation.status === 'AGUARDANDO_CLIENTE'` (tela de detalhe e/ou a partir da notificação de falta de retorno)
- [ ] Modal com textarea pré-preenchida com o template `client_followup_request` (issue #15), editável antes de confirmar
- [ ] Server action que envia o e-mail ao cliente com o texto final e registra evento `FOLLOWUP_REQUESTED` em `quotation_events`
- [ ] Novo tipo de evento `FOLLOWUP_REQUESTED` adicionado ao `check` de `quotation_events`
- [ ] Ação não deve estar disponível fora do status `AGUARDANDO_CLIENTE`
- [ ] Testes: envio usa o texto editado quando fornecido, e o texto padrão do template quando o campo é deixado como veio

## Blocked by

Issue #15, Issue #16
