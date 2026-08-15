import { describe, it, expect } from 'vitest'
import { isEligibleForResponseAlert, type ResponseAlertInput } from './response-alert'

const base: ResponseAlertInput = {
  status: 'AGUARDANDO_CLIENTE',
  alertEnabled: true,
  alertDays: 3,
  sentToClientAt: '2026-08-01T12:00:00.000Z',
  alertSentAt: null,
  hasClientCommentSinceSent: false,
  now: new Date('2026-08-04T12:00:00.000Z'), // exatamente 3 dias depois
}

describe('isEligibleForResponseAlert', () => {
  it('elegível quando o prazo configurado já passou', () => {
    expect(isEligibleForResponseAlert(base)).toBe(true)
  })

  it('não elegível antes do prazo', () => {
    expect(isEligibleForResponseAlert({ ...base, now: new Date('2026-08-03T12:00:00.000Z') })).toBe(
      false
    )
  })

  it('não elegível se o alerta não foi habilitado no envio', () => {
    expect(isEligibleForResponseAlert({ ...base, alertEnabled: false })).toBe(false)
  })

  it('não elegível se o alerta já foi disparado antes (evita duplicar)', () => {
    expect(isEligibleForResponseAlert({ ...base, alertSentAt: '2026-08-04T12:00:00.000Z' })).toBe(
      false
    )
  })

  it('não elegível fora do status AGUARDANDO_CLIENTE', () => {
    expect(isEligibleForResponseAlert({ ...base, status: 'APROVADA' })).toBe(false)
  })

  it('não elegível se o cliente comentou depois do envio', () => {
    expect(isEligibleForResponseAlert({ ...base, hasClientCommentSinceSent: true })).toBe(false)
  })

  it('não elegível sem dias configurados ou sem data de envio', () => {
    expect(isEligibleForResponseAlert({ ...base, alertDays: null })).toBe(false)
    expect(isEligibleForResponseAlert({ ...base, sentToClientAt: null })).toBe(false)
  })
})
