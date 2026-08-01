import { describe, it, expect } from 'vitest'
import { hasRevisionEvent, statusDisplayLabel, statusColorClass } from './status-label'

describe('hasRevisionEvent', () => {
  it('false quando não há evento de revisão', () => {
    expect(hasRevisionEvent([])).toBe(false)
    expect(hasRevisionEvent([{ type: 'FORWARDED' }, { type: 'COMMENTED' }])).toBe(false)
  })

  it('true quando existe pelo menos um REVISION_REQUESTED', () => {
    expect(hasRevisionEvent([{ type: 'FORWARDED' }, { type: 'REVISION_REQUESTED' }])).toBe(true)
  })
})

describe('statusDisplayLabel — Comercial', () => {
  it('AGUARDANDO_CLIENTE mostra "Encaminhada ao cliente"', () => {
    expect(statusDisplayLabel('AGUARDANDO_CLIENTE', false, false)).toBe('Encaminhada ao cliente')
  })

  it('REPROVADA mostra "Recusada"', () => {
    expect(statusDisplayLabel('REPROVADA', false, false)).toBe('Recusada')
  })

  it('APROVADA sem revisão mostra "Aprovada"', () => {
    expect(statusDisplayLabel('APROVADA', false, false)).toBe('Aprovada')
  })

  it('APROVADA por causa de revisão pedida pela Operação mostra "Revisão solicitada"', () => {
    expect(statusDisplayLabel('APROVADA', true, false)).toBe('Revisão solicitada')
  })

  it('ENCAMINHADA pela 1ª vez mostra "Encaminhada para a operação"', () => {
    expect(statusDisplayLabel('ENCAMINHADA', false, false)).toBe('Encaminhada para a operação')
  })

  it('ENCAMINHADA de novo após revisão mostra "Revisão enviada"', () => {
    expect(statusDisplayLabel('ENCAMINHADA', true, false)).toBe('Revisão enviada')
  })

  it('CONCLUIDA mostra "Concluída"', () => {
    expect(statusDisplayLabel('CONCLUIDA', true, false)).toBe('Concluída')
  })
})

describe('statusDisplayLabel — Operação', () => {
  it('ENCAMINHADA pela 1ª vez mostra "Aberta"', () => {
    expect(statusDisplayLabel('ENCAMINHADA', false, true)).toBe('Aberta')
  })

  it('ENCAMINHADA de novo, após pedir revisão, mostra "Revisão realizada"', () => {
    expect(statusDisplayLabel('ENCAMINHADA', true, true)).toBe('Revisão realizada')
  })

  it('CONCLUIDA mostra "Concluída"', () => {
    expect(statusDisplayLabel('CONCLUIDA', true, true)).toBe('Concluída')
  })

  it('APROVADA depois dela mesma pedir revisão mostra "Revisão solicitada" (continua visível)', () => {
    expect(statusDisplayLabel('APROVADA', true, true)).toBe('Revisão solicitada')
  })

  it('APROVADA sem revisão usa o rótulo padrão (não deveria nem aparecer pra Operação)', () => {
    expect(statusDisplayLabel('APROVADA', false, true)).toBe('Aprovada')
  })

  it('demais status usam o rótulo padrão', () => {
    expect(statusDisplayLabel('RASCUNHO', true, true)).toBe('Rascunho')
    expect(statusDisplayLabel('REPROVADA', true, true)).toBe('Recusada')
  })
})

describe('statusColorClass — Comercial', () => {
  it('cada status base tem sua própria cor', () => {
    expect(statusColorClass('RASCUNHO', false, false)).toBe('bg-slate-100 text-slate-600')
    expect(statusColorClass('PRONTA', false, false)).toBe('bg-sky-50 text-sky-700')
    expect(statusColorClass('AGUARDANDO_CLIENTE', false, false)).toBe(
      'bg-indigo-50 text-indigo-700'
    )
    expect(statusColorClass('APROVADA', false, false)).toBe('bg-emerald-50 text-emerald-700')
    expect(statusColorClass('REPROVADA', false, false)).toBe('bg-red-50 text-red-700')
    expect(statusColorClass('ENCAMINHADA', false, false)).toBe('bg-blue-50 text-blue-700')
    expect(statusColorClass('CONCLUIDA', false, false)).toBe('bg-green-100 text-green-700')
  })

  it('"Revisão solicitada" (APROVADA revisada) usa laranja', () => {
    expect(statusColorClass('APROVADA', true, false)).toBe('bg-orange-50 text-orange-700')
  })

  it('"Revisão enviada" (ENCAMINHADA revisada) usa ciano', () => {
    expect(statusColorClass('ENCAMINHADA', true, false)).toBe('bg-cyan-50 text-cyan-700')
  })
})

describe('statusColorClass — Operação', () => {
  it('"Aberta" (ENCAMINHADA 1ª vez) usa a cor padrão de ENCAMINHADA', () => {
    expect(statusColorClass('ENCAMINHADA', false, true)).toBe('bg-blue-50 text-blue-700')
  })

  it('"Revisão realizada" (ENCAMINHADA revisada) usa ciano', () => {
    expect(statusColorClass('ENCAMINHADA', true, true)).toBe('bg-cyan-50 text-cyan-700')
  })

  it('"Revisão solicitada" (APROVADA revisada) usa laranja', () => {
    expect(statusColorClass('APROVADA', true, true)).toBe('bg-orange-50 text-orange-700')
  })

  it('demais status usam a cor padrão', () => {
    expect(statusColorClass('APROVADA', false, true)).toBe('bg-emerald-50 text-emerald-700')
    expect(statusColorClass('CONCLUIDA', true, true)).toBe('bg-green-100 text-green-700')
  })
})
