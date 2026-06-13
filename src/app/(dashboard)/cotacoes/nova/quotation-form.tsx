'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { createQuotation, type QuotationAdditionalInput } from '../actions'
import { OperationFields, type OperationValue } from './operation-fields'
import { LegsEditor, emptyLeg, type LegRow } from './legs-editor'
import { AdditionalsSelector } from './additionals-selector'
import { CertificationsSelector } from './certifications-selector'
import {
  type ClientOption,
  type PortOption,
  type CertOption,
  type AdditionalOption,
  toNumber,
  brl,
} from './types'
import type { Segment, VehicleType, ValueType } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

export function QuotationForm({
  clients,
  ports,
  additionals,
  certifications,
}: {
  clients: ClientOption[]
  ports: PortOption[]
  additionals: AdditionalOption[]
  certifications: CertOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  // Identificação
  const [clientId, setClientId] = useState('')
  const [sender, setSender] = useState('')
  const [recipient, setRecipient] = useState('')
  const [segment, setSegment] = useState<Segment | ''>('')
  const [product, setProduct] = useState('')

  // Operação / veículo / valor
  const [operation, setOperation] = useState<OperationValue>({
    operationType: '',
    subtype: '',
    detail: '',
  })
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('')
  const [valueType, setValueType] = useState<ValueType | ''>('')

  // Trechos / porto
  const [legs, setLegs] = useState<LegRow[]>([emptyLeg()])
  const [portId, setPortId] = useState('')

  // Adicionais / certificações
  const [addSelections, setAddSelections] = useState<QuotationAdditionalInput[]>([])
  const [addSubtotal, setAddSubtotal] = useState(0)
  const [certIds, setCertIds] = useState<string[]>([])

  const legsTotal = useMemo(() => legs.reduce((s, l) => s + toNumber(l.value), 0), [legs])
  const grandTotal = legsTotal + addSubtotal

  function submit() {
    setError(undefined)
    startTransition(async () => {
      const res = await createQuotation({
        clientId,
        sender,
        recipient,
        segment,
        product,
        vehicleType,
        valueType,
        operationType: operation.operationType,
        operationSubtype: operation.subtype,
        operationDetail: operation.detail,
        emptyContainerPortId: portId,
        legs: legs.map((l) => ({
          origin: l.origin,
          destination: l.destination,
          value: toNumber(l.value),
        })),
        additionals: addSelections,
        certificationIds: certIds,
      })
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Section title="Identificação">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Select id="client" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Selecione…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="segment">Segmento *</Label>
            <Select
              id="segment"
              value={segment}
              onChange={(e) => setSegment(e.target.value as Segment)}
            >
              <option value="">Selecione…</option>
              <option value="CAFE">Café</option>
              <option value="INDUSTRIA">Indústria</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sender">Remetente</Label>
            <Input id="sender" value={sender} onChange={(e) => setSender(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="recipient">Destinatário</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="product">Produto</Label>
            <Input id="product" value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section title="Operação">
        <OperationFields value={operation} onChange={setOperation} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="vehicle">Tipo de veículo *</Label>
            <Select
              id="vehicle"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              <option value="">Selecione…</option>
              <option value="CARRETA_LS">Carreta LS</option>
              <option value="RODOTREM">Rodotrem</option>
              <option value="BITRUCK">Bitruck</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="value-type">Tipo de valor *</Label>
            <Select
              id="value-type"
              value={valueType}
              onChange={(e) => setValueType(e.target.value as ValueType)}
            >
              <option value="">Selecione…</option>
              <option value="POR_CONTAINER">Por container</option>
              <option value="POR_VEICULO">Por veículo</option>
              <option value="POR_OPERACAO">Por operação</option>
            </Select>
          </div>
        </div>
      </Section>

      <Section title="Trechos">
        <LegsEditor legs={legs} onChange={setLegs} />
      </Section>

      <Section title="Container vazio">
        <div className="max-w-md">
          <Label htmlFor="port">Cidade de retirada/entrega</Label>
          <Select id="port" value={portId} onChange={(e) => setPortId(e.target.value)}>
            <option value="">Selecione…</option>
            {ports.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
      </Section>

      <Section title="Adicionais">
        <AdditionalsSelector
          additionals={additionals}
          onChange={(sels, subtotal) => {
            setAddSelections(sels)
            setAddSubtotal(subtotal)
          }}
        />
      </Section>

      <Section title="Certificações no PDF">
        <CertificationsSelector
          certifications={certifications}
          selected={certIds}
          onChange={setCertIds}
        />
      </Section>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-5">
        <div className="text-sm text-slate-600">
          Trechos: {brl(legsTotal)} · Adicionais: {brl(addSubtotal)}
          <span className="ml-2 font-semibold text-slate-900">Total: {brl(grandTotal)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/cotacoes')}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <Button onClick={submit} disabled={pending}>
            {pending ? 'Salvando…' : 'Salvar rascunho'}
          </Button>
        </div>
      </div>

      {error && <FormMessage type="error">{error}</FormMessage>}
    </div>
  )
}
