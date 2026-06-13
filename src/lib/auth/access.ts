/**
 * Rotas públicas — acessíveis sem autenticação.
 * Tudo que não está nesta lista exige um usuário logado.
 */
const PUBLIC_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/auth', // callbacks de e-mail (confirmação, recuperação de senha)
  '/cotacao', // portal público do cliente via token (issue #08)
] as const

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * Decide se a requisição deve ser redirecionada para /login.
 * Usuário não autenticado só pode acessar rotas públicas.
 */
export function shouldRedirectToLogin(pathname: string, hasUser: boolean): boolean {
  if (hasUser) return false
  return !isPublicPath(pathname)
}
