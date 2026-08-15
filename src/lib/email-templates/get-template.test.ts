import { describe, it, expect } from 'vitest'
import { resolveEmailTemplate, type EmailTemplate } from './resolve-template'

const fallback: EmailTemplate = {
  subject: 'Assunto padrão',
  body: 'Texto padrão',
  imageUrl: null,
}

describe('resolveEmailTemplate', () => {
  it('usa o texto de fábrica quando não há linha no banco', () => {
    expect(resolveEmailTemplate(null, fallback)).toEqual(fallback)
  })

  it('usa o texto customizado quando a linha existe e está preenchida', () => {
    const row = { subject: 'Assunto customizado', body: 'Texto customizado', image_url: 'foo.png' }
    expect(resolveEmailTemplate(row, fallback)).toEqual({
      subject: 'Assunto customizado',
      body: 'Texto customizado',
      imageUrl: 'foo.png',
    })
  })

  it('cai no texto de fábrica campo a campo quando algo ficou vazio', () => {
    const row = { subject: '   ', body: 'Só o corpo foi customizado', image_url: null }
    expect(resolveEmailTemplate(row, fallback)).toEqual({
      subject: fallback.subject,
      body: 'Só o corpo foi customizado',
      imageUrl: null,
    })
  })

  it('mantém a imagem de fábrica quando nenhuma foi enviada', () => {
    const withImageFallback: EmailTemplate = { ...fallback, imageUrl: 'default.png' }
    const row = { subject: 'X', body: 'Y', image_url: null }
    expect(resolveEmailTemplate(row, withImageFallback).imageUrl).toBe('default.png')
  })
})
