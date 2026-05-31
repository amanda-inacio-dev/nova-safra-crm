# Issue #11 — Fluxo da operação (encaminhamento + encerramento com CT-e)

**Tipo:** AFK  
**Bloqueada por:** Issues #09 e #10

## What to build

Fluxo completo do time de Operação: receber cotações aprovadas, solicitar revisão ao Comercial quando necessário, e encerrar o processo com upload do CT-e.

## Acceptance criteria

- [ ] Botão "Encaminhar para Operação" disponível em cotações aprovadas pelo cliente
- [ ] Modal de seleção de usuários da Operação (lista de e-mails cadastrados)
- [ ] Status da cotação atualizado para "ENCAMINHADA" após encaminhamento
- [ ] Usuários da Operação veem apenas cotações com status ENCAMINHADA ou posterior
- [ ] Botão "Solicitar revisão" disponível para a Operação com campo de observação
- [ ] Solicitação de revisão notifica o Comercial responsável (Issue #09)
- [ ] Botão "Encerrar processo" disponível para a Operação
- [ ] Upload obrigatório do CT-e (PDF) para encerrar
- [ ] Campo de observação opcional no encerramento
- [ ] Status atualizado para "CONCLUÍDA" após encerramento
- [ ] Cotação concluída fica somente-leitura

## Blocked by

Issues #09 e #10
