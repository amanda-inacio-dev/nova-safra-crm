# Issue #12 — Upload de documentos por cliente

> ⏸️ **EM ESPERA — não implementar por enquanto** (decisão da usuária em 31/07/2026).
> Nada desta issue foi construído. O escopo abaixo continua válido e pode ser
> retomado a qualquer momento: nenhuma outra issue depende dela, e o restante do
> sistema não referencia `client_documents` em lugar nenhum.
> Ao retomar: só precisa da migration da tabela + bucket, e da tela dentro do
> cadastro do cliente (`/clientes/[id]/editar`). O helper de upload de arquivo
> não-imagem já existe (`src/lib/storage/upload-document.ts`, criado na issue #11
> para o CT-e) e pode ser reaproveitado.

**Tipo:** AFK  
**Bloqueada por:** Issue #03

## What to build

Pasta digital por cliente com upload, listagem, download e exclusão de documentos. Visível apenas para Admin e Comercial.

## Acceptance criteria

- [ ] Tabela `client_documents`: id, client_id, name, file_url, category, uploaded_by, created_at
- [ ] Categorias disponíveis: Tabela de Frete, Apólice de Seguro, Contrato/Compliance, Pasta de Sinistro, Geral
- [ ] Upload de arquivos (PDF, Excel, imagens) para Supabase Storage
- [ ] Listagem de documentos por cliente, agrupada por categoria
- [ ] Download de documento com clique
- [ ] Exclusão de documento com confirmação
- [ ] Somente Admin e Comercial acessam — Operação bloqueada
- [ ] Limite de tamanho de arquivo validado no frontend (ex: 20MB)

## Blocked by

Issue #03
