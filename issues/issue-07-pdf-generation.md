# Issue #07 — Geração do PDF da cotação

**Tipo:** AFK  
**Bloqueada por:** Issue #06

## What to build

Geração server-side do PDF da cotação usando o template aprovado na Issue #06. O PDF inclui logo Nova Safra, logo do cliente, selos de certificação selecionados, todos os campos da cotação, trechos, adicionais e total. O arquivo é armazenado no Supabase Storage e vinculado à cotação.

## Acceptance criteria

- [ ] Geração do PDF server-side (Puppeteer ou similar) com o template aprovado
- [ ] Cabeçalho: logo Nova Safra (esquerda), título "COTAÇÃO" + subtítulo (centro), logo do cliente (direita)
- [ ] Selos de certificação selecionados exibidos no cabeçalho
- [ ] ID único (NS_IMP_XXXX / NS_EXP_XXXX) visível no PDF
- [ ] Todos os campos do formulário representados no PDF
- [ ] Trechos exibidos em tabela (Percurso | Frete | Pedágios | Total) — estrutura herdada do modelo
- [ ] Adicionais listados com valores
- [ ] Total geral calculado e destacado
- [ ] PDF armazenado no Supabase Storage com URL pública vinculada à cotação
- [ ] Preview do PDF disponível na tela antes de confirmar
- [ ] Botão de editar retorna ao formulário pré-preenchido
- [ ] Status da cotação atualizado de "RASCUNHO" para "PRONTA" após confirmação

## Blocked by

Issue #06
