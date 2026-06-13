import type { UserRole } from '@/types'

export type ProfileLike = {
  role: UserRole
  active: boolean
}

/** Verifica se um role está dentro da lista de roles permitidos. */
export function hasRequiredRole(
  role: UserRole | null | undefined,
  allowed: readonly UserRole[]
): boolean {
  if (!role) return false
  return allowed.includes(role)
}

/**
 * Regra única de autorização usada nas rotas protegidas:
 * o perfil precisa existir, estar ativo e ter um role permitido.
 */
export function isAuthorized(
  profile: ProfileLike | null | undefined,
  allowed: readonly UserRole[]
): boolean {
  if (!profile) return false
  if (!profile.active) return false
  return hasRequiredRole(profile.role, allowed)
}
