'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getMyNotifications,
  markNotificationRead,
  type NotificationItem,
} from './notification-actions'
import type { NotificationType } from '@/types'

const NOTIFICATION_TEXT: Record<NotificationType, (code: string) => string> = {
  CLIENT_APPROVED: (code) => `Cliente aprovou a cotação ${code}`,
  CLIENT_REJECTED: (code) => `Cliente reprovou a cotação ${code}`,
  CLIENT_COMMENTED: (code) => `Cliente comentou na cotação ${code}`,
  FORWARDED_TO_OPERATION: (code) => `Cotação ${code} recebida`,
  REVISION_REQUESTED: (code) => `Revisão solicitada na cotação ${code}`,
  QUOTATION_CLOSED: (code) => `Cotação ${code} concluída — CT-e anexado`,
}

/** Sem infraestrutura de realtime no projeto ainda — um polling simples a cada
 *  45s é suficiente pro volume de uso atual (não é um chat, é um aviso). */
const POLL_MS = 45_000

export function NotificationBell({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const unreadCount = items.filter((n) => !n.read).length

  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(async () => {
        const fresh = await getMyNotifications()
        setItems(fresh)
      })
    }, POLL_MS)
    return () => clearInterval(interval)
  }, [])

  function handleClick(n: NotificationItem) {
    setOpen(false)
    if (!n.read) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, read: true } : i)))
      startTransition(() => markNotificationRead(n.id))
    }
    router.push(`/cotacoes/${n.quotation_id}/revisar`)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        aria-label="Notificações"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.6}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Notificações</p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">
                  Nenhuma notificação ainda.
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      n.read ? 'text-slate-500' : 'bg-brand-50/40 font-medium text-slate-900'
                    }`}
                  >
                    <span className="block">
                      {NOTIFICATION_TEXT[n.type](n.quotation_code ?? '')}
                    </span>
                    <span className="mt-0.5 block text-xs font-normal text-slate-400">
                      {new Date(n.created_at).toLocaleString('pt-BR')}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
