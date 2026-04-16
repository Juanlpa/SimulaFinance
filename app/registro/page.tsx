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
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 relative selection:bg-blue-500/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent pointer-events-none" />
        <Card className="w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.08)] border-0 ring-1 ring-slate-100 bg-white/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-700 ease-out z-10 rounded-[2rem]">
          <CardContent className="pt-10 pb-8 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-white shadow-inner flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping" />
              <CheckCircle2 className="size-10 text-emerald-500 drop-shadow-sm" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">¡Cuenta creada!</h2>
            <p className="text-[15px] text-slate-500 font-medium leading-relaxed mb-6">
              Revisa tu correo electrónico para confirmar tu cuenta. Serás redirigido automáticamente...
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
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
              className="inline-block mt-6 text-[15px] font-bold transition-all hover:underline decoration-2 underline-offset-4"
              style={{ color: 'var(--color-inst-primary)' }}
            >
              Ir al login ahora →
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex w-full bg-slate-50 relative selection:bg-blue-500/30">
      {/* Lado Izquierdo: Arte Visual / Brand */}
      <div className="hidden lg:flex relative w-0 flex-1 bg-slate-900 overflow-hidden items-center justify-center">
        {/* Fondo Base con gradiente dinámica */}
        <div 
          className="absolute inset-0 opacity-100 transition-colors duration-1000"
          style={{ 
             background: `linear-gradient(135deg, var(--color-inst-secondary) 0%, var(--color-inst-primary) 100%)`
          }}
        />
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        {/* Orbes decorativos estilo Glassmorphism Premium */}
        <div className="absolute top-[-5%] right-[-15%] w-[600px] h-[600px] rounded-full opacity-[0.15] mix-blend-screen blur-[120px] bg-blue-300 animate-pulse duration-[7000ms]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full opacity-[0.1] mix-blend-screen blur-[150px] bg-purple-400 animate-pulse" style={{ animationDelay: '2s', animationDuration: '9s' }}/>
        
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 text-white w-full max-w-2xl">
          <div className="animate-in fade-in slide-in-from-left-12 duration-1000 delay-150 fill-mode-both">
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight mb-8 leading-[1.1] drop-shadow-lg">
              Tu futuro financiero <br /><span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">comienza aquí.</span>
            </h1>
            <p className="text-xl xl:text-2xl text-white/80 mb-12 leading-relaxed font-light drop-shadow-sm">
              Únete a miles de analistas y clientes que proyectan sus inversiones e hipotecas con precisión absoluta.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Formulario Estructurado Premium */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[55%] xl:w-1/2 lg:px-16 xl:px-24 py-12 bg-white/40 backdrop-blur-3xl z-10 shadow-[-20px_0_60px_rgba(0,0,0,0.02)] overflow-y-auto scrollbar-hide">
        <div className="mx-auto w-full max-w-md lg:w-[480px] animate-in fade-in slide-in-from-right-8 duration-1000 ease-out py-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100/50">
            <div className="flex items-center gap-4 mb-10 w-full justify-center">
              {institucion?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={institucion.logo_url}
                  alt={logoNombre}
                  className="h-12 w-auto rounded-xl object-contain drop-shadow-sm"
                />
              ) : (
                <div 
                  className="size-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-slate-50"
                  style={{ backgroundColor: 'var(--color-inst-primary)' }}
                >
                  {logoInicial}
                </div>
              )}
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                Crear cuenta
              </h2>
              <p className="text-[15px] text-slate-500 font-medium">
                Ingresa tus datos para acceder a las simulaciones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95 duration-500 ease-out border-red-200 bg-red-50 text-red-800 rounded-2xl shadow-sm">
                  <AlertCircle className="size-5" />
                  <AlertDescription className="font-semibold text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-nombre" className="text-slate-700 font-semibold ml-1 text-[13px]">Nombre</Label>
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
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.nombre}
                  />
                  {fieldErrors.nombre && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1">{fieldErrors.nombre}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-apellido" className="text-slate-700 font-semibold ml-1 text-[13px]">Apellido</Label>
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
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.apellido}
                  />
                  {fieldErrors.apellido && (
                    <p className="text-xs text-red-500 mt-1 font-medium ml-1">{fieldErrors.apellido}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="reg-email" className="text-slate-700 font-semibold ml-1 text-sm">Correo electrónico</Label>
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
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base"
                  style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1 font-medium ml-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-slate-700 font-semibold ml-1 text-sm">Contraseña</Label>
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
                    className="h-12 pr-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base tracking-widest placeholder:tracking-normal"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-xl hover:bg-slate-100"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {password && (
                  <div className="space-y-1.5 pt-1.5 px-1 opacity-90">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out shadow-sm ${strength.color}`}
                        style={{ width: strength.width }}
                      />
                    </div>
                  </div>
                )}
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1 font-medium ml-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2 pb-2">
                <Label htmlFor="reg-confirm" className="text-slate-700 font-semibold ml-1 text-sm">Confirmar contraseña</Label>
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
                    className="h-12 pr-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base tracking-widest placeholder:tracking-normal"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                    aria-invalid={!!fieldErrors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-xl hover:bg-slate-100"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {confirmPassword && (
                  <p className={`text-[12px] pt-1.5 ml-1 flex items-center gap-1.5 font-bold ${password === confirmPassword ? 'text-emerald-500' : 'text-red-500'}`}>
                    {password === confirmPassword ? (
                      <><CheckCircle2 className="size-3.5" /> Coinciden correctamente</>
                    ) : (
                      <><AlertCircle className="size-3.5" /> Las contraseñas no coinciden</>
                    )}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-6 text-base font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 rounded-2xl group border border-black/10"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                {loading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    Completar registro
                    <UserPlus className="size-5 ml-2 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-center text-[15px] text-slate-600 font-medium">
                ¿Ya tienes cuenta?{' '}
                <Link
                  href="/login"
                  className="font-extrabold hover:underline transition-all ml-1 underline-offset-4 decoration-2"
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
