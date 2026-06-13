import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; error?: string }>
}) {
  const params = await searchParams

  let notice: string | undefined
  if (params.reset === 'ok') {
    notice = 'Senha redefinida com sucesso. Faça login com a nova senha.'
  } else if (params.error === 'invalid_link') {
    notice = undefined
  }

  return <LoginForm notice={notice} />
}
