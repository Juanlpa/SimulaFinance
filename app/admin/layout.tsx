// ============================================================
// SimulaFinance — Layout del panel Admin
// ============================================================
// Propósito: Envuelve todas las páginas /admin/* con:
//   - Sidebar de navegación
//   - Verificación de rol 'admin' (refuerzo client-side)
//   - ThemeProvider ya activo desde root layout
//
// Componentes:
//   - Sidebar (components/shared/Sidebar.tsx)
//   - ProtectedRoute con rolRequerido="admin"
// ============================================================
import type { Metadata } from 'next'
import { Sidebar } from '@/components/shared/Sidebar'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export const metadata: Metadata = {
  title: 'Panel Admin — SimulaFinance',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute rolRequerido="admin">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 bg-gray-50 overflow-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
