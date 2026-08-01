'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { randomLocalId } from '@/lib/utils/id'

export type ContactRow = {
  /** Só para o React distinguir as linhas — não é o id do banco. */
  key: string
  name: string
  email: string
  phone: string
  role: string
}

export type ClientContactInitial = {
  name: string | null
  email: string | null
  phone: string | null
  role: string | null
}

export function emptyContact(): ContactRow {
  return { key: randomLocalId(), name: '', email: '', phone: '', role: '' }
}

export function contactsFromInitial(initial: ClientContactInitial[]): ContactRow[] {
  return initial.map((c) => ({
    key: randomLocalId(),
    name: c.name ?? '',
    email: c.email ?? '',
    phone: c.phone ?? '',
    role: c.role ?? '',
  }))
}

/**
 * Lista de contatos ADICIONAIS do cliente (além do contato principal, que
 * continua nos campos de cima da ficha).
 *
 * Vai para o servidor como um campo escondido em JSON: são vários campos por
 * linha e um número variável de linhas — mandar tudo junto evita ter que
 * inventar nomes tipo `contato[2][email]` e desmontá-los do outro lado.
 */
export function ContactsEditor({ initial }: { initial: ClientContactInitial[] }) {
  const [contacts, setContacts] = useState<ContactRow[]>(() => contactsFromInitial(initial))

  function update(key: string, field: keyof Omit<ContactRow, 'key'>, value: string) {
    setContacts((prev) => prev.map((c) => (c.key === key ? { ...c, [field]: value } : c)))
  }

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-700">Outros contatos</p>
          <p className="text-xs text-slate-400">
            Pessoas que também recebem a cotação por e-mail (logística, financeiro…).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setContacts((prev) => [...prev, emptyContact()])}
          className="text-brand-700 hover:text-brand-800 text-sm font-medium"
        >
          + Adicionar contato
        </button>
      </div>

      <input
        type="hidden"
        name="contacts"
        value={JSON.stringify(
          contacts.map(({ name, email, phone, role }) => ({ name, email, phone, role }))
        )}
      />

      {contacts.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-400">
          Nenhum contato adicional.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {contacts.map((contact) => (
            <div
              key={contact.key}
              className="grid gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-[1fr_1fr_140px_120px_auto]"
            >
              <Input
                value={contact.name}
                onChange={(e) => update(contact.key, 'name', e.target.value)}
                placeholder="Nome"
              />
              <Input
                type="email"
                value={contact.email}
                onChange={(e) => update(contact.key, 'email', e.target.value)}
                placeholder="e-mail@empresa.com"
              />
              <Input
                value={contact.phone}
                onChange={(e) => update(contact.key, 'phone', e.target.value)}
                placeholder="Telefone"
              />
              <Input
                value={contact.role}
                onChange={(e) => update(contact.key, 'role', e.target.value)}
                placeholder="Área/cargo"
              />
              <button
                type="button"
                onClick={() => setContacts((prev) => prev.filter((c) => c.key !== contact.key))}
                className="self-center px-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
