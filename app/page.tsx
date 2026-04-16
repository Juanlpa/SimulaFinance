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
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-900">
      {/* Navbar Transparente Flotante */}
      <header className="absolute top-0 left-0 right-0 z-50 py-6 px-6 lg:px-12 flex justify-between items-center animate-in fade-in slide-in-from-top-8 duration-1000 ease-out">
        <div className="flex items-center gap-3 group cursor-pointer">
          {institucion?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={institucion.logo_url} alt={nombre} className="h-10 w-auto rounded-xl shadow-md transition-transform group-hover:scale-105" />
          ) : (
             <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center text-white font-extrabold text-xl shadow-[0_4px_30px_rgba(0,0,0,0.1)] border border-white/30 transition-transform group-hover:scale-105 group-hover:bg-white/30">
               {logoInicial}
             </div>
          )}
          <span className="font-extrabold text-2xl tracking-tight text-white drop-shadow-md group-hover:text-white/90 transition-colors">{nombre}</span>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/login" className="text-white hover:text-white/80 text-sm font-semibold transition-all duration-300">
            Iniciar sesión
          </Link>
          <Link 
            href="/registro" 
            className="px-6 py-2.5 bg-white/10 hover:bg-white/25 backdrop-blur-xl text-white border border-white/30 rounded-full font-bold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 hover:scale-105 hover:shadow-[0_8px_40px_rgb(255,255,255,0.2)] active:scale-95"
          >
            Únete ahora
          </Link>
        </div>
      </header>

      {/* Hero Section Dinámico con Glassmorphism */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 pt-32 pb-24 overflow-hidden rounded-b-[3rem] lg:rounded-b-[4rem] shadow-2xl">
        {/* Fondo animado multicapa avanzado */}
        <div 
          className="absolute inset-0 transition-colors duration-1000 z-0 bg-slate-900"
          style={{ background: `linear-gradient(135deg, var(--color-inst-primary) 0%, var(--color-inst-secondary) 100%)` }}
        >
          {/* Capas radiales para profundidad */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent mix-blend-overlay" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right_bottom,rgba(255,255,255,0.15),rgba(0,0,0,0.4))] mix-blend-overlay" />
          
          {/* Textura sutil (opcional) */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        </div>
        
        {/* Orbes animadas de fondo */}
        <div className="absolute top-1/4 left-[15%] w-[500px] h-[500px] bg-white/20 blur-[120px] rounded-full mix-blend-overlay animate-pulse z-0 pointer-events-none duration-[4000ms]" />
        <div className="absolute bottom-1/4 right-[10%] w-[600px] h-[600px] bg-blue-400/30 blur-[150px] rounded-full mix-blend-overlay animate-pulse z-0 pointer-events-none duration-[5000ms]" style={{ animationDelay: '1s'}}/>

        {/* Contenido Hero */}
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center mt-8">
          <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm font-semibold text-white mb-8 backdrop-blur-md shadow-lg animate-in fade-in zoom-in-95 slide-in-from-bottom-8 duration-700 ease-out hover:bg-white/15 transition-colors cursor-default">
            <Zap className="size-4 mr-2 text-yellow-300 drop-shadow-sm" fill="currentColor"/>
            <span className="tracking-wide">Motor financiero de última generación</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-white tracking-tighter leading-[1.05] mb-8 drop-shadow-xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-150 fill-mode-both">
            Proyecta tu futuro con <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/40 drop-shadow-sm">precisión absoluta</span>
          </h1>
          
          <p className="text-lg lg:text-2xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed font-light animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 fill-mode-both">
            {slogan}. Simula hipotecas, créditos e inversiones bajo normativa ecuatoriana en una experiencia premium inigualable.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500 fill-mode-both">
            <Link
              href="/registro"
              className="px-8 py-4 rounded-2xl font-bold text-base shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] transition-all duration-300 transform hover:-translate-y-1 bg-white text-gray-900 flex items-center justify-center group active:scale-95"
            >
              Comienza tu cálculo ahora
              <ArrowRight className="ml-2 size-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
          </div>
        </div>
        
        {/* Mockup Premium / Glass Pane Inferior */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[90%] md:w-[70%] max-w-5xl z-20 animate-in fade-in slide-in-from-bottom-24 duration-1200 delay-700 fill-mode-both">
           <div className="h-48 md:h-72 w-full bg-white/10 backdrop-blur-2xl rounded-t-[2.5rem] border-t border-x border-white/30 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
             {/* Decorative abstract lines inside the mockup to make it look like a dashboard wireframe */}
             <div className="w-[85%] h-[80%] rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-4 p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/20 to-transparent blur-3xl" />
                <div className="w-1/3 h-4 bg-white/20 rounded-full" />
                <div className="flex gap-4">
                  <div className="w-1/2 h-24 bg-white/10 rounded-xl" />
                  <div className="w-1/2 h-24 bg-white/10 rounded-xl" />
                </div>
                <div className="w-full h-12 bg-white/10 rounded-xl mt-auto" />
             </div>
           </div>
        </div>
      </section>

      {/* Características (Cards Flotantes Premium) */}
      <section className="pt-32 pb-24 px-6 bg-slate-50 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both" style={{ animationDelay: '200ms' }}>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              ¿Por qué elegir nuestro simulador?
            </h2>
            <p className="mt-6 text-xl text-slate-500 max-w-3xl mx-auto font-light leading-relaxed">
              Diseñado estructuralmente para la excelencia visual y operativa. Entregando resultados exactos tanto a clientes analistas como a empresas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 px-4">
            <div className="group bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-500 ease-out relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
                <Calculator className="size-32" />
              </div>
              <div className="size-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Calculator className="size-8" />
              </div>
              <h3 className="font-extrabold text-2xl mb-4 text-slate-900 tracking-tight">Créditos Exactos</h3>
              <p className="text-slate-500 leading-relaxed text-base font-medium">
                Sistemas Francés y Alemán, integrando automáticamente contribuciones SOLCA y seguros vigentes. Sin errores, sin latencia.
              </p>
            </div>

            <div className="group bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-500 ease-out delay-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
                <TrendingUp className="size-32" />
              </div>
              <div className="size-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <TrendingUp className="size-8" />
              </div>
              <h3 className="font-extrabold text-2xl mb-4 text-slate-900 tracking-tight">Inversiones Claras</h3>
              <p className="text-slate-500 leading-relaxed text-base font-medium">
                Calcula rendimientos sobre depósitos fijos o planes programados. Visualiza tu rentabilidad detallada mes a mes.
              </p>
            </div>

            <div className="group bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-500 ease-out delay-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-500 group-hover:scale-110 transform">
                <ShieldCheck className="size-32" />
              </div>
              <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-8 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <ShieldCheck className="size-8" />
              </div>
              <h3 className="font-extrabold text-2xl mb-4 text-slate-900 tracking-tight">Seguridad Bancaria</h3>
              <p className="text-slate-500 leading-relaxed text-base font-medium">
                Arquitectura blindada. Tus datos financieros y simulaciones están protegidos por encriptación avanzada y Row Level Security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Premium Minimalista */}
      <footer className="bg-white border-t border-slate-100 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="flex items-center gap-3">
            {institucion?.logo_url ? (
              <img src={institucion.logo_url} alt="Logo" className="w-8 h-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">{logoInicial}</div>
            )}
            <span className="font-bold text-slate-800 text-lg tracking-tight">{nombre}</span>
          </div>
          <div className="text-sm text-slate-500 text-center md:text-right font-medium">
            <p>© {new Date().getFullYear()} Todos los derechos reservados.</p>
            <p className="mt-1 text-slate-400">Desarrollado bajo marco regulatorio BCE.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
