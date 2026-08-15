import { requireRole } from '@/lib/auth/require-role'
import { createClient } from '@/lib/supabase/server'
import { EmailTemplatesManager, type EmailTemplateRow } from './email-templates-manager'
import type { EmailTemplateKey } from '@/types'

const EMAIL_TEMPLATE_KEYS: EmailTemplateKey[] = [
  'client_followup_request',
  'prospection_industria',
  'prospection_cafe',
  'birthday_message',
]

export default async function TextosPadraoPage() {
  await requireRole(['ADMIN'])

  const supabase = await createClient()
  // Se a migration 0034 ainda não rodou, a consulta falha e a tela abre com
  // os campos vazios em vez de quebrar — mesmo raciocínio usado em
  // /admin/configuracoes para tabelas novas.
  const { data } = await supabase.from('email_templates').select('key, subject, body, image_url')
  const rows = (data ?? []) as EmailTemplateRow[]
  const items: EmailTemplateRow[] = EMAIL_TEMPLATE_KEYS.map(
    (key) => rows.find((t) => t.key === key) ?? { key, subject: '', body: '', image_url: null }
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Textos Padrão</h1>
        <p className="mt-1 text-slate-500">
          Textos de e-mail usados como ponto de partida — quem for enviar pode ajustar na hora, isso
          aqui é só o padrão.
        </p>
      </div>

      <EmailTemplatesManager items={items} />
    </div>
  )
}
