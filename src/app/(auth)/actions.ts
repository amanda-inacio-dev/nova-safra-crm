'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type AuthState = {
  error?: string
  success?: string
}

/** Login com e-mail e senha. Bloqueia usuários desativados. */
export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'E-mail ou senha inválidos.' }
  }

  // Usuário desativado não pode entrar
  const { data: profile } = await supabase
    .from('users')
    .select('active')
    .eq('id', data.user.id)
    .single()

  if (profile && profile.active === false) {
    await supabase.auth.signOut()
    return { error: 'Usuário desativado. Contate o administrador.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

/** Logout e redireciona para a tela de login. */
export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

/** Envia e-mail de recuperação de senha. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) {
    return { error: 'Informe o e-mail.' }
  }

  const origin =
    (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  })

  // Resposta neutra: não revela se o e-mail existe ou não
  return {
    success: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
  }
}

/** Define a nova senha (usuário precisa ter sessão válida vinda do link de recuperação). */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')

  if (password.length < 8) {
    return { error: 'A senha deve ter pelo menos 8 caracteres.' }
  }
  if (password !== confirm) {
    return { error: 'As senhas não conferem.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.' }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: 'Não foi possível atualizar a senha. Tente novamente.' }
  }

  redirect('/login?reset=ok')
}
