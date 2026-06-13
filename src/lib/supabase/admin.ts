import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com a service_role key.
 *
 * ATENÇÃO: ignora as políticas de RLS e tem acesso total ao banco.
 * Use SOMENTE no servidor (Server Actions / Route Handlers) e SEMPRE
 * depois de validar que o usuário atual tem permissão (ex.: ADMIN).
 * Nunca importe este arquivo em componentes de cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
