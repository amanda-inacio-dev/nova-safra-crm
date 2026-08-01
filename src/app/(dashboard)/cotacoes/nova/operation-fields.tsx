'use client'

import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  IMPORT_SUBTYPES,
  EXPORT_SUBTYPES,
  DTA_DETAILS,
  OPERATION_LABELS,
} from '@/lib/quotation/operation'
import type { OperationType } from '@/types'

export type OperationValue = {
  operationType: OperationType | ''
  subtype: string
  detail: string
}

export function OperationFields({
  value,
  onChange,
}: {
  value: OperationValue
  onChange: (v: OperationValue) => void
}) {
  const { operationType, subtype, detail } = value

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="op-type">Tipo de operação *</Label>
        <Select
          id="op-type"
          value={operationType}
          onChange={(e) =>
            onChange({ operationType: e.target.value as OperationType, subtype: '', detail: '' })
          }
        >
          <option value="">Selecione…</option>
          <option value="IMPORTACAO">Importação</option>
          <option value="EXPORTACAO">Exportação</option>
        </Select>
      </div>

      {operationType === 'IMPORTACAO' && (
        <div>
          <Label htmlFor="op-subtype">Subtipo *</Label>
          <Select
            id="op-subtype"
            value={subtype}
            onChange={(e) => onChange({ ...value, subtype: e.target.value, detail: '' })}
          >
            <option value="">Selecione…</option>
            {IMPORT_SUBTYPES.map((s) => (
              <option key={s} value={s}>
                {OPERATION_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {operationType === 'EXPORTACAO' && (
        <div>
          <Label htmlFor="op-subtype">Tipo *</Label>
          <Select
            id="op-subtype"
            value={subtype}
            onChange={(e) => onChange({ ...value, subtype: e.target.value, detail: '' })}
          >
            <option value="">Selecione…</option>
            {EXPORT_SUBTYPES.map((s) => (
              <option key={s} value={s}>
                {OPERATION_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {operationType === 'IMPORTACAO' && (subtype === 'DTA' || subtype === 'DTA_DI') && (
        <div>
          <Label htmlFor="op-detail">Detalhe da DTA *</Label>
          <Select
            id="op-detail"
            value={detail}
            onChange={(e) => onChange({ ...value, detail: e.target.value })}
          >
            <option value="">Selecione…</option>
            {DTA_DETAILS.map((d) => (
              <option key={d} value={d}>
                {OPERATION_LABELS[d]}
              </option>
            ))}
          </Select>
        </div>
      )}

      {operationType === 'IMPORTACAO' && subtype === 'OUTRO' && (
        <div>
          <Label htmlFor="op-detail">Descreva *</Label>
          <Input
            id="op-detail"
            value={detail}
            onChange={(e) => onChange({ ...value, detail: e.target.value })}
            placeholder="Tipo de operação"
          />
        </div>
      )}

      {operationType === 'EXPORTACAO' && subtype === 'COM_MAPA' && (
        <div>
          <Label htmlFor="op-detail">Cidade do mapa *</Label>
          <Input
            id="op-detail"
            value={detail}
            onChange={(e) => onChange({ ...value, detail: e.target.value })}
            placeholder="Cidade"
          />
        </div>
      )}
    </div>
  )
}
