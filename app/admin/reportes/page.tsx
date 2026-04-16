// ============================================================
// SimulaFinance — Admin: Reportes
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Loader2,
  BarChart3,
  DollarSign,
  Users,
  Calculator,
  FileText,
  TrendingUp,
} from 'lucide-react'

interface Estadisticas {
  totalSimulaciones: number
  totalSolicitudesCredito: number
  totalSolicitudesInversion: number
  montoTotalSolicitado: number
  montoTotalAprobado: number
  clientesActivos: number
  tiposMasSimulados: { nombre: string; count: number }[]
}

export default function ReportesPage() {
  const [stats, setStats] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('institucion_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.institucion_id) { setLoading(false); return }

    const [
      simRes,
      solCreditoRes,
      solInversionRes,
      montoSolicitadoRes,
      montoAprobadoRes,
      clientesRes,
    ] = await Promise.all([
      supabase.from('simulaciones').select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true }).eq('usuarios.institucion_id', perfil.institucion_id),
      supabase.from('solicitudes_credito').select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true }).eq('usuarios.institucion_id', perfil.institucion_id),
      supabase.from('solicitudes_inversion').select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true }).eq('usuarios.institucion_id', perfil.institucion_id),
      supabase.from('solicitudes_credito').select('monto, usuarios!inner(institucion_id)').eq('usuarios.institucion_id', perfil.institucion_id),
      supabase.from('solicitudes_credito').select('monto, usuarios!inner(institucion_id)').eq('estado', 'aprobada').eq('usuarios.institucion_id', perfil.institucion_id),
      supabase.from('usuarios').select('id', { count: 'exact', head: true }).eq('rol', 'cliente').eq('institucion_id', perfil.institucion_id),
    ])

    const montoTotal = (montoSolicitadoRes.data ?? []).reduce((a: number, s: { monto: number }) => a + (s.monto ?? 0), 0)
    const montoAprobado = (montoAprobadoRes.data ?? []).reduce((a: number, s: { monto: number }) => a + (s.monto ?? 0), 0)

    setStats({
      totalSimulaciones: simRes.count ?? 0,
      totalSolicitudesCredito: solCreditoRes.count ?? 0,
      totalSolicitudesInversion: solInversionRes.count ?? 0,
      montoTotalSolicitado: montoTotal,
      montoTotalAprobado: montoAprobado,
      clientesActivos: clientesRes.count ?? 0,
      tiposMasSimulados: [], // Para futura implementación con group by
    })

    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const fmt = (n: number) => `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes</h1>
      <p className="text-gray-500 text-sm mb-6">Estadísticas generales del sistema.</p>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Calculator className="size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Simulaciones</p>
              <p className="text-2xl font-bold">{stats?.totalSimulaciones ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50">
              <FileText className="size-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Solicitudes crédito</p>
              <p className="text-2xl font-bold">{stats?.totalSolicitudesCredito ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <TrendingUp className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Solicitudes inversión</p>
              <p className="text-2xl font-bold">{stats?.totalSolicitudesInversion ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-50">
              <DollarSign className="size-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto total solicitado</p>
              <p className="text-xl font-bold font-mono">{fmt(stats?.montoTotalSolicitado ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50">
              <DollarSign className="size-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Monto total aprobado</p>
              <p className="text-xl font-bold font-mono">{fmt(stats?.montoTotalAprobado ?? 0)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50">
              <Users className="size-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes activos</p>
              <p className="text-2xl font-bold">{stats?.clientesActivos ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasa de conversión */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-gray-500" />
          Tasa de conversión
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold" style={{ color: 'var(--color-inst-primary)' }}>
              {stats && stats.totalSimulaciones > 0
                ? ((stats.totalSolicitudesCredito / stats.totalSimulaciones) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Simulaciones → Solicitudes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats && stats.totalSolicitudesCredito > 0
                ? ((stats.montoTotalAprobado / stats.montoTotalSolicitado) * 100).toFixed(1)
                : '0.0'}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Monto aprobado / solicitado</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats?.clientesActivos ?? 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Clientes registrados</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        En futuras versiones se agregarán gráficos interactivos, exportación a Excel y reportes personalizados.
      </p>
    </div>
  )
}
