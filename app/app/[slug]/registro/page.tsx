// ============================================================
// SimulaFinance — Registro público por institución /app/[slug]/registro
// El cliente queda asignado automáticamente a la institución del slug
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, UserPlus } from 'lucide-react'
import { use } from 'react'
import type { Institucion } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default function RegistroSlugPage({ params }: Props) {
  const { slug } = use(params)
  const router = useRouter()

  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [cargando, setCargando] = useState(true)

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

  // Cargar institución por slug
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

  // Redirigir tras registro exitoso
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => router.push(`/login`), 3000)
      return () => clearTimeout(t)
    }
  }, [success, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nombre.trim() || !apellido.trim()) { setError('Nombre y apellido son requeridos.'); return }
    if (password.length < 8) { setError('La contraseña debe tener mínimo 8 caracteres.'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return }
    if (!institucion) { setError('No se pudo cargar la institución.'); return }

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
            institucion_id: institucion.id,   // ← siempre la institución correcta
          },
        },
      })

      if (signUpError) {
        const msgs: Record<string, string> = {
          'User already registered': 'Ya existe una cuenta con este correo.',
        }
        setError(msgs[signUpError.message] ?? signUpError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('Error inesperado. Intenta nuevamente.')
    } finally {
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

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center bg-white rounded-2xl border p-10 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
        <p className="text-gray-500 text-sm">
          Revisa tu correo para confirmar tu cuenta. Serás redirigido al login...
        </p>
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

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Crear cuenta</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Registro en <span className="font-semibold">{institucion?.nombre ?? slug}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800 rounded-xl">
              <AlertCircle className="size-4" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Nombre</Label>
              <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" className="h-10" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Apellido</Label>
              <Input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="Pérez" className="h-10" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Correo electrónico</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" className="h-10" required />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Contraseña</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="h-10 pr-10"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                className="h-10 pr-10"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="size-3" /> Las contraseñas no coinciden
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 text-white font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--color-inst-primary)' }}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <><UserPlus className="size-4" /> Crear cuenta</>}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <a href={`/app/${slug}/login`} className="font-semibold hover:underline" style={{ color: 'var(--color-inst-primary)' }}>
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  )
}
