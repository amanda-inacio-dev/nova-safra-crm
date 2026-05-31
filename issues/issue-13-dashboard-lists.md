# Issue #13 — Dashboard e listas mestras

**Tipo:** AFK  
**Bloqueada por:** Issue #11

## What to build

Painel de controle com indicadores em tempo real e telas de lista mestra de cotações e histórico por cliente. Estilo visual baseado na referência `download.jpeg` (sidebar azul escuro, cards de métricas, gráficos).

## Referência visual

Arquivo `download.jpeg` na pasta do projeto: sidebar de navegação à esquerda em azul escuro, cards de métricas no topo, gráfico de barras e gráfico de área na área principal.

## Acceptance criteria

- [ ] Dashboard como tela inicial após login
- [ ] Cards de métricas: Total geradas, Em aberto, Aprovadas, Reprovadas, Concluídas, Taxa de aprovação (%)
- [ ] Gráfico de barras: cotações geradas por mês
- [ ] Filtro de período: último mês, trimestre, ano, intervalo personalizado
- [ ] Indicadores atualizam ao mudar o filtro de período
- [ ] Sidebar de navegação com links para: Dashboard, Cotações, Clientes, Admin (se Admin)
- [ ] Lista mestra de cotações com colunas: ID, Cliente, Origem, Destino, Tipo de operação, Veículo, Segmento, Status, Data, Responsável
- [ ] Busca por palavra-chave na lista mestra
- [ ] Filtros por: cliente, status, tipo de operação, veículo, segmento, período, responsável
- [ ] Tela "Cotações por cliente": lista de clientes → clique abre histórico completo com mesmos filtros
- [ ] Visibilidade por perfil aplicada (Operação vê apenas ENCAMINHADA em diante)

## Blocked by

Issue #11
