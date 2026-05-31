# Issue #10 — Versionamento de cotações

**Tipo:** AFK  
**Bloqueada por:** Issue #08

## What to build

Permitir a geração de novas versões de uma cotação existente (v2, v3...) mantendo o mesmo ID base. Cada versão passa pelo fluxo completo e o histórico fica visível na tela da cotação.

## Acceptance criteria

- [ ] Campo `parent_id` e `version` (integer) na tabela `quotations`
- [ ] Botão "Nova versão" disponível em cotações com status APROVADA, REPROVADA ou quando solicitado pela Operação
- [ ] Nova versão herda os dados da versão anterior como pré-preenchimento
- [ ] ID exibido com sufixo: NS_IMP_0023-v2, -v3, etc.
- [ ] Histórico de todas as versões listado na tela da cotação individual
- [ ] Cada versão tem seu próprio status, PDF e token de cliente
- [ ] Somente a versão mais recente pode ser enviada ao cliente
- [ ] Testes: lógica de sufixo de versão, herança de dados, isolamento de status

## Blocked by

Issue #08
