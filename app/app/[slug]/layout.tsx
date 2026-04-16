// ============================================================
// SimulaFinance — Layout público por institución (/app/[slug])
// Carga la institución por slug e inyecta su theme visual
// ============================================================
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateCSSString } from '@/lib/theme/dynamic-colors'
import type { Institucion } from '@/types'

interface Props {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export default async function SlugLayout({ children, params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: inst } = await supabase
    .from('instituciones')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!inst) notFound()

  const institucion = inst as Institucion
  const cssVars = generateCSSString({
    primario: institucion.color_primario,
    secundario: institucion.color_secundario,
    acento: institucion.color_acento,
  })

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <div className="min-h-screen bg-gray-50">
        {/* Header público */}
        <header className="border-b bg-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
            {institucion.logo_url && (
              <img src={institucion.logo_url} alt={institucion.nombre} className="h-9 w-auto object-contain" />
            )}
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight">{institucion.nombre}</h1>
              {institucion.slogan && (
                <p className="text-xs text-gray-500">{institucion.slogan}</p>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <a
                href={`/app/${slug}/registro`}
                className="text-sm font-medium px-4 py-1.5 rounded-lg border"
                style={{ color: 'var(--color-inst-primary)', borderColor: 'var(--color-inst-primary)' }}
              >
                Registrarse
              </a>
              <a
                href={`/app/${slug}/login`}
                className="text-sm font-medium text-white px-4 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-inst-primary)' }}
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>

        <footer className="border-t bg-white mt-12">
          <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-400 text-center">
            {institucion.nombre}
            {institucion.telefono && ` · ${institucion.telefono}`}
            {institucion.email && ` · ${institucion.email}`}
          </div>
        </footer>
      </div>
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: inst } = await supabase.from('instituciones').select('nombre, slogan').eq('slug', slug).single()
  return {
    title: inst ? `Simulador — ${inst.nombre}` : 'SimulaFinance',
    description: inst?.slogan ?? 'Simulador de créditos e inversiones',
  }
}
