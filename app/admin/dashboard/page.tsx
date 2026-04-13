// ============================================================
// SimulaFinance — Admin: Dashboard (con métricas y solicitudes)
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  FileText,
  CheckCircle,
  XCircle,
  Calculator,
  Users,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface Metricas {
  pendientes: number
  aprobadas: number
  rechazadas: number
  simulacionesMes: number
  clientes: number
  inversionesPendientes: number
}

interface SolicitudReciente {
  id: string
  created_at: string
  monto: number
  cuota_final: number
  estado: string
  usuario_nombre: string
  tipo_credito_nombre: string
}

const ESTADO_BADGES: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  documentos: { label: 'Documentos', color: 'bg-blue-100 text-blue-700' },
  en_revision: { label: 'En revisión', color: 'bg-purple-100 text-purple-700' },
  aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  desembolsada: { label: 'Desembolsada', color: 'bg-emerald-100 text-emerald-700' },
}

export default function AdminDashboardPage() {
  const [metricas, setMetricas] = useState<Metricas | null>(null)
  const [recientes, setRecientes] = useState<SolicitudReciente[]>([])
  const [loading, setLoading] = useState(true)

  const cargarDatos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('institucion_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.institucion_id) { setLoading(false); return }
    const instId = perfil.institucion_id

    // Métricas en paralelo
    const [
      pendientesRes,
      aprobadasRes,
      rechazadasRes,
      simulacionesRes,
      clientesRes,
      inversionesRes,
      recientesRes,
    ] = await Promise.all([
      supabase
        .from('solicitudes_credito')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
      supabase
        .from('solicitudes_credito')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'aprobada'),
      supabase
        .from('solicitudes_credito')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'rechazada'),
      supabase
        .from('simulaciones')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('rol', 'cliente')
        .eq('institucion_id', instId),
      supabase
        .from('solicitudes_inversion')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente'),
      // Últimas 5 solicitudes
      supabase
        .from('solicitudes_credito')
        .select(`
          id,
          created_at,
          monto,
          cuota_final,
          estado,
          usuarios!inner(nombre, apellido),
          tipos_credito!inner(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    setMetricas({
      pendientes: pendientesRes.count ?? 0,
      aprobadas: aprobadasRes.count ?? 0,
      rechazadas: rechazadasRes.count ?? 0,
      simulacionesMes: simulacionesRes.count ?? 0,
      clientes: clientesRes.count ?? 0,
      inversionesPendientes: inversionesRes.count ?? 0,
    })

    // Mapear solicitudes recientes
    const solicitudes: SolicitudReciente[] = (recientesRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      created_at: s.created_at as string,
      monto: s.monto as number,
      cuota_final: s.cuota_final as number,
      estado: s.estado as string,
      usuario_nombre: `${(s.usuarios as Record<string, string>)?.nombre ?? ''} ${(s.usuarios as Record<string, string>)?.apellido ?? ''}`.trim(),
      tipo_credito_nombre: (s.tipos_credito as Record<string, string>)?.nombre ?? '',
    }))

    setRecientes(solicitudes)
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

  const m = metricas

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">
        Panel General de <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, var(--color-inst-primary), var(--color-inst-accent))' }}>Administración</span>
      </h1>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricaCard
          icon={<Clock className="size-5" />}
          label="Solicitudes pendientes"
          valor={m?.pendientes ?? 0}
          color="var(--color-inst-primary)"
        />
        <MetricaCard
          icon={<CheckCircle className="size-5" />}
          label="Aprobadas"
          valor={m?.aprobadas ?? 0}
          color="#16a34a"
        />
        <MetricaCard
          icon={<Calculator className="size-5" />}
          label="Simulaciones del mes"
          valor={m?.simulacionesMes ?? 0}
          color="var(--color-inst-accent)"
        />
        <MetricaCard
          icon={<Users className="size-5" />}
          label="Clientes registrados"
          valor={m?.clientes ?? 0}
          color="var(--color-inst-secondary)"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <XCircle className="size-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Rechazadas</p>
                <p className="text-xl font-bold">{m?.rechazadas ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <TrendingUp className="size-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inversiones pendientes</p>
                <p className="text-xl font-bold">{m?.inversionesPendientes ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas solicitudes */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="size-4 text-gray-500" />
            Últimas solicitudes
          </h2>
          <Link href="/admin/solicitudes">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              Ver todas
              <ArrowRight className="size-3" />
            </Button>
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No hay solicitudes recientes.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo de crédito</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">Cuota final</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recientes.map((s) => {
                const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-gray-100 text-gray-600' }
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.usuario_nombre || 'Sin nombre'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{s.tipo_credito_nombre}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${s.monto?.toLocaleString() ?? '0'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${s.cuota_final?.toFixed(2) ?? '0.00'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

function MetricaCard({
  icon,
  label,
  valor,
  color,
}: {
  icon: React.ReactNode
  label: string
  valor: number
  color: string
}) {
  return (
    <Card className="hover:scale-[1.02] transition-transform duration-300 shadow-sm border border-gray-100/50">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-3 rounded-2xl shadow-sm transition-colors duration-300" style={{ backgroundColor: `${color}15`, color: color }}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-0.5">{label}</p>
          <p className="text-3xl font-extrabold tracking-tight text-gray-900">{valor}</p>
        </div>
      </CardContent>
    </Card>
  )
}
