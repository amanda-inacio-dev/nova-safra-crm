import { describe, it, expect } from 'vitest'
import {
  hasRevisionEvent,
  statusDisplayLabel,
  statusColorClass,
  displayStatusColor,
  STAFF_DISPLAY_STATUSES,
} from './status-label'

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

describe('cores dos status', () => {
  it('NENHUMA cor se repete entre os 10 estados', () => {
    const cores = STAFF_DISPLAY_STATUSES.map(displayStatusColor)
    expect(new Set(cores).size).toBe(STAFF_DISPLAY_STATUSES.length)
  })

  it('todo estado tem cor definida', () => {
    for (const estado of STAFF_DISPLAY_STATUSES) {
      expect(displayStatusColor(estado)).toBeTruthy()
    }
  })

  it('concluída é verde e recusada é vermelha', () => {
    expect(displayStatusColor('CONCLUIDA')).toContain('green')
    expect(displayStatusColor('REPROVADA')).toContain('red')
  })

  it('aprovada tem fundo preenchido, para saltar aos olhos', () => {
    // Os demais estados usam tons claros (100); aprovada e concluída são sólidas.
    expect(displayStatusColor('APROVADA')).toMatch(/bg-[a-z]+-(400|500|600|700)/)
  })

  it('revisão solicitada (esperando alguém agir) usa laranja', () => {
    expect(statusColorClass('APROVADA', true, false)).toContain('orange')
    expect(statusColorClass('APROVADA', true, true)).toContain('orange')
  })

  it('cor não muda por perfil — só o texto muda', () => {
    for (const status of ['ENCAMINHADA', 'CONCLUIDA', 'APROVADA'] as const) {
      expect(statusColorClass(status, false, true)).toBe(statusColorClass(status, false, false))
    }
  })
})
