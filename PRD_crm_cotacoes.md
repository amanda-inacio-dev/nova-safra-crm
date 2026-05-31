# PRD — CRM de Gestão e Geração de Cotações para Transportadora

## Problem Statement

O time comercial de uma transportadora com ~200 caminhões gerencia todo o processo de cotações manualmente: monta propostas em arquivos avulsos, envia por e-mail, aguarda resposta na caixa de entrada, passa as aprovações para a operação também por e-mail, e arquiva documentos de clientes em pastas locais. Não existe visibilidade centralizada do pipeline de cotações, o histórico de negociação fragmenta-se em threads de e-mail, e qualquer ausência de um colaborador paralisa o acesso às informações. A operação recebe cotações aprovadas sem padronização, aumentando o risco de erros na execução do serviço.

---

## Solution

Um sistema web multiusuário que centraliza todo o ciclo comercial: geração de cotações em PDF com identidade visual padronizada, envio ao cliente com link de resposta, notificações automáticas, histórico de versões por negociação, encaminhamento para a operação e encerramento com CT-e. Cada cliente possui uma pasta digital de documentos. Um dashboard com indicadores em tempo real substitui a consolidação manual em planilhas.

---

## User Stories

### Autenticação e Acesso

1. Como usuário interno, quero fazer login com e-mail e senha, para acessar o sistema com segurança.
2. Como usuário interno, quero recuperar minha senha por e-mail, para não perder acesso em caso de esquecimento.
3. Como administrador, quero cadastrar novos usuários e atribuir perfis (Comercial ou Operação), para controlar quem acessa o quê.
4. Como administrador, quero desativar um usuário sem excluí-lo, para preservar o histórico de cotações geradas por ele.
5. Como administrador, quero alterar o perfil de um usuário existente, para ajustar permissões conforme mudanças de função.

### Dashboard

6. Como gestor, quero ver no dashboard o total de cotações geradas no período selecionado, para acompanhar o volume comercial.
7. Como gestor, quero ver quantas cotações estão em aberto, aprovadas, reprovadas e concluídas, para ter visão instantânea do funil.
8. Como gestor, quero filtrar os indicadores por período (último mês, trimestre, ano ou intervalo personalizado), para comparar desempenho entre períodos.
9. Como gestor, quero ver um gráfico de cotações geradas por mês, para identificar sazonalidade e tendências.
10. Como gestor, quero ver a taxa de aprovação de cotações, para avaliar a eficácia comercial.

### Cadastro de Clientes

11. Como usuário do Comercial, quero cadastrar um novo cliente com razão social, CNPJ, e-mail, telefone e logo, para tê-lo disponível na geração de cotações.
12. Como usuário do Comercial, quero editar os dados de um cliente existente, para manter o cadastro atualizado.
13. Como usuário do Comercial, quero fazer upload de documentos na pasta do cliente (tabela de frete, apólice de seguro, contratos, pasta de sinistro e documentos gerais), para centralizar os arquivos relevantes daquele cliente.
14. Como usuário do Comercial, quero visualizar e baixar os documentos da pasta de um cliente, para consultá-los durante uma negociação.
15. Como usuário do Comercial, quero excluir documentos da pasta de um cliente, para remover arquivos desatualizados.
16. Como usuário da Operação, quero ser impedido de acessar a pasta de documentos dos clientes, para que informações contratuais e comerciais permaneçam restritas.

### Geração de Cotações

17. Como usuário do Comercial, quero selecionar um cliente de uma lista cadastrada ao iniciar uma cotação, para evitar digitação manual de dados do cliente.
18. Como usuário do Comercial, quero preencher os campos de remetente e destinatário em texto livre, para identificar as partes envolvidas na operação.
19. Como usuário do Comercial, quero selecionar o segmento da operação (Café ou Indústria), para categorizar a cotação corretamente.
20. Como usuário do Comercial, quero preencher o produto em texto livre, para descrever a carga transportada.
21. Como usuário do Comercial, quero selecionar o tipo de veículo (Carreta LS, Rodotrem ou Bitruck), para especificar o equipamento necessário.
22. Como usuário do Comercial, quero selecionar o tipo de valor (Por container, Por veículo ou Por operação), para indicar a base de precificação.
23. Como usuário do Comercial, quero selecionar o tipo de operação (Importação ou Exportação) e navegar pelos subtipos hierárquicos, para classificar corretamente a operação aduaneira.
24. Como usuário do Comercial, ao selecionar Importação > DTA, quero escolher entre Baixa de container, Desova de container, Sobre rodas ou Outros (com campo texto livre), para detalhar o tipo de desembaraço.
25. Como usuário do Comercial, ao selecionar Importação > DI, quero confirmar sem subtipos adicionais, pois DI é seleção final.
26. Como usuário do Comercial, ao selecionar Importação > Outro, quero preencher um campo texto livre, para registrar tipos de operação não previstos.
27. Como usuário do Comercial, ao selecionar Exportação > Operação direta, quero confirmar sem campos adicionais.
28. Como usuário do Comercial, ao selecionar Exportação > Operação com mapa, quero preencher o campo "Cidade do mapa" em texto livre, para indicar a localidade do mapa de transporte.
29. Como usuário do Comercial, quero adicionar múltiplos trechos em uma cotação, cada um com origem (autocompletar Google Maps), destino (autocompletar Google Maps) e valor, para representar operações com mais de um segmento de rota.
30. Como usuário do Comercial, quero remover um trecho adicionado, para corrigir erros durante o preenchimento.
31. Como usuário do Comercial, quero selecionar a cidade de retirada/entrega do container vazio a partir de uma lista fixa de portos e pátios, para padronizar esse campo.
32. Como usuário do Comercial, quero selecionar adicionais de uma lista pré-cadastrada (com valores fixos) e ver o total acumulado, para compor o custo final da cotação.
33. Como usuário do Comercial, quero selecionar quais logos de certificação aparecerão no PDF da cotação, a partir de um banco de imagens do sistema, para personalizar a proposta.

### PDF da Cotação

34. Como usuário do Comercial, quero visualizar um preview do PDF antes de confirmar, para revisar o documento.
35. Como usuário do Comercial, quero editar os dados da cotação após visualizar o preview, para corrigir eventuais erros.
36. Como sistema, quero gerar um identificador único no formato NS_IMP_XXXX (importação) ou NS_EXP_XXXX (exportação) para cada cotação, para garantir rastreabilidade.
37. Como sistema, quero incluir no PDF: logo da transportadora, logo do cliente, logos das certificações selecionadas, todos os campos do formulário, trechos com origens/destinos/valores, adicionais, total e identificador único, para entregar uma proposta completa e profissional.

### Envio ao Cliente

38. Como usuário do Comercial, quero enviar a cotação confirmada por e-mail diretamente pelo sistema, para não precisar alternar para outro cliente de e-mail.
39. Como sistema, quero incluir no e-mail ao cliente um link único com token de autenticação, para que o cliente acesse a cotação sem precisar criar conta.
40. Como cliente, quero acessar via link uma página simples com os detalhes da minha cotação, para visualizar a proposta recebida.
41. Como cliente, quero clicar em "Aprovar" para aceitar a cotação, para comunicar minha decisão sem precisar responder por e-mail.
42. Como cliente, quero clicar em "Reprovar" para recusar a cotação, para comunicar minha decisão sem precisar responder por e-mail.
43. Como cliente, quero deixar um comentário ou solicitação na página da cotação, para pedir ajustes ou esclarecimentos.
44. Como cliente, quero receber confirmação visual após minha resposta, para ter certeza de que ela foi registrada.

### Notificações

45. Como usuário do Comercial, quero receber notificação dentro da plataforma e por e-mail quando o cliente aprovar uma cotação, para agir imediatamente.
46. Como usuário do Comercial, quero receber notificação quando o cliente reprovar uma cotação, para iniciar uma nova negociação.
47. Como usuário do Comercial, quero receber notificação quando o cliente deixar um comentário em uma cotação, para responder à solicitação.
48. Como usuário da Operação, quero receber notificação dentro da plataforma e por e-mail quando uma cotação aprovada for encaminhada para mim, para iniciar a execução.
49. Como usuário do Comercial, quero receber notificação quando a Operação solicitar uma revisão da cotação, para gerar uma nova versão.

### Versionamento

50. Como usuário do Comercial, quero gerar uma nova versão de uma cotação existente (mantendo o mesmo ID base com sufixo -v2, -v3...), para continuar a negociação sem perder o histórico.
51. Como usuário do Comercial, quero visualizar todas as versões de uma cotação na tela individual, para acompanhar a evolução da negociação.
52. Como sistema, quero garantir que cada versão passe pelo mesmo fluxo completo (geração → envio → resposta do cliente), para manter a rastreabilidade.

### Encaminhamento para Operação

53. Como usuário do Comercial, quero, após uma cotação ser aprovada, selecionar usuários da Operação de uma lista e encaminhá-la, para que executem o serviço.
54. Como sistema, quero notificar por e-mail e plataforma os usuários da Operação selecionados, informando que uma cotação foi fechada, para que iniciem o atendimento.

### Fluxo da Operação

55. Como usuário da Operação, quero visualizar apenas cotações com status "Aprovada" ou posterior na lista mestra, para focar no que é relevante para mim.
56. Como usuário da Operação, quero solicitar revisão de uma cotação aprovada, para acionar o Comercial quando identificar necessidade de ajuste.
57. Como sistema, quero, quando a Operação solicitar revisão, notificar o Comercial responsável para que gere uma nova versão e reinicie o fluxo com o cliente.
58. Como usuário da Operação, quero encerrar um processo anexando o CT-e em PDF e um campo de observação opcional, para registrar a conclusão do serviço.
59. Como sistema, quero marcar o processo como "Concluído" e torná-lo somente-leitura após o encerramento, para preservar a integridade do histórico.

### Listas e Histórico

60. Como usuário do Comercial, quero ver na lista mestra todas as cotações do sistema com colunas de ID, cliente, origem, destino, tipo de operação, veículo, segmento, status, data e responsável, para ter visão completa do pipeline.
61. Como usuário, quero buscar cotações por palavra-chave na lista mestra, para localizar rapidamente qualquer cotação.
62. Como usuário, quero filtrar cotações por cliente, status, tipo de operação, veículo, segmento, período e responsável, para segmentar a visualização conforme necessidade.
63. Como usuário, quero acessar a tela de cotações por cliente, selecionar um cliente e ver todo o seu histórico de cotações, para ter visão do relacionamento com aquele cliente.

### Área Administrativa

64. Como administrador, quero cadastrar adicionais com nome e valor fixo, para que o Comercial os selecione ao gerar cotações.
65. Como administrador, quero editar e excluir adicionais cadastrados, para manter a lista atualizada.
66. Como administrador, quero cadastrar portos e pátios na lista fixa de cidades de retirada/entrega de container, para padronizar esse campo.
67. Como administrador, quero fazer upload de logos de certificação no banco de imagens do sistema, para que o Comercial as selecione ao gerar PDFs.
68. Como administrador, quero remover logos do banco de imagens, para manter apenas certificações válidas.
69. Como administrador, quero configurar o nome e a logo principal da empresa transportadora no sistema, para que apareçam em todos os PDFs gerados.

---

## Implementation Decisions

### Módulos Principais

**1. Auth Module**

- Autenticação JWT para usuários internos
- Controle de acesso baseado em perfil (RBAC): Admin, Comercial, Operação
- Tokens de link único (sem expiração imediata) para acesso de clientes a cotações específicas — sem sessão autenticada

**2. Client Module**

- CRUD de clientes com upload de logo (imagem)
- Gerenciamento de documentos por cliente (upload, listagem, download, exclusão)
- Armazenamento de arquivos em serviço de cloud (ex: Supabase Storage ou AWS S3)
- Visibilidade restrita por perfil: documentos visíveis apenas para Admin e Comercial

**3. Quotation Module**

- Criação de cotação com todos os campos do formulário
- Hierarquia de tipos de operação implementada como estado condicional no formulário (Importação → DTA/DI/Outro → subtipos de DTA)
- Trechos da cotação como entidade relacionada (1 cotação → N trechos)
- Adicionais selecionados como relação many-to-many (cotação ↔ adicional)
- Versionamento: campo `parentId` + campo `version` (integer); o ID de exibição é gerado a partir do root da cadeia de versões
- Identificador único: sequencial por tipo (`NS_IMP_XXXX` / `NS_EXP_XXXX`), gerado no backend

**4. PDF Generation Module**

- Geração server-side do PDF da cotação (ex: Puppeteer ou PDFKit)
- Template parametrizável com: logo da transportadora, logo do cliente, logos de certificação selecionadas, campos do formulário, trechos, adicionais, total, ID único
- Armazenamento do PDF gerado no cloud storage, vinculado à cotação

**5. Client-Facing Portal Module**

- Rota pública acessada via token único (`/cotacao/:token`)
- Sem autenticação de usuário — apenas validação do token
- Ações disponíveis: aprovar, reprovar, comentar
- Cada ação registra timestamp e IP no log da cotação

**6. Notification Module**

- Serviço de envio de e-mail transacional via Resend (resend.com)
- Notificações in-app armazenadas no banco e servidas via polling ou WebSocket
- Eventos notificáveis: resposta do cliente, encaminhamento para operação, solicitação de revisão

**7. Admin Module**

- CRUD de usuários com atribuição de perfil
- CRUD de adicionais (nome + valor)
- CRUD de portos/pátios
- CRUD de logos de certificação (banco de imagens)
- Configurações gerais da empresa

**8. Dashboard Module**

- Queries agregadas com filtro de período
- Indicadores: total gerado, em aberto, aprovadas, reprovadas, concluídas, taxa de aprovação, série mensal
- Sem cache em Fase 1 — queries diretas ao banco

### Esquema de Dados (principais entidades)

```
User { id, name, email, passwordHash, role: ADMIN|COMMERCIAL|OPERATION, active }

Client { id, name, cnpj, email, phone, logoUrl }

ClientDocument { id, clientId, name, fileUrl, category, uploadedAt }

Quotation {
  id, code (NS_IMP_0001), version (int), parentId (nullable),
  clientId, createdBy (userId), status,
  segment (COFFEE|INDUSTRY), product,
  vehicleType, valueType,
  operationType, operationSubtype, operationDetail,
  emptyContainerLocationId,
  sender, recipient,
  totalValue, pdfUrl,
  clientToken (unique),
  createdAt, updatedAt
}

QuotationLeg { id, quotationId, origin, destination, value, order }

QuotationAdditional { quotationId, additionalId }

QuotationCertification { quotationId, certificationId }

QuotationEvent {
  id, quotationId, type (CREATED|SENT|APPROVED|REJECTED|COMMENTED|FORWARDED|REVISION_REQUESTED|CLOSED),
  actorId (nullable — null se for cliente), clientComment, createdAt
}

Additional { id, name, value, active }

Port { id, name, active }

Certification { id, name, imageUrl, active }

Notification { id, userId, quotationId, type, read, createdAt }
```

### Integrações Externas

- **Google Maps Places API:** autocompletar campos de Origem e Destino nos trechos (chamada client-side)
- **Resend:** disparo de e-mails transacionais (chamada server-side)

### Visibilidade por Perfil

| Recurso                | Admin | Comercial | Operação                     |
| ---------------------- | ----- | --------- | ---------------------------- |
| Todas as cotações      | ✓     | ✓         | Apenas aprovadas/posteriores |
| Documentos de clientes | ✓     | ✓         | ✗                            |
| Área administrativa    | ✓     | ✗         | ✗                            |
| Encerrar com CT-e      | ✓     | ✗         | ✓                            |
| Gerar/editar cotações  | ✓     | ✓         | ✗                            |

---

## Testing Decisions

### O que constitui um bom teste neste projeto

- Testar comportamento externo (o que o módulo faz), não implementação interna (como faz)
- Testar os fluxos completos dos módulos de negócio (criação de cotação, geração de identificador, versionamento, transição de status)
- Não testar detalhes de UI; testar a lógica de negócio isolada das views

### Módulos prioritários para testes

**Quotation Module (alta prioridade)**

- Geração correta do identificador único (sequencial, por tipo, sem colisões)
- Lógica de versionamento: novo `code` = root + sufixo de versão correto
- Máquina de estados de status: transições válidas e inválidas
- Cálculo do total: soma dos trechos + adicionais selecionados

**Auth Module (alta prioridade)**

- Geração e validação de JWT
- Geração e validação de token de cliente (link único)
- Rejeição de acesso a rotas protegidas sem token válido

**Client Portal Module (média prioridade)**

- Token inválido retorna 404 (não expõe existência da cotação)
- Ações do cliente (aprovar/reprovar/comentar) registram evento corretamente
- Dupla ação (aprovar duas vezes) é idempotente ou bloqueada

**Notification Module (média prioridade)**

- Cada evento de negócio dispara as notificações corretas para os destinatários corretos
- E-mail não é disparado para usuários desativados

---

## Out of Scope

- Integração com sistema NTT ou qualquer ERP externo
- Cálculo automático de preços a partir de tabelas de frete (precificação é sempre manual)
- Portal do cliente com histórico de múltiplas cotações (cada link dá acesso a uma cotação específica)
- App mobile nativo (sistema é web; mobile responsivo é secundário)
- Módulo de tabelas de frete gerenciadas no sistema (Fase 2)
- Upload de documentos operacionais pelo cliente pós-fechamento — DTA, BL, etc. (Fase 2)
- Rastreamento de grandes Bids (Fase 2)
- Relatórios exportáveis (CSV/Excel) — Fase 2

---

## Further Notes

- **Prazo:** menos de 2 meses para o núcleo da Fase 1. Priorizar o fluxo central (cotação → PDF → envio → resposta → encaminhamento para operação) antes de funcionalidades secundárias (dashboard, área admin completa).
- **Layout do PDF:** o template visual do PDF precisa ser aprovado pelo cliente antes da implementação. Não desenvolver sem referências visuais definidas.
- **Sequência recomendada de desenvolvimento:**
  1. Auth + estrutura base
  2. CRUD de clientes e admin
  3. Formulário de cotação + geração de PDF
  4. Envio de e-mail + portal do cliente
  5. Notificações
  6. Dashboard
  7. Refinamentos de UX e permissões
- **Escopo de usuários:** 5 a 20 usuários simultâneos — não há necessidade de otimizações de escala na Fase 1.
- **Stack não prescrita:** nenhuma decisão de tecnologia (linguagem, framework, banco de dados) foi tomada ainda. O desenvolvedor tem liberdade de escolha dentro dos requisitos não-funcionais descritos.
