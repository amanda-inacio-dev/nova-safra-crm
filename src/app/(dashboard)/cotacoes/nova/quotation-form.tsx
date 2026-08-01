'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { createQuotation, updateQuotation, type QuotationAdditionalInput } from '../actions'
import { OperationFields, type OperationValue } from './operation-fields'
import { LegsEditor, emptyLeg, type LegRow } from './legs-editor'
import { AdditionalsSelector } from './additionals-selector'
import { CertificationsSelector } from './certifications-selector'
import {
  type ClientOption,
  type PortOption,
  type CertOption,
  type AdditionalOption,
  type NameOption,
  toNumber,
  brl,
} from './types'
import {
  calculateInsurance,
  insuranceMerchandiseValue,
  normalizeName,
  CONTAINER_INSURANCE_NAME,
} from '@/lib/quotation/estimate'
import {
  summarizeQuotationGrandTotal,
  keyForSelection,
  type LegChargeInput,
} from '@/lib/quotation/summary'
import type { Segment, VehicleType, ValueType } from '@/types'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

export type QuotationInitial = {
  clientId: string
  sender: string
  recipient: string
  segment: Segment | ''
  product: string
  processReference: string
  merchandiseValue: string
  validity: string
  operation: OperationValue
  vehicleType: VehicleType | ''
  valueType: ValueType | ''
  legs: LegRow[]
  portId: string
  /** Adicionais GERAIS da cotação (sem as margens esquerda, que ficam em cada trecho). */
  additionals: QuotationAdditionalInput[]
  certificationIds: string[]
  insuranceRate: string
  suspendedTaxesRate: string
  insuranceIncluded: boolean
  /** Seleção de quais adicionais gerais entram na soma. */
  includeMap: Record<string, boolean>
}

export function QuotationForm({
  clients,
  ports,
  additionals,
  certifications,
  senders,
  recipients,
  routeOrigins,
  routeDestinations,
  quotationId,
  initial,
  readOnly,
}: {
  clients: ClientOption[]
  ports: PortOption[]
  additionals: AdditionalOption[]
  certifications: CertOption[]
  /** Sugestões salvas (Admin > Configurações) — não travam os campos, só ajudam a reaproveitar nomes/rotas. */
  senders: NameOption[]
  recipients: NameOption[]
  routeOrigins: NameOption[]
  routeDestinations: NameOption[]
  /** Presente em modo edição — salva alterações em vez de criar uma nova cotação. */
  quotationId?: string
  /** Dados já salvos, para pré-preencher o formulário em modo edição. */
  initial?: QuotationInitial
  /** Cotação CONCLUIDA — o servidor já rejeita a gravação; aqui só desabilita o Salvar. */
  readOnly?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string>()

  // Identificação
  const [clientId, setClientId] = useState(initial?.clientId ?? '')
  const [sender, setSender] = useState(initial?.sender ?? '')
  const [recipient, setRecipient] = useState(initial?.recipient ?? '')
  const [segment, setSegment] = useState<Segment | ''>(initial?.segment ?? '')
  const [product, setProduct] = useState(initial?.product ?? '')
  const [processReference, setProcessReference] = useState(initial?.processReference ?? '')
  const [merchandiseValue, setMerchandiseValue] = useState(initial?.merchandiseValue ?? '')
  const [validity, setValidity] = useState(initial?.validity ?? '')

  // Operação / veículo / valor
  const [operation, setOperation] = useState<OperationValue>(
    initial?.operation ?? { operationType: '', subtype: '', detail: '' }
  )
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>(initial?.vehicleType ?? '')
  const [valueType, setValueType] = useState<ValueType | ''>(initial?.valueType ?? '')

  // Trechos / porto
  const [legs, setLegs] = useState<LegRow[]>(initial?.legs ?? [emptyLeg()])
  const [portId, setPortId] = useState(initial?.portId ?? '')
  const showLegGroups = operation.operationType === 'IMPORTACAO' && operation.subtype === 'DTA_DI'

  // Adicionais gerais (Estadia, Handling etc. — as margens esquerda ficam por trecho) / certificações
  const [addSelections, setAddSelections] = useState<QuotationAdditionalInput[]>(
    initial?.additionals ?? []
  )
  // Cotação nova já nasce com TODAS as certificações marcadas — o normal é
  // exibi-las no PDF; desmarcar é a exceção. Ao editar, vale o que foi salvo
  // (senão desmarcar uma seria desfeito na próxima abertura da tela).
  const [certIds, setCertIds] = useState<string[]>(
    initial ? initial.certificationIds : certifications.map((c) => c.id)
  )

  // Seguro
  const [insuranceRate, setInsuranceRate] = useState(initial?.insuranceRate ?? '')
  const [suspendedTaxesRate, setSuspendedTaxesRate] = useState(initial?.suspendedTaxesRate ?? '')
  const [insuranceIncluded, setInsuranceIncluded] = useState(initial?.insuranceIncluded ?? true)

  // Seleção de quais adicionais GERAIS entram na soma (marcado por padrão quando ausente).
  const [includeMap, setIncludeMap] = useState<Record<string, boolean>>(initial?.includeMap ?? {})
  const included = (key: string) => includeMap[key] ?? true
  const toggleInclude = (key: string) => setIncludeMap((m) => ({ ...m, [key]: !(m[key] ?? true) }))

  const isDTA =
    operation.operationType === 'IMPORTACAO' &&
    (operation.subtype === 'DTA' || operation.subtype === 'DTA_DI')

  // Base do contêiner para o seguro = soma do adicional geral "Valor para efeito do contêiner"
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

  const effectiveSuspendedRate = isDTA ? toNumber(suspendedTaxesRate) : 0
  const insuranceMerch = useMemo(
    () => insuranceMerchandiseValue(toNumber(merchandiseValue), effectiveSuspendedRate),
    [merchandiseValue, effectiveSuspendedRate]
  )
  // Valor do seguro: calculado UMA VEZ para a cotação e somado INTEIRO em cada trecho
  // (não é dividido entre eles) — confirmado com a usuária.
  const insuranceValue = useMemo(
    () =>
      calculateInsurance({
        merchandiseValue: toNumber(merchandiseValue),
        suspendedTaxesRate: effectiveSuspendedRate,
        containerBase,
        ratePercent: toNumber(insuranceRate),
      }),
    [merchandiseValue, effectiveSuspendedRate, containerBase, insuranceRate]
  )

  // Cada trecho aplica sua PRÓPRIA alíquota de ICMS sobre a soma dele mesmo (Frete +
  // Pedágio + margens esquerda marcadas + Seguro). O total geral soma todos os
  // trechos (já com ICMS) + os adicionais gerais marcados (sem ICMS de novo neles).
  const legInputs: LegChargeInput[] = useMemo(
    () =>
      legs.map((leg) => ({
        freightValue: toNumber(leg.freightValue),
        freightIncluded: leg.freightIncluded,
        tollValue: toNumber(leg.tollValue),
        tollIncluded: leg.tollIncluded,
        additionalSelections: leg.additionals,
        additionals,
        insuranceValue,
        insuranceIncluded,
        icmsRatePercent: toNumber(leg.icmsRate),
      })),
    [legs, additionals, insuranceValue, insuranceIncluded]
  )

  const grand = useMemo(
    () =>
      summarizeQuotationGrandTotal({
        legs: legInputs,
        generalSelections: addSelections,
        generalAdditionals: additionals,
        generalIncludeMap: includeMap,
      }),
    [legInputs, addSelections, additionals, includeMap]
  )

  function submit() {
    setError(undefined)
    startTransition(async () => {
      const input = {
        clientId,
        sender,
        recipient,
        segment,
        product,
        processReference,
        validity,
        vehicleType,
        valueType,
        operationType: operation.operationType,
        operationSubtype: operation.subtype,
        operationDetail: operation.detail,
        emptyContainerPortId: portId,
        legs: legs.map((l) => ({
          origin: l.origin,
          destination: l.destination,
          freightValue: toNumber(l.freightValue),
          freightIncluded: l.freightIncluded,
          tollValue: toNumber(l.tollValue),
          tollIncluded: l.tollIncluded,
          icmsRate: toNumber(l.icmsRate),
          legGroup: l.legGroup || null,
          additionals: l.additionals,
        })),
        additionals: addSelections.map((sel) => ({
          ...sel,
          includeInTotal: included(keyForSelection(sel)),
        })),
        certificationIds: certIds,
        merchandiseValue: toNumber(merchandiseValue),
        insuranceRate: toNumber(insuranceRate),
        suspendedTaxesRate: effectiveSuspendedRate,
        insuranceInTotal: insuranceIncluded,
      }
      const res = quotationId
        ? await updateQuotation(quotationId, input)
        : await createQuotation(input)
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
            <Input
              id="sender"
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              list="senders-list"
            />
            <datalist id="senders-list">
              {senders.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="recipient">Destinatário</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              list="recipients-list"
            />
            <datalist id="recipients-list">
              {recipients.map((r) => (
                <option key={r.id} value={r.name} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="product">Produto</Label>
            <Input id="product" value={product} onChange={(e) => setProduct(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="process-reference">Referência do processo</Label>
            <Input
              id="process-reference"
              value={processReference}
              onChange={(e) => setProcessReference(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="merchandise">Valor da mercadoria (R$)</Label>
            <CurrencyInput
              id="merchandise"
              value={merchandiseValue}
              onValueChange={setMerchandiseValue}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="validity">Validade da cotação</Label>
            <Input
              id="validity"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
              placeholder="Ex.: 10 dias"
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
        <p className="mb-3 text-sm text-slate-500">
          Frete, Pedágio, margens esquerda e ICMS são lançados em cada trecho — cada um aplica sua
          própria alíquota de ICMS sobre a soma dele mesmo.
        </p>
        <LegsEditor
          legs={legs}
          additionals={additionals}
          routeOrigins={routeOrigins}
          routeDestinations={routeDestinations}
          showGroups={showLegGroups}
          onChange={setLegs}
        />
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

      <Section title="Valores/Adicionais">
        <AdditionalsSelector
          additionals={additionals}
          initial={initial?.additionals}
          onChange={setAddSelections}
        />
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
              <Label htmlFor="suspended">Impostos suspensos (%)</Label>
              <Input
                id="suspended"
                type="number"
                step="0.01"
                min="0"
                value={suspendedTaxesRate}
                onChange={(e) => setSuspendedTaxesRate(e.target.value)}
                placeholder="Ex.: 15"
              />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-600">
          <div className="flex justify-between">
            <span>Valor da mercadoria</span>
            <span>{brl(toNumber(merchandiseValue))}</span>
          </div>
          {isDTA && (
            <>
              <div className="flex justify-between">
                <span>
                  Impostos suspensos ({toNumber(suspendedTaxesRate).toLocaleString('pt-BR')}%)
                </span>
                <span>{brl(insuranceMerch - toNumber(merchandiseValue))}</span>
              </div>
              <div className="flex justify-between">
                <span>Valor da mercadoria p/ seguro</span>
                <span>{brl(insuranceMerch)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between">
            <span>Valor p/ efeito do contêiner</span>
            <span>{brl(containerBase)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa de seguro</span>
            <span>{toNumber(insuranceRate).toLocaleString('pt-BR')}%</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-900">
            <span>Valor do seguro</span>
            <span>{brl(insuranceValue)}</span>
          </div>
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={insuranceIncluded}
            onChange={(e) => setInsuranceIncluded(e.target.checked)}
          />
          Incluir o seguro em cada trecho (valor cheio, o mesmo em todos)
        </label>
      </Section>

      <Section title="Certificações no PDF">
        <CertificationsSelector
          certifications={certifications}
          selected={certIds}
          onChange={setCertIds}
        />
      </Section>

      <Section title="Total Estimado">
        <div className="flex flex-col gap-4">
          {grand.legSummaries.map((legSummary, i) => (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 text-sm font-semibold text-slate-800">
                Trecho {i + 1}: {legs[i]?.origin || '—'} → {legs[i]?.destination || '—'}
              </p>
              <div className="flex flex-col gap-1 text-sm text-slate-600">
                {legSummary.lines.map((l) => (
                  <div key={l.key} className="flex justify-between">
                    <span>{l.label}</span>
                    <span>{brl(l.value)}</span>
                  </div>
                ))}
                <div className="mt-1 flex justify-between border-t border-slate-200 pt-1">
                  <span>Base do trecho</span>
                  <span>{brl(legSummary.base)}</span>
                </div>
                {legSummary.icmsRatePercent > 0 && (
                  <div className="flex justify-between">
                    <span>ICMS ({legSummary.icmsRatePercent.toLocaleString('pt-BR')}%)</span>
                    <span>{brl(legSummary.icmsValue)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-slate-900">
                  <span>Total do trecho</span>
                  <span>{brl(legSummary.total)}</span>
                </div>
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 text-sm text-slate-500">
              Selecione os adicionais gerais que devem compor o total.
            </p>
            <div className="flex flex-col gap-2">
              {[...grand.generalIncludedLines, ...grand.generalExcludedLines].map((l) => (
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
            </div>
          </div>

          <div className="rounded-md bg-slate-50 p-4 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Soma dos trechos</span>
              <span>{brl(grand.legsTotal)}</span>
            </div>
            {grand.generalIncludedLines.map((l) => (
              <div key={l.key} className="flex justify-between">
                <span>{l.label}</span>
                <span>{brl(l.value)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-900">
              <span>Total Estimado</span>
              <span>{brl(grand.grandTotal)}</span>
            </div>
          </div>

          {(grand.generalExcludedLines.length > 0 ||
            grand.legSummaries.some((l) => l.excludedLines.length > 0)) && (
            <div className="rounded-md border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
                Adicionais, se aplicáveis (não entram no total)
              </p>
              <div className="flex flex-col gap-1 text-sm text-slate-500">
                {grand.legSummaries.flatMap((legSummary, i) =>
                  legSummary.excludedLines.map((l) => (
                    <div key={`leg-${i}-${l.key}`} className="flex justify-between">
                      <span>
                        Trecho {i + 1}: {l.label}
                      </span>
                      <span>{brl(l.value)}</span>
                    </div>
                  ))
                )}
                {grand.generalExcludedLines.map((l) => (
                  <div key={l.key} className="flex justify-between">
                    <span>{l.label}</span>
                    <span>{brl(l.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
        <Button onClick={submit} disabled={pending || readOnly}>
          {pending ? 'Salvando…' : quotationId ? 'Salvar alterações' : 'Salvar rascunho'}
        </Button>
      </div>

      {error && <FormMessage type="error">{error}</FormMessage>}
    </div>
  )
}
