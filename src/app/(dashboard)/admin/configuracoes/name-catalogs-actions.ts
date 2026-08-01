'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import type { ConfigActionState } from './additionals-actions'

/** As 4 listas simples de sugestão (mesmo formato: id, name, active) — Remetentes,
 *  Destinatários, Origens e Destinos. Uma única action genérica evita repetir 4x o
 *  mesmo CRUD; a tabela vem pré-presa via `.bind(null, table)` no componente. */
const CATALOG_TABLES = ['senders', 'recipients', 'route_origins', 'route_destinations'] as const
export type CatalogTable = (typeof CATALOG_TABLES)[number]

function isCatalogTable(value: string): value is CatalogTable {
  return (CATALOG_TABLES as readonly string[]).includes(value)
}

export async function createCatalogItem(
  table: CatalogTable,
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])
  if (!isCatalogTable(table)) return { error: 'Lista inválida.' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return { error: 'Informe o nome.' }

  const supabase = await createClient()
  const { error } = await supabase.from(table).insert({ name })
  if (error) return { error: 'Não foi possível criar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function updateCatalogItem(
  table: CatalogTable,
  _prev: ConfigActionState,
  formData: FormData
): Promise<ConfigActionState> {
  await requireRole(['ADMIN'])
  if (!isCatalogTable(table)) return { error: 'Lista inválida.' }

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  if (!id) return { error: 'Registro inválido.' }
  if (!name) return { error: 'Informe o nome.' }

  const supabase = await createClient()
  const { error } = await supabase.from(table).update({ name }).eq('id', id)
  if (error) return { error: 'Não foi possível salvar.' }

  revalidatePath('/admin/configuracoes')
  return { ok: true }
}

export async function toggleCatalogItem(table: CatalogTable, formData: FormData): Promise<void> {
  await requireRole(['ADMIN'])
  if (!isCatalogTable(table)) return

  const id = String(formData.get('id') ?? '')
  const active = String(formData.get('active') ?? '') === 'true'
  if (!id) return

  const supabase = await createClient()
  await supabase.from(table).update({ active }).eq('id', id)
  revalidatePath('/admin/configuracoes')
}
