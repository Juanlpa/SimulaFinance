// ============================================================
// SimulaFinance — Página de Registro
// ============================================================
// Registro de nuevos clientes con Supabase Auth.
// Flujo:
//   1. Ingresa: nombre, apellido, email, contraseña, confirmar contraseña
//   2. Validaciones client-side (email, contraseña ≥8, contraseñas coinciden)
//   3. supabase.auth.signUp() con metadata { nombre, apellido }
//   4. Trigger en BD crea fila en `usuarios` automáticamente
//   5. Mostrar mensaje de confirmación → redirigir a /login tras 3s
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useInstitucion } from '@/components/theme/ThemeProvider'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  UserPlus,
} from 'lucide-react'

interface FormErrors {
  nombre?: string
  apellido?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegistroPage() {
  const router = useRouter()
  const { institucion } = useInstitucion()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({})

  // Redirigir a /login tras 3 segundos de éxito
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/login')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, router])

  // Validaciones reactivas
  const validate = (): boolean => {
    const errors: FormErrors = {}

    if (!nombre.trim()) errors.nombre = 'El nombre es requerido.'
    if (!apellido.trim()) errors.apellido = 'El apellido es requerido.'

    if (!email.trim()) {
      errors.email = 'El correo es requerido.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo válido.'
    }

    if (!password) {
      errors.password = 'La contraseña es requerida.'
    } else if (password.length < 8) {
      errors.password = 'Mínimo 8 caracteres.'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirma tu contraseña.'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden.'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)

    try {
      const supabase = createClient()

      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            apellido: apellido.trim(),
          },
        },
      })

      if (signUpError) {
        const mensajes: Record<string, string> = {
          'User already registered': 'Ya existe una cuenta con este correo electrónico.',
          'Password should be at least 6 characters': 'La contraseña debe tener al menos 8 caracteres.',
          'Signup requires a valid password': 'Ingresa una contraseña válida.',
        }
        setError(mensajes[signUpError.message] || signUpError.message)
        setLoading(false)
        return
      }

      // Éxito
      setSuccess(true)
      setLoading(false)
    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      setLoading(false)
    }
  }

  const logoNombre = institucion?.nombre ?? 'SimulaFinance'
  const logoInicial = logoNombre.charAt(0).toUpperCase()

  // Indicador de fuerza de contraseña
  const getPasswordStrength = (): { label: string; color: string; width: string } => {
    if (!password) return { label: '', color: '', width: '0%' }
    if (password.length < 6) return { label: 'Débil', color: 'bg-red-400', width: '25%' }
    if (password.length < 8) return { label: 'Regular', color: 'bg-yellow-400', width: '50%' }
    if (password.length < 12) return { label: 'Buena', color: 'bg-blue-400', width: '75%' }
    return { label: 'Fuerte', color: 'bg-green-400', width: '100%' }
  }

  const strength = getPasswordStrength()

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 py-8">
        <Card className="w-full max-w-sm shadow-lg border-0 ring-1 ring-black/5">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Revisa tu correo electrónico para confirmar tu cuenta.
              Serás redirigido al login en unos segundos...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-[3000ms] ease-linear"
                style={{
                  backgroundColor: 'var(--color-inst-primary)',
                  width: '100%',
                  animation: 'progress-fill 3s linear forwards',
                }}
              />
            </div>
            <style>{`
              @keyframes progress-fill {
                from { width: 0%; }
                to { width: 100%; }
              }
            `}</style>
            <Link
              href="/login"
              className="inline-block mt-4 text-sm font-medium hover:underline"
              style={{ color: 'var(--color-inst-accent)' }}
            >
              Ir al login ahora →
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 px-4 py-8">
      {/* Fondo decorativo */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--color-inst-primary) 0%, transparent 50%), radial-gradient(circle at 80% 50%, var(--color-inst-accent) 0%, transparent 50%)`,
        }}
      />

      <Card className="w-full max-w-md relative z-10 shadow-lg border-0 ring-1 ring-black/5">
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
          <CardTitle className="text-xl font-bold text-gray-900">Crear cuenta</CardTitle>
          <CardDescription className="text-gray-500">
            Regístrate como cliente en {logoNombre}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alerta de error */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1 duration-300">
                <AlertCircle className="size-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-nombre">Nombre</Label>
                <Input
                  id="reg-nombre"
                  type="text"
                  placeholder="Juan"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value)
                    if (fieldErrors.nombre) setFieldErrors((p) => ({ ...p, nombre: undefined }))
                  }}
                  required
                  disabled={loading}
                  className="h-10"
                  aria-invalid={!!fieldErrors.nombre}
                />
                {fieldErrors.nombre && (
                  <p className="text-xs text-destructive mt-0.5">{fieldErrors.nombre}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-apellido">Apellido</Label>
                <Input
                  id="reg-apellido"
                  type="text"
                  placeholder="Pérez"
                  value={apellido}
                  onChange={(e) => {
                    setApellido(e.target.value)
                    if (fieldErrors.apellido) setFieldErrors((p) => ({ ...p, apellido: undefined }))
                  }}
                  required
                  disabled={loading}
                  className="h-10"
                  aria-invalid={!!fieldErrors.apellido}
                />
                {fieldErrors.apellido && (
                  <p className="text-xs text-destructive mt-0.5">{fieldErrors.apellido}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-email">Correo electrónico</Label>
              <Input
                id="reg-email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
                }}
                required
                autoComplete="email"
                disabled={loading}
                className="h-10"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-xs text-destructive mt-0.5">{fieldErrors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
                  }}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-10 pr-10"
                  aria-invalid={!!fieldErrors.password}
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
              {/* Indicador de fuerza */}
              {password && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Fuerza: {strength.label}</p>
                </div>
              )}
              {fieldErrors.password && (
                <p className="text-xs text-destructive mt-0.5">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-confirm">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }))
                  }}
                  required
                  autoComplete="new-password"
                  disabled={loading}
                  className="h-10 pr-10"
                  aria-invalid={!!fieldErrors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Indicador de coincidencia */}
              {confirmPassword && (
                <p className={`text-xs flex items-center gap-1 ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {password === confirmPassword ? (
                    <><CheckCircle2 className="size-3" /> Las contraseñas coinciden</>
                  ) : (
                    <><AlertCircle className="size-3" /> Las contraseñas no coinciden</>
                  )}
                </p>
              )}
              {fieldErrors.confirmPassword && !confirmPassword && (
                <p className="text-xs text-destructive mt-0.5">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Botón submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="size-4" />
                  Crear cuenta
                </>
              )}
            </Button>
          </form>

          {/* Link a login */}
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--color-inst-accent)' }}
            >
              Iniciar sesión
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
