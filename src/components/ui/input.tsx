import { cn } from '@/lib/utils/cn'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900',
        'placeholder:text-slate-400',
        'focus:border-brand-600 focus:ring-brand-600 focus:ring-1 focus:outline-none',
        'disabled:cursor-not-allowed disabled:bg-slate-50',
        className
      )}
      {...props}
    />
  )
}
