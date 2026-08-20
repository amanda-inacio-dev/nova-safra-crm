'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { FormMessage } from '@/components/ui/form-message'
import { requestClientFollowUp } from './actions'

/** Modal de "Solicitar retorno" (issue #17) — pré-carrega o texto padrão
 *  configurável (template `client_followup_request`, ver /admin/textos-padrao),
 *  editável livremente antes de confirmar o envio. */
export function RequestFollowUpModal({
  quotationId,
  initialMessage,
  open,
  onClose,
}: {
  quotationId: string
  initialMessage: string
  open: boolean
  onClose: () => void
}) {
  const [message, setMessage] = useState(initialMessage)
  const [error, setError] = useState<string>()
  const [sent, setSent] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleClose() {
    setError(undefined)
    setSent(false)
    setMessage(initialMessage)
    onClose()
  }

  function handleConfirm() {
    setError(undefined)
    startTransition(async () => {
      const res = await requestClientFollowUp(quotationId, message)
      if (res?.error) setError(res.error)
      else setSent(true)
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Solicitar retorno ao cliente">
      <div className="flex flex-col gap-3">
        {sent ? (
          <>
            <p className="text-sm text-emerald-700">Mensagem enviada ao cliente.</p>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Fechar</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <label htmlFor="followup-message" className="text-sm font-medium text-slate-700">
                Mensagem para o cliente
              </label>
              <Textarea
                id="followup-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                Texto padrão configurável em Admin → Textos Padrão — pode editar à vontade antes de
                enviar.
              </p>
            </div>

            {error && <FormMessage type="error">{error}</FormMessage>}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <Button onClick={handleConfirm} disabled={pending || !message.trim()}>
                {pending ? 'Enviando…' : 'Enviar'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
