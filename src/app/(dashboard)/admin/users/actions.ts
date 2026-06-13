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

/** Atualiza nome e perfil de um usuário existente. Somente ADMIN. */
export async function updateUser(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  await requireRole(['ADMIN'])

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const role = parseRole(formData.get('role'))

  if (!id) return { error: 'Usuário inválido.' }
  if (!name) return { error: 'O nome é obrigatório.' }
  if (!role) return { error: 'Selecione um perfil válido.' }

  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ name, role }).eq('id', id)

  if (error) return { error: 'Não foi possível salvar as alterações.' }

  revalidatePath('/admin/users')
  return { success: 'Alterações salvas.' }
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
