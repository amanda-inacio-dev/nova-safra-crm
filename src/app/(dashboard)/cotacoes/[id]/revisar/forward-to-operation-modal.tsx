'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { FormMessage } from '@/components/ui/form-message'
import { forwardToOperation, type OperationUser } from '../operation-actions'

export function ForwardToOperationModal({
  quotationId,
  users,
  open,
  onClose,
}: {
  quotationId: string
  users: OperationUser[]
  open: boolean
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleConfirm() {
    setError(undefined)
    startTransition(async () => {
      const res = await forwardToOperation(quotationId, selected, message)
      if (res?.error) setError(res.error)
      else {
        setSelected([])
        setMessage('')
        onClose()
      }
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Encaminhar para a Operação">
      <div className="flex flex-col gap-3">
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum usuário ativo da Operação cadastrado ainda. Cadastre um em Admin → Usuários.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <label
                key={u.id}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                />
                <span className="font-medium text-slate-800">{u.name}</span>
                <span className="text-slate-400">{u.email}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="forward-message" className="text-sm font-medium text-slate-700">
            Mensagem para a Operação (opcional)
          </label>
          <Textarea
            id="forward-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ex.: Fiquem atentos ao prazo de retirada do container."
          />
        </div>

        {error && <FormMessage type="error">{error}</FormMessage>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <Button onClick={handleConfirm} disabled={pending || selected.length === 0}>
            {pending ? 'Encaminhando…' : 'Encaminhar'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
