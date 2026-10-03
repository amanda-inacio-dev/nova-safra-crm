import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Issue #14: uma falha no aviso ao Comercial (Resend fora do ar, e-mail
// recusado, usuário inativo) não pode impedir o encerramento da cotação —
// mas precisa ficar registrada em log.

const sendNotificationEmail = vi.fn()
const notifyUser = vi.fn()
const quotationUpdates: unknown[] = []
let creator: { name: string; email: string; active: boolean } | null

/** Imita o query builder do supabase-js: todo método encadeia, e o resultado
 *  (via await, .single() ou .maybeSingle()) é o que estiver em `rows[tabela]`. */
function fakeSupabase(rows: () => Record<string, unknown>) {
  return {
    from(table: string) {
      const result = () => ({ data: rows()[table] ?? null, error: null })
      const builder: Record<string, unknown> = {}
      for (const method of ['select', 'eq', 'order', 'insert']) {
        builder[method] = () => builder
      }
      builder.update = (values: unknown) => {
        if (table === 'quotations') quotationUpdates.push(values)
        return builder
      }
      builder.single = async () => result()
      builder.maybeSingle = async () => result()
      builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(result()).then(resolve, reject)
      return builder
    },
  }
}

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('@/lib/auth/require-role', () => ({
  requireRole: vi.fn(async () => ({ id: 'op-1', role: 'OPERATION' })),
}))
vi.mock('@/lib/storage/upload-document', () => ({ uploadDocument: vi.fn() }))
vi.mock('@/lib/notifications/create-notification', () => ({
  notifyUser: (...args: unknown[]) => notifyUser(...args),
}))
vi.mock('@/lib/email/send-notification-email', () => ({
  sendNotificationEmail: (...args: unknown[]) => sendNotificationEmail(...args),
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () =>
    fakeSupabase(() => ({
      quotations: { id: 'q-1', code: 'NS_IMP_0001', created_by: 'com-1', status: 'ENCAMINHADA' },
      quotation_ctes: [{ file_url: 'https://exemplo/cte.pdf' }],
    })),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () =>
    fakeSupabase(() => ({
      users: creator,
      app_settings: { company_name: 'Nova Safra Transportes' },
    })),
}))

const { closeQuotation } = await import('./operation-actions')

describe('closeQuotation — aviso ao Comercial', () => {
  let errorSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    quotationUpdates.length = 0
    creator = { name: 'Comercial', email: 'comercial@exemplo.com', active: true }
    notifyUser.mockReset().mockResolvedValue(undefined)
    sendNotificationEmail.mockReset().mockResolvedValue({})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    warnSpy.mockRestore()
  })

  it('encerra e envia o e-mail quando tudo funciona', async () => {
    const result = await closeQuotation('q-1', new FormData())

    expect(result).toEqual({})
    expect(quotationUpdates).toContainEqual(expect.objectContaining({ status: 'CONCLUIDA' }))
    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'com-1', type: 'QUOTATION_CLOSED' })
    )
    expect(sendNotificationEmail).toHaveBeenCalledOnce()
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('encerra mesmo com o Resend fora do ar (exceção) e registra em log', async () => {
    sendNotificationEmail.mockRejectedValue(new Error('Resend indisponível'))

    const result = await closeQuotation('q-1', new FormData())

    expect(result).toEqual({})
    expect(quotationUpdates).toContainEqual(expect.objectContaining({ status: 'CONCLUIDA' }))
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[closeQuotation]'),
      expect.any(Error)
    )
  })

  it('encerra mesmo com o e-mail recusado e registra em log', async () => {
    sendNotificationEmail.mockResolvedValue({ error: 'Não foi possível enviar.' })

    const result = await closeQuotation('q-1', new FormData())

    expect(result).toEqual({})
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[closeQuotation]'),
      'Não foi possível enviar.'
    )
  })

  it('não envia e-mail para Comercial inativo, mas registra em log', async () => {
    creator = { name: 'Comercial', email: 'comercial@exemplo.com', active: false }

    const result = await closeQuotation('q-1', new FormData())

    expect(result).toEqual({})
    expect(sendNotificationEmail).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[closeQuotation]'))
  })
})
