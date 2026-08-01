import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { NotificationType } from '@/types'

/** Cria a notificação in-app de um usuário — nunca para usuário desativado
 *  (a notificação simplesmente não é criada, sem erro). Usa a service_role
 *  porque quem dispara isso geralmente é o portal público do cliente (sem
 *  sessão de staff) ou uma Server Action que já validou tudo que precisava. */
export async function notifyUser(params: {
  userId: string
  quotationId: string
  type: NotificationType
}): Promise<void> {
  const admin = createAdminClient()

  const { data: user } = await admin
    .from('users')
    .select('active')
    .eq('id', params.userId)
    .maybeSingle()
  if (!user?.active) return

  await admin.from('notifications').insert({
    user_id: params.userId,
    quotation_id: params.quotationId,
    type: params.type,
  })
}
