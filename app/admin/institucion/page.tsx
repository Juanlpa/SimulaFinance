// ============================================================
// SimulaFinance — Admin: Configuración de la Institución
// ============================================================
// Carga los datos de la institución del admin actual y renderiza
// el formulario de configuración completo.
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InstitucionForm } from '@/components/admin/InstitucionForm'
import type { Institucion } from '@/types'
import { Loader2, Link2, Copy, CheckCheck, Calculator, UserPlus } from 'lucide-react'

export default function InstitucionPage() {
  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState<string | null>(null)

  const copiar = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto)
    setCopiado(key)
    setTimeout(() => setCopiado(null), 2000)
  }

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Obtener el perfil del admin (con institucion_id)
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('institucion_id')
        .eq('id', user.id)
        .single()

      if (perfil?.institucion_id) {
        // Cargar la institución
        const { data: inst } = await supabase
          .from('instituciones')
          .select('*')
          .eq('id', perfil.institucion_id)
          .single()

        setInstitucion(inst ?? null)
      }

      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const slug = (institucion as any)?.slug as string | null

  const links = slug ? [
    {
      key: 'simulador',
      label: 'Simulador público',
      desc: 'Cualquier persona puede simular sin registrarse',
      icon: <Calculator className="size-4" />,
      url: `${base}/app/${slug}`,
    },
    {
      key: 'registro',
      label: 'Link de registro',
      desc: 'Comparte este link a tus clientes para que se registren',
      icon: <UserPlus className="size-4" />,
      url: `${base}/app/${slug}/registro`,
    },
  ] : []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración de la institución</h1>
      <p className="text-gray-500 text-sm mb-6">
        Personaliza el branding de tu institución. Los cambios se reflejan en todo el sistema.
      </p>

      {/* Links de acceso público */}
      {slug ? (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
            <Link2 className="size-4" /> Links de tu institución
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Comparte estos links con tus clientes. Cada uno está vinculado exclusivamente a <span className="font-medium text-gray-600">{institucion?.nombre}</span>.
          </p>
          <div className="space-y-3">
            {links.map(l => (
              <div key={l.key} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 border">
                <div className="text-gray-400 shrink-0">{l.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-600 mb-0.5">{l.label}</p>
                  <p className="text-xs text-gray-400 mb-1">{l.desc}</p>
                  <p className="font-mono text-xs text-gray-700 truncate">{l.url}</p>
                </div>
                <button
                  onClick={() => copiar(l.url, l.key)}
                  className="shrink-0 inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                  style={copiado === l.key
                    ? { backgroundColor: '#d1fae5', color: '#065f46' }
                    : { backgroundColor: 'var(--color-inst-primary)', color: 'white' }}
                >
                  {copiado === l.key
                    ? <><CheckCheck className="size-3" /> Copiado</>
                    : <><Copy className="size-3" /> Copiar</>}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 mb-6 flex items-start gap-2">
          <Link2 className="size-4 mt-0.5 shrink-0" />
          <span>Configura el <strong>slug</strong> de tu institución para obtener los links de registro y simulador públicos.</span>
        </div>
      )}

      <InstitucionForm
        institucionInicial={institucion}
        adminUsuarioId={userId}
      />
    </div>
  )
}
