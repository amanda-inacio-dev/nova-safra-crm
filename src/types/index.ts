export type { Database } from './database.types'

export type UserRole = 'ADMIN' | 'COMMERCIAL' | 'OPERATION'

export type QuotationStatus =
  | 'RASCUNHO'
  | 'PRONTA'
  | 'AGUARDANDO_CLIENTE'
  | 'APROVADA'
  | 'REPROVADA'
  | 'ENCAMINHADA'
  | 'CONCLUIDA'

export type OperationType = 'IMPORTACAO' | 'EXPORTACAO'

export type VehicleType = 'CARRETA_LS' | 'RODOTREM' | 'BITRUCK'

export type ValueType = 'POR_CONTAINER' | 'POR_VEICULO' | 'POR_OPERACAO'

export type Segment = 'CAFE' | 'INDUSTRIA'

export type QuotationEventType =
  | 'APPROVED'
  | 'REJECTED'
  | 'COMMENTED'
  | 'FORWARDED'
  | 'REVISION_REQUESTED'
  | 'CLOSED'

export type NotificationType =
  | 'CLIENT_APPROVED'
  | 'CLIENT_REJECTED'
  | 'CLIENT_COMMENTED'
  | 'FORWARDED_TO_OPERATION'
  | 'REVISION_REQUESTED'
  | 'QUOTATION_CLOSED'
