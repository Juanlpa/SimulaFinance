'use client'
// ============================================================
// SimulaFinance — Navbar con branding institucional dinámico
// ============================================================
// TODO: Implementar menú completo de navegación por rol
// Componentes: Avatar, DropdownMenu, Sheet (mobile)
// Datos: institución desde useInstitucion(), usuario desde Supabase Auth
// ============================================================
import Link from 'next/link'
import { useInstitucion } from '@/components/theme/ThemeProvider'

export function Navbar() {
  const { institucion } = useInstitucion()

  return (
    <nav
      className="flex items-center justify-between px-6 py-3 shadow-sm"
      style={{ backgroundColor: 'var(--color-inst-primary)' }}
    >
      <div className="flex items-center gap-3">
        {institucion?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institucion.logo_url}
            alt={`Logo ${institucion.nombre}`}
            className="h-8 w-auto object-contain"
          />
        )}
        <div>
          <span className="text-white font-bold text-lg">
            {institucion?.nombre ?? 'SimulaFinance'}
          </span>
          {institucion?.slogan && (
            <p className="text-white/70 text-xs">{institucion.slogan}</p>
          )}
        </div>
      </div>

      {/* TODO: Agregar links de navegación, avatar de usuario, dropdown con logout */}
      <div className="flex items-center gap-4">
        <Link href="/cliente/simulador-credito" className="text-white/90 hover:text-white text-sm">
          Simulador
        </Link>
        <Link href="/cliente/mis-solicitudes" className="text-white/90 hover:text-white text-sm">
          Mis solicitudes
        </Link>
      </div>
    </nav>
  )
}
