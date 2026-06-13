import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

export type Profile = {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

/**
 * Retorna o perfil do usuário autenticado (auth + linha em public.users),
 * ou null se não houver sessão válida.
 *
 * Usa getUser(), que revalida o token junto ao Supabase — não confie em
 * getSession() para autorização no servidor.
 */
export async function getSessionProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, role, active')
    .eq('id', user.id)
    .single()

  return (profile as Profile | null) ?? null
}
