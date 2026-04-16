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

import { Eye, EyeOff, Loader2, AlertCircle, LogIn, ShieldCheck, Zap, Calculator } from 'lucide-react'

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
    <main className="min-h-screen flex w-full bg-slate-50 relative selection:bg-blue-500/30">
      {/* Lado Izquierdo: Formulario Mejorado */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-1/2 lg:px-20 xl:px-24 bg-white/40 backdrop-blur-3xl z-10 shadow-[20px_0_60px_rgba(0,0,0,0.02)]">
        <div className="mx-auto w-full max-w-md lg:w-[420px] animate-in fade-in slide-in-from-left-8 duration-1000 ease-out">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-slate-100/50">
            {/* Logo e Identidad Institucional */}
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
                Bienvenido
              </h2>
              <p className="text-[15px] text-slate-500 font-medium">
                Accede a tu plataforma financiera {logoNombre}.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="animate-in fade-in zoom-in-95 duration-500 ease-out border-red-200 bg-red-50 text-red-800 rounded-2xl shadow-sm">
                  <AlertCircle className="size-5" />
                  <AlertDescription className="font-semibold text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="login-email" className="text-slate-700 font-semibold ml-1 text-sm">Correo electrónico</Label>
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="login-password" className="text-slate-700 font-semibold text-sm">Contraseña</Label>
                  <Link
                    href="/reset-password"
                    className="text-[13px] font-bold transition-all hover:underline decoration-2 underline-offset-4"
                    style={{ color: 'var(--color-inst-primary)' }}
                    tabIndex={-1}
                  >
                    ¿Olvidaste tu clave?
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
                    className="h-12 pr-12 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 transition-all shadow-inner text-base tracking-widest placeholder:tracking-normal"
                    style={{ '--tw-ring-color': 'rgba(59, 130, 246, 0.15)', '--tw-border-color': 'var(--color-inst-accent)' } as any}
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
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 mt-4 text-base font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_12px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 rounded-2xl group border border-black/10"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                {loading ? (
                  <Loader2 className="size-6 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    Ingresar
                    <LogIn className="size-5 ml-2 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <p className="text-center text-[15px] text-slate-600 font-medium">
                ¿No tienes una cuenta?{' '}
                <Link
                  href="/registro"
                  className="font-extrabold hover:underline transition-all ml-1 underline-offset-4 decoration-2"
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
      <div className="hidden lg:flex relative w-0 flex-1 bg-slate-900 overflow-hidden items-center justify-center">
        {/* Fondo Base con gradiente dinámica */}
        <div 
          className="absolute inset-0 opacity-100 transition-colors duration-1000"
          style={{ 
             background: `linear-gradient(135deg, var(--color-inst-primary) 0%, var(--color-inst-secondary) 100%)`
          }}
        />
        
        {/* Capa de ruido sutil y radial */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)] mix-blend-overlay" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        {/* Orbes decorativos estilo Glassmorphism Premium */}
        <div className="absolute top-[-5%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-[0.15] mix-blend-screen blur-[120px] bg-blue-300 animate-pulse duration-[7000ms]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full opacity-[0.1] mix-blend-screen blur-[150px] bg-purple-400 animate-pulse" style={{ animationDelay: '3s', animationDuration: '8s' }}/>
        
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 text-white w-full max-w-2xl">
          <div className="animate-in fade-in slide-in-from-right-12 duration-1000 delay-200 fill-mode-both">
            <div className="inline-block p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8">
              <Zap className="size-8 text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)]" />
            </div>
            <h1 className="text-5xl xl:text-6xl font-black tracking-tight mb-8 leading-[1.1] drop-shadow-lg">
              El poder de decidir con <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">precisión.</span>
            </h1>
            <p className="text-xl xl:text-2xl text-white/80 mb-12 leading-relaxed font-light drop-shadow-sm">
              Ingresa al ecosistema de SimulaFinance, el entorno donde cada cálculo cuenta.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-default">
                <ShieldCheck className="size-10 text-emerald-400 mb-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]" />
                <h3 className="font-bold text-lg mb-2 text-white">Seguridad Bancaria</h3>
                <p className="text-sm text-white/60 font-medium leading-relaxed">Tus datos financieros están encriptados y protegidos por RLS Auth.</p>
              </div>
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-default">
                <Calculator className="size-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform drop-shadow-[0_0_10px_rgba(96,165,250,0.3)]" />
                <h3 className="font-bold text-lg mb-2 text-white">Simulación Veloz</h3>
                <p className="text-sm text-white/60 font-medium leading-relaxed">Calcula préstamos de inmediato en ecosistemas de cuota fija u ordinaria.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
