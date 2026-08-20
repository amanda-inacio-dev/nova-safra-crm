import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Rotas de API (ex.: /api/cron/*) ficam de fora: cuidam da própria
  // autenticação (ex.: CRON_SECRET) e nunca devem ser redirecionadas para
  // /login — um redirect não faz sentido pra quem espera uma resposta JSON,
  // e derrubaria a chamada automática da Vercel Cron antes de chegar no código.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
