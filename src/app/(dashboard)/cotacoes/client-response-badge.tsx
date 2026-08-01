'use client'

import { useState } from 'react'

/**
 * Badge de status que sabe mostrar "Comentada" (quando o cliente já comentou mas
 * ainda não aprovou/reprovou formalmente) — clicável, revela o último comentário
 * num popover. Se não houver comentário pendente, é só o badge normal.
 */
export function ClientResponseBadge({
  statusLabel,
  colorClass = 'bg-slate-100 text-slate-600',
  latestComment,
}: {
  statusLabel: string
  /** Classes Tailwind (bg + text) — cada status tem a própria cor, ver status-label.ts. */
  colorClass?: string
  /** Último comentário do cliente enquanto a cotação ainda está aguardando resposta. */
  latestComment: string | null
}) {
  const [open, setOpen] = useState(false)

  if (!latestComment) {
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
        {statusLabel}
      </span>
    )
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
      >
        Comentada
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute z-10 mt-1 w-64 rounded-md border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 shadow-lg"
        >
          <p className="mb-1 font-semibold tracking-wide text-slate-500 uppercase">
            Comentário do cliente
          </p>
          <p>{latestComment}</p>
        </div>
      )}
    </span>
  )
}
