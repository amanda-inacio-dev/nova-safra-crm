'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { validateCnpj } from '@/lib/utils/cnpj'

export type ClientActionState = {
  error?: string
  ok?: boolean
}

const LOGO_BUCKET = 'client-logos'
const MAX_LOGO_BYTES = 5 * 1024 * 1024 // 5 MB

type ClientFields = {
  name: string
  contact_name: string | null
  cnpj: string | null
  email: string | null
  phone: string | null
  notes: string | null
}

function parseFields(formData: FormData): { fields?: ClientFields; error?: string } {
  const name = String(formData.get('name') ?? '').trim()
  const contact_name = String(formData.get('contact_name') ?? '').trim()
  const cnpj = String(formData.get('cnpj') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const phone = String(formData.get('phone') ?? '').trim()
  const notes = String(formData.get('notes') ?? '').trim()

  if (!name) return { error: 'A razão social é obrigatória.' }
  if (cnpj && !validateCnpj(cnpj)) return { error: 'CNPJ inválido.' }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'E-mail inválido.' }
  }

  return {
    fields: {
      name,
      contact_name: contact_name || null,
      cnpj: cnpj || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    },
  }
}

/** Envia a logo ao Storage e retorna a URL pública, ou erro. */
async function uploadLogo(file: File): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'A logo deve ser um arquivo de imagem.' }
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: 'A logo deve ter no máximo 5 MB.' }
  }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: 'Não foi possível enviar a logo.' }

  const {
    data: { publicUrl },
  } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path)

  return { url: publicUrl }
}

export async function createClientAction(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const { fields, error } = parseFields(formData)
  if (error || !fields) return { error }

  let logoUrl: string | null = null
  const logo = formData.get('logo')
  if (logo instanceof File && logo.size > 0) {
    const result = await uploadLogo(logo)
    if (result.error) return { error: result.error }
    logoUrl = result.url ?? null
  }

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('clients').insert({ ...fields, logo_url: logoUrl })

  if (dbError) return { error: 'Não foi possível salvar o cliente.' }

  revalidatePath('/clientes')
  return { ok: true }
}

export async function updateClientAction(
  _prev: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const id = String(formData.get('id') ?? '')
  if (!id) return { error: 'Cliente inválido.' }

  const { fields, error } = parseFields(formData)
  if (error || !fields) return { error }

  const update: Record<string, unknown> = { ...fields }

  const logo = formData.get('logo')
  if (logo instanceof File && logo.size > 0) {
    const result = await uploadLogo(logo)
    if (result.error) return { error: result.error }
    update.logo_url = result.url
  }

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('clients').update(update).eq('id', id)

  if (dbError) return { error: 'Não foi possível salvar as alterações.' }

  revalidatePath('/clientes')
  redirect('/clientes')
}
