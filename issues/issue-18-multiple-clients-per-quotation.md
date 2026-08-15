# Issue #18 — Múltiplos clientes por cotação

**Tipo:** AFK
**Bloqueada por:** Nada — pode começar imediatamente

## What to build

Permitir que uma cotação tenha mais de um cliente vinculado, cada um com seu próprio valor e adicionais. Hoje `quotations.client_id` é uma FK única e obrigatória (`not null`, migration `0007_quotations.sql`), e o formulário (`quotation-form.tsx`) usa um `<Select>` simples de cliente.

Introduzir uma tabela de junção `quotation_clients` (`quotation_id, client_id, total_value, created_at`) e `quotation_client_additionals` (`quotation_client_id, additional_id`) para os adicionais por cliente. Avaliar durante a implementação se `quotations.client_id` é mantido como "cliente principal" (compatibilidade com PDF/portal existentes) ou se todo o restante do sistema passa a ler da tabela de junção — decisão técnica com impacto em RLS, geração de PDF, portal do cliente (`client_token`) e a tela "Cotações por cliente".

## Acceptance criteria

- [ ] Migration: tabela `quotation_clients` e `quotation_client_additionals`
- [ ] Formulário de nova cotação permite adicionar múltiplos blocos de cliente, cada um com dropdown de cliente, valor e seletor de adicionais próprio
- [ ] RLS revisada para refletir a visibilidade multi-cliente
- [ ] PDF da cotação reflete os múltiplos clientes e seus valores/adicionais individuais
- [ ] Tela "Cotações por cliente" (`cotacoes/por-cliente`) continua funcionando, listando a cotação para cada cliente vinculado
- [ ] Validação: não permitir salvar cotação sem nenhum cliente vinculado
- [ ] Testes: cálculo do total geral quando há múltiplos clientes com valores/adicionais distintos

## Blocked by

Nada — pode começar imediatamente
