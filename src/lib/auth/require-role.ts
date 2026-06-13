import 'server-only'
import { redirect } from 'next/navigation'
import { getSessionProfile, type Profile } from './user'
import { hasRequiredRole } from './roles'
import type { UserRole } from '@/types'

/**
 * Garante que existe um usuário autenticado e ativo.
 * Redireciona para /login caso contrário. Retorna o perfil.
 */
export async function requireUser(): Promise<Profile> {
  const profile = await getSessionProfile()
  if (!profile || !profile.active) {
    redirect('/login')
  }
  return profile
}

/**
 * Garante usuário ativo COM um dos roles permitidos.
 * Redireciona para /login se não autenticado, ou /403 se sem permissão.
 */
export async function requireRole(allowed: readonly UserRole[]): Promise<Profile> {
  const profile = await requireUser()
  if (!hasRequiredRole(profile.role, allowed)) {
    redirect('/403')
  }
  return profile
}
