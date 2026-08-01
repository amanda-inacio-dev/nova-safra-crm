'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/types'

export type UserActionState = {
  error?: string
  success?: string
}

const VALID_ROLES: UserRole[] = ['ADMIN', 'COMMERCIAL', 'OPERATION']

function parseRole(value: FormDataEntryValue | null): UserRole | null {
  const v = String(value ?? '')
  return VALID_ROLES.includes(v as UserRole) ? (v as UserRole) : null
}

/** Cria um novo usuário (Auth + perfil via trigger). Somente ADMIN. */
export async function createUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireRole(['ADMIN'])

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const role = parseRole(formData.get('role'))

  if (!name || !email) return { error: 'Nome e e-mail são obrigatórios.' }
  if (!role) return { error: 'Selecione um perfil válido.' }
  if (password.length < 8) return { error: 'A senha deve ter pelo menos 8 caracteres.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Já existe um usuário com este e-mail.' }
    }
    return { error: 'Não foi possível criar o usuário. Tente novamente.' }
  }

  revalidatePath('/admin/users')
  return { success: `Usuário ${name} criado com sucesso.` }
}

/** Atualiza nome, e-mail e perfil de um usuário existente. Somente ADMIN. */
export async function updateUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const role = parseRole(formData.get('role'))

  if (!id) return { error: 'Usuário inválido.' }
  if (!name) return { error: 'O nome é obrigatório.' }
  if (!email) return { error: 'O e-mail é obrigatório.' }
  if (!role) return { error: 'Selecione um perfil válido.' }

  const admin = createAdminClient()

  const { error: authError } = await admin.auth.admin.updateUserById(id, { email })
  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      return { error: 'Já existe um usuário com este e-mail.' }
    }
    return { error: 'Não foi possível atualizar o e-mail.' }
  }

  const { error } = await admin.from('users').update({ name, email, role }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar as alterações.' }

  revalidatePath('/admin/users')
  return { success: 'Alterações salvas.' }
}

/**
 * Define uma nova senha para o login de um usuário. Não é possível redefinir a
 * senha de OUTRO administrador (só a própria) — evita que um admin assuma a
 * conta de outro admin. Não existe forma de "ver" a senha atual — o Supabase
 * (como qualquer sistema de login sério) só guarda a senha de forma criptografada,
 * de mão única; a única ação possível é definir uma nova. Somente ADMIN.
 */
export async function resetUserPassword(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const currentAdmin = await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const password = String(formData.get('password') ?? '')

  if (!id) return { error: 'Usuário inválido.' }
  if (password.length < 8) return { error: 'A senha deve ter pelo menos 8 caracteres.' }

  const admin = createAdminClient()

  if (id !== currentAdmin.id) {
    const { data: target } = await admin.from('users').select('role').eq('id', id).maybeSingle()
    if (target?.role === 'ADMIN') {
      return { error: 'Não é possível redefinir a senha de outro administrador.' }
    }
  }

  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) return { error: 'Não foi possível redefinir a senha.' }

  return { success: 'Senha redefinida com sucesso.' }
}

/**
 * Ativa ou desativa um usuário. Desativado é banido no Auth (não consegue logar)
 * e marcado como active=false no perfil. Somente ADMIN.
 */
export async function toggleUserActive(formData: FormData): Promise<void> {
  const currentAdmin = await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const nextActive = String(formData.get('active') ?? '') === 'true'

  if (!id) return
  // Um admin não pode desativar a própria conta
  if (id === currentAdmin.id && !nextActive) return

  const admin = createAdminClient()

  await admin.from('users').update({ active: nextActive }).eq('id', id)
  await admin.auth.admin.updateUserById(id, {
    ban_duration: nextActive ? 'none' : '876000h', // ~100 anos
  })

  revalidatePath('/admin/users')
}
