import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024 // 10 MB

/** Envia um PDF a um bucket público do Storage e retorna a URL pública.
 *  Mesma ideia de uploadImage() (src/lib/storage/upload-image.ts), mas para
 *  documentos (ex.: CT-e) em vez de imagens. Uso exclusivo no servidor. */
export async function uploadDocument(
  bucket: string,
  file: File,
  prefix = ''
): Promise<{ url?: string; error?: string }> {
  if (file.type !== 'application/pdf') {
    return { error: 'O arquivo deve ser um PDF.' }
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: 'O arquivo deve ter no máximo 10 MB.' }
  }

  const admin = createAdminClient()
  const path = `${prefix}${crypto.randomUUID()}.pdf`

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) return { error: 'Não foi possível enviar o arquivo.' }

  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(path)

  return { url: publicUrl }
}
