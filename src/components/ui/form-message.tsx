import { cn } from '@/lib/utils/cn'

type Props = {
  type?: 'error' | 'success'
  children: React.ReactNode
}

export function FormMessage({ type = 'error', children }: Props) {
  if (!children) return null
  return (
    <p
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        type === 'error'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-green-200 bg-green-50 text-green-700'
      )}
    >
      {children}
    </p>
  )
}
