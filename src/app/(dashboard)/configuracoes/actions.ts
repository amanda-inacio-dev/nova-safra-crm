'use server'

import { requireUser } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'

export type PasswordState = { error?: string; success?: string }

/**
 * Troca a senha do PRÓPRIO usuário logado — vale para qualquer perfil
 * (Admin, Comercial, Operação), sem depender do administrador.
 *
 * A senha atual é exigida de propósito: sem isso, quem encontrasse um
 * computador com a sessão aberta poderia trocar a senha e tomar a conta.
 * A conferência é feita tentando um login com ela (o Supabase nunca devolve
 * a senha guardada — só é possível verificar autenticando de novo).
 */
export async function changeMyPassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const profile = await requireUser()

  const currentPassword = String(formData.get('current') ?? '')
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (!currentPassword) return { error: 'Informe a senha atual.' }
  if (password.length < 8) return { error: 'A nova senha deve ter pelo menos 8 caracteres.' }
  if (password !== confirm) return { error: 'A confirmação não confere com a nova senha.' }
  if (password === currentPassword) return { error: 'A nova senha é igual à atual.' }

  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'A senha atual está incorreta.' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    console.error('[changeMyPassword] falha ao atualizar a senha:', error)
    return { error: 'Não foi possível alterar a senha. Tente novamente.' }
  }

  return { success: 'Senha alterada com sucesso.' }
}
