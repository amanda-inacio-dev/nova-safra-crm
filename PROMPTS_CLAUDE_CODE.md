# Sequência de Prompts — Claude Code

Use estes prompts **em ordem** no Claude Code. Cada prompt corresponde a uma issue.
Sempre que um prompt indicar **(HITL)**, é você quem aprova antes de continuar.

---

## ANTES DE TUDO — Configuração inicial

Cole este prompt uma única vez ao abrir o Claude Code pela primeira vez nesta pasta:

```
Leia o arquivo CLAUDE.md e todos os arquivos dentro da pasta issues/ para entender o projeto completamente antes de qualquer ação. Confirme que leu e me faça um resumo do que entendeu sobre o sistema.
```

---

## Issue #01 — Setup do projeto (HITL)

```
Leia o arquivo issues/issue-01-stack-scaffolding.md e execute todos os acceptance criteria.

Stack: Next.js 14 com App Router e TypeScript, Supabase, Vercel, Resend e Stripe.

Crie a estrutura inicial do projeto Next.js nesta pasta, configure os pacotes necessários, crie o arquivo .env.example com todas as variáveis de ambiente necessárias e documente no README.md os passos para rodar localmente.

Não suba nada para o Vercel ainda — isso será feito manualmente conforme as instruções do issue-01.
```

> **Após rodar:** siga as instruções manuais do `issue-01-stack-scaffolding.md` para criar as contas no Supabase, Vercel, Resend e Stripe. Volte aqui quando terminar.

---

## Issue #02 — Autenticação

```
Leia issues/issue-02-auth.md e implemente o sistema completo de autenticação.

Use Supabase Auth para login/logout/recuperação de senha. Crie a tabela users no Supabase com os campos especificados no CLAUDE.md. Implemente proteção de rotas por perfil (ADMIN, COMMERCIAL, OPERATION). Crie a tela de login e a tela de gerenciamento de usuários para o Admin.

Siga as convenções do CLAUDE.md: TypeScript estrito, RLS no Supabase, Server Actions para mutações.
```

---

## Issues #03 e #04 — Clientes e Admin (rode separadamente)

**Prompt para clientes:**

```
Leia issues/issue-03-client-crud.md e implemente o CRUD completo de clientes.

Crie a tabela clients no Supabase com RLS (apenas ADMIN e COMMERCIAL acessam). Implemente a tela de listagem, formulário de criação/edição e upload de logo para Supabase Storage. Valide CNPJ no frontend.
```

**Prompt para área admin:**

```
Leia issues/issue-04-admin-config.md e implemente a área administrativa.

Crie as tabelas additionals, ports e certifications no Supabase com RLS restrito ao ADMIN. Implemente CRUD para cada uma, incluindo upload de imagens de certificação para Supabase Storage.
```

---

## Issue #05 — Formulário de cotação

```
Leia issues/issue-05-quotation-form.md e implemente o formulário completo de criação de cotação.

Crie as tabelas quotations, quotation_legs, quotation_additionals e quotation_certifications no Supabase conforme o schema do CLAUDE.md.

Implemente a hierarquia condicional de tipos de operação exatamente como especificada no CLAUDE.md. Integre a Google Maps Places API nos campos de origem e destino dos trechos. Gere o identificador único NS_IMP_XXXX / NS_EXP_XXXX de forma sequencial e sem colisão.

Escreva testes para: geração do ID único, hierarquia de tipo de operação, cálculo do total de adicionais.
```

---

## Issue #06 — Aprovação do template PDF (HITL)

```
Leia issues/issue-06-pdf-template-approval.md.

Com base nos arquivos de referência disponíveis na pasta (logo Nova Safra: 1708696221170.jpeg, selos: AEO-Marcas_Security_Positiva.png e selo ISO 9001.png, cotação de referência: Tabela de Fretes Cooperativa CASUL 29 05 2026.pdf), crie um arquivo HTML estático chamado pdf-template-preview.html que represente o layout visual do PDF da cotação com dados fictícios.

O cabeçalho deve seguir o modelo do documento de referência: logo Nova Safra à esquerda, título "COTAÇÃO" + "Transporte Rodoviário Nacional" ao centro, logo do cliente à direita. Os selos ficam abaixo do cabeçalho. Substitua "TABELA DE FRETES" por "COTAÇÃO".

Não implemente a geração real do PDF ainda — apenas o preview HTML para aprovação.
```

> **Após rodar:** abra o arquivo `pdf-template-preview.html` no navegador, revise o layout com o responsável e aprove antes de continuar para a Issue #07.

---

## Issue #07 — Geração do PDF

```
Leia issues/issue-07-pdf-generation.md. O template HTML foi aprovado em pdf-template-preview.html.

Implemente a geração server-side do PDF usando Puppeteer numa Vercel Function. O PDF deve usar exatamente o layout aprovado, com as logos e selos reais da pasta do projeto. Armazene o PDF gerado no Supabase Storage e salve a URL na tabela quotations. Implemente o preview do PDF na tela de cotação e atualize o status de RASCUNHO para PRONTA após confirmação.
```

---

## Issue #08 — Portal do cliente

```
Leia issues/issue-08-client-portal.md e implemente o fluxo de envio e resposta do cliente.

Crie a rota pública /cotacao/[token] sem autenticação. Implemente o envio do e-mail via Resend com template profissional contendo o link tokenizado. Na página pública, exiba o PDF da cotação e os botões Aprovar, Reprovar e campo de comentário. Registre a resposta em quotation_events. Implemente idempotência (cliente não responde duas vezes). Token inválido retorna 404.
```

---

## Issues #09 e #10 — Notificações e Versionamento (rode separadamente)

**Notificações:**

```
Leia issues/issue-09-notifications.md e implemente o sistema de notificações.

Crie a tabela notifications no Supabase. Implemente notificações in-app (ícone com badge no header, marcar como lida) e envio de e-mails via Resend para todos os eventos listados no issue. Não dispare notificações para usuários desativados.
```

**Versionamento:**

```
Leia issues/issue-10-versioning.md e implemente o versionamento de cotações.

Adicione os campos parent_id e version à tabela quotations. Implemente o botão "Nova versão" que pré-preenche o formulário com dados da versão anterior e gera o sufixo -v2, -v3 no identificador. Liste todas as versões na tela individual da cotação. Escreva testes para a lógica de sufixo e herança de dados.
```

---

## Issue #11 — Fluxo da operação

```
Leia issues/issue-11-operation-flow.md e implemente o fluxo completo do time de Operação.

Implemente: botão "Encaminhar para Operação" com seleção de usuários, visibilidade restrita para o perfil OPERATION, botão "Solicitar revisão" com notificação ao Comercial, e encerramento do processo com upload obrigatório do CT-e. Cotação concluída deve ficar somente-leitura.
```

---

## Issue #12 — Documentos por cliente

```
Leia issues/issue-12-client-documents.md e implemente a pasta de documentos por cliente.

Crie a tabela client_documents no Supabase com RLS restrito a ADMIN e COMMERCIAL. Implemente upload para Supabase Storage, listagem por categoria, download e exclusão. Integre à tela de detalhe do cliente criada na Issue #03.
```

---

## Issue #13 — Dashboard e listas

```
Leia issues/issue-13-dashboard-lists.md e implemente o dashboard e as telas de lista.

O layout visual deve seguir a referência download.jpeg: sidebar de navegação à esquerda em azul escuro, cards de métricas no topo, gráficos na área principal. Implemente os indicadores filtráveis por período, gráfico de cotações por mês, lista mestra com busca e filtros, e tela de cotações por cliente. Aplique as regras de visibilidade por perfil.
```

---

## Dicas gerais para usar no Claude Code

- Se travar num erro: `Use a skill /diagnose para investigar este erro: [cole o erro aqui]`
- Se quiser entender uma parte do código: `Use a skill /zoom-out para me explicar como este módulo se encaixa no sistema`
- Se quiser melhorar a arquitetura após algumas issues prontas: `Use a skill /improve-codebase-architecture para revisar o que foi construído até agora`
- Se precisar escrever testes: `Use a skill /tdd para implementar os testes do módulo [nome]`
