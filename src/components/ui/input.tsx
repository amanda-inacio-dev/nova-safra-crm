'use client'

import { cn } from '@/lib/utils/cn'

export function Input({
  className,
  onWheel,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus:border-brand-600 focus:ring-brand-600 focus:ring-1 focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-slate-50',
        // Campos numéricos: apenas digitação (sem setas ▲▼)
        '[appearance:textfield] [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:[-webkit-appearance:none] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:[-webkit-appearance:none]',
        className
      )}
      // Impede que o scroll do mouse altere o valor de campos numéricos
      onWheel={(e) => {
        if (props.type === 'number') e.currentTarget.blur()
        onWheel?.(e)
      }}
      {...props}
    />
  )
}
