'use server'

import { requireUser } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import type { NotificationType } from '@/types'

export type NotificationItem = {
  id: string
  type: NotificationType
  read: boolean
  created_at: string
  quotation_id: string
  quotation_code: string | null
}

type NotificationRow = {
  id: string
  type: NotificationType
  read: boolean
  created_at: string
  quotation_id: string
  quotation: { code: string | null } | null
}

/** Notificações do usuário logado (mais recentes primeiro) — usado tanto na
 *  primeira carga (layout) quanto no polling do sino. */
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const profile = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('notifications')
    .select('id, type, read, created_at, quotation_id, quotation:quotations(code)')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return ((data ?? []) as unknown as NotificationRow[]).map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    created_at: n.created_at,
    quotation_id: n.quotation_id,
    quotation_code: n.quotation?.code ?? null,
  }))
}

/** Marca uma notificação como lida — RLS já garante que só afeta a própria. */
export async function markNotificationRead(id: string): Promise<void> {
  await requireUser()
  const supabase = await createClient()
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}
