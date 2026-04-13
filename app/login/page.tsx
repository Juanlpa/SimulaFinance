// ============================================================
// SimulaFinance — Página de Login
// ============================================================
// Autenticación real con Supabase Auth.
// Flujo:
//   1. Usuario ingresa email + contraseña
//   2. supabase.auth.signInWithPassword()
//   3. Éxito → leer rol de usuario → redirigir según rol
//   4. Error → mostrar mensaje descriptivo
// ============================================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useInstitucion } from '@/components/theme/ThemeProvider'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { institucion } = useInstitucion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        // Mapear mensajes de error de Supabase a mensajes en español
        const mensajes: Record<string, string> = {
          'Invalid login credentials': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
          'Email not confirmed': 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.',
          'Too many requests': 'Demasiados intentos. Espera un momento antes de volver a intentar.',
        }
        setError(mensajes[signInError.message] || signInError.message)
        setLoading(false)
        return
      }

      // Obtener el rol del usuario
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No se pudo obtener la información del usuario.')
        setLoading(false)
        return
      }

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      const rol = perfil?.rol ?? 'cliente'

      // Redirigir según el rol
      if (rol === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/cliente/dashboard')
      }
    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      setLoading(false)
    }
  }

  const logoNombre = institucion?.nombre ?? 'SimulaFinance'
  const logoInicial = logoNombre.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 py-8">
      {/* Fondo decorativo sutil */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--color-inst-primary) 0%, transparent 50%), radial-gradient(circle at 80% 50%, var(--color-inst-accent) 0%, transparent 50%)`,
        }}
      />

      <Card className="w-full max-w-sm relative z-10 shadow-lg border-0 ring-1 ring-black/5">
        <CardHeader className="text-center pb-2">
          {/* Logo institucional */}
          <div className="flex justify-center mb-2">
            {institucion?.logo_url ? (
              <img
                src={institucion.logo_url}
                alt={logoNombre}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md transition-transform hover:scale-105"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                {logoInicial}
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Iniciar sesión</CardTitle>
          <CardDescription className="text-gray-500">
            Accede a {logoNombre}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alerta de error */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1 duration-300">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="h-10"
              />
            </div>

            {/* Password con toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Contraseña</Label>
                <Link
                  href="/reset-password"
                  className="text-xs font-medium hover:underline transition-colors"
                  style={{ color: 'var(--color-inst-accent)' }}
                  tabIndex={-1}
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Botón submit */}
            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-10 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  <LogIn className="size-4" />
                  Iniciar sesión
                </>
              )}
            </Button>
          </form>

          {/* Link a registro */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link
              href="/registro"
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--color-inst-accent)' }}
            >
              Regístrate
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
