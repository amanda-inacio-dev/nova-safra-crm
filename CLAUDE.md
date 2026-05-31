# Nova Safra CRM — Contexto para o Agente

## O que é este projeto

CRM web de geração e gestão de cotações para a **Nova Safra Gestão Logística**, transportadora com ~200 caminhões especializada em frete de container e carga solta.

O sistema substitui o processo atual de cotações por e-mail, centralizando todo o ciclo comercial em uma plataforma web.

## Documentos de referência (leia antes de qualquer tarefa)

- `especificacao_sistema_crm.md` — especificação completa com todos os campos, fluxos e regras de negócio
- `PRD_crm_cotacoes.md` — PRD com 69 user stories, módulos, schema de dados e decisões técnicas
- `issues/` — pasta com as 13 issues do projeto em ordem de dependência

## Stack

| Camada                  | Tecnologia                                    |
| ----------------------- | --------------------------------------------- |
| Frontend + Backend      | Next.js 14+ (App Router, TypeScript)          |
| Banco de dados          | Supabase (PostgreSQL)                         |
| Autenticação            | Supabase Auth                                 |
| Storage de arquivos     | Supabase Storage                              |
| Hospedagem              | Vercel                                        |
| E-mail transacional     | Resend                                        |
| Pagamentos              | Stripe                                        |
| Autocompletar endereços | Google Maps Places API                        |
| Geração de PDF          | Puppeteer (server-side, via Vercel Functions) |

## Identidade visual

- **Empresa:** Nova Safra Gestão Logística
- **Logo principal:** `1708696221170.jpeg`
- **Selos de certificação:** `AEO-Marcas_Security_Positiva.png`, `selo ISO 9001.png`
- **Referência de layout do dashboard:** `download.jpeg` (sidebar azul escuro, cards, gráficos)
- **Referência de cotação:** `Tabela de Fretes Cooperativa CASUL 29 05 2026.pdf` — usar o cabeçalho como base, substituindo "TABELA DE FRETES" por "COTAÇÃO"

## Glossário de domínio

| Termo           | Definição                                                                |
| --------------- | ------------------------------------------------------------------------ |
| Cotação         | Proposta de frete gerada pelo Comercial e enviada ao cliente             |
| Trecho          | Segmento de rota dentro de uma cotação (origem → destino + valor)        |
| Adicional       | Custo extra aplicável (pedágio, estadia, escolta, etc.)                  |
| Container vazio | Ponto de retirada/devolução do container (porto ou pátio)                |
| CT-e            | Conhecimento de Transporte Eletrônico — documento que encerra o processo |
| DTA             | Despacho de Trânsito Aduaneiro                                           |
| DI              | Declaração de Importação                                                 |
| BL              | Bill of Lading — conhecimento de embarque marítimo                       |
| Bid             | Processo de cotação competitiva de grandes clientes                      |

## Perfis de usuário

| Perfil     | Permissões principais                                                 |
| ---------- | --------------------------------------------------------------------- |
| ADMIN      | Tudo + gerenciar usuários e configurações                             |
| COMMERCIAL | Criar/enviar cotações, gerenciar clientes, ver documentos de clientes |
| OPERATION  | Ver cotações aprovadas, solicitar revisão, encerrar com CT-e          |
| Cliente    | Acesso via link único sem login — aprovar/reprovar/comentar           |

## Schema principal do banco

```
users { id, name, email, role: ADMIN|COMMERCIAL|OPERATION, active }
clients { id, name, cnpj, email, phone, logo_url }
client_documents { id, client_id, name, file_url, category }
quotations { id, code, version, parent_id, client_id, created_by, status,
             segment, product, vehicle_type, value_type,
             operation_type, operation_subtype, operation_detail,
             empty_container_port_id, sender, recipient,
             total_value, pdf_url, client_token, created_at }
quotation_legs { id, quotation_id, origin, destination, value, order }
quotation_additionals { quotation_id, additional_id }
quotation_certifications { quotation_id, certification_id }
quotation_events { id, quotation_id, type, actor_id, client_comment, created_at }
additionals { id, name, value, active }
ports { id, name, active }
certifications { id, name, image_url, active }
notifications { id, user_id, quotation_id, type, read, created_at }
```

## Status do ciclo de uma cotação

`RASCUNHO` → `PRONTA` → `AGUARDANDO_CLIENTE` → `APROVADA` | `REPROVADA` → `ENCAMINHADA` → `CONCLUIDA`

## Identificador de cotações

- Importação: `NS_IMP_XXXX` (ex: `NS_IMP_0023`)
- Exportação: `NS_EXP_XXXX` (ex: `NS_EXP_0047`)
- Revisões: sufixo `-v2`, `-v3` (ex: `NS_IMP_0023-v2`)

## Convenções de código

- TypeScript estrito em todo o projeto
- Server Actions para mutações de dados
- Row Level Security (RLS) no Supabase para todas as tabelas
- Variáveis de ambiente nunca expostas no cliente (prefixo `NEXT_PUBLIC_` apenas quando necessário)
- Testes para: geração de ID único, máquina de estados da cotação, validação de token do cliente

## Ordem de desenvolvimento (issues)

1. `issue-01` — Setup (HITL — requer configuração manual)
2. `issue-02` — Auth
3. `issue-03` — Clientes / `issue-04` — Admin (paralelos)
4. `issue-05` — Formulário de cotação
5. `issue-06` — Aprovação do PDF (HITL)
6. `issue-07` — Geração do PDF
7. `issue-08` — Portal do cliente
8. `issue-09` — Notificações / `issue-10` — Versionamento (paralelos)
9. `issue-11` — Fluxo da operação
10. `issue-12` — Documentos do cliente (pode rodar em paralelo com #05+)
11. `issue-13` — Dashboard e listas
