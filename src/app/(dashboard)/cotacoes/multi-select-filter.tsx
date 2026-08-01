'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'

export type MultiSelectOption = { id: string; name: string }

/**
 * Filtro de múltipla escolha: um botão que abre a lista de caixas de seleção.
 *
 * Detalhe importante: a lista fica SEMPRE no HTML, só escondida por CSS quando
 * fechada. Se ela fosse removida da tela, as caixas marcadas sairiam junto e o
 * formulário enviaria o filtro vazio.
 *
 * Cada caixa marcada vira uma repetição do mesmo parâmetro na URL
 * (`?segmento=CAFE&segmento=INDUSTRIA`), que é como o servidor lê a seleção.
 */
export function MultiSelectFilter({
  name,
  label,
  options,
  selected,
}: {
  /** Nome do parâmetro na URL (ex.: "cliente"). */
  name: string
  label: string
  options: MultiSelectOption[]
  selected: string[]
}) {
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState<string[]>(selected)
  const boxRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora — sem isso ficam vários painéis abertos ao mesmo tempo.
  useEffect(() => {
    if (!open) return
    function onClickOutside(event: MouseEvent) {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function toggle(id: string) {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const summary =
    checked.length === 0
      ? 'Todos'
      : checked.length === 1
        ? (options.find((o) => o.id === checked[0])?.name ?? '1 selecionado')
        : `${checked.length} selecionados`

  return (
    <div className="flex flex-col gap-1" ref={boxRef}>
      <span className="text-xs text-slate-500">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-white px-3 text-sm',
            checked.length > 0
              ? 'border-brand-600 text-slate-900'
              : 'border-slate-300 text-slate-500'
          )}
        >
          <span className="truncate">{summary}</span>
          <span aria-hidden className="text-slate-400">
            ▾
          </span>
        </button>

        <div
          className={cn(
            'absolute z-30 mt-1 max-h-64 w-full min-w-[220px] overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg',
            !open && 'hidden'
          )}
        >
          {options.length === 0 ? (
            <p className="px-2 py-3 text-sm text-slate-400">Nada cadastrado ainda.</p>
          ) : (
            <>
              {checked.length > 0 && (
                <button
                  type="button"
                  onClick={() => setChecked([])}
                  className="mb-1 w-full rounded px-2 py-1 text-left text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Limpar seleção
                </button>
              )}
              {options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    name={name}
                    value={option.id}
                    checked={checked.includes(option.id)}
                    onChange={() => toggle(option.id)}
                    className="accent-brand-700 h-4 w-4"
                  />
                  <span className="truncate">{option.name}</span>
                </label>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
