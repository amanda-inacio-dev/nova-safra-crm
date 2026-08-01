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

type ContactInput = {
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

/**
 * Lê os contatos adicionais, que chegam como JSON num campo escondido (são
 * vários campos por linha e um número variável de linhas).
 *
 * Linha totalmente em branco é descartada em silêncio — é comum a pessoa
 * clicar em "Adicionar contato" e desistir.
 */
function parseContacts(formData: FormData): { contacts?: ContactInput[]; error?: string } {
  const raw = String(formData.get('contacts') ?? '').trim()
  if (!raw) return { contacts: [] }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { error: 'Não foi possível ler os contatos.' }
  }
  if (!Array.isArray(parsed)) return { error: 'Não foi possível ler os contatos.' }

  const contacts: ContactInput[] = []
  for (const item of parsed) {
    const row = (item ?? {}) as Record<string, unknown>
    const name = String(row.name ?? '').trim()
    const email = String(row.email ?? '').trim()
    const phone = String(row.phone ?? '').trim()
    const role = String(row.role ?? '').trim()

    if (!name && !email && !phone && !role) continue
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: `E-mail inválido no contato "${name || email}".` }
    }
    contacts.push({ name, email: email || null, phone: phone || null, role: role || null })
  }

  return { contacts }
}

/**
 * Regrava os contatos do cliente (apaga e insere de novo) — mesmo padrão já
 * usado nos filhos da cotação. Se a migration 0028 ainda não foi aplicada, o
 * cadastro do cliente não quebra: só os contatos adicionais não são salvos.
 */
async function saveContacts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: string,
  contacts: ContactInput[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from('client_contacts')
    .delete()
    .eq('client_id', clientId)

  if (deleteError) {
    console.error('[saveContacts] falha ao limpar contatos:', deleteError)
    return { error: 'Cliente salvo, mas não foi possível atualizar os contatos.' }
  }

  if (contacts.length === 0) return {}

  const { error } = await supabase
    .from('client_contacts')
    .insert(contacts.map((c) => ({ ...c, client_id: clientId })))

  if (error) {
    console.error('[saveContacts] falha ao inserir contatos:', error)
    return { error: 'Cliente salvo, mas não foi possível salvar os contatos.' }
  }
  return {}
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

  const { contacts, error: contactsError } = parseContacts(formData)
  if (contactsError || !contacts) return { error: contactsError }

  const supabase = await createClient()
  const { data: created, error: dbError } = await supabase
    .from('clients')
    .insert({ ...fields, logo_url: logoUrl })
    .select('id')
    .single()

  if (dbError || !created) return { error: 'Não foi possível salvar o cliente.' }

  if (contacts.length > 0) {
    const result = await saveContacts(supabase, created.id, contacts)
    if (result.error) return { error: result.error }
  }

  revalidatePath('/clientes')
  return { ok: true }
}

/**
 * Exclui um cliente — só Admin (a policy da migration 0029 também barra no banco).
 *
 * Cliente com cotações NÃO é excluído: o histórico comercial iria junto. Em vez
 * de deixar o erro de chave estrangeira aparecer cru, a checagem é feita antes
 * para dar um aviso com o número de cotações.
 */
export async function deleteClientAction(clientId: string): Promise<{ error?: string }> {
  await requireRole(['ADMIN'])
  if (!clientId) return { error: 'Cliente inválido.' }

  const supabase = await createClient()

  const { count, error: countError } = await supabase
    .from('quotations')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)

  if (countError) {
    console.error('[deleteClientAction] falha ao contar cotações:', countError)
    return { error: 'Não foi possível verificar as cotações do cliente.' }
  }
  if ((count ?? 0) > 0) {
    return {
      error: `Este cliente tem ${count} cotação(ões) e não pode ser excluído. Exclua ou transfira as cotações antes.`,
    }
  }

  const { error } = await supabase.from('clients').delete().eq('id', clientId)
  if (error) {
    console.error('[deleteClientAction] falha ao excluir cliente:', error)
    return { error: 'Não foi possível excluir o cliente.' }
  }

  revalidatePath('/clientes')
  return {}
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

  const { contacts, error: contactsError } = parseContacts(formData)
  if (contactsError || !contacts) return { error: contactsError }

  const supabase = await createClient()
  const { error: dbError } = await supabase.from('clients').update(update).eq('id', id)

  if (dbError) return { error: 'Não foi possível salvar as alterações.' }

  const result = await saveContacts(supabase, id, contacts)
  if (result.error) return { error: result.error }

  revalidatePath('/clientes')
  redirect('/clientes')
}
