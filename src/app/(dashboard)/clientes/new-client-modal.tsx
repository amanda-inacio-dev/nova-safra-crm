'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { ClientForm } from './client-form'
import { createClientAction } from './actions'

export function NewClientModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)}>Novo cliente</Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo cliente">
        <ClientForm
          action={createClientAction}
          onSuccess={() => {
            setOpen(false)
            router.refresh()
          }}
          onCancel={() => setOpen(false)}
        />
      </Modal>
    </>
  )
}
