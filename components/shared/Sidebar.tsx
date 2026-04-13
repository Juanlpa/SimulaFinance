'use client'
// ============================================================
// SimulaFinance — Sidebar de navegación para panel admin
// ============================================================
// TODO: Implementar navegación completa con íconos (lucide-react)
// Items: Dashboard, Institución, Tipos de crédito, Cobros indirectos,
//        Requisitos, Tasas BCE, Productos inversión, Solicitudes, Reportes
// Datos: rol del usuario para mostrar/ocultar secciones
// ============================================================
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useInstitucion } from '@/components/theme/ThemeProvider'

const navItemsAdmin = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/institucion', label: 'Institución' },
  { href: '/admin/tipos-credito', label: 'Tipos de crédito' },
  { href: '/admin/cobros-indirectos', label: 'Cobros indirectos' },
  { href: '/admin/requisitos-credito', label: 'Requisitos' },
  { href: '/admin/tasas-referencia', label: 'Tasas BCE' },
  { href: '/admin/productos-inversion', label: 'Productos inversión' },
  { href: '/admin/solicitudes', label: 'Solicitudes' },
  { href: '/admin/reportes', label: 'Reportes' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { institucion } = useInstitucion()

  return (
    <aside
      className="w-64 min-h-screen flex flex-col py-4"
      style={{ backgroundColor: 'var(--color-inst-secondary)' }}
    >
      <div className="px-4 mb-6">
        <p className="text-white/60 text-xs uppercase tracking-wider">
          {institucion?.nombre ?? 'SimulaFinance'}
        </p>
        <p className="text-white text-sm font-semibold mt-1">Panel Administrativo</p>
      </div>

      <nav className="flex-1">
        {navItemsAdmin.map((item) => {
          const activo = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                activo
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-3 border-t border-white/20">
        {/* TODO: Mostrar nombre del admin y botón logout */}
        <p className="text-white/50 text-xs">Admin</p>
      </div>
    </aside>
  )
}
