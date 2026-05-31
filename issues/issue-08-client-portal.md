# Issue #08 — Portal do cliente (link único + resposta)

**Tipo:** AFK  
**Bloqueada por:** Issue #07

## What to build

Fluxo de envio da cotação ao cliente por e-mail (via Resend) com link tokenizado. Página pública onde o cliente visualiza a cotação e registra sua resposta (aprovar, reprovar, comentar) sem precisar de login.

## Acceptance criteria

- [ ] Campo `client_token` (UUID único) na tabela `quotations`
- [ ] Botão "Enviar por e-mail" na tela da cotação
- [ ] E-mail enviado via Resend com template profissional e link para `/cotacao/[token]`
- [ ] Rota pública `/cotacao/[token]` acessível sem autenticação
- [ ] Token inválido retorna página de erro 404
- [ ] Página pública exibe: PDF da cotação (embed ou link de download), botão Aprovar, botão Reprovar, campo de comentário
- [ ] Ação do cliente registrada em `quotation_events` (tipo: APPROVED | REJECTED | COMMENTED)
- [ ] Status da cotação atualizado após resposta do cliente
- [ ] Confirmação visual exibida ao cliente após resposta
- [ ] Cliente não consegue responder duas vezes (idempotência)
- [ ] Status da cotação atualizado para "AGUARDANDO_CLIENTE" após envio

## Blocked by

Issue #07
