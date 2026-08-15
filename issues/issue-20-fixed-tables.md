# Issue #20 — Tabelas fixas (nova aba)

**Tipo:** HITL (requer input da usuária antes de detalhar)
**Bloqueada por:** Nada tecnicamente, mas **aguardando os modelos de tabela que a usuária vai enviar** antes de detalhar schema e layout de PDF

## What to build

Nova aba "Tabelas" no sistema, para geração de tabelas fixas de frete — diferente de cotações pontuais. Estrutura de dados, campos e layout de PDF dependem dos modelos que a usuária ainda vai enviar. Esta issue fica com o escopo funcional em aberto até a entrega desses modelos.

As issues #24 (visão 360º do cliente) e #28 (relatórios de tabelas) dependem desta.

## Acceptance criteria

- [ ] Aguardar modelos de tabela fornecidos pela usuária (formato, campos, layout de PDF)
- [ ] Detalhar schema de dados após os modelos (provavelmente `fixed_tables` + `fixed_table_items`, a confirmar)
- [ ] Nova aba "Tabelas" na navegação principal (mesmo padrão de RLS/roles das demais abas)
- [ ] CRUD de tabelas fixas
- [ ] Geração de PDF da tabela (reaproveitando a infraestrutura de PDF via Puppeteer já usada para cotações, se aplicável ao layout enviado)

## Blocked by

Nada tecnicamente — aguardando input da usuária (modelos de tabela) para detalhar o restante do escopo
