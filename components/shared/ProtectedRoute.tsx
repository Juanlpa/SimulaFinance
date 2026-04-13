'use client'
// ============================================================
// SimulaFinance — ProtectedRoute (client-side guard)
// Para uso en Client Components que necesitan verificar rol
// La protección principal ocurre en middleware.ts (server-side)
// ============================================================
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RolUsuario } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  rolRequerido?: RolUsuario
}

export function ProtectedRoute({ children, rolRequerido }: ProtectedRouteProps) {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [permitido, setPermitido] = useState(false)

  useEffect(() => {
    async function verificar() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      if (rolRequerido) {
        const { data: perfil } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (perfil?.rol !== rolRequerido && !(rolRequerido === 'cliente' && perfil?.rol === 'admin')) {
          router.push(perfil?.rol === 'admin' ? '/admin/dashboard' : '/cliente/dashboard')
          return
        }
      }

      setPermitido(true)
      setVerificando(false)
    }

    verificar()
  }, [router, rolRequerido])

  if (verificando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!permitido) return null

  return <>{children}</>
}
