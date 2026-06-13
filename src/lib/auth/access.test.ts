import { describe, it, expect } from 'vitest'
import { isPublicPath, shouldRedirectToLogin } from './access'

describe('isPublicPath', () => {
  it('reconhece rotas públicas de autenticação', () => {
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/forgot-password')).toBe(true)
    expect(isPublicPath('/reset-password')).toBe(true)
    expect(isPublicPath('/auth/confirm')).toBe(true)
  })

  it('reconhece o portal público do cliente', () => {
    expect(isPublicPath('/cotacao/abc-123')).toBe(true)
  })

  it('trata rotas protegidas como não públicas', () => {
    expect(isPublicPath('/')).toBe(false)
    expect(isPublicPath('/admin/users')).toBe(false)
  })

  it('não confunde prefixos parecidos', () => {
    expect(isPublicPath('/logout-secreto')).toBe(false)
  })
})

describe('shouldRedirectToLogin', () => {
  it('redireciona usuário sem sessão em rota protegida (token inválido/ausente)', () => {
    expect(shouldRedirectToLogin('/', false)).toBe(true)
    expect(shouldRedirectToLogin('/admin/users', false)).toBe(true)
  })

  it('não redireciona usuário sem sessão em rota pública', () => {
    expect(shouldRedirectToLogin('/login', false)).toBe(false)
  })

  it('nunca redireciona usuário autenticado', () => {
    expect(shouldRedirectToLogin('/', true)).toBe(false)
    expect(shouldRedirectToLogin('/admin/users', true)).toBe(false)
  })
})
