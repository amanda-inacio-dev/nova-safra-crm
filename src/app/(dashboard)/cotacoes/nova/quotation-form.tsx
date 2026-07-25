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
import {
  calculateInsurance,
  grossUpWithIcms,
  normalizeName,
  CONTAINER_INSURANCE_NAME,
} from '@/lib/quotation/estimate'
import type { Segment, VehicleType, ValueType } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

type TotalLine = { key: string; label: string; value: number }

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
  const [merchandiseValue, setMerchandiseValue] = useState('')

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
  const [certIds, setCertIds] = useState<string[]>([])

  // Seguro
  const [insuranceRate, setInsuranceRate] = useState('')
  const [suspendedTaxes, setSuspendedTaxes] = useState('')

  // Seleção de campos no total (marcado por padrão quando ausente)
  const [includeMap, setIncludeMap] = useState<Record<string, boolean>>({})
  const included = (key: string) => includeMap[key] ?? true
  const toggleInclude = (key: string) => setIncludeMap((m) => ({ ...m, [key]: !(m[key] ?? true) }))

  const isDTA = operation.operationType === 'IMPORTACAO' && operation.subtype === 'DTA'

  const legsTotal = useMemo(() => legs.reduce((s, l) => s + toNumber(l.value), 0), [legs])

  // Base do contêiner para o seguro = soma do adicional "Valor para efeito do contêiner"
  const containerAdditionalId = useMemo(
    () =>
      additionals.find((a) => normalizeName(a.name) === normalizeName(CONTAINER_INSURANCE_NAME))
        ?.id,
    [additionals]
  )
  const containerBase = useMemo(
    () =>
      addSelections
        .filter((s) => s.additionalId === containerAdditionalId)
        .reduce((sum, a) => sum + (Number(a.value) || 0), 0),
    [addSelections, containerAdditionalId]
  )

  const insuranceValue = useMemo(
    () =>
      calculateInsurance({
        merchandiseValue: toNumber(merchandiseValue),
        containerBase,
        suspendedTaxes: isDTA ? toNumber(suspendedTaxes) : 0,
        ratePercent: toNumber(insuranceRate),
      }),
    [merchandiseValue, containerBase, isDTA, suspendedTaxes, insuranceRate]
  )

  // Linhas de valor que podem compor o total (frete + adicionais + seguro)
  const additionalLines = useMemo<TotalLine[]>(() => {
    const map = new Map<string, TotalLine>()
    for (const sel of addSelections) {
      if (sel.percent != null) continue // ICMS é tratado à parte
      const value = Number(sel.value) || 0
      if (value === 0) continue
      if (sel.additionalId) {
        const label = additionals.find((a) => a.id === sel.additionalId)?.name ?? 'Adicional'
        const key = `add:${sel.additionalId}`
        const cur = map.get(key)
        map.set(key, { key, label, value: (cur?.value ?? 0) + value })
      } else if (sel.customName) {
        const key = `manual:${sel.customName}`
        const cur = map.get(key)
        map.set(key, { key, label: sel.customName, value: (cur?.value ?? 0) + value })
      }
    }
    return [...map.values()]
  }, [addSelections, additionals])

  const lines = useMemo<TotalLine[]>(() => {
    const base: TotalLine[] = [{ key: 'freight', label: 'Frete (trechos)', value: legsTotal }]
    base.push(...additionalLines)
    if (insuranceValue > 0) base.push({ key: 'insurance', label: 'Seguro', value: insuranceValue })
    return base
  }, [legsTotal, additionalLines, insuranceValue])

  const selectedSum = lines.reduce((s, l) => (included(l.key) ? s + l.value : s), 0)

  const icmsSelection = useMemo(() => addSelections.find((s) => s.percent != null), [addSelections])
  const icmsRateInput = icmsSelection ? Number(icmsSelection.percent) || 0 : 0
  const icmsIncluded = Boolean(icmsSelection) && included('icms')
  const { total: grandTotal, icmsValue } = grossUpWithIcms(
    selectedSum,
    icmsIncluded ? icmsRateInput : 0
  )
  const hasIcms = icmsIncluded && icmsRateInput > 0

  function keyForSelection(sel: QuotationAdditionalInput): string {
    if (sel.percent != null) return 'icms'
    if (sel.additionalId) return `add:${sel.additionalId}`
    return `manual:${sel.customName ?? ''}`
  }

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
        additionals: addSelections.map((sel) => ({
          ...sel,
          includeInTotal: included(keyForSelection(sel)),
        })),
        certificationIds: certIds,
        merchandiseValue: toNumber(merchandiseValue),
        insuranceRate: toNumber(insuranceRate),
        suspendedTaxes: isDTA ? toNumber(suspendedTaxes) : 0,
        freightInTotal: included('freight'),
        insuranceInTotal: included('insurance'),
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
          <div>
            <Label htmlFor="product">Produto</Label>
            <Input id="product" value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="merchandise">Valor da mercadoria (R$)</Label>
            <Input
              id="merchandise"
              type="number"
              step="0.01"
              min="0"
              value={merchandiseValue}
              onChange={(e) => setMerchandiseValue(e.target.value)}
              placeholder="Opcional"
            />
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
        <AdditionalsSelector additionals={additionals} onChange={setAddSelections} />
      </Section>

      <Section title="Cálculo do Seguro">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="insurance-rate">Taxa de seguro (%)</Label>
            <Input
              id="insurance-rate"
              type="number"
              step="0.0001"
              min="0"
              value={insuranceRate}
              onChange={(e) => setInsuranceRate(e.target.value)}
              placeholder="Ex.: 0,10"
            />
          </div>
          {isDTA && (
            <div>
              <Label htmlFor="suspended">Impostos suspensos (R$)</Label>
              <Input
                id="suspended"
                type="number"
                step="0.01"
                min="0"
                value={suspendedTaxes}
                onChange={(e) => setSuspendedTaxes(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Valor da mercadoria</span>
            <span>{brl(toNumber(merchandiseValue))}</span>
          </div>
          <div className="flex justify-between">
            <span>Valor p/ efeito do contêiner</span>
            <span>{brl(containerBase)}</span>
          </div>
          {isDTA && (
            <div className="flex justify-between">
              <span>Impostos suspensos</span>
              <span>{brl(toNumber(suspendedTaxes))}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Taxa de seguro</span>
            <span>{toNumber(insuranceRate).toLocaleString('pt-BR')}%</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <span>Valor do seguro</span>
            <span>{brl(insuranceValue)}</span>
          </div>
        </div>
      </Section>

      <Section title="Certificações no PDF">
        <CertificationsSelector
          certifications={certifications}
          selected={certIds}
          onChange={setCertIds}
        />
      </Section>

      <Section title="Total Estimado">
        <p className="mb-3 text-sm text-slate-500">Selecione os campos que devem compor o total.</p>
        <div className="flex flex-col gap-2">
          {lines.map((l) => (
            <label
              key={l.key}
              className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={included(l.key)}
                  onChange={() => toggleInclude(l.key)}
                />
                {l.label}
              </span>
              <span className="text-sm text-slate-600">{brl(l.value)}</span>
            </label>
          ))}
          {icmsSelection && (
            <label className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={included('icms')}
                  onChange={() => toggleInclude('icms')}
                />
                ICMS ({icmsRateInput.toLocaleString('pt-BR')}%) — aplicado por dentro
              </span>
              <span className="text-sm text-slate-600">{hasIcms ? brl(icmsValue) : '—'}</span>
            </label>
          )}
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Soma dos selecionados</span>
            <span>{brl(selectedSum)}</span>
          </div>
          {hasIcms && (
            <>
              <div className="flex justify-between">
                <span>Total com ICMS</span>
                <span>{brl(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor do ICMS</span>
                <span>{brl(icmsValue)}</span>
              </div>
            </>
          )}
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
            <span>Total Estimado</span>
            <span>{brl(grandTotal)}</span>
          </div>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3 rounded-lg border border-slate-200 bg-white p-5">
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

      {error && <FormMessage type="error">{error}</FormMessage>}
    </div>
  )
}
