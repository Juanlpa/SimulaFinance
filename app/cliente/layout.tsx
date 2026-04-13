// ============================================================
// SimulaFinance — Layout del panel Cliente
// ============================================================
import type { Metadata } from 'next'
import { Navbar } from '@/components/shared/Navbar'

export const metadata: Metadata = {
  title: 'SimulaFinance',
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
