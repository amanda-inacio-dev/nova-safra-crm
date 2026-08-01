import { describe, it, expect } from 'vitest'
import {
  stripVersionSuffix,
  versionedCode,
  nextVersionNumber,
  rootQuotationId,
  buildNewVersionInsert,
  collapseVersions,
  type InheritableQuotationFields,
} from './version'

/** Linha mínima usada nos testes de colapso de versões. */
function v(
  id: string,
  version: number,
  createdAt: string,
  parentId: string | null = null,
  status = 'RASCUNHO'
) {
  return { id, version, created_at: createdAt, parent_id: parentId, status }
}

describe('collapseVersions', () => {
  it('cotação sem versões extras passa intacta', () => {
    const rows = [v('a', 1, '2026-07-01'), v('b', 1, '2026-06-01')]
    expect(collapseVersions(rows)).toEqual(rows)
  })

  it('uma cotação com 3 versões vira UMA linha, a mais recente', () => {
    const collapsed = collapseVersions([
      v('v3', 3, '2026-07-10', 'v1', 'APROVADA'),
      v('v2', 2, '2026-07-05', 'v1', 'REPROVADA'),
      v('v1', 1, '2026-07-01', null, 'REPROVADA'),
    ])
    expect(collapsed).toHaveLength(1)
    expect(collapsed[0].id).toBe('v3')
    expect(collapsed[0].status).toBe('APROVADA')
  })

  it('a data que fica é a da PRIMEIRA versão (a cotação nasceu ali)', () => {
    const collapsed = collapseVersions([
      v('v2', 2, '2026-07-26', 'v1', 'ENCAMINHADA'),
      v('v1', 1, '2026-06-13', null, 'APROVADA'),
    ])
    expect(collapsed[0].created_at).toBe('2026-06-13')
    expect(collapsed[0].id).toBe('v2')
  })

  it('não depende da ordem em que as versões chegam', () => {
    const desc = collapseVersions([v('v2', 2, '2026-07-26', 'v1'), v('v1', 1, '2026-06-13')])
    const asc = collapseVersions([v('v1', 1, '2026-06-13'), v('v2', 2, '2026-07-26', 'v1')])
    expect(desc[0].id).toBe('v2')
    expect(asc[0].id).toBe('v2')
    expect(desc[0].created_at).toBe(asc[0].created_at)
  })

  it('preserva a ordem das famílias na lista', () => {
    const collapsed = collapseVersions([
      v('c', 1, '2026-07-30'),
      v('a2', 2, '2026-07-20', 'a1'),
      v('a1', 1, '2026-07-01'),
      v('b', 1, '2026-05-01'),
    ])
    expect(collapsed.map((r) => r.id)).toEqual(['c', 'a2', 'b'])
  })

  it('empate no número de versão desempata pela data', () => {
    const collapsed = collapseVersions([
      v('x', 2, '2026-07-01', 'raiz'),
      v('y', 2, '2026-07-09', 'raiz'),
    ])
    expect(collapsed).toHaveLength(1)
    expect(collapsed[0].id).toBe('y')
  })

  it('quando só uma versão da família sobrou do filtro, é ela quem representa', () => {
    const collapsed = collapseVersions([v('v1', 1, '2026-07-01', null, 'APROVADA')])
    expect(collapsed[0].id).toBe('v1')
    expect(collapsed[0].created_at).toBe('2026-07-01')
  })

  it('lista vazia devolve lista vazia', () => {
    expect(collapseVersions([])).toEqual([])
  })
})

describe('stripVersionSuffix', () => {
  it('mantém código sem sufixo igual', () => {
    expect(stripVersionSuffix('NS_IMP_0023')).toBe('NS_IMP_0023')
  })

  it('remove sufixo -v2, -v3 etc.', () => {
    expect(stripVersionSuffix('NS_IMP_0023-v2')).toBe('NS_IMP_0023')
    expect(stripVersionSuffix('NS_IMP_0023-v12')).toBe('NS_IMP_0023')
  })
})

describe('versionedCode', () => {
  it('v1 fica sem sufixo', () => {
    expect(versionedCode('NS_IMP_0023', 1)).toBe('NS_IMP_0023')
  })

  it('v2+ ganha sufixo -vN', () => {
    expect(versionedCode('NS_IMP_0023', 2)).toBe('NS_IMP_0023-v2')
    expect(versionedCode('NS_IMP_0023', 3)).toBe('NS_IMP_0023-v3')
  })

  it('deriva sempre da base, mesmo partindo de um código já sufixado', () => {
    expect(versionedCode('NS_IMP_0023-v2', 3)).toBe('NS_IMP_0023-v3')
  })
})

describe('nextVersionNumber', () => {
  it('começa em 1 quando não há versões anteriores', () => {
    expect(nextVersionNumber([])).toBe(1)
  })

  it('usa a maior versão existente + 1, independente da ordem', () => {
    expect(nextVersionNumber([1])).toBe(2)
    expect(nextVersionNumber([1, 2, 3])).toBe(4)
    expect(nextVersionNumber([1, 3, 2])).toBe(4)
  })
})

describe('rootQuotationId', () => {
  it('usa o próprio id quando não tem parent (é a v1)', () => {
    expect(rootQuotationId({ id: 'v1-id', parent_id: null })).toBe('v1-id')
  })

  it('usa o parent_id quando já é uma versão posterior', () => {
    expect(rootQuotationId({ id: 'v2-id', parent_id: 'v1-id' })).toBe('v1-id')
  })
})

describe('buildNewVersionInsert', () => {
  const inherited: InheritableQuotationFields = {
    client_id: 'client-1',
    sender: 'Fazenda X',
    recipient: 'Indústria Y',
    segment: 'CAFE',
    product: 'Café verde',
    process_reference: 'PROC-123',
    validity: '10 dias',
    merchandise_value: 50000,
    vehicle_type: 'CARRETA_LS',
    value_type: 'POR_CONTAINER',
    operation_type: 'EXPORTACAO',
    operation_subtype: 'DIRETA',
    operation_detail: null,
    empty_container_port_id: 'port-1',
    insurance_rate: 0.1,
    suspended_taxes_rate: 0,
    insurance_in_total: true,
    total_value: 7413.64,
  }

  it('herda todos os campos de negócio sem alterar', () => {
    const result = buildNewVersionInsert({
      inherited,
      previousCode: 'NS_EXP_0047',
      newVersion: 2,
      rootId: 'v1-id',
      createdBy: 'user-1',
    })
    expect(result.client_id).toBe(inherited.client_id)
    expect(result.sender).toBe(inherited.sender)
    expect(result.total_value).toBe(inherited.total_value)
    expect(result.insurance_in_total).toBe(inherited.insurance_in_total)
  })

  it('isola status/PDF/token — sempre reinicia, nunca herda', () => {
    const result = buildNewVersionInsert({
      inherited,
      previousCode: 'NS_EXP_0047',
      newVersion: 2,
      rootId: 'v1-id',
      createdBy: 'user-1',
    })
    expect(result.status).toBe('RASCUNHO')
    expect(result.pdf_url).toBeNull()
    expect(result.client_token).toBeNull()
  })

  it('monta código, versão, parent_id e created_by corretos', () => {
    const result = buildNewVersionInsert({
      inherited,
      previousCode: 'NS_EXP_0047',
      newVersion: 2,
      rootId: 'v1-id',
      createdBy: 'user-1',
    })
    expect(result.code).toBe('NS_EXP_0047-v2')
    expect(result.version).toBe(2)
    expect(result.parent_id).toBe('v1-id')
    expect(result.created_by).toBe('user-1')
  })
})
