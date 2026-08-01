'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormMessage } from '@/components/ui/form-message'
import { respondToQuotation, addQuotationComment } from './actions'
import type { QuotationStatus } from '@/types'

export function ClientPortalPanel({
  token,
  status,
  pdfUrl,
}: {
  token: string
  status: QuotationStatus
  pdfUrl: string | null
}) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string>()
  const [commentSent, setCommentSent] = useState(false)
  const [responding, startResponding] = useTransition()
  const [sendingComment, startSendingComment] = useTransition()

  const alreadyResponded = currentStatus === 'APROVADA' || currentStatus === 'REPROVADA'

  function handleRespond(decision: 'APPROVED' | 'REJECTED') {
    setError(undefined)
    startResponding(async () => {
      const res = await respondToQuotation(token, decision, comment)
      if (res.error) setError(res.error)
      else {
        setCurrentStatus(decision === 'APPROVED' ? 'APROVADA' : 'REPROVADA')
        setComment('')
      }
    })
  }

  function handleSendComment() {
    setError(undefined)
    setCommentSent(false)
    startSendingComment(async () => {
      const res = await addQuotationComment(token, comment)
      if (res.error) setError(res.error)
      else {
        setCommentSent(true)
        setComment('')
      }
    })
  }

  // As ações vêm ANTES do documento: o cliente precisa ver o que pode fazer sem
  // ter que rolar o PDF inteiro até o fim.
  return (
    <div className="mt-6 flex flex-col gap-4">
      {error && <FormMessage type="error">{error}</FormMessage>}

      {alreadyResponded && (
        <div
          className={`rounded-lg border p-4 text-sm font-medium ${
            currentStatus === 'APROVADA'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {currentStatus === 'APROVADA'
            ? 'Obrigado! Sua aprovação foi registrada.'
            : 'Sua reprovação foi registrada. Entraremos em contato.'}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
        <label htmlFor="comment" className="text-sm font-medium text-slate-700">
          Comentário {alreadyResponded ? '' : '(opcional — enviado junto com Aprovar/Reprovar)'}
        </label>
        <Textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Escreva aqui sua observação…"
        />

        <div className="flex flex-wrap gap-3">
          {!alreadyResponded && (
            <>
              <Button
                onClick={() => handleRespond('APPROVED')}
                disabled={responding || sendingComment}
              >
                {responding ? 'Enviando…' : 'Aprovar'}
              </Button>
              <Button
                onClick={() => handleRespond('REJECTED')}
                disabled={responding || sendingComment}
                variant="danger"
              >
                {responding ? 'Enviando…' : 'Reprovar'}
              </Button>
            </>
          )}
          <Button
            onClick={handleSendComment}
            disabled={responding || sendingComment || !comment.trim()}
            variant="secondary"
          >
            {sendingComment ? 'Enviando…' : 'Enviar comentário'}
          </Button>
        </div>
        {commentSent && <p className="text-sm text-emerald-700">Comentário enviado.</p>}
      </div>

      {pdfUrl ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Documento da cotação</h2>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#1f5c39] hover:underline"
            >
              Abrir em tela cheia ↗
            </a>
          </div>
          {/* Bem alto de propósito: é o conteúdo principal da tela. */}
          <iframe
            src={pdfUrl}
            title="Cotação"
            className="h-[85vh] min-h-[600px] w-full rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>
      ) : (
        <div className="flex h-[30vh] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
          O documento ainda não está disponível.
        </div>
      )}
    </div>
  )
}
