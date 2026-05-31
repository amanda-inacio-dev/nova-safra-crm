# Issue #06 — Aprovação do template visual do PDF

**Tipo:** HITL (requer aprovação humana)  
**Bloqueada por:** Issue #05

## What to build

Definir e aprovar o layout visual do PDF da cotação antes de implementar a geração automática. O template usa o cabeçalho da "Tabela de Fretes" atual como referência, adaptado para "Cotação".

## Referências disponíveis na pasta do projeto

- `1708696221170.jpeg` — Logo Nova Safra Gestão Logística
- `AEO-Marcas_Security_Positiva.png` — Selo AEO Security
- `selo ISO 9001.png` — Selo ISO 9001
- `Tabela de Fretes Cooperativa CASUL 29 05 2026.pdf` — documento de referência

## Estrutura do cabeçalho (baseado no documento de referência)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo Nova Safra]    COTAÇÃO          [Logo Cliente]        │
│                   Transporte Rodoviário Nacional             │
│  [Selos: AEO Security | ISO 9001 | outros selecionados]      │
├─────────────────────────────────────────────────────────────┤
│  ID: NS_IMP_0001   |  Data: 29/05/2026  |  Validade: ...    │
└─────────────────────────────────────────────────────────────┘
```

## Acceptance criteria

- [ ] Layout do cabeçalho aprovado (logo NS à esquerda, título ao centro, logo cliente à direita)
- [ ] Posicionamento dos selos de certificação definido
- [ ] Seções do corpo do PDF definidas (dados da operação, trechos, adicionais, observações)
- [ ] Paleta de cores aprovada (baseada na identidade Nova Safra: verde escuro + branco)
- [ ] Template aprovado pelo responsável antes de prosseguir para Issue #07

## Blocked by

Issue #05
