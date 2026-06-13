import { describe, it, expect } from 'vitest'
import { validateCnpj, formatCnpj } from './cnpj'

describe('validateCnpj', () => {
  it('aceita CNPJ válido sem máscara', () => {
    expect(validateCnpj('11222333000181')).toBe(true)
  })

  it('aceita CNPJ válido com máscara', () => {
    expect(validateCnpj('11.222.333/0001-81')).toBe(true)
  })

  it('rejeita dígitos verificadores incorretos', () => {
    expect(validateCnpj('11222333000182')).toBe(false)
  })

  it('rejeita comprimento inválido', () => {
    expect(validateCnpj('1122233300018')).toBe(false)
    expect(validateCnpj('')).toBe(false)
  })

  it('rejeita sequências repetidas', () => {
    expect(validateCnpj('00000000000000')).toBe(false)
    expect(validateCnpj('11111111111111')).toBe(false)
  })
})

describe('formatCnpj', () => {
  it('aplica a máscara completa', () => {
    expect(formatCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('aplica máscara parcial conforme digita', () => {
    expect(formatCnpj('11222')).toBe('11.222')
  })

  it('ignora caracteres não numéricos e limita a 14 dígitos', () => {
    expect(formatCnpj('11.222.333/0001-8199')).toBe('11.222.333/0001-81')
  })
})
