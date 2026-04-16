// ============================================================
// SimulaFinance — Layout del panel SuperAdmin
// ============================================================
import { Sidebar } from '@/components/shared/Sidebar'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute rolRequerido="superadmin">
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
