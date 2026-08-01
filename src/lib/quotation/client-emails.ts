/**
 * Reúne os e-mails de um cliente: o principal (cadastrado direto no cliente)
 * mais os contatos adicionais (tabela `client_contacts`, migration 0028).
 *
 * Usado tanto na tela de envio ao cliente quanto na hora de disparar o e-mail.
 */

export type ClientContact = {
  name: string | null
  email: string | null
  role?: string | null
}

export type ClientEmailOption = {
  email: string
  /** Como identificar essa pessoa na tela ("Maria — Logística"). */
  label: string
  /** Contato principal do cliente (o cadastrado direto na ficha). */
  primary: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim())
}

/**
 * Monta a lista de destinatários possíveis, sem repetir e-mail (comparação sem
 * caixa: "Ana@x.com" e "ana@x.com" são a mesma pessoa) e ignorando endereços
 * inválidos ou vazios. O contato principal vem primeiro.
 */
export function clientEmailOptions(
  client: { name?: string | null; contact_name?: string | null; email?: string | null },
  contacts: ClientContact[]
): ClientEmailOption[] {
  const options: ClientEmailOption[] = []
  const seen = new Set<string>()

  function add(email: string | null | undefined, label: string, primary: boolean) {
    const clean = (email ?? '').trim()
    if (!clean || !isValidEmail(clean)) return
    const key = clean.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    options.push({ email: clean, label, primary })
  }

  add(client.email, client.contact_name?.trim() || client.name?.trim() || 'Contato principal', true)

  for (const contact of contacts) {
    const name = contact.name?.trim()
    const role = contact.role?.trim()
    const label = [name || 'Contato', role].filter(Boolean).join(' — ')
    add(contact.email, label, false)
  }

  return options
}
