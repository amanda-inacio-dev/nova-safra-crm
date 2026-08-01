/**
 * Rótulos em português dos campos de domínio da cotação.
 *
 * Centralizados aqui porque a mesma tradução é usada no PDF, na lista mestra
 * e nos filtros — antes cada tela tinha a própria cópia do mapa.
 */

export const OPERATION_TYPE_LABEL: Record<string, string> = {
  IMPORTACAO: 'Importação',
  EXPORTACAO: 'Exportação',
}

export const SEGMENT_LABEL: Record<string, string> = {
  CAFE: 'Café',
  INDUSTRIA: 'Indústria',
}

export const VEHICLE_LABEL: Record<string, string> = {
  CARRETA_LS: 'Carreta LS',
  RODOTREM: 'Rodotrem',
  BITRUCK: 'Bitruck',
}

export const VALUE_TYPE_LABEL: Record<string, string> = {
  POR_CONTAINER: 'Por container',
  POR_VEICULO: 'Por veículo',
  POR_OPERACAO: 'Por operação',
}

/** Traduz um código, caindo em "—" quando o campo está vazio no banco. */
export function labelOf(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '—'
  return map[value] ?? value
}
