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
    <main className="min-h-screen flex w-full bg-white relative">
      {/* Lado Izquierdo: Arte Visual / Brand */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900 overflow-hidden">
        {/* Fondo Base con gradiente dinámica */}
        <div 
          className="absolute inset-0 opacity-90 transition-colors duration-1000"
          style={{ 
             background: `linear-gradient(135deg, var(--color-inst-secondary) 0%, var(--color-inst-primary) 100%)`
          }}
        />
        
        {/* Orbes decorativos estilo Glassmorphism */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full opacity-30 mix-blend-screen blur-[80px] bg-white animate-pulse" />
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] rounded-full opacity-20 mix-blend-screen blur-[100px] bg-blue-300 animate-pulse" style={{ animationDelay: '2s' }}/>
        
        <div className="absolute inset-0 flex flex-col justify-center px-16 xl:px-24 text-white z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-left-8 duration-1000 delay-150 fill-mode-both">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Tu futuro financiero comienza aquí.
            </h1>
            <p className="text-lg xl:text-xl text-white/80 mb-10 leading-relaxed font-light">
              Únete a miles de usuarios que confían en nosotros para proyectar sus inversiones e hipotecas.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 py-12 scrollbar-hide overflow-y-auto">
        <div className="mx-auto w-full max-w-sm lg:w-[400px] animate-in fade-in slide-in-from-bottom-8 duration-700 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              {institucion?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institucion.logo_url}
                  alt={logoNombre}
                  className="h-10 w-auto rounded-lg object-contain shadow-sm"
                />
              ) : (
                <div 
                  className="size-10 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md"
                  style={{ backgroundColor: 'var(--color-inst-primary)' }}
                >
                  {logoInicial}
                </div>
              )}
              <span className="font-bold text-2xl tracking-tight text-gray-900">{logoNombre}</span>
            </div>
            
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">
              Crear cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa tus datos para empezar a cotizar.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95 duration-300 border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-nombre" className="text-gray-700">Nombre</Label>
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
                    className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 shadow-sm"
                    style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.nombre}
                  />
                  {fieldErrors.nombre && (
                    <p className="text-xs text-destructive mt-0.5">{fieldErrors.nombre}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-apellido" className="text-gray-700">Apellido</Label>
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
                    className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 shadow-sm"
                    style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.apellido}
                  />
                  {fieldErrors.apellido && (
                    <p className="text-xs text-destructive mt-0.5">{fieldErrors.apellido}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-gray-700">Correo electrónico</Label>
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
                  className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 shadow-sm"
                  style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive mt-0.5">{fieldErrors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-gray-700">Contraseña</Label>
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
                    className="h-11 pr-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 shadow-sm"
                    style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1 pt-1 opacity-80">
                    <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="text-xs text-destructive mt-0.5">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1.5 pb-2">
                <Label htmlFor="reg-confirm" className="text-gray-700">Confirmar contraseña</Label>
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
                    className="h-11 pr-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 shadow-sm"
                    style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[11px] pt-1 flex items-center gap-1 font-medium ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {password === confirmPassword ? (
                      <><CheckCircle2 className="size-3" /> Coinciden</>
                    ) : (
                      <><AlertCircle className="size-3" /> No coinciden</>
                    )}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl rounded-lg group"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    Completar registro
                    <UserPlus className="size-4 ml-2 opacity-70 group-hover:opacity-100 transition-all" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-bold hover:underline transition-colors ml-1"
                  style={{ color: 'var(--color-inst-primary)' }}
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
