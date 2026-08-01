'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormMessage } from '@/components/ui/form-message'
import { requestRevision, closeQuotation, type CteAttachment } from '../operation-actions'
import { CteAttachments } from './cte-attachments'
import type { QuotationStatus } from '@/types'

/** Ações da Operação: solicitar revisão ou encerrar com CT-e — só faz sentido
 *  enquanto a cotação está ENCAMINHADA; depois de CONCLUIDA vira só leitura. */
export function OperationPanel({
  quotationId,
  status,
  cteUrl,
  ctes,
  isDtaDi,
}: {
  quotationId: string
  status: QuotationStatus
  cteUrl: string | null
  ctes: CteAttachment[]
  isDtaDi: boolean
}) {
  const router = useRouter()
  const [revisionText, setRevisionText] = useState('')
  const [closeObservation, setCloseObservation] = useState('')
  const [error, setError] = useState<string>()
  const [requesting, startRequesting] = useTransition()
  const [closing, startClosing] = useTransition()

  if (status === 'CONCLUIDA') {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">Processo encerrado.</p>
          {ctes.length === 0 && cteUrl && (
            <a
              href={cteUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block underline"
            >
              Ver CT-e
            </a>
          )}
        </div>
        {/* Depois de encerrada, os anexos ficam só para consulta. */}
        <CteAttachments
          quotationId={quotationId}
          initial={ctes}
          canEdit={false}
          isDtaDi={isDtaDi}
        />
      </div>
    )
  }

  if (status !== 'ENCAMINHADA') return null

  function handleRequestRevision() {
    setError(undefined)
    startRequesting(async () => {
      const res = await requestRevision(quotationId, revisionText)
      if (res?.error) {
        setError(res.error)
        return
      }
      // Depois de pedir revisão, a cotação sai de ENCAMINHADA — a Operação não
      // enxerga mais essa cotação (RLS), então a própria página atual pararia
      // de carregar (404) se ficássemos nela. Volta pra lista, que já reflete
      // a saída dela.
      window.alert('Revisão solicitada! O Comercial foi avisado.')
      router.push('/cotacoes')
    })
  }

  function handleClose() {
    setError(undefined)
    // Os CT-es são anexados no bloco acima (podem ser vários) — encerrar só
    // confirma; o servidor recusa se não houver nenhum anexado.
    const formData = new FormData()
    formData.set('observation', closeObservation)
    startClosing(async () => {
      const res = await closeQuotation(quotationId, formData)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <FormMessage type="error">{error}</FormMessage>}

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <label htmlFor="revision-obs" className="text-sm font-medium text-slate-700">
          Solicitar revisão ao Comercial
        </label>
        <Textarea
          id="revision-obs"
          rows={3}
          value={revisionText}
          onChange={(e) => setRevisionText(e.target.value)}
          placeholder="Explique o que precisa ser ajustado…"
        />
        <div>
          <Button
            onClick={handleRequestRevision}
            disabled={requesting || !revisionText.trim()}
            variant="secondary"
          >
            {requesting ? 'Enviando…' : 'Solicitar revisão'}
          </Button>
        </div>
      </div>

      <CteAttachments quotationId={quotationId} initial={ctes} canEdit isDtaDi={isDtaDi} />

      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <span className="text-sm font-medium text-slate-700">Encerrar processo</span>
        <p className="text-xs text-slate-400">
          Anexe os CT-es no bloco acima — é preciso pelo menos um para encerrar.
        </p>
        <Textarea
          rows={2}
          value={closeObservation}
          onChange={(e) => setCloseObservation(e.target.value)}
          placeholder="Observação (opcional)"
        />
        <div>
          <Button onClick={handleClose} disabled={closing}>
            {closing ? 'Encerrando…' : 'Encerrar processo'}
          </Button>
        </div>
      </div>
    </div>
  )
}
