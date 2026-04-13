// ============================================================
// SimulaFinance — Página de Login UI Premium
// ============================================================
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useInstitucion } from '@/components/theme/ThemeProvider'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Eye, EyeOff, Loader2, AlertCircle, LogIn, ShieldCheck, Zap } from 'lucide-react'

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
        const mensajes: Record<string, string> = {
          'Invalid login credentials': 'Credenciales incorrectas. Verifica tu correo y contraseña.',
          'Email not confirmed': 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.',
          'Too many requests': 'Demasiados intentos. Espera un momento.',
        }
        setError(mensajes[signInError.message] || signInError.message)
        setLoading(false)
        return
      }

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

      if (rol === 'admin') router.push('/admin/dashboard')
      else router.push('/cliente/dashboard')

    } catch {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      setLoading(false)
    }
  }

  const logoNombre = institucion?.nombre ?? 'SimulaFinance'
  const logoInicial = logoNombre.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen flex w-full bg-white relative">
      {/* Lado Izquierdo: Formulario */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div>
            {/* Logo Logo Institucional Clásico (Fallback a inicial) */}
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
            
            <h2 className="mt-8 text-3xl font-extrabold text-gray-900 tracking-tight">
              Bienvenido de nuevo
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Ingresa tus credenciales para acceder a tu panel financiero.
            </p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95 duration-300 border-red-200 bg-red-50 text-red-800">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-gray-700">Correo electrónico</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                  className="h-11 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 transition-all shadow-sm"
                  style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-gray-700">Contraseña</Label>
                  <Link
                    href="/reset-password"
                    className="text-xs font-semibold transition-colors hover:underline"
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
                    className="h-11 pr-10 rounded-lg border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 transition-all shadow-sm"
                    style={{ '--tw-ring-color': 'var(--color-inst-accent)' } as any}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 mt-2 text-[15px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl rounded-lg group"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                {loading ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    Iniciar sesión
                    <LogIn className="size-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                ¿No tienes una cuenta aún?{' '}
                <Link
                  href="/registro"
                  className="font-bold hover:underline transition-colors ml-1"
                  style={{ color: 'var(--color-inst-primary)' }}
                >
                  Regístrate ahora
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Arte Visual / Brand */}
      <div className="hidden lg:block relative w-0 flex-1 bg-gray-900 overflow-hidden">
        {/* Fondo Base con gradiente dinámica */}
        <div 
          className="absolute inset-0 opacity-90 transition-colors duration-1000"
          style={{ 
             background: `linear-gradient(135deg, var(--color-inst-primary) 0%, var(--color-inst-secondary) 100%)`
          }}
        />
        
        {/* Orbes decorativos estilo Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-30 mix-blend-screen blur-[80px] bg-white animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[50%] h-[50%] rounded-full opacity-20 mix-blend-screen blur-[100px] bg-blue-300 animate-pulse" style={{ animationDelay: '2s' }}/>
        
        <div className="absolute inset-0 flex flex-col justify-center px-16 xl:px-24 text-white z-10">
          <div className="max-w-xl animate-in fade-in slide-in-from-right-8 duration-1000 delay-150 fill-mode-both">
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-6 leading-tight">
              Gestiona tus finanzas de manera inteligente.
            </h1>
            <p className="text-lg xl:text-xl text-white/80 mb-10 leading-relaxed font-light">
              Calcula cuotas, solicita facilidades crediticias e invierte todo desde un único panel diseñado para tu comodidad.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
                <ShieldCheck className="size-8 text-white/90 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Seguridad Criptográfica</h3>
                <p className="text-sm text-white/70">Tus datos financieros están protegidos con RLS y Auth avanzado.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
                <Zap className="size-8 text-white/90 mb-3" />
                <h3 className="font-semibold text-lg mb-1">Cálculos Ultrarrápidos</h3>
                <p className="text-sm text-white/70">Simulaciones instantáneas ajustadas a la ley ecuatoriana.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
