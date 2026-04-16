// ============================================================
// SimulaFinance — Selector de institución para registro
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface InstitucionItem {
  id: string
  nombre: string
  slogan: string | null
  slug: string
  logo_url: string | null
  color_primario: string
}

export default function RegistroSelectorPage() {
  const [instituciones, setInstituciones] = useState<InstitucionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    let activo = true
    ;(async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('instituciones')
        .select('id, nombre, slogan, slug, logo_url, color_primario')
        .order('nombre')
      if (!activo) return
      const conSlug = ((data ?? []) as InstitucionItem[]).filter(i => !!i.slug)
      setInstituciones(conSlug)
      setLoading(false)
    })()
    return () => { activo = false }
  }, [])

  const filtradas = instituciones.filter(i =>
    i.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-slate-900 text-white font-black text-2xl mb-4 shadow-lg">
          S
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">¿En qué institución te vas a registrar?</h1>
        <p className="text-gray-500 text-sm">Selecciona tu institución financiera para crear tu cuenta.</p>
      </div>

      <div className="w-full max-w-md">
        {/* Buscador */}
        {instituciones.length > 4 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Buscar institución..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            {busqueda ? 'No se encontraron instituciones.' : 'No hay instituciones disponibles.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map(inst => (
              <a
                key={inst.id}
                href={`/app/${inst.slug}/registro`}
                className="flex items-center gap-4 bg-white rounded-xl border px-5 py-4 hover:shadow-md hover:border-gray-300 transition-all group cursor-pointer"
              >
                {/* Logo o inicial */}
                {inst.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={inst.logo_url}
                    alt={inst.nombre}
                    className="size-11 rounded-lg object-contain shrink-0"
                  />
                ) : (
                  <div
                    className="size-11 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: inst.color_primario }}
                  >
                    {inst.nombre.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{inst.nombre}</p>
                  {inst.slogan && (
                    <p className="text-xs text-gray-400 truncate">{inst.slogan}</p>
                  )}
                </div>

                <ArrowRight className="size-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </a>
            ))}
          </div>
        )}

        <p className="text-center text-sm text-gray-400 mt-8">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-gray-700 font-semibold hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </main>
  )
}
