'use client'

import { useRef, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { FormMessage } from '@/components/ui/form-message'
import { addCte, deleteCte, type CteAttachment } from '../operation-actions'

const GROUP_LABEL: Record<string, string> = { DTA: 'DTA', DI: 'DI' }

/**
 * CT-es da cotação (migration 0032) — vários por cotação.
 *
 * Em cotação DTA+DI cada anexo é marcado como DTA ou DI, porque são etapas
 * diferentes da mesma operação. Nas demais, o anexo é único/geral.
 *
 * `canEdit` separa os dois usos: a Operação anexa e remove; o Comercial só vê.
 */
export function CteAttachments({
  quotationId,
  initial,
  canEdit,
  isDtaDi,
}: {
  quotationId: string
  initial: CteAttachment[]
  canEdit: boolean
  isDtaDi: boolean
}) {
  const [ctes, setCtes] = useState<CteAttachment[]>(initial)
  const [group, setGroup] = useState<'' | 'DTA' | 'DI'>('')
  const [error, setError] = useState<string>()
  const [pending, start] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    setError(undefined)
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Selecione o arquivo do CT-e.')
      return
    }
    if (isDtaDi && !group) {
      setError('Informe se este CT-e é da DTA ou da DI.')
      return
    }
    const formData = new FormData()
    formData.set('cte', file)
    formData.set('leg_group', group)
    start(async () => {
      const res = await addCte(quotationId, formData)
      if (res.error) {
        setError(res.error)
        return
      }
      if (res.cte) setCtes((prev) => [...prev, res.cte!])
      if (fileRef.current) fileRef.current.value = ''
      setGroup('')
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Remover este CT-e?')) return
    setError(undefined)
    start(async () => {
      const res = await deleteCte(quotationId, id)
      if (res.error) setError(res.error)
      else setCtes((prev) => prev.filter((c) => c.id !== id))
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <span className="text-sm font-medium text-slate-700">
        CT-es anexados {ctes.length > 0 && `(${ctes.length})`}
      </span>

      {error && <FormMessage type="error">{error}</FormMessage>}

      {ctes.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum CT-e anexado ainda.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {ctes.map((cte) => (
            <div
              key={cte.id}
              className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2"
            >
              {cte.leg_group && (
                <span className="bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 text-xs font-medium">
                  {GROUP_LABEL[cte.leg_group]}
                </span>
              )}
              <a
                href={cte.file_url}
                target="_blank"
                rel="noreferrer"
                className="text-brand-700 hover:text-brand-800 flex-1 truncate text-sm font-medium"
              >
                {cte.file_name || 'CT-e'}
              </a>
              <span className="text-xs whitespace-nowrap text-slate-400">
                {new Date(cte.created_at).toLocaleDateString('pt-BR')}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleDelete(cte.id)}
                  disabled={pending}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                >
                  Remover
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Arquivo (PDF)</label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="text-sm text-slate-600"
            />
          </div>
          {isDtaDi && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">Etapa</label>
              <Select
                value={group}
                onChange={(e) => setGroup(e.target.value as '' | 'DTA' | 'DI')}
                className="w-32"
              >
                <option value="">Selecione</option>
                <option value="DTA">DTA</option>
                <option value="DI">DI</option>
              </Select>
            </div>
          )}
          <Button onClick={handleAdd} disabled={pending} variant="secondary">
            {pending ? 'Enviando…' : 'Anexar CT-e'}
          </Button>
        </div>
      )}
    </div>
  )
}
