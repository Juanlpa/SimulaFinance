'use client'
// ============================================================
// SimulaFinance — ProtectedRoute (client-side guard)
// ============================================================
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { RolUsuario } from '@/types'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  rolRequerido?: RolUsuario
}

export function ProtectedRoute({ children, rolRequerido }: ProtectedRouteProps) {
  const router = useRouter()
  const [verificando, setVerificando] = useState(true)
  const [permitido, setPermitido] = useState(false)

  useEffect(() => {
    let mounted = true

    async function verificar() {
      try {
        const supabase = createClient()
        
        // 1. Obtener usuario de Auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          if (mounted) {
            router.push('/login')
          }
          return
        }

        // 2. Si se requiere rol, verificar perfil en DB
        if (rolRequerido) {
          const { data: perfil, error: dbError } = await supabase
            .from('usuarios')
            .select('rol')
            .eq('id', user.id)
            .single()

          if (dbError) {
            console.error('Error al obtener perfil:', dbError)
            
            // Caso especial: Recursión RLS o error de política
            if (dbError.code === '42P17') {
              toast.error('Error de base de datos (recursión RLS). Por favor, contacte soporte.')
            } else {
              toast.error('Error al verificar permisos del usuario.')
            }
            
            if (mounted) router.push('/login')
            return
          }

          if (!perfil) {
            toast.error('No se encontró un perfil para este usuario.')
            if (mounted) router.push('/login')
            return
          }

          // Validación de jerarquía (admin puede entrar a todo)
          const esAdmin = perfil.rol === 'admin'
          const esClienteAutoalizado = perfil.rol === rolRequerido || (rolRequerido === 'cliente' && esAdmin)

          if (!esClienteAutoalizado) {
            toast.warning('No tienes permiso para acceder a esta sección.')
            if (mounted) {
              router.push(esAdmin ? '/admin/dashboard' : '/cliente/dashboard')
            }
            return
          }
        }

        if (mounted) {
          setPermitido(true)
        }
      } catch (err) {
        console.error('Error fatal en ProtectedRoute:', err)
        toast.error('Ocurrió un error inesperado al verificar la sesión.')
        if (mounted) router.push('/login')
      } finally {
        if (mounted) {
          setVerificando(false)
        }
      }
    }

    verificar()

    return () => {
      mounted = false
    }
  }, [router, rolRequerido])

  if (verificando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="size-10 text-gray-400 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Verificando sesión...</p>
      </div>
    )
  }

  if (!permitido) return null

  return <>{children}</>
}
