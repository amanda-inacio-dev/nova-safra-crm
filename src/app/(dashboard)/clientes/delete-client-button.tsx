'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClientAction } from './actions'

/**
 * Exclusão de cliente — aparece só para Admin.
 *
 * Pede confirmação (a ação é definitiva) e mostra o motivo na própria linha
 * quando o servidor recusa, que é o caso comum: cliente com cotações.
 */
export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm(`Excluir o cliente "${name}"? Esta ação não pode ser desfeita.`)) return
    setError(undefined)
    start(async () => {
      const res = await deleteClientAction(id)
      if (res.error) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
      >
        {pending ? 'Excluindo…' : 'Excluir'}
      </button>
      {error && <p className="mt-1 max-w-[220px] text-xs text-red-600">{error}</p>}
    </>
  )
}
