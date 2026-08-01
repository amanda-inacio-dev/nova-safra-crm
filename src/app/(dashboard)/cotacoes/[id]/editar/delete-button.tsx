'use client'

import { useState, useTransition } from 'react'
import { deleteQuotation } from '../../actions'

export function DeleteQuotationButton({ quotationId }: { quotationId: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  function handleDelete() {
    if (!window.confirm('Excluir esta cotação? Essa ação não pode ser desfeita.')) return
    setError(undefined)
    startTransition(async () => {
      const res = await deleteQuotation(quotationId)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? 'Excluindo…' : 'Excluir cotação'}
      </button>
    </div>
  )
}
