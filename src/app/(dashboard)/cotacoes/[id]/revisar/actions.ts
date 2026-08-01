'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getQuotationPdfData } from '@/lib/pdf/get-quotation-data'
import { renderQuotationHtml } from '@/lib/pdf/template'
import { htmlToPdfBuffer } from '@/lib/pdf/generate'
import { sendQuotationEmail } from '@/lib/email/send-quotation-email'
import { uploadImage } from '@/lib/storage/upload-image'

const PDF_BUCKET = 'quotation-pdfs'
const SIGNATURE_BUCKET = 'signatures'

/** Gera o PDF da cotação, salva no Storage e vincula a URL à cotação. */
export async function generateQuotationPdf(
  quotationId: string
): Promise<{ url?: string; error?: string }> {
  await requireRole(['ADMIN', 'COMMERCIAL'])

  const data = await getQuotationPdfData(quotationId)
  if (!data) return { error: 'Cotação não encontrada.' }

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await htmlToPdfBuffer(renderQuotationHtml(data))
  } catch (e) {
    // O motivo real vai pro log do servidor E pra tela: quem chega aqui já passou
    // pelo requireRole acima (Admin/Comercial), e sem isso uma falha em produção
    // vira adivinhação — foi exatamente o que aconteceu no 1º deploy.
    const detail = e instanceof Error ? e.message : String(e)
    console.error('[generateQuotationPdf] falha ao renderizar o PDF:', e)
    return { error: `Não foi possível gerar o PDF: ${detail}` }
  }

  // Caminho único a cada geração (não só uma query string): um "?v=" na URL pode ser
  // ignorado por alguma camada de CDN/cache na frente do Storage, então o navegador
  // continuaria mostrando o arquivo antigo. Um caminho de arquivo genuinamente novo
  // elimina essa ambiguidade — não tem como confundir com uma versão anterior.
  const admin = createAdminClient()
  const path = `${quotationId}/${Date.now()}.pdf`
  const { error: uploadError } = await admin.storage
    .from(PDF_BUCKET)
    .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: false })
  if (uploadError) {
    console.error('[generateQuotationPdf] falha ao subir o PDF no Storage:', uploadError)
    return { error: `Não foi possível salvar o PDF gerado: ${uploadError.message}` }
  }

  const {
    data: { publicUrl },
  } = admin.storage.from(PDF_BUCKET).getPublicUrl(path)

  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from('quotations')
    .update({ pdf_url: publicUrl })
    .eq('id', quotationId)
  if (updateError) {
    console.error('[generateQuotationPdf] falha ao vincular o PDF à cotação:', updateError)
    return { error: `PDF gerado, mas não foi possível vincular à cotação: ${updateError.message}` }
  }

  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  return { url: publicUrl }
}

/** Confirma a cotação: exige um PDF já gerado e avança o status de RASCUNHO para PRONTA. */
export async function confirmQuotation(quotationId: string): Promise<{ error?: string }> {
  await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const { data: quotation } = await supabase
    .from('quotations')
    .select('pdf_url, status')
    .eq('id', quotationId)
    .single()

  if (!quotation?.pdf_url) return { error: 'Gere o PDF antes de confirmar.' }
  if (quotation.status !== 'RASCUNHO') return { error: 'Esta cotação já foi confirmada.' }

  const { error } = await supabase
    .from('quotations')
    .update({ status: 'PRONTA' })
    .eq('id', quotationId)
  if (error) return { error: 'Não foi possível confirmar a cotação.' }

  // Fica na própria tela de revisão (não redireciona) — é aqui que aparece o botão
  // "Enviar por e-mail" assim que a cotação sai de RASCUNHO.
  revalidatePath(`/cotacoes/${quotationId}/revisar`)
  revalidatePath('/cotacoes')
  return {}
}

/** Gera (se preciso) o link único do cliente, envia por e-mail via Resend e avança
 *  o status para AGUARDANDO_CLIENTE. Se o Resend não estiver configurado, ainda
 *  assim devolve o link para a equipe compartilhar manualmente. */
export async function sendQuotationToClient(
  quotationId: string,
  customMessage?: string
): Promise<{ url?: string; warning?: string; error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])
  const supabase = await createClient()

  const { data: sender } = await supabase
    .from('users')
    .select('signature_url')
    .eq('id', profile.id)
    .single()

  const { data: quotation } = await supabase
    .from('quotations')
    .select(
      'id, code, status, pdf_url, client_token, parent_id, version, client:clients(name, email)'
    )
    .eq('id', quotationId)
    .single()

  const client = quotation?.client as unknown as { name: string; email: string | null } | null
  if (!quotation) return { error: 'Cotação não encontrada.' }
  if (!quotation.pdf_url) return { error: 'Gere o PDF antes de enviar.' }
  if (quotation.status === 'RASCUNHO')
    return { error: 'Confirme a cotação antes de enviar ao cliente.' }
  if (!client?.email) return { error: 'O cliente não tem e-mail cadastrado.' }

  // Só a versão mais recente da família pode ser enviada ao cliente.
  const rootId = quotation.parent_id ?? quotation.id
  const { data: family } = await supabase
    .from('quotations')
    .select('version')
    .or(`id.eq.${rootId},parent_id.eq.${rootId}`)
  const maxVersion = Math.max(...((family ?? []) as { version: number }[]).map((f) => f.version), 0)
  if (quotation.version < maxVersion) {
    return { error: 'Só a versão mais recente desta cotação pode ser enviada ao cliente.' }
  }

  let token = quotation.client_token as string | null
  if (!token) {
    token = randomUUID()
    const { error: tokenError } = await supabase
      .from('quotations')
      .update({ client_token: token })
      .eq('id', quotationId)
    if (tokenError) return { error: 'Não foi possível gerar o link do cliente.' }
  }

  const { error: statusError } = await supabase
    .from('quotations')
    .update({ status: 'AGUARDANDO_CLIENTE' })
    .eq('id', quotationId)
  if (statusError) return { error: 'Não foi possível atualizar o status da cotação.' }

  const { data: settings } = await supabase
    .from('app_settings')
    .select('company_name')
    .eq('id', 1)
    .single()
  const companyName = settings?.company_name ?? 'Nova Safra Gestão Logística'
  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cotacao/${token}`

  const { error: emailError } = await sendQuotationEmail({
    to: client.email,
    clientName: client.name,
    quotationCode: quotation.code ?? '',
    companyName,
    portalUrl,
    customMessage: customMessage?.trim() || null,
    senderName: profile.name,
    signatureUrl: sender?.signature_url ?? null,
  })

  revalidatePath(`/cotacoes/${quotationId}/revisar`)

  if (emailError)
    return { url: portalUrl, warning: `Link gerado, mas o e-mail não foi enviado: ${emailError}` }
  return { url: portalUrl }
}

/** Salva a assinatura (imagem) do usuário logado — aparece no e-mail enviado ao
 *  cliente. Fica ligada ao usuário (não à cotação), então só precisa subir uma vez. */
export async function updateMySignature(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const profile = await requireRole(['ADMIN', 'COMMERCIAL'])

  const file = formData.get('signature')
  if (!(file instanceof File) || file.size === 0) return { error: 'Selecione uma imagem.' }

  const { url, error: uploadError } = await uploadImage(SIGNATURE_BUCKET, file, `${profile.id}/`)
  if (uploadError || !url) return { error: uploadError ?? 'Não foi possível enviar a assinatura.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('update_my_signature', { p_signature_url: url })
  if (error) return { error: 'Não foi possível salvar a assinatura.' }

  return { url }
}
