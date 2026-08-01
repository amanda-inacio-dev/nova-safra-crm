import { describe, it, expect } from 'vitest'
import {
  buildAdditionalLines,
  keyForSelection,
  summarizeLegCharges,
  summarizeQuotationGrandTotal,
  type AdditionalNameLookup,
} from './summary'

const additionals: AdditionalNameLookup[] = [
  {
    id: 'add-margem',
    name: 'Retirada margem esquerda',
    subtypes: [
      { id: 'sub-frete', name: 'Frete' },
      { id: 'sub-pedagio', name: 'Pedágio' },
    ],
  },
  { id: 'add-icms', name: 'ICMS', subtypes: [] },
  { id: 'add-estadia', name: 'Estadia', subtypes: [] },
]

describe('keyForSelection', () => {
  it('identifica percentual, subtipo, adicional e manual', () => {
    expect(keyForSelection({ percent: 12 })).toBe('icms')
    expect(keyForSelection({ additionalId: 'a', subtypeId: 's' })).toBe('sub:a:s')
    expect(keyForSelection({ additionalId: 'a' })).toBe('add:a')
    expect(keyForSelection({ customName: 'Extra' })).toBe('manual:Extra')
  })
})

describe('buildAdditionalLines', () => {
  it('discrimina cada subtipo em sua própria linha, com o nome do adicional', () => {
    const lines = buildAdditionalLines(
      [
        { additionalId: 'add-margem', subtypeId: 'sub-frete', value: 420 },
        { additionalId: 'add-margem', subtypeId: 'sub-pedagio', value: 65 },
      ],
      additionals
    )
    expect(lines).toEqual([
      { key: 'sub:add-margem:sub-frete', label: 'Retirada margem esquerda · Frete', value: 420 },
      { key: 'sub:add-margem:sub-pedagio', label: 'Retirada margem esquerda · Pedágio', value: 65 },
    ])
  })

  it('ignora ICMS (percentual) e valores zerados', () => {
    const lines = buildAdditionalLines(
      [
        { additionalId: 'add-icms', percent: 12 },
        { additionalId: 'add-margem', subtypeId: 'sub-frete', value: 0 },
      ],
      additionals
    )
    expect(lines).toEqual([])
  })

  it('inclui adicional manual pelo nome digitado', () => {
    const lines = buildAdditionalLines([{ customName: 'Taxa especial', value: 100 }], additionals)
    expect(lines).toEqual([{ key: 'manual:Taxa especial', label: 'Taxa especial', value: 100 }])
  })
})

describe('summarizeLegCharges', () => {
  it('soma Frete + Pedágio + margem esquerda + Seguro e aplica o ICMS do trecho', () => {
    // Caso confirmado: Frete 5.000 + Pedágio 200 + Seguro 105 = 5.305; ICMS 12% por dentro.
    const summary = summarizeLegCharges({
      freightValue: 5000,
      freightIncluded: true,
      tollValue: 200,
      tollIncluded: true,
      additionalSelections: [],
      additionals: [],
      insuranceValue: 105,
      insuranceIncluded: true,
      icmsRatePercent: 12,
    })
    expect(summary.base).toBe(5305)
    expect(summary.total).toBeCloseTo(6028.41, 2)
  })

  it('não aplica ICMS quando a alíquota do trecho é zero', () => {
    const summary = summarizeLegCharges({
      freightValue: 1000,
      freightIncluded: true,
      tollValue: 0,
      tollIncluded: true,
      additionalSelections: [],
      additionals: [],
      insuranceValue: 0,
      insuranceIncluded: true,
      icmsRatePercent: 0,
    })
    expect(summary.total).toBe(1000)
  })

  it('itens desmarcados não entram na base, mas aparecem em excludedLines', () => {
    const summary = summarizeLegCharges({
      freightValue: 1000,
      freightIncluded: true,
      tollValue: 200,
      tollIncluded: false,
      additionalSelections: [],
      additionals: [],
      insuranceValue: 0,
      insuranceIncluded: true,
      icmsRatePercent: 0,
    })
    expect(summary.base).toBe(1000)
    expect(summary.excludedLines).toEqual([{ key: 'leg-toll', label: 'Pedágio', value: 200 }])
  })

  it('margem esquerda desmarcada não entra na base do trecho', () => {
    const summary = summarizeLegCharges({
      freightValue: 1000,
      freightIncluded: true,
      tollValue: 0,
      tollIncluded: true,
      additionalSelections: [
        {
          additionalId: 'add-margem',
          subtypeId: 'sub-frete',
          value: 300,
          includeInTotal: false,
        },
      ],
      additionals,
      insuranceValue: 0,
      insuranceIncluded: true,
      icmsRatePercent: 0,
    })
    expect(summary.base).toBe(1000)
    expect(summary.excludedLines).toEqual([
      { key: 'sub:add-margem:sub-frete', label: 'Retirada margem esquerda · Frete', value: 300 },
    ])
  })
})

describe('summarizeQuotationGrandTotal', () => {
  it('exemplo confirmado: 2 trechos (cada um com seu ICMS) + 1 adicional geral', () => {
    const legs = [
      {
        freightValue: 5000,
        freightIncluded: true,
        tollValue: 200,
        tollIncluded: true,
        additionalSelections: [],
        additionals: [],
        insuranceValue: 105,
        insuranceIncluded: true,
        icmsRatePercent: 12,
      },
      {
        freightValue: 800,
        freightIncluded: true,
        tollValue: 50,
        tollIncluded: true,
        additionalSelections: [],
        additionals: [],
        insuranceValue: 105,
        insuranceIncluded: true,
        icmsRatePercent: 12,
      },
    ]

    const result = summarizeQuotationGrandTotal({
      legs,
      generalSelections: [{ additionalId: 'add-estadia', value: 300, includeInTotal: true }],
      generalAdditionals: additionals,
      generalIncludeMap: {},
    })

    expect(result.legSummaries[0].total).toBeCloseTo(6028.41, 2)
    expect(result.legSummaries[1].total).toBeCloseTo(1085.23, 2)
    expect(result.legsTotal).toBeCloseTo(7113.64, 2)
    expect(result.generalSum).toBe(300)
    expect(result.grandTotal).toBeCloseTo(7413.64, 2)
  })

  it('adicional geral desmarcado não entra na soma, só em generalExcludedLines', () => {
    const result = summarizeQuotationGrandTotal({
      legs: [],
      generalSelections: [{ additionalId: 'add-estadia', value: 300, includeInTotal: false }],
      generalAdditionals: additionals,
      generalIncludeMap: { 'add:add-estadia': false },
    })
    expect(result.generalSum).toBe(0)
    expect(result.generalExcludedLines).toEqual([
      { key: 'add:add-estadia', label: 'Estadia', value: 300 },
    ])
    expect(result.grandTotal).toBe(0)
  })
})
