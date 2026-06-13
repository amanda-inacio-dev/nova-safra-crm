import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="from-brand-900 to-brand-700 flex min-h-screen flex-1 flex-col items-center justify-center bg-gradient-to-br px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="rounded-xl bg-white p-3 shadow-lg">
            <Image
              src="/assets/logo-nova-safra.jpeg"
              alt="Nova Safra Gestão Logística"
              width={160}
              height={64}
              priority
              className="h-12 w-auto"
            />
          </div>
        </div>
        <div className="rounded-xl bg-white p-8 shadow-xl">{children}</div>
        <p className="mt-6 text-center text-xs text-white/70">
          Nova Safra Gestão Logística — Sistema de Cotações
        </p>
      </div>
    </div>
  )
}
