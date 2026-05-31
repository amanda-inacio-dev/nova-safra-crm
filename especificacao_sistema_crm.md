# Especificação Técnica — CRM de Cotações para Transportadora

**Versão:** 1.0  
**Data:** Maio de 2026  
**Status:** Pronto para desenvolvimento

---

## 1. Visão Geral do Produto

Sistema web sob medida para uma transportadora com aproximadamente 200 caminhões, especializada em frete de carga em container e carga solta. O sistema centraliza o processo comercial — da geração de cotações até a passagem para a operação — substituindo o fluxo atual baseado em e-mails e planilhas.

### 1.1 Objetivos Principais

- Gerar cotações em PDF com identidade visual padronizada
- Gerenciar o ciclo completo de negociação (envio → resposta do cliente → aprovação → operação)
- Rastrear todas as cotações com histórico completo e auditável
- Armazenar documentos por cliente em uma pasta digital centralizada
- Notificar automaticamente os envolvidos em cada etapa do processo

### 1.2 Público-Alvo

| Perfil        | Descrição                                                    |
| ------------- | ------------------------------------------------------------ |
| Administrador | Configura o sistema, gerencia usuários e permissões          |
| Comercial     | Gera cotações, negocia com clientes, encaminha para operação |
| Operação      | Recebe cotações aprovadas, executa e encerra com CT-e        |
| Cliente       | Acessa cotações via link único, sem cadastro autenticado     |

### 1.3 Escopo da Fase 1

O sistema cobre do primeiro contato comercial até a passagem para a operação (encerrada com o anexo do CT-e). Integrações externas (NTT e similares) estão **fora do escopo**.

---

## 2. Arquitetura de Usuários e Permissões

### 2.1 Perfis

**Administrador**

- Recruta, cadastra e gerencia todos os usuários
- Define e altera permissões por perfil
- Acessa todas as funcionalidades do sistema
- Cadastra: adicionais, portos/pátios, logos/certificações

**Comercial**

- Cadastra e edita clientes (dados + logo)
- Gera, edita e envia cotações
- Visualiza todas as cotações do sistema (não apenas as próprias)
- Acessa documentos dos clientes (tabelas, apólices, contratos)
- Encaminha cotações aprovadas para a operação
- Gera novas versões de cotação quando solicitado pela operação

**Operação**

- Visualiza apenas cotações aprovadas (após encaminhamento pelo comercial)
- Pode solicitar revisão de cotação (notifica o comercial)
- Encerra o processo anexando o CT-e + observação opcional
- **Não acessa** documentos cadastrais dos clientes

**Cliente (sem autenticação)**

- Acessa cotações via link único enviado por e-mail
- Pode: aprovar, reprovar ou comentar a cotação
- Não tem cadastro no sistema; é rastreado pelo link/token da cotação

---

## 3. Funcionalidades do Sistema

### 3.1 Autenticação

- Login com e-mail e senha para usuários internos (Admin, Comercial, Operação)
- Recuperação de senha por e-mail
- Sessão autenticada com token JWT
- Clientes **não possuem** autenticação — acesso via link com token único por cotação

---

### 3.2 Cadastro de Clientes

**Quem pode cadastrar:** Admin e Comercial

**Campos obrigatórios:**

- Razão social
- CNPJ
- E-mail de contato
- Telefone
- Logo da empresa (upload de imagem)

**Pasta de documentos do cliente** (visível apenas para Admin e Comercial):

- Tabela de frete específica (Excel)
- Apólice de seguro
- Termos contratuais e de compliance
- Pasta de sinistro
- Demais documentos gerais (upload livre)

---

### 3.3 Formulário de Cotação

Preenchido pelo usuário do Comercial. Campos:

#### Identificação

- **Cliente:** seleção da lista de cadastros preexistente
- **Remetente:** texto livre
- **Destinatário:** texto livre
- **Segmento:** seleção única — `Café` ou `Indústria`
- **Produto:** texto livre

#### Tipo de Operação (hierárquico)

```
Importação
  └── DTA
        ├── Baixa de container
        ├── Desova de container
        ├── Sobre rodas
        └── Outros (campo texto livre)
  └── DI  (seleção final, sem subtipo)
  └── Outro (campo texto livre)

Exportação
  └── Operação direta (seleção final)
  └── Operação com mapa
        └── Cidade do mapa: texto livre
```

#### Tipo de Veículo

Dropdown com opções:

- Carreta LS
- Rodotrem
- Bitruck

#### Tipo de Valor

Dropdown com opções:

- Por container
- Por veículo
- Por operação

#### Trechos da Operação (seção dinâmica)

O usuário adiciona quantos trechos forem necessários. Cada trecho contém:

- **Origem:** texto livre com autocompletar via Google Maps API
- **Destino:** texto livre com autocompletar via Google Maps API
- **Valor:** numérico (preenchimento manual)

#### Cidade de Retirada/Entrega do Container Vazio

- Seleção a partir de lista fixa de portos e pátios (cadastrada pelo Admin)

#### Adicionais

- Lista de opções pré-cadastradas pelo Admin, cada uma com valor fixo
- Usuário marca quais se aplicam à cotação
- O sistema exibe o total dos adicionais selecionados

#### Certificações no PDF

- Banco de imagens gerenciado pelo Admin
- Usuário seleciona quais logos de certificação incluir no PDF da cotação

---

### 3.4 Geração de PDF da Cotação

**Identificador único no formato:**

- Importação: `NS_IMP_XXXX` (ex: `NS_IMP_0023`)
- Exportação: `NS_EXP_XXXX` (ex: `NS_EXP_0047`)
- Revisões: sufixo de versão — `NS_IMP_0023-v2`, `-v3`, etc.

**Conteúdo do PDF:**

- Logo da empresa transportadora
- Logo do cliente
- Logo(s) das certificações selecionadas
- Todos os campos preenchidos no formulário
- Trechos com origens, destinos e valores
- Adicionais selecionados
- Valor total
- Identificador único e data

**Layout:** a ser criado do zero com base em referências visuais fornecidas pelo cliente. Design deve ser aprovado antes da implementação.

**Fluxo pós-geração:**

1. Usuário revisa o PDF dentro do sistema
2. Pode editar antes de confirmar
3. Após confirmar, envia por e-mail ao cliente

---

### 3.5 Envio da Cotação ao Cliente

- Enviado por e-mail diretamente pelo sistema
- O e-mail contém um **link único** com token de autenticação por cotação
- Ao clicar no link, o cliente acessa uma página simples com:
  - Detalhes da cotação
  - Botão **Aprovar**
  - Botão **Reprovar**
  - Campo **Comentário/Solicitação** (texto livre)
- O cliente não precisa criar conta nem instalar nada

---

### 3.6 Notificações

**Gatilho → Notificados**

| Evento                            | Canal               | Destinatários                     |
| --------------------------------- | ------------------- | --------------------------------- |
| Cliente aprova cotação            | E-mail + plataforma | Usuário que gerou a cotação       |
| Cliente reprova cotação           | E-mail + plataforma | Usuário que gerou a cotação       |
| Cliente comenta cotação           | E-mail + plataforma | Usuário que gerou a cotação       |
| Cotação encaminhada para operação | E-mail + plataforma | Usuários selecionados na operação |
| Operação solicita revisão         | E-mail + plataforma | Usuário do comercial responsável  |

---

### 3.7 Versionamento de Cotações

- Novas versões podem ser criadas pelo **Comercial** (por solicitação do cliente ou da operação)
- Cada versão mantém o mesmo ID base com sufixo incremental: `-v2`, `-v3`...
- O histórico completo de versões fica visível na tela da cotação individual
- Cada nova versão passa pelo mesmo fluxo: PDF → revisão → envio → resposta do cliente

---

### 3.8 Fluxo Completo de uma Cotação

```
[Comercial] Preenche formulário
       ↓
[Sistema] Gera PDF com ID único
       ↓
[Comercial] Revisa e confirma
       ↓
[Sistema] Envia e-mail com link único ao cliente
       ↓
[Cliente] Acessa link → Aprova / Reprova / Comenta
       ↓
[Sistema] Notifica o Comercial
       ↓ (se reprovada/comentada)
[Comercial] Gera nova versão → repete o fluxo
       ↓ (se aprovada)
[Comercial] Seleciona usuários da Operação → encaminha
       ↓
[Sistema] Notifica a Operação por e-mail e plataforma
       ↓
[Operação] Executa o serviço
       │
       ├── Se precisar de revisão: notifica o Comercial → nova versão
       │
       └── Quando concluído: anexa CT-e + observação opcional → ENCERRA
```

---

### 3.9 Encerramento do Processo

- Realizado pelo usuário da **Operação**
- Ação: anexar o CT-e (PDF) + campo de observação (opcional)
- Após o encerramento, o processo é marcado como **Concluído** e fica somente-leitura

---

## 4. Telas do Sistema

### 4.1 Login e Autenticação

- Tela de login com e-mail e senha
- Link de recuperação de senha
- Redirecionamento por perfil após login

### 4.2 Dashboard (Painel de Controle)

Tela inicial após login. Exibe indicadores em tempo real, filtráveis por período (último mês, trimestre, ano, ou intervalo personalizado):

- Total de cotações geradas no período
- Cotações em aberto (aguardando resposta do cliente)
- Cotações aprovadas
- Cotações reprovadas
- Cotações concluídas (CT-e anexado)
- Cotações geradas por mês (gráfico de barras)
- Taxa de aprovação (%)

### 4.3 Lista Mestra de Cotações

Tabela com todas as cotações do sistema. Colunas:

- ID (ex: NS_IMP_0023-v2)
- Cliente
- Origem principal
- Destino principal
- Tipo de operação
- Subtipo
- Tipo de veículo
- Segmento
- Status (Em aberto / Aprovada / Reprovada / Encaminhada / Concluída)
- Data de criação
- Responsável (usuário que criou)

**Funcionalidades:**

- Busca por palavra-chave (full-text)
- Filtros por: cliente, status, tipo de operação, tipo de veículo, segmento, período, responsável

**Visibilidade:**

- Comercial: vê todas as cotações
- Operação: vê apenas cotações com status "Aprovada" ou posterior
- Admin: vê tudo

### 4.4 Cotações por Cliente

- Tela inicial: lista de todos os clientes cadastrados
- Ao clicar em um cliente: exibe todas as cotações do histórico daquele cliente
- Mesmas colunas e filtros da Lista Mestra
- Exibe também: total de cotações, taxa de aprovação, última negociação

### 4.5 Formulário de Nova Cotação

- Formulário estruturado com todos os campos descritos na seção 3.3
- Seção de trechos dinâmica (adicionar/remover trechos)
- Seleção de adicionais com checkboxes
- Seleção de certificações para o PDF
- Preview do PDF antes de confirmar

### 4.6 Tela da Cotação Individual

- Visualização do PDF gerado
- Histórico de versões
- Status atual e linha do tempo de eventos (gerada, enviada, resposta do cliente, encaminhada, etc.)
- Botões de ação contextuais:
  - Editar (se ainda em rascunho)
  - Enviar por e-mail
  - Gerar nova versão
  - Encaminhar para operação (se aprovada)
  - Encerrar com CT-e (perfil Operação)

### 4.7 Cadastro de Clientes

- Lista de clientes com busca e filtro
- Formulário de criação/edição
- Seção de upload de documentos do cliente (categorizada)

### 4.8 Página Pública da Cotação (acesso do cliente)

- Acessada via link único por e-mail
- Sem necessidade de login
- Exibe o PDF da cotação
- Botões: Aprovar / Reprovar
- Campo de texto para comentários/solicitações
- Confirmação visual após resposta

### 4.9 Área Administrativa

- Gestão de usuários (criar, editar, desativar, definir perfil)
- Gestão de adicionais: nome + valor fixo
- Gestão de portos e pátios (lista fixa para campo de container vazio)
- Banco de logos e certificações (upload e gerenciamento)
- Configurações gerais do sistema (nome da empresa, logo principal)

---

## 5. Envio de E-mail

- Serviço de terceiro recomendado: **Resend** (resend.com) — gratuito para volumes baixos, fácil integração
- Alternativa: SendGrid
- E-mails transacionais disparados pelo sistema:
  - Envio de cotação ao cliente (com link único)
  - Notificação de resposta do cliente ao comercial
  - Notificação de encaminhamento ao time de operação
  - Notificação de solicitação de revisão pela operação
  - Recuperação de senha

---

## 6. Integrações Externas

| Integração                                | Status                 |
| ----------------------------------------- | ---------------------- |
| Google Maps API (autocompletar endereços) | **Incluída na Fase 1** |
| NTT                                       | **Fora do escopo**     |
| Quaisquer ERPs ou sistemas legados        | **Fora do escopo**     |

---

## 7. Requisitos Não-Funcionais

- **Acesso:** Web, via navegador, sem necessidade de instalação
- **Disponibilidade:** Online, acessível de qualquer lugar
- **Usuários simultâneos:** 5 a 20 usuários internos
- **Segurança:** Autenticação JWT, controle de acesso por perfil, links de cotação com token único e expiração
- **Armazenamento de arquivos:** Upload de PDFs, imagens e Excel; armazenamento em serviço de cloud (ex: AWS S3 ou Supabase Storage)
- **Responsividade:** Desktop prioritário; mobile como secundário

---

## 8. Expansões Futuras (Fase 2 em diante)

Estas funcionalidades estão **fora do escopo da Fase 1** mas foram mapeadas para desenvolvimento futuro:

### 8.1 Documentação Operacional Pós-Fechamento

Após aprovação da cotação, o cliente poderia fazer upload de documentos operacionais diretamente na plataforma (DTA, BL - Bill of Lading, etc.), com acesso imediato pela operação.

### 8.2 Gestão de Tabelas de Frete no Sistema

Substituir as planilhas Excel por um módulo interno de criação e gestão de tabelas de frete, com histórico de versões e controle de vigência.

### 8.3 Rastreamento de Grandes Bids

Módulo para registrar e acompanhar processos de bid — mesmo que conduzidos externamente (e-mail ou plataformas dos clientes) — centralizando status, documentos e histórico dentro da plataforma.

---

## 9. Decisões de Design e UX

- Layout do PDF a ser criado do zero com base em referências visuais fornecidas pelo cliente antes do desenvolvimento
- Identidade visual do sistema (cores, fontes) a ser definida com o cliente
- Prioridade de entrega: **menos de 2 meses** — desenvolver o núcleo essencial primeiro (cotação → envio → aprovação → operação), expansões em seguida

---

## 10. Glossário

| Termo           | Definição                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------- |
| CT-e            | Conhecimento de Transporte Eletrônico — documento fiscal obrigatório no transporte de cargas |
| DTA             | Despacho de Trânsito Aduaneiro — regime aduaneiro especial                                   |
| DI              | Declaração de Importação — documento de desembaraço aduaneiro                                |
| BL              | Bill of Lading — conhecimento de embarque marítimo                                           |
| Bid             | Processo de cotação competitiva geralmente conduzido por grandes clientes                    |
| Adicional       | Custo extra aplicável a uma cotação (pedágio, escolta, seguro etc.)                          |
| Trecho          | Segmento de rota dentro de uma cotação (origem → destino com valor)                          |
| Container vazio | Ponto de retirada ou devolução do container, geralmente um porto ou pátio                    |
