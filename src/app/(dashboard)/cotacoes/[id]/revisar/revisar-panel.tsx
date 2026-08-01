'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormMessage } from '@/components/ui/form-message'
import { ClientResponseBadge } from '../../client-response-badge'
import {
  generateQuotationPdf,
  confirmQuotation,
  sendQuotationToClient,
  updateMySignature,
} from './actions'
import { createNewVersion } from '../version-actions'
import { type OperationUser } from '../operation-actions'
import { ForwardToOperationModal } from './forward-to-operation-modal'
import { OperationPanel } from './operation-panel'
import {
  STATUS_LABEL,
  statusDisplayLabel,
  statusColorClass,
  hasRevisionEvent,
} from '@/lib/quotation/status-label'
import type { QuotationStatus, QuotationEventType, UserRole } from '@/types'

export type QuotationEvent = {
  type: QuotationEventType
  client_comment: string | null
  created_at: string
}

export type VersionSummary = {
  id: string
  code: string | null
  version: number
  status: QuotationStatus
}

const EVENT_LABEL: Record<QuotationEventType, string> = {
  APPROVED: 'Cliente aprovou a cotação',
  REJECTED: 'Cliente reprovou a cotação',
  COMMENTED: 'Cliente comentou',
  FORWARDED: 'Encaminhada para a Operação',
  REVISION_REQUESTED: 'Revisão solicitada',
  CLOSED: 'Processo encerrado',
}

const EVENT_BADGE_CLASS: Record<QuotationEventType, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  COMMENTED: 'bg-slate-100 text-slate-600',
  FORWARDED: 'bg-brand-50 text-brand-700',
  REVISION_REQUESTED: 'bg-amber-50 text-amber-700',
  CLOSED: 'bg-emerald-50 text-emerald-700',
}

function VersionHistory({
  versions,
  currentId,
}: {
  versions: VersionSummary[]
  currentId: string
}) {
  if (versions.length <= 1) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">Histórico de versões</p>
      <div className="flex flex-col gap-2">
        {versions.map((v) => (
          <Link
            key={v.id}
            href={`/cotacoes/${v.id}/revisar`}
            className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
              v.id === currentId
                ? 'border-brand-200 bg-brand-50 text-brand-800 font-medium'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>
              v{v.version} — {v.code ?? '—'}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColorClass(v.status, false, false)}`}
            >
              {STATUS_LABEL[v.status]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function QuotationHistory({ events }: { events: QuotationEvent[] }) {
  if (events.length === 0) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-800">Histórico da cotação</p>
      <div className="flex flex-col gap-3">
        {events.map((e, i) => (
          <div key={i} className="flex flex-col gap-1 border-l-2 border-slate-200 pl-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_BADGE_CLASS[e.type]}`}
              >
                {EVENT_LABEL[e.type]}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(e.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            {e.client_comment && <p className="text-sm text-slate-700">{e.client_comment}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RevisarPdfPanel({
  quotationId,
  status,
  initialPdfUrl,
  events,
  initialSignatureUrl,
  version,
  versions,
  role,
  cteUrl,
  operationUsers,
}: {
  quotationId: string
  status: QuotationStatus
  initialPdfUrl: string | null
  events: QuotationEvent[]
  initialSignatureUrl: string | null
  version: number
  versions: VersionSummary[]
  role: UserRole
  cteUrl: string | null
  operationUsers: OperationUser[]
}) {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl)
  const [error, setError] = useState<string>()
  const [sendResult, setSendResult] = useState<{ url?: string; warning?: string }>()
  const [message, setMessage] = useState('')
  const [signatureUrl, setSignatureUrl] = useState(initialSignatureUrl)
  const [signatureError, setSignatureError] = useState<string>()
  const [forwardOpen, setForwardOpen] = useState(false)
  const [generating, startGenerating] = useTransition()
  const [confirming, startConfirming] = useTransition()
  const [sending, startSending] = useTransition()
  const [uploadingSignature, startUploadingSignature] = useTransition()
  const [creatingVersion, startCreatingVersion] = useTransition()
  const signatureInputRef = useRef<HTMLInputElement>(null)

  const isOperation = role === 'OPERATION'
  const isDraft = status === 'RASCUNHO'
  const maxVersion = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : version
  const isLatestVersion = version >= maxVersion
  const canSend = Boolean(pdfUrl) && !isDraft && isLatestVersion
  const canCreateNewVersion = status === 'APROVADA' || status === 'REPROVADA'
  const canForward = status === 'APROVADA'
  const latestComment =
    status === 'AGUARDANDO_CLIENTE'
      ? (events.find((e) => e.type === 'COMMENTED')?.client_comment ?? null)
      : null
  const displayStatusLabel = statusDisplayLabel(status, hasRevisionEvent(events), isOperation)
  const displayStatusColor = statusColorClass(status, hasRevisionEvent(events), isOperation)

  function handleGenerate() {
    setError(undefined)
    startGenerating(async () => {
      const res = await generateQuotationPdf(quotationId)
      if (res.error) setError(res.error)
      else if (res.url) setPdfUrl(res.url)
    })
  }

  function handleConfirm() {
    setError(undefined)
    startConfirming(async () => {
      const res = await confirmQuotation(quotationId)
      if (res?.error) setError(res.error)
    })
  }

  function handleSend() {
    setError(undefined)
    setSendResult(undefined)
    startSending(async () => {
      const res = await sendQuotationToClient(quotationId, message)
      if (res.error) setError(res.error)
      else setSendResult({ url: res.url, warning: res.warning })
    })
  }

  function handleCreateNewVersion() {
    setError(undefined)
    startCreatingVersion(async () => {
      const res = await createNewVersion(quotationId)
      if (res?.error) setError(res.error)
    })
  }

  function handleSignatureChange(file: File | undefined) {
    if (!file) return
    setSignatureError(undefined)
    startUploadingSignature(async () => {
      const formData = new FormData()
      formData.set('signature', file)
      const res = await updateMySignature(formData)
      if (res.error) setSignatureError(res.error)
      else if (res.url) setSignatureUrl(res.url)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {isOperation ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-sm text-slate-500">Status</span>
          <ClientResponseBadge
            statusLabel={displayStatusLabel}
            colorClass={displayStatusColor}
            latestComment={latestComment}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleGenerate}
                disabled={generating}
                variant={pdfUrl ? 'secondary' : 'primary'}
              >
                {generating ? 'Gerando…' : pdfUrl ? 'Gerar novamente' : 'Gerar PDF'}
              </Button>
              <Link
                href={`/cotacoes/${quotationId}/editar`}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Editar
              </Link>
            </div>

            {isDraft ? (
              <Button onClick={handleConfirm} disabled={!pdfUrl || confirming}>
                {confirming ? 'Confirmando…' : 'Confirmar'}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <ClientResponseBadge
                  statusLabel={displayStatusLabel}
                  colorClass={displayStatusColor}
                  latestComment={latestComment}
                />
                {canForward && (
                  <Button onClick={() => setForwardOpen(true)} variant="secondary">
                    Encaminhar para Operação
                  </Button>
                )}
                {canCreateNewVersion && (
                  <Button
                    onClick={handleCreateNewVersion}
                    disabled={creatingVersion}
                    variant="secondary"
                  >
                    {creatingVersion ? 'Criando…' : 'Nova versão'}
                  </Button>
                )}
              </div>
            )}
          </div>

          <ForwardToOperationModal
            quotationId={quotationId}
            users={operationUsers}
            open={forwardOpen}
            onClose={() => setForwardOpen(false)}
          />

          {status === 'CONCLUIDA' && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-medium">Processo concluído pela Operação.</p>
              {cteUrl && (
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
          )}

          {!isLatestVersion && (
            <FormMessage type="error">
              Esta é uma versão antiga (v{version} de v{maxVersion}) — só a mais recente pode ser
              enviada ao cliente.
            </FormMessage>
          )}

          {!isDraft && (
            <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="send-message" className="text-sm font-medium text-slate-700">
                  Mensagem para o cliente (opcional)
                </label>
                <Textarea
                  id="send-message"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex.: Segue a cotação conforme conversamos, qualquer dúvida me chame."
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Assinatura (imagem, opcional)
                </span>
                <div className="flex items-center gap-3">
                  {signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- URL vem do Storage
                    <img
                      src={signatureUrl}
                      alt="Sua assinatura"
                      className="h-12 w-auto rounded border border-slate-200 bg-slate-50 px-2"
                    />
                  )}
                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSignatureChange(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploadingSignature}
                    onClick={() => signatureInputRef.current?.click()}
                  >
                    {uploadingSignature
                      ? 'Enviando…'
                      : signatureUrl
                        ? 'Trocar assinatura'
                        : 'Enviar assinatura'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Aparece no fim do e-mail, junto com seu nome — fica salva pra próxima vez.
                </p>
                {signatureError && <FormMessage type="error">{signatureError}</FormMessage>}
              </div>

              <div>
                <Button onClick={handleSend} disabled={!canSend || sending} variant="secondary">
                  {sending ? 'Enviando…' : 'Enviar por e-mail'}
                </Button>
              </div>
            </div>
          )}

          {sendResult && (
            <div className="border-brand-200 bg-brand-50 text-brand-900 rounded-lg border p-4 text-sm">
              <p className="font-medium">
                Link do cliente gerado{sendResult.warning ? '' : ' — e-mail enviado com sucesso'}:
              </p>
              <p className="mt-1 break-all">
                <a href={sendResult.url} target="_blank" rel="noreferrer" className="underline">
                  {sendResult.url}
                </a>
              </p>
              {sendResult.warning && <p className="mt-2 text-amber-700">{sendResult.warning}</p>}
            </div>
          )}
        </>
      )}

      {isOperation && <OperationPanel quotationId={quotationId} status={status} cteUrl={cteUrl} />}

      {error && <FormMessage type="error">{error}</FormMessage>}

      <VersionHistory versions={versions} currentId={quotationId} />

      <QuotationHistory events={events} />

      {pdfUrl ? (
        <iframe
          src={pdfUrl}
          title="Prévia do PDF da cotação"
          className="h-[80vh] w-full rounded-lg border border-slate-200 bg-slate-50"
        />
      ) : (
        <div className="flex h-[40vh] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-400">
          {isOperation
            ? 'O PDF desta cotação ainda não está disponível.'
            : 'Clique em "Gerar PDF" para criar a prévia.'}
        </div>
      )}
    </div>
  )
}
