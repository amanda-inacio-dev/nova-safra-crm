import { describe, it, expect } from 'vitest'
import { validateOperation } from './operation'

describe('validateOperation', () => {
  it('aceita Importação > DTA > Desova', () => {
    expect(
      validateOperation({ operationType: 'IMPORTACAO', subtype: 'DTA', detail: 'DESOVA' }).ok
    ).toBe(true)
  })

  it('rejeita DTA sem detalhe', () => {
    expect(validateOperation({ operationType: 'IMPORTACAO', subtype: 'DTA', detail: '' }).ok).toBe(
      false
    )
  })

  it('aceita Importação > DTA+DI > Sobre rodas', () => {
    expect(
      validateOperation({ operationType: 'IMPORTACAO', subtype: 'DTA_DI', detail: 'SOBRE_RODAS' })
        .ok
    ).toBe(true)
  })

  it('rejeita DTA+DI sem detalhe da DTA', () => {
    expect(
      validateOperation({ operationType: 'IMPORTACAO', subtype: 'DTA_DI', detail: '' }).ok
    ).toBe(false)
  })

  it('aceita Importação > DI sem detalhe', () => {
    expect(validateOperation({ operationType: 'IMPORTACAO', subtype: 'DI', detail: '' }).ok).toBe(
      true
    )
  })

  it('exige texto livre em Importação > Outro', () => {
    expect(
      validateOperation({ operationType: 'IMPORTACAO', subtype: 'OUTRO', detail: '' }).ok
    ).toBe(false)
    expect(
      validateOperation({ operationType: 'IMPORTACAO', subtype: 'OUTRO', detail: 'Especial' }).ok
    ).toBe(true)
  })

  it('aceita Exportação > Operação direta', () => {
    expect(
      validateOperation({ operationType: 'EXPORTACAO', subtype: 'DIRETA', detail: '' }).ok
    ).toBe(true)
  })

  it('exige cidade em Exportação > Operação com mapa', () => {
    expect(
      validateOperation({ operationType: 'EXPORTACAO', subtype: 'COM_MAPA', detail: '' }).ok
    ).toBe(false)
    expect(
      validateOperation({ operationType: 'EXPORTACAO', subtype: 'COM_MAPA', detail: 'Varginha' }).ok
    ).toBe(true)
  })

  it('rejeita sem tipo de operação', () => {
    expect(validateOperation({ operationType: '', subtype: '', detail: '' }).ok).toBe(false)
  })
})
