// ============================================================
// SimulaFinance — Landing Page UI Premium
// ============================================================
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Institucion } from '@/types'
import { ArrowRight, Calculator, FileText, TrendingUp, ShieldCheck, Zap } from 'lucide-react'

export default async function HomePage() {
  let institucion: Institucion | null = null

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

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
    // Modo demo
  }

  const nombre = institucion?.nombre ?? 'SimulaFinance'
  const slogan = institucion?.slogan ?? 'Simulador Financiero Inteligente'
  const logoInicial = nombre.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen flex flex-col bg-white overflow-hidden selection:bg-white/30 selection:text-white">
      {/* Navbar Transparente Flotante */}
      <header className="absolute top-0 left-0 right-0 z-50 py-6 px-6 lg:px-12 flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-1000">
        <div className="flex items-center gap-3">
          {institucion?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt={nombre} className="h-9 w-auto rounded-md shadow-sm" />
          ) : (
             <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold text-xl shadow-lg border border-white/20">
               {logoInicial}
             </div>
          )}
          <span className="font-bold text-2xl tracking-tight text-white drop-shadow-sm">{nombre}</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-white/90 hover:text-white text-sm font-semibold transition-colors">
            Iniciar sesión
          </Link>
          <Link 
            href="/registro" 
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full font-medium text-sm shadow-xl transition-all hover:scale-105"
          >
            Únete ahora
          </Link>
        </div>
      </header>

      {/* Hero Section Dinámico con Glassmorphism */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 pt-20 pb-16">
        {/* Fondo animado multicapa */}
        <div 
          className="absolute inset-0 transition-colors duration-1000 z-0"
          style={{ background: `var(--color-inst-primary)` }}
        >
          {/* Capas radiales para profundidad */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right_bottom,rgba(255,255,255,0.1),rgba(0,0,0,0.2))] mix-blend-overlay" />
        </div>
        
        {/* Orbes animadas de fondo */}
        <div className="absolute top-1/4 left-[15%] w-[400px] h-[400px] bg-white/20 blur-[100px] rounded-full mix-blend-overlay animate-pulse z-0 pointer-events-none" />
        <div className="absolute bottom-1/4 right-[10%] w-[500px] h-[500px] bg-blue-400/30 blur-[120px] rounded-full mix-blend-overlay animate-pulse z-0 pointer-events-none" style={{ animationDelay: '2s'}}/>

        {/* Contenido Hero */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center rounded-full bg-white/10 border border-white/10 px-3 py-1 text-sm font-medium text-white mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="size-4 mr-2 text-yellow-300" fill="currentColor"/>
            <span>Motor financiero actualizado 2026</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-md animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
            Proyecta tu futuro con <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">precisión absoluta</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            {slogan}. Simula hipotecas, créditos de consumo e inversiones bajo 
            la normativa estricta del Ecuador con una experiencia de usuario sin precedentes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500 fill-mode-both">
            <Link
              href="/registro"
              className="px-8 py-4 rounded-full font-bold text-[15px] shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all transform hover:-translate-y-1 bg-white text-gray-900 flex items-center justify-center group"
            >
              Comienza tu cálculo
              <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        {/* Mockup / Elemento decorativo inferior */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-[80%] max-w-4xl opacity-50 blur-sm mix-blend-overlay z-0 pointer-events-none">
           <div className="h-64 w-full bg-white/20 rounded-t-3xl border-t border-x border-white/30 backdrop-blur-xl" />
        </div>
      </section>

      {/* Características (Cards Flotantes Premium) */}
      <section className="py-24 px-6 bg-gray-50 relative z-20 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              ¿Por qué elegir nuestro simulador?
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Diseñado tanto para clientes como analistas de crédito que requieren resultados exactos y rápidos.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
              <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Calculator className="size-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Créditos de Consumo</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Sistemas Francés (cuota fija) y Alemán (capital fijo), integrando automáticamente la contribución de SOLCA y seguros vigentes.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 delay-100">
              <div className="size-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <TrendingUp className="size-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Inversiones a Plazo</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Calcula rendimientos sobre depósitos a plazo fijo o planes de ahorro programado. Conoce exactamente tu rentabilidad mensual y total.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 delay-200">
              <div className="size-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <ShieldCheck className="size-7" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Experiencia Segura</h3>
              <p className="text-gray-500 leading-relaxed text-sm">
                Sube tus documentos con total seguridad. Usa biometría facial para procesar solicitudes sin necesidad de ir a una agencia presencial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="bg-white border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            {institucion?.logo_url ? (
              <img src={institucion.logo_url} alt="Logo" className="w-6 h-6 grayscale opacity-60" />
            ) : (
              <div className="w-6 h-6 rounded bg-gray-200" />
            )}
            <span className="font-semibold text-gray-400">{nombre}</span>
          </div>
          <div className="text-xs text-gray-400 text-center md:text-right">
            <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
            <p className="mt-1">Regulado por normas financieras del BCE.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
