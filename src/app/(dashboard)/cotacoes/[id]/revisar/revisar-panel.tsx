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
import { CteAttachments } from './cte-attachments'
import type { CteAttachment } from '../operation-actions'
import {
  statusDisplayLabel,
  statusColorClass,
  hasRevisionEvent,
} from '@/lib/quotation/status-label'
import {
  VersionHistory,
  QuotationHistory,
  visibleEvents,
  type QuotationEvent,
  type VersionSummary,
} from '../quotation-history'
import type { ClientEmailOption } from '@/lib/quotation/client-emails'
import type { QuotationStatus, UserRole } from '@/types'

export type { QuotationEvent, VersionSummary }

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
  clientEmails,
  ctes,
  isDtaDi,
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
  /** CT-es anexados (migration 0032) — varios por cotacao. */
  ctes: CteAttachment[]
  /** Importacao DTA+DI: cada CT-e precisa dizer de qual etapa e. */
  isDtaDi: boolean
  /** Contatos do cliente que podem receber a cotação (principal + adicionais). */
  clientEmails: ClientEmailOption[]
}) {
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl)
  const [error, setError] = useState<string>()
  const [sendResult, setSendResult] = useState<{
    url?: string
    warning?: string
    sentTo?: string[]
  }>()
  // Todos os contatos vêm marcados: o normal é avisar o cliente inteiro, e
  // desmarcar quem não deve receber é mais rápido do que marcar um por um.
  const [recipients, setRecipients] = useState<string[]>(() => clientEmails.map((c) => c.email))
  const [message, setMessage] = useState('')
  const [signatureUrl, setSignatureUrl] = useState(initialSignatureUrl)
  const [signatureError, setSignatureError] = useState<string>()
  const [forwardOpen, setForwardOpen] = useState(false)
  const [showCtes, setShowCtes] = useState(false)
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
  // Nova versão é sempre permitida (pedido da usuária): a anterior continua
  // intacta, então não há risco de perder nada ao criar.
  const canCreateNewVersion = true
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
      const res = await sendQuotationToClient(quotationId, message, recipients)
      if (res.error) setError(res.error)
      else setSendResult({ url: res.url, warning: res.warning, sentTo: res.sentTo })
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
                {generating ? 'Gerando…' : pdfUrl ? 'Gerar PDF novamente' : 'Gerar PDF'}
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
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <p className="font-medium">Processo concluído pela Operação.</p>
                {ctes.length > 0 ? (
                  // Ao lado do aviso, abre/fecha a lista de anexos.
                  <button
                    type="button"
                    onClick={() => setShowCtes((v) => !v)}
                    className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    {showCtes ? 'Ocultar CT-es' : `Ver CT-es (${ctes.length})`}
                  </button>
                ) : (
                  // Cotações encerradas antes da migration 0032 têm só o link antigo.
                  cteUrl && (
                    <a href={cteUrl} target="_blank" rel="noreferrer" className="underline">
                      Ver CT-e
                    </a>
                  )
                )}
              </div>
              {/* O Comercial vê os CT-es, mas quem anexa/remove é a Operação. */}
              {showCtes && ctes.length > 0 && (
                <CteAttachments
                  quotationId={quotationId}
                  initial={ctes}
                  canEdit={false}
                  isDtaDi={isDtaDi}
                />
              )}
            </>
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
                <span className="text-sm font-medium text-slate-700">Enviar para</span>
                {clientEmails.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    Este cliente não tem e-mail cadastrado. Cadastre em Clientes → editar.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {clientEmails.map((option) => (
                      <label
                        key={option.email}
                        className="flex items-center gap-2 text-sm text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={recipients.includes(option.email)}
                          onChange={() =>
                            setRecipients((prev) =>
                              prev.includes(option.email)
                                ? prev.filter((e) => e !== option.email)
                                : [...prev, option.email]
                            )
                          }
                          className="accent-brand-700 h-4 w-4"
                        />
                        <span>
                          {option.label}{' '}
                          <span className="text-slate-400">&lt;{option.email}&gt;</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

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
                <Button
                  onClick={handleSend}
                  disabled={!canSend || sending || recipients.length === 0}
                  variant="secondary"
                >
                  {sending ? 'Enviando…' : 'Enviar por e-mail'}
                </Button>
              </div>
            </div>
          )}

          {sendResult && (
            <div className="border-brand-200 bg-brand-50 text-brand-900 rounded-lg border p-4 text-sm">
              <p className="font-medium">
                Link do cliente gerado
                {sendResult.warning
                  ? ''
                  : ` — e-mail enviado para ${sendResult.sentTo?.length ?? 0} destinatário${
                      (sendResult.sentTo?.length ?? 0) === 1 ? '' : 's'
                    }`}
                :
              </p>
              {!sendResult.warning && sendResult.sentTo && sendResult.sentTo.length > 0 && (
                <p className="mt-1 text-xs break-all">{sendResult.sentTo.join(' · ')}</p>
              )}
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

      {isOperation && (
        <OperationPanel
          quotationId={quotationId}
          status={status}
          cteUrl={cteUrl}
          ctes={ctes}
          isDtaDi={isDtaDi}
        />
      )}

      {error && <FormMessage type="error">{error}</FormMessage>}

      {/* A Operação enxerga só a versão que foi encaminhada pra ela e o
          histórico interno — nem as outras versões, nem a conversa do
          Comercial com o cliente. */}
      {!isOperation && <VersionHistory versions={versions} currentId={quotationId} />}

      <QuotationHistory events={visibleEvents(events, isOperation)} />

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
