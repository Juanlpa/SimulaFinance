// ============================================================
// SimulaFinance — Cliente: Dashboard
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  Loader2,
  Calculator,
  TrendingUp,
  FileText,
  ArrowRight,
  DollarSign,
  Clock,
} from 'lucide-react'

interface SimulacionReciente {
  id: string
  created_at: string
  monto: number
  plazo_meses: number
  cuota_final: number
  costo_total: number
  sistema_amortizacion: string
}

interface SolicitudActiva {
  id: string
  tipo: 'credito' | 'inversion'
  monto: number
  estado: string
  created_at: string
}

const ESTADO_BADGES: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  documentos: { label: 'Documentos', color: 'bg-blue-100 text-blue-700' },
  en_revision: { label: 'En revisión', color: 'bg-purple-100 text-purple-700' },
  aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  desembolsada: { label: 'Desembolsada', color: 'bg-emerald-100 text-emerald-700' },
}

export default function ClienteDashboardPage() {
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [simulaciones, setSimulaciones] = useState<SimulacionReciente[]>([])
  const [solicitudesActivas, setSolicitudesActivas] = useState<SolicitudActiva[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Nombre del usuario
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('nombre, apellido')
      .eq('id', user.id)
      .single()

    if (perfil) {
      setNombreUsuario(`${perfil.nombre ?? ''} ${perfil.apellido ?? ''}`.trim() || 'Usuario')
    }

    // Últimas 3 simulaciones
    const { data: sims } = await supabase
      .from('simulaciones')
      .select('id, created_at, monto, plazo_meses, cuota_final, costo_total, sistema_amortizacion')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    setSimulaciones(sims ?? [])

    // Solicitudes activas
    const { data: solCredito } = await supabase
      .from('solicitudes_credito')
      .select('id, monto, estado, created_at')
      .eq('usuario_id', user.id)
      .neq('estado', 'rechazada')
      .order('created_at', { ascending: false })
      .limit(3)

    const activas: SolicitudActiva[] = (solCredito ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      tipo: 'credito' as const,
      monto: s.monto as number,
      estado: s.estado as string,
      created_at: s.created_at as string,
    }))

    setSolicitudesActivas(activas)
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
      <div className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3 text-slate-900 drop-shadow-sm">
          ¡Hola, <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-inst-primary), var(--color-inst-accent))' }}>{nombreUsuario}</span>!
        </h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl">
          Explora tus herramientas financieras y gestiona tus solicitudes en un solo entorno consolidado.
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Link href="/cliente/simulador-credito" className="group block">
          <Card className="h-full bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-blue-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <Calculator className="size-6 text-blue-600 drop-shadow-sm" />
                </div>
                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-blue-600 transition-colors duration-300">
                  <ArrowRight className="size-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-1.5">Simular crédito</h3>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">Proyecta tu tabla de amortización y cuotas al instante.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cliente/simulador-inversion" className="group block">
          <Card className="h-full bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-emerald-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <TrendingUp className="size-6 text-emerald-600 drop-shadow-sm" />
                </div>
                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-emerald-600 transition-colors duration-300">
                  <ArrowRight className="size-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-1.5">Simular inversión</h3>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">Estima el rendimiento y crecimiento de tu capital.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cliente/mis-solicitudes" className="group block">
          <Card className="h-full bg-white/70 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 rounded-3xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 rounded-2xl bg-purple-100 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <FileText className="size-6 text-purple-600 drop-shadow-sm" />
                </div>
                <div className="p-2 rounded-full bg-slate-50 group-hover:bg-purple-600 transition-colors duration-300">
                  <ArrowRight className="size-4 text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
              <h3 className="font-bold text-xl text-slate-900 mb-1.5">Mis solicitudes</h3>
              <p className="text-[15px] text-slate-500 font-medium leading-relaxed">Monitorea el progreso y estado de tus trámites en vivo.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Solicitudes activas */}
        {solicitudesActivas.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-slate-100 rounded-xl shadow-inner">
                <Clock className="size-5 text-slate-600" />
              </div>
              Solicitudes activas
            </h2>
            <div className="space-y-4">
              {solicitudesActivas.map((s) => {
                const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-slate-100 text-slate-600' }
                return (
                  <div key={s.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors duration-300">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="size-5 text-slate-400 group-hover:text-blue-500" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 tracking-tight">Crédito por <span className="text-slate-900">${s.monto.toLocaleString()}</span></p>
                        <p className="text-sm font-medium text-slate-400">
                          {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Últimas simulaciones */}
        <div className={`bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] p-8 ${solicitudesActivas.length === 0 ? 'lg:col-span-2 max-w-4xl' : ''}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900">
              <div className="p-2 bg-slate-100 rounded-xl shadow-inner">
                <Calculator className="size-5 text-slate-600" />
              </div>
              Últimas simulaciones
            </h2>
            <Link href="/cliente/mis-simulaciones" className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </div>

          {simulaciones.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-[15px] font-medium text-slate-500 mb-3">Aún no has proyectado simulaciones</p>
              <Link
                href="/cliente/simulador-credito"
                className="inline-flex text-sm font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
                style={{ color: 'var(--color-inst-primary)' }}
              >
                Ir al simulador →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {simulaciones.map((sim) => (
                <div key={sim.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors duration-300">
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block p-2.5 bg-white shadow-sm border border-slate-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                      <FileText className="size-5 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 tracking-tight">
                        ${sim.monto.toLocaleString()} <span className="text-slate-400 font-normal mx-1">—</span> {sim.plazo_meses} meses
                      </p>
                      <p className="text-sm font-medium text-slate-500">
                        {sim.sistema_amortizacion === 'francesa' ? 'Francés' : 'Alemán'} •{' '}
                        {new Date(sim.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-mono font-bold" style={{ color: 'var(--color-inst-primary)' }}>
                      ${sim.cuota_final?.toFixed(2) ?? '0.00'}/mes
                    </p>
                    <p className="text-sm font-medium text-slate-400">
                      Total: ${sim.costo_total?.toLocaleString() ?? '0'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
