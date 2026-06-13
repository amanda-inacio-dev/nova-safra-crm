'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils/cn'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const inputClass = cn(
  'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900',
  'placeholder:text-slate-400',
  'focus:border-brand-600 focus:ring-brand-600 focus:ring-1 focus:outline-none'
)

type PlaceAutocomplete = {
  addListener: (event: string, handler: () => void) => void
  getPlace: () => { formatted_address?: string; name?: string }
}

type GoogleMaps = {
  maps: {
    places: {
      Autocomplete: new (
        input: HTMLInputElement,
        opts?: Record<string, unknown>
      ) => PlaceAutocomplete
    }
  }
}

declare global {
  interface Window {
    google?: GoogleMaps
    __novaSafraMapsPromise?: Promise<void>
  }
}

/** Carrega o script do Google Maps Places uma única vez. */
function loadMaps(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.maps?.places) return Promise.resolve()
  if (window.__novaSafraMapsPromise) return window.__novaSafraMapsPromise

  window.__novaSafraMapsPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places&language=pt-BR`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Falha ao carregar Google Maps'))
    document.head.appendChild(script)
  })
  return window.__novaSafraMapsPromise
}

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  'aria-label'?: string
}

export function AddressInput({ value, onChange, placeholder, ...rest }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!MAPS_KEY || !inputRef.current) return
    let cancelled = false

    loadMaps()
      .then(() => {
        if (cancelled || !inputRef.current || !window.google) return
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'name'],
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          onChange(place.formatted_address ?? place.name ?? inputRef.current?.value ?? '')
        })
      })
      .catch(() => {
        /* silencioso: cai no comportamento de texto normal */
      })

    return () => {
      cancelled = true
    }
    // onChange é estável (vem do componente pai); roda só uma vez na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={rest['aria-label']}
    />
  )
}
