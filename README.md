# Nova Safra CRM

CRM web para gestão e geração de cotações de frete para a **Nova Safra Gestão Logística**.

## Stack

| Camada                          | Tecnologia                          |
| ------------------------------- | ----------------------------------- |
| Frontend + Backend              | Next.js 16 (App Router, TypeScript) |
| Banco de dados + Auth + Storage | Supabase (PostgreSQL)               |
| Hospedagem                      | Vercel                              |
| E-mail transacional             | Resend                              |
| Pagamentos                      | Stripe                              |
| Geração de PDF                  | Puppeteer (server-side)             |
| Autocompletar endereços         | Google Maps Places API              |

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- Contas criadas em: Supabase, Resend e Stripe (veja configuração manual abaixo)

## Instalação local

```bash
# 1. Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd nova-safra-crm

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com seus valores reais

# 4. Rode o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Configuração manual dos serviços externos

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Em **Settings > API**, copie `Project URL` e `anon public key`
3. Copie também a `service_role key` (usada apenas server-side)
4. Cole os valores em `.env.local`

### Resend

1. Crie uma conta em [resend.com](https://resend.com)
2. Adicione e verifique seu domínio em **Domains**
3. Crie uma API Key em **API Keys**
4. Cole `RESEND_API_KEY` e `RESEND_FROM_EMAIL` em `.env.local`

### Stripe

1. Crie uma conta em [stripe.com](https://stripe.com)
2. Em **Developers > API Keys**, copie as chaves de **modo teste**
3. Cole `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` e `STRIPE_SECRET_KEY` em `.env.local`

## Scripts disponíveis

| Comando                | Descrição                                            |
| ---------------------- | ---------------------------------------------------- |
| `npm run dev`          | Servidor de desenvolvimento em http://localhost:3000 |
| `npm run build`        | Build de produção                                    |
| `npm run start`        | Servidor de produção (após build)                    |
| `npm run lint`         | ESLint                                               |
| `npm run type-check`   | Verificação de tipos TypeScript                      |
| `npm run format`       | Formata todos os arquivos com Prettier               |
| `npm run format:check` | Verifica formatação sem alterar arquivos             |

## Estrutura do projeto

```
src/
├── app/              # Rotas (App Router)
│   ├── (auth)/       # Login, recuperação de senha
│   ├── (dashboard)/  # Páginas autenticadas
│   └── api/          # Route Handlers
├── components/
│   ├── ui/           # Componentes de UI reutilizáveis
│   └── layout/       # Layout (sidebar, header)
├── lib/
│   ├── supabase/     # Clientes Supabase (browser, server, middleware)
│   ├── resend/       # Cliente Resend
│   ├── stripe/       # Cliente Stripe
│   └── utils/        # Utilitários gerais
└── types/            # Tipos TypeScript globais
```

## Assets visuais

Os assets da empresa estão em `public/assets/`:

| Arquivo                        | Uso                                      |
| ------------------------------ | ---------------------------------------- |
| `logo-nova-safra.jpeg`         | Logo principal — header e PDFs           |
| `selo-aeo.png`                 | Selo AEO Security — PDFs de cotação      |
| `selo-iso9001.png`             | Selo ISO 9001 — PDFs de cotação          |
| `referencia-dashboard.jpeg`    | Referência visual do layout do dashboard |
| `referencia-cotacao-casul.pdf` | Referência do layout do PDF de cotação   |

## Deploy

O deploy é feito automaticamente na Vercel a cada push na branch `main`. Configure todas as variáveis do `.env.example` no painel da Vercel antes do primeiro deploy.
