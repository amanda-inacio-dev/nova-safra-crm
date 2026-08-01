import { describe, it, expect } from 'vitest'
import {
  resolvePeriod,
  parseLocalDate,
  toDateInput,
  summarizeQuotations,
  monthlyCounts,
  formatPercent,
  type MetricsRow,
} from './metrics'
import type { QuotationStatus } from '@/types'

/** Data local (não UTC), pra bater com o que o usuário vê no navegador. */
function local(y: number, m: number, d: number, h = 12): string {
  return new Date(y, m - 1, d, h).toISOString()
}

function row(status: QuotationStatus, createdAt: string): MetricsRow {
  return { status, created_at: createdAt }
}

describe('parseLocalDate', () => {
  it('interpreta yyyy-mm-dd no fuso local, não em UTC', () => {
    const date = parseLocalDate('2026-07-31')!
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(31)
    expect(date.getHours()).toBe(0)
  })

  it('endOfDay leva pro último milissegundo do dia', () => {
    const date = parseLocalDate('2026-07-31', true)!
    expect(date.getHours()).toBe(23)
    expect(date.getMinutes()).toBe(59)
    expect(date.getMilliseconds()).toBe(999)
  })

  it('rejeita formato inválido', () => {
    expect(parseLocalDate('31/07/2026')).toBeNull()
    expect(parseLocalDate('')).toBeNull()
  })
})

describe('toDateInput', () => {
  it('formata com zero à esquerda', () => {
    expect(toDateInput(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('resolvePeriod', () => {
  const now = new Date(2026, 6, 31, 15, 0, 0) // 31/07/2026

  it('padrão é o último ano quando não vem preset', () => {
    const period = resolvePeriod({}, now)
    expect(period.preset).toBe('ANO')
    expect(period.fromInput).toBe('2025-07-31')
    expect(period.toInput).toBe('2026-07-31')
  })

  it('MES recua um mês', () => {
    expect(resolvePeriod({ preset: 'MES' }, now).fromInput).toBe('2026-06-30')
  })

  it('TRIMESTRE recua três meses', () => {
    expect(resolvePeriod({ preset: 'TRIMESTRE' }, now).fromInput).toBe('2026-04-30')
  })

  it('não estoura o fim do mês ao recuar (31/03 - 1 mês = 28/02)', () => {
    const marco = new Date(2026, 2, 31, 10)
    expect(resolvePeriod({ preset: 'MES' }, marco).fromInput).toBe('2026-02-28')
  })

  it('PERSONALIZADO usa as datas informadas', () => {
    const period = resolvePeriod(
      { preset: 'PERSONALIZADO', from: '2026-01-01', to: '2026-03-31' },
      now
    )
    expect(period.preset).toBe('PERSONALIZADO')
    expect(period.fromInput).toBe('2026-01-01')
    expect(period.toInput).toBe('2026-03-31')
    expect(period.to.getHours()).toBe(23)
  })

  it('PERSONALIZADO incompleto ou invertido cai no padrão de 1 ano', () => {
    expect(resolvePeriod({ preset: 'PERSONALIZADO', from: '2026-01-01' }, now).preset).toBe('ANO')
    expect(
      resolvePeriod({ preset: 'PERSONALIZADO', from: '2026-05-01', to: '2026-01-01' }, now).preset
    ).toBe('ANO')
  })

  it('preset desconhecido cai no padrão em vez de quebrar', () => {
    expect(resolvePeriod({ preset: 'SEMANA' }, now).preset).toBe('ANO')
  })
})

describe('summarizeQuotations', () => {
  it('zera tudo sem cotações', () => {
    const m = summarizeQuotations([])
    expect(m.total).toBe(0)
    expect(m.approvalRate).toBeNull()
    expect(m.conclusionRate).toBeNull()
  })

  it('conta cada status no card certo', () => {
    const m = summarizeQuotations([
      row('RASCUNHO', local(2026, 7, 1)),
      row('PRONTA', local(2026, 7, 2)),
      row('AGUARDANDO_CLIENTE', local(2026, 7, 3)),
      row('APROVADA', local(2026, 7, 4)),
      row('REPROVADA', local(2026, 7, 5)),
      row('ENCAMINHADA', local(2026, 7, 6)),
      row('CONCLUIDA', local(2026, 7, 7)),
    ])
    expect(m.total).toBe(7)
    expect(m.open).toBe(3)
    expect(m.rejected).toBe(1)
    expect(m.forwarded).toBe(1)
    expect(m.concluded).toBe(1)
  })

  it('aprovada que avançou (encaminhada/concluída) continua contando como aprovada', () => {
    const m = summarizeQuotations([
      row('APROVADA', local(2026, 7, 4)),
      row('ENCAMINHADA', local(2026, 7, 6)),
      row('CONCLUIDA', local(2026, 7, 7)),
    ])
    expect(m.approved).toBe(3)
  })

  it('taxa de aprovação ignora as que ainda estão em aberto', () => {
    const m = summarizeQuotations([
      row('APROVADA', local(2026, 7, 4)),
      row('APROVADA', local(2026, 7, 5)),
      row('APROVADA', local(2026, 7, 6)),
      row('REPROVADA', local(2026, 7, 7)),
      row('RASCUNHO', local(2026, 7, 8)),
      row('AGUARDANDO_CLIENTE', local(2026, 7, 9)),
    ])
    expect(m.approvalRate).toBe(75)
  })

  it('taxa sobre enviadas conta a que o cliente não respondeu (5 de 6 = 83,3%)', () => {
    const m = summarizeQuotations([
      row('APROVADA', local(2026, 7, 1)),
      row('APROVADA', local(2026, 7, 2)),
      row('APROVADA', local(2026, 7, 3)),
      row('ENCAMINHADA', local(2026, 7, 4)),
      row('CONCLUIDA', local(2026, 7, 5)),
      row('AGUARDANDO_CLIENTE', local(2026, 7, 6)),
    ])
    expect(m.sent).toBe(6)
    expect(m.approved).toBe(5)
    expect(m.pendingClient).toBe(1)
    // Sobre respondidas seria 100% — sobre enviadas, não.
    expect(m.approvalRate).toBe(100)
    expect(formatPercent(m.approvalRateOnSent)).toBe('83,3%')
  })

  it('rascunho e pronta não entram em nenhuma das duas taxas (nunca foram ao cliente)', () => {
    const m = summarizeQuotations([
      row('APROVADA', local(2026, 7, 1)),
      row('RASCUNHO', local(2026, 7, 2)),
      row('PRONTA', local(2026, 7, 3)),
    ])
    expect(m.sent).toBe(1)
    expect(m.approvalRate).toBe(100)
    expect(m.approvalRateOnSent).toBe(100)
  })

  it('recusada também puxa a taxa sobre enviadas pra baixo', () => {
    const m = summarizeQuotations([
      row('APROVADA', local(2026, 7, 1)),
      row('APROVADA', local(2026, 7, 2)),
      row('REPROVADA', local(2026, 7, 3)),
      row('AGUARDANDO_CLIENTE', local(2026, 7, 4)),
    ])
    expect(m.decided).toBe(3)
    expect(m.sent).toBe(4)
    expect(m.approvalRate).toBeCloseTo(66.667, 2)
    expect(m.approvalRateOnSent).toBe(50)
  })

  it('sem nenhuma enviada, as duas taxas ficam nulas', () => {
    const m = summarizeQuotations([row('RASCUNHO', local(2026, 7, 1))])
    expect(m.approvalRate).toBeNull()
    expect(m.approvalRateOnSent).toBeNull()
  })

  it('byStatus conta cada status separado, com zero nos ausentes', () => {
    const m = summarizeQuotations([
      row('ENCAMINHADA', local(2026, 7, 1)),
      row('ENCAMINHADA', local(2026, 7, 2)),
      row('APROVADA', local(2026, 7, 3)),
      row('CONCLUIDA', local(2026, 7, 4)),
    ])
    // Na visão da Operação, APROVADA visível = devolvida pro Comercial revisar.
    expect(m.byStatus.APROVADA).toBe(1)
    expect(m.byStatus.ENCAMINHADA).toBe(2)
    expect(m.byStatus.CONCLUIDA).toBe(1)
    expect(m.byStatus.REPROVADA).toBe(0)
    expect(m.byStatus.RASCUNHO).toBe(0)
  })

  it('byStatus vem zerado quando não há cotação', () => {
    expect(summarizeQuotations([]).byStatus).toEqual({
      RASCUNHO: 0,
      PRONTA: 0,
      AGUARDANDO_CLIENTE: 0,
      APROVADA: 0,
      REPROVADA: 0,
      ENCAMINHADA: 0,
      CONCLUIDA: 0,
    })
  })

  it('taxa de conclusão é concluídas sobre aprovadas', () => {
    const m = summarizeQuotations([
      row('CONCLUIDA', local(2026, 7, 1)),
      row('ENCAMINHADA', local(2026, 7, 2)),
      row('REPROVADA', local(2026, 7, 3)),
    ])
    expect(m.conclusionRate).toBe(50)
  })
})

describe('monthlyCounts', () => {
  it('inclui meses sem nenhuma cotação', () => {
    const buckets = monthlyCounts(
      [row('APROVADA', local(2026, 1, 15)), row('RASCUNHO', local(2026, 3, 2))],
      new Date(2026, 0, 1),
      new Date(2026, 2, 31, 23, 59)
    )
    expect(buckets.map((b) => b.key)).toEqual(['2026-01', '2026-02', '2026-03'])
    expect(buckets.map((b) => b.count)).toEqual([1, 0, 1])
  })

  it('rotula como mes/ano abreviado', () => {
    const buckets = monthlyCounts([], new Date(2026, 6, 1), new Date(2026, 6, 31))
    expect(buckets[0].label).toBe('jul/26')
  })

  it('agrupa várias no mesmo mês', () => {
    const buckets = monthlyCounts(
      [
        row('APROVADA', local(2026, 7, 1)),
        row('APROVADA', local(2026, 7, 20)),
        row('REPROVADA', local(2026, 7, 31)),
      ],
      new Date(2026, 6, 1),
      new Date(2026, 6, 31, 23, 59)
    )
    expect(buckets).toHaveLength(1)
    expect(buckets[0].count).toBe(3)
  })

  it('ignora cotação fora do intervalo e data inválida', () => {
    const buckets = monthlyCounts(
      [row('APROVADA', local(2025, 12, 20)), row('APROVADA', 'data-invalida')],
      new Date(2026, 0, 1),
      new Date(2026, 0, 31)
    )
    expect(buckets[0].count).toBe(0)
  })
})

describe('formatPercent', () => {
  it('usa vírgula decimal e sufixo %', () => {
    expect(formatPercent(66.666)).toBe('66,7%')
    expect(formatPercent(100)).toBe('100,0%')
  })

  it('null vira travessão', () => {
    expect(formatPercent(null)).toBe('—')
  })
})
