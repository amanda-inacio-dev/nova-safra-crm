import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Envia uma imagem a um bucket público do Storage e retorna a URL pública.
 * Valida tipo (image/*) e tamanho (≤ 5 MB). Uso exclusivo no servidor.
 */
export async function uploadImage(
  bucket: string,
  file: File,
  prefix = ''
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { error: 'O arquivo deve ser uma imagem.' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: 'A imagem deve ter no máximo 5 MB.' }
  }

  const admin = createAdminClient()
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${prefix}${crypto.randomUUID()}.${ext}`

  const { error } = await admin.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) return { error: 'Não foi possível enviar a imagem.' }

  const {
    data: { publicUrl },
  } = admin.storage.from(bucket).getPublicUrl(path)

  return { url: publicUrl }
}
