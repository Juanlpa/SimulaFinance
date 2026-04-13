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
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        ¡Hola, {nombreUsuario}!
      </h1>
      <p className="text-gray-500 text-sm mb-8">¿Qué deseas hacer hoy?</p>

      {/* Accesos rápidos */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Link href="/cliente/simulador-credito" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Calculator className="size-5 text-blue-600" />
                </div>
                <ArrowRight className="size-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Simular crédito</h3>
              <p className="text-sm text-gray-500 mt-1">Calcula tu cuota y tabla de amortización</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cliente/simulador-inversion" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="size-5 text-emerald-600" />
                </div>
                <ArrowRight className="size-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Simular inversión</h3>
              <p className="text-sm text-gray-500 mt-1">Proyecta el rendimiento de tu inversión</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/cliente/mis-solicitudes" className="group">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <FileText className="size-5 text-purple-600" />
                </div>
                <ArrowRight className="size-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900">Mis solicitudes</h3>
              <p className="text-sm text-gray-500 mt-1">Revisa el estado de tus solicitudes</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Solicitudes activas */}
      {solicitudesActivas.length > 0 && (
        <div className="bg-white rounded-xl border p-5 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="size-4 text-gray-500" />
            Solicitudes activas
          </h2>
          <div className="space-y-3">
            {solicitudesActivas.map((s) => {
              const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={s.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <DollarSign className="size-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Crédito por ${s.monto.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Últimas simulaciones */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Calculator className="size-4 text-gray-500" />
            Últimas simulaciones
          </h2>
          <Link href="/cliente/mis-simulaciones" className="text-xs text-gray-500 hover:text-gray-700">
            Ver todas →
          </Link>
        </div>

        {simulaciones.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-2">Aún no has realizado simulaciones</p>
            <Link
              href="/cliente/simulador-credito"
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--color-inst-primary)' }}
            >
              Ir al simulador →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {simulaciones.map((sim) => (
              <div key={sim.id} className="flex items-center justify-between py-2.5 border-b last:border-b-0">
                <div>
                  <p className="text-sm font-medium">
                    ${sim.monto.toLocaleString()} — {sim.plazo_meses} meses
                  </p>
                  <p className="text-xs text-gray-400">
                    {sim.sistema_amortizacion === 'francesa' ? 'Francés' : 'Alemán'} •{' '}
                    {new Date(sim.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-medium" style={{ color: 'var(--color-inst-primary)' }}>
                    ${sim.cuota_final?.toFixed(2) ?? '0.00'}/mes
                  </p>
                  <p className="text-xs text-gray-400">
                    Total: ${sim.costo_total?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
