// ============================================================
// SimulaFinance — Login público por institución /app/[slug]/login
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, AlertCircle, LogIn } from 'lucide-react'
import { use } from 'react'
import type { Institucion } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default function LoginSlugPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()

  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [cargando, setCargando] = useState(true)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('instituciones')
        .select('*')
        .eq('slug', slug)
        .single()
      setInstitucion(data ?? null)
      setCargando(false)
    })()
  }, [slug])

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
        const msgs: Record<string, string> = {
          'Invalid login credentials': 'Correo o contraseña incorrectos.',
          'Email not confirmed': 'Confirma tu correo antes de ingresar.',
          'Too many requests': 'Demasiados intentos. Espera un momento.',
        }
        setError(msgs[signInError.message] ?? signInError.message)
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('No se pudo obtener el usuario.'); setLoading(false); return }

      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (perfil?.rol === 'admin') router.push('/admin/dashboard')
      else router.push('/cliente/dashboard')

    } catch {
      setError('Error inesperado. Intenta nuevamente.')
      setLoading(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const logoInicial = (institucion?.nombre ?? 'S').charAt(0).toUpperCase()

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border shadow-sm p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          {institucion?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt={institucion.nombre} className="h-12 w-auto object-contain" />
          ) : (
            <div
              className="size-12 rounded-xl flex items-center justify-center text-white font-black text-xl"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {logoInicial}
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Bienvenido</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Accede a tu cuenta en <span className="font-semibold">{institucion?.nombre ?? slug}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 rounded-xl">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm">Correo electrónico</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="h-10"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 pr-10"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full h-10 text-white font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--color-inst-primary)' }}
          >
            {loading
              ? <Loader2 className="size-4 animate-spin" />
              : <><LogIn className="size-4" /> Ingresar</>}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿No tienes cuenta?{' '}
          <a href={`/app/${slug}/registro`} className="font-semibold hover:underline" style={{ color: 'var(--color-inst-primary)' }}>
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  )
}
