'use client'

import Image from 'next/image'
import type { CertOption } from './types'

export function CertificationsSelector({
  certifications,
  selected,
  onChange,
}: {
  certifications: CertOption[]
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  if (certifications.length === 0) {
    return <p className="text-sm text-slate-400">Nenhuma certificação cadastrada.</p>
  }

  return (
    <div className="flex flex-wrap gap-3">
      {certifications.map((cert) => {
        const checked = selected.includes(cert.id)
        return (
          <label
            key={cert.id}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 ${
              checked ? 'border-brand-600 bg-brand-50' : 'border-slate-200'
            }`}
          >
            <input type="checkbox" checked={checked} onChange={() => toggle(cert.id)} />
            {cert.image_url && (
              <Image
                src={cert.image_url}
                alt={cert.name}
                width={28}
                height={28}
                unoptimized
                className="h-7 w-7 object-contain"
              />
            )}
            <span className="text-sm text-slate-700">{cert.name}</span>
          </label>
        )
      })}
    </div>
  )
}
