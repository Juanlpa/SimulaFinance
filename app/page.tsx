// ============================================================
// SimulaFinance — Landing Page
// ============================================================
// Propósito: Página de inicio con branding institucional dinámico.
//   - Muestra logo, nombre, slogan y colores de la institución
//   - CTA para iniciar sesión o registrarse
//   - Resumen de funcionalidades: simulador de créditos e inversiones
//   - Requiere: ThemeProvider activo en layout.tsx
//
// Componentes a usar (cuando se implemente):
//   - Navbar (sin autenticación, modo público)
//   - Card con CTAs de login/registro
//   - Sección de características
//   - NotaLegal al pie
//
// Datos desde Supabase:
//   - instituciones (nombre, logo, slogan, colores) → ya cargado en layout
// ============================================================
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Institucion } from '@/types'

export default async function HomePage() {
  let institucion: Institucion | null = null

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Redirección inteligente si ya está logueado
    if (session) {
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', session.user.id)
        .single()
      
      if (perfil?.rol === 'admin') {
        const { redirect } = await import('next/navigation')
        redirect('/admin/dashboard')
      } else {
        const { redirect } = await import('next/navigation')
        redirect('/cliente/dashboard')
      }
    }

    const { data } = await supabase.from('instituciones').select('*').limit(1).single()
    institucion = data ?? null
  } catch {
    // Sin configuración o error de sesión — modo demo o continuar
  }

  const nombre = institucion?.nombre ?? 'SimulaFinance'
  const slogan = institucion?.slogan ?? 'Simulador de créditos e inversiones'

  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center flex-1 text-white py-24 px-6 text-center"
        style={{ backgroundColor: 'var(--color-inst-primary)' }}
      >
        {institucion?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={institucion.logo_url}
            alt={`Logo ${nombre}`}
            className="h-20 w-auto object-contain mb-6"
          />
        )}
        <h1 className="text-4xl font-bold mb-3">{nombre}</h1>
        <p className="text-xl text-white/80 mb-8 max-w-lg">{slogan}</p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            style={{ backgroundColor: 'var(--color-inst-accent)', color: '#fff' }}
          >
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="px-6 py-3 rounded-lg font-semibold text-sm border border-white/40 text-white hover:bg-white/10 transition-colors"
          >
            Registrarse gratis
          </Link>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
            ¿Qué puedes hacer con SimulaFinance?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-inst-primary)' }}>
                Simulador de Créditos
              </h3>
              <p className="text-gray-600 text-sm">
                Calcula tablas de amortización francesa (cuota fija) y alemana (capital fijo).
                Incluye todos los cobros indirectos: SOLCA, seguros y más.
                Genera un PDF institucional completo.
              </p>
            </div>
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-inst-primary)' }}>
                Simulador de Inversiones
              </h3>
              <p className="text-gray-600 text-sm">
                Proyecta el rendimiento de depósitos a plazo fijo, ahorro programado y
                ahorro con objetivo. Conoce cuánto ganarás y cuándo recibirás tu dinero.
              </p>
            </div>
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-inst-primary)' }}>
                Solicitud en línea
              </h3>
              <p className="text-gray-600 text-sm">
                Si te interesa un crédito o inversión, puedes iniciar la solicitud formal
                con análisis de capacidad de pago, subida de documentos y validación biométrica.
              </p>
            </div>
            <div className="border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--color-inst-primary)' }}>
                Cumplimiento legal ecuatoriano
              </h3>
              <p className="text-gray-600 text-sm">
                Tasas ajustadas a las resoluciones del BCE, contribución SOLCA según el
                Código Orgánico Monetario y validación de cédula y RUC ecuatorianos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-6 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} {nombre} — Simulador financiero académico</p>
        <p className="mt-1">
          Tasas conforme a la Codificación de Resoluciones Monetarias del Banco Central del Ecuador.
        </p>
      </footer>
    </main>
  )
}
