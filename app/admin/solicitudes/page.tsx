// ============================================================
// SimulaFinance — Admin: Solicitudes (crédito + inversión)
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

import {
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
} from 'lucide-react'

// ─── Tipos internos ──────────────────────────────────────────
interface SolicitudFila {
  id: string
  created_at: string
  monto: number
  plazo_meses: number
  cuota_final: number
  estado: string
  observaciones_admin: string | null
  usuario_nombre: string
  usuario_cedula: string
  tipo_credito_nombre: string
  cedula_url: string | null
  selfie_url: string | null
}

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'desembolsada', label: 'Desembolsada' },
]

const ESTADO_BADGES: Record<string, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
  documentos: { label: 'Documentos', color: 'bg-blue-100 text-blue-700' },
  en_revision: { label: 'En revisión', color: 'bg-purple-100 text-purple-700' },
  aprobada: { label: 'Aprobada', color: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700' },
  desembolsada: { label: 'Desembolsada', color: 'bg-emerald-100 text-emerald-700' },
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudFila[]>([])
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'credito' | 'inversion'>('credito')

  // Detail dialog
  const [detalle, setDetalle] = useState<SolicitudFila | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('solicitudes_credito')
      .select(`
        id,
        created_at,
        monto,
        plazo_meses,
        cuota_final,
        estado,
        observaciones_admin,
        cedula_url,
        selfie_url,
        usuarios!inner(nombre, apellido, cedula),
        tipos_credito!inner(nombre)
      `)
      .order('created_at', { ascending: false })

    if (filtroEstado !== 'todos') {
      query = query.eq('estado', filtroEstado)
    }

    const { data } = await query

    const filas: SolicitudFila[] = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      created_at: s.created_at as string,
      monto: s.monto as number,
      plazo_meses: s.plazo_meses as number,
      cuota_final: s.cuota_final as number,
      estado: s.estado as string,
      observaciones_admin: s.observaciones_admin as string | null,
      usuario_nombre: `${(s.usuarios as Record<string, string>)?.nombre ?? ''} ${(s.usuarios as Record<string, string>)?.apellido ?? ''}`.trim(),
      usuario_cedula: (s.usuarios as Record<string, string>)?.cedula ?? '',
      tipo_credito_nombre: (s.tipos_credito as Record<string, string>)?.nombre ?? '',
      cedula_url: s.cedula_url as string | null,
      selfie_url: s.selfie_url as string | null,
    }))

    setSolicitudes(filas)
    setLoading(false)
  }, [filtroEstado])

  useEffect(() => { cargarSolicitudes() }, [cargarSolicitudes])

  const abrirDetalle = (sol: SolicitudFila) => {
    setDetalle(sol)
    setObservaciones(sol.observaciones_admin ?? '')
    setDialogOpen(true)
  }

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!detalle) return
    if (nuevoEstado === 'rechazada' && !observaciones.trim()) {
      toast.error('Motivo de rechazo requerido.')
      return
    }

    setGuardando(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('solicitudes_credito')
      .update({
        estado: nuevoEstado,
        observaciones_admin: observaciones.trim() || null,
      })
      .eq('id', detalle.id)

    if (error) {
      toast.error('Error al actualizar.')
    } else {
      toast.success(`Solicitud ${nuevoEstado === 'aprobada' ? 'aprobada' : 'rechazada'}.`)
      setDialogOpen(false)
      cargarSolicitudes()
    }
    setGuardando(false)
  }

  // Contadores por estado
  const contadores = ESTADOS.slice(1).reduce((acc, e) => {
    acc[e.value] = solicitudes.filter((s) => s.estado === e.value).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitudes</h1>
      <p className="text-gray-500 text-sm mb-6">Revisa y gestiona las solicitudes de crédito e inversión.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('credito')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            tab === 'credito' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="inline size-3.5 mr-1" />
          Crédito
        </button>
        <button
          onClick={() => setTab('inversion')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            tab === 'inversion' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Inversión
        </button>
      </div>

      {tab === 'credito' && (
        <>
          {/* Filtros por estado */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ESTADOS.map((e) => (
              <button
                key={e.value}
                onClick={() => setFiltroEstado(e.value)}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer border ${
                  filtroEstado === e.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {e.label}
                {e.value !== 'todos' && contadores[e.value] ? (
                  <span className="ml-1 opacity-70">({contadores[e.value]})</span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-gray-400" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-400 text-sm">No hay solicitudes{filtroEstado !== 'todos' ? ` con estado "${filtroEstado}"` : ''}.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Tipo crédito</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Cuota final</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((s) => {
                    const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-gray-100 text-gray-600' }
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.usuario_nombre || 'Sin nombre'}</TableCell>
                        <TableCell className="font-mono text-sm text-gray-600">{s.usuario_cedula || '—'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{s.tipo_credito_nombre}</TableCell>
                        <TableCell className="text-right font-mono text-sm">${s.monto?.toLocaleString() ?? '0'}</TableCell>
                        <TableCell className="text-right font-mono text-sm">${s.cuota_final?.toFixed(2) ?? '0.00'}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                            {badge.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-xs" onClick={() => abrirDetalle(s)} title="Ver detalle">
                            <Eye className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {tab === 'inversion' && (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400 text-sm">Panel de inversiones — Se activará al implementar la Fase 2.7</p>
        </div>
      )}

      {/* Dialog detalle */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de solicitud</DialogTitle>
          </DialogHeader>

          {detalle && (
            <div className="space-y-4 py-2">
              {/* Datos del cliente */}
              <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                <p><span className="font-medium">Cliente:</span> {detalle.usuario_nombre}</p>
                <p><span className="font-medium">Cédula:</span> {detalle.usuario_cedula || '—'}</p>
                <p><span className="font-medium">Tipo:</span> {detalle.tipo_credito_nombre}</p>
                <p><span className="font-medium">Monto:</span> ${detalle.monto?.toLocaleString()}</p>
                <p><span className="font-medium">Plazo:</span> {detalle.plazo_meses} meses</p>
                <p><span className="font-medium">Cuota final:</span> ${detalle.cuota_final?.toFixed(2)}</p>
                <p><span className="font-medium">Fecha:</span> {new Date(detalle.created_at).toLocaleDateString('es-EC')}</p>
              </div>

              {/* Documentos */}
              <div>
                <p className="text-sm font-medium mb-2">Documentos</p>
                <div className="flex gap-2 flex-wrap">
                  {detalle.cedula_url && (
                    <a href={detalle.cedula_url} target="_blank" rel="noopener" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                      <ExternalLink className="size-3" /> Cédula
                    </a>
                  )}
                  {detalle.selfie_url && (
                    <a href={detalle.selfie_url} target="_blank" rel="noopener" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">
                      <ExternalLink className="size-3" /> Selfie
                    </a>
                  )}
                  {!detalle.cedula_url && !detalle.selfie_url && (
                    <p className="text-xs text-gray-400">Sin documentos subidos</p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div className="space-y-1.5">
                <Label>Observaciones del administrador</Label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Motivo de aprobación o rechazo..."
                  className="w-full min-h-[80px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
                />
              </div>

              {/* Estado actual */}
              <div>
                <Label>Estado actual</Label>
                <p className="mt-1">
                  <Badge>{ESTADO_BADGES[detalle.estado]?.label ?? detalle.estado}</Badge>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => cambiarEstado('rechazada')}
              disabled={guardando || detalle?.estado === 'rechazada'}
              className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
            >
              <XCircle className="size-4" />
              Rechazar
            </Button>
            <Button
              onClick={() => cambiarEstado('aprobada')}
              disabled={guardando || detalle?.estado === 'aprobada'}
              className="text-white bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
