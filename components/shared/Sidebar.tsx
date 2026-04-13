'use client'
// ============================================================
// SimulaFinance — Sidebar de navegación (Admin y Cliente)
// ============================================================

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useInstitucion } from '@/components/theme/ThemeProvider'
import { 
  BarChart3,
  Building2,
  CreditCard,
  Receipt,
  FileCheck,
  TrendingUp,
  Layers,
  LayoutDashboard,
  FileText,
  PieChart,
  LogOut,
  ChevronLeft,
  Settings,
  Calculator,
  History,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Configuración de ítems por rol
const NAV_ITEMS_ADMIN = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/institucion', label: 'Institución', icon: Building2 },
  { href: '/admin/tipos-credito', label: 'Tipos de crédito', icon: Layers },
  { href: '/admin/cobros-indirectos', label: 'Cobros indirectos', icon: Receipt },
  { href: '/admin/requisitos-credito', label: 'Requisitos', icon: FileCheck },
  { href: '/admin/tasas-referencia', label: 'Tasas BCE', icon: TrendingUp },
  { href: '/admin/productos-inversion', label: 'Productos inversión', icon: CreditCard },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/solicitudes', label: 'Solicitudes', icon: FileText },
  { href: '/admin/reportes', label: 'Reportes', icon: PieChart },
]

const NAV_ITEMS_CLIENTE = [
  { href: '/cliente/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/cliente/simulador-credito', label: 'Simulador Crédito', icon: Calculator },
  { href: '/cliente/simulador-inversion', label: 'Simulador Inversión', icon: TrendingUp },
  { href: '/cliente/mis-solicitudes', label: 'Mis Solicitudes', icon: FileText },
  { href: '/cliente/mis-simulaciones', label: 'Mis Simulaciones', icon: History },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { institucion } = useInstitucion()
  const [role, setRole] = useState<'admin' | 'cliente' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
        setRole(perfil?.rol || 'cliente')
      }
      setLoading(false)
    }
    checkRole()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Error al cerrar sesión')
    } else {
      toast.success('Sesión cerrada correctamente')
      router.push('/login')
      router.refresh()
    }
  }

  const items = role === 'admin' ? NAV_ITEMS_ADMIN : NAV_ITEMS_CLIENTE

  if (loading) return <aside className="w-64 min-h-screen border-r bg-gray-50/50" />

  return (
    <aside
      className="w-64 min-h-screen flex flex-col py-6 sticky top-0"
      style={{ backgroundColor: 'var(--color-inst-secondary)' }}
    >
      {/* Cabecera Sidebar */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-white flex items-center justify-center font-bold text-lg" style={{ color: 'var(--color-inst-primary)' }}>
            {institucion?.nombre?.charAt(0) || 'S'}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-bold truncate">
              {institucion?.nombre ?? 'SimulaFinance'}
            </p>
            <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">
              Panel {role}
            </p>
          </div>
        </div>
      </div>

      {/* Ítem de Navegación */}
      <nav className="flex-1 px-3 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const activo = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                activo
                  ? 'bg-white/15 text-white font-medium shadow-sm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`size-4.5 transition-colors ${activo ? 'text-white' : 'text-white/40 group-hover:text-white/80'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer Sidebar (Logout) */}
      <div className="px-3 pt-4 mt-auto border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer group"
        >
          <LogOut className="size-4.5 text-white/40 group-hover:text-red-400/80 transition-colors" />
          Cerrar sesión
        </button>
        <div className="mt-4 px-3">
          <p className="text-[10px] text-white/30 font-medium">SimulaFinance v1.0.RC</p>
        </div>
      </div>
    </aside>
  )
}
