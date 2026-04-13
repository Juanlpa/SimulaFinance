// ============================================================
// SimulaFinance — Layout del panel Cliente
// ============================================================
import type { Metadata } from 'next'
import { Sidebar } from '@/components/shared/Sidebar'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export const metadata: Metadata = {
  title: 'SimulaFinance — Área Clientes',
}

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute rolRequerido="cliente">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-50/50 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
