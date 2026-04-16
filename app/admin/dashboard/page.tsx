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
        .select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
        .eq('usuarios.institucion_id', instId),
      supabase
        .from('solicitudes_credito')
        .select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true })
        .eq('estado', 'aprobada')
        .eq('usuarios.institucion_id', instId),
      supabase
        .from('solicitudes_credito')
        .select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true })
        .eq('estado', 'rechazada')
        .eq('usuarios.institucion_id', instId),
      supabase
        .from('simulaciones')
        .select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .eq('usuarios.institucion_id', instId),
      supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .eq('rol', 'cliente')
        .eq('institucion_id', instId),
      supabase
        .from('solicitudes_inversion')
        .select('id, usuarios!inner(institucion_id)', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
        .eq('usuarios.institucion_id', instId),
      // Últimas 5 solicitudes
      supabase
        .from('solicitudes_credito')
        .select(`
          id,
          created_at,
          monto,
          cuota_final,
          estado,
          usuarios!inner(nombre, apellido, institucion_id),
          tipos_credito!inner(nombre)
        `)
        .eq('usuarios.institucion_id', instId)
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
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 ease-out">
      <div className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3 text-slate-900 drop-shadow-sm">
          Panel <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--color-inst-primary), var(--color-inst-accent))' }}>Administrativo</span>
        </h1>
        <p className="text-slate-500 text-lg font-medium max-w-2xl">
          Monitorea métricas clave en tiempo real y gestiona las solicitudes de los clientes.
        </p>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricaCard
          icon={<Clock className="size-6 drop-shadow-sm" />}
          label="Solicitudes pendientes"
          valor={m?.pendientes ?? 0}
          color="var(--color-inst-primary)"
        />
        <MetricaCard
          icon={<CheckCircle className="size-6 drop-shadow-sm" />}
          label="Aprobadas"
          valor={m?.aprobadas ?? 0}
          color="#10b981"
        />
        <MetricaCard
          icon={<Calculator className="size-6 drop-shadow-sm" />}
          label="Simulaciones del mes"
          valor={m?.simulacionesMes ?? 0}
          color="var(--color-inst-accent)"
        />
        <MetricaCard
          icon={<Users className="size-6 drop-shadow-sm" />}
          label="Clientes registrados"
          valor={m?.clientes ?? 0}
          color="var(--color-inst-secondary)"
        />
      </div>

      {/* Métricas secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-red-50 shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:bg-red-100">
                <XCircle className="size-7 text-red-500" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-500 mb-1">Rechazadas</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{m?.rechazadas ?? 0}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-red-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
        
        <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 group rounded-[2rem] overflow-hidden">
          <CardContent className="p-6 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-emerald-50 shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:bg-emerald-100">
                <TrendingUp className="size-7 text-emerald-500" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-500 mb-1">Inversiones pendientes</p>
                <p className="text-4xl font-black text-slate-800 tracking-tight">{m?.inversionesPendientes ?? 0}</p>
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Card>
      </div>

      {/* Últimas solicitudes */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] overflow-hidden p-2">
        <div className="flex items-center justify-between p-6 px-8 border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-3 text-slate-900">
            <div className="p-2 bg-slate-100 rounded-xl shadow-inner">
              <FileText className="size-5 text-slate-600" />
            </div>
            Últimas solicitudes
          </h2>
          <Link href="/admin/solicitudes">
            <Button variant="ghost" className="font-bold text-slate-500 hover:text-blue-600 transition-colors rounded-xl h-10 px-4 group">
              Ver todas
              <ArrowRight className="size-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {recientes.length === 0 ? (
          <div className="p-16 text-center bg-slate-50/50 m-4 rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No hay transferencias ni solicitudes recientes registradas.</p>
          </div>
        ) : (
          <div className="p-2">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-bold text-slate-500 py-4 px-6 rounded-l-xl">Cliente</TableHead>
                  <TableHead className="font-bold text-slate-500">Producto Crediticio</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Monto Capital</TableHead>
                  <TableHead className="text-right font-bold text-slate-500">Cuota Base</TableHead>
                  <TableHead className="font-bold text-slate-500">Radicación</TableHead>
                  <TableHead className="font-bold text-slate-500 rounded-r-xl">Estatus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recientes.map((s) => {
                  const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-slate-100 text-slate-600' }
                  return (
                    <TableRow key={s.id} className="border-slate-100/60 hover:bg-slate-50/80 transition-colors group">
                      <TableCell className="font-bold text-slate-800 py-4 px-6">{s.usuario_nombre || 'Sin nombre'}</TableCell>
                      <TableCell className="text-[15px] font-medium text-slate-600">{s.tipo_credito_nombre}</TableCell>
                      <TableCell className="text-right font-mono text-[15px] font-semibold text-slate-700">
                        ${s.monto?.toLocaleString() ?? '0'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[15px] font-semibold text-slate-700">
                        ${s.cuota_final?.toFixed(2) ?? '0.00'}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-500">
                        {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-[13px] px-3 py-1.5 rounded-full font-bold shadow-sm inline-block ${badge.color}`}>
                          {badge.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
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
    <Card className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-1 rounded-[2rem] overflow-hidden group">
      <CardContent className="p-6 relative z-10 flex items-center gap-5">
        <div 
          className="p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform duration-500" 
          style={{ backgroundColor: `${color}15`, color: color }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-slate-500 mb-1">{label}</p>
          <p className="text-4xl font-black tracking-tight text-slate-800">{valor}</p>
        </div>
      </CardContent>
      <div 
        className="absolute bottom-0 left-0 h-1 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ backgroundColor: color }}
      />
    </Card>
  )
}
