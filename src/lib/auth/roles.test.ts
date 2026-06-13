import { describe, it, expect } from 'vitest'
import { hasRequiredRole, isAuthorized } from './roles'

describe('hasRequiredRole', () => {
  it('aceita um role presente na lista de permitidos', () => {
    expect(hasRequiredRole('ADMIN', ['ADMIN', 'COMMERCIAL'])).toBe(true)
  })

  it('rejeita um role ausente da lista', () => {
    expect(hasRequiredRole('OPERATION', ['ADMIN', 'COMMERCIAL'])).toBe(false)
  })

  it('rejeita role nulo ou indefinido', () => {
    expect(hasRequiredRole(null, ['ADMIN'])).toBe(false)
    expect(hasRequiredRole(undefined, ['ADMIN'])).toBe(false)
  })
})

describe('isAuthorized', () => {
  it('autoriza usuário ativo com role permitido', () => {
    expect(isAuthorized({ role: 'COMMERCIAL', active: true }, ['COMMERCIAL'])).toBe(true)
  })

  it('bloqueia usuário desativado mesmo com role permitido', () => {
    expect(isAuthorized({ role: 'ADMIN', active: false }, ['ADMIN'])).toBe(false)
  })

  it('bloqueia role não permitido (controle de acesso por perfil)', () => {
    expect(isAuthorized({ role: 'OPERATION', active: true }, ['ADMIN', 'COMMERCIAL'])).toBe(false)
  })

  it('bloqueia perfil inexistente (sem sessão)', () => {
    expect(isAuthorized(null, ['ADMIN'])).toBe(false)
  })
})
