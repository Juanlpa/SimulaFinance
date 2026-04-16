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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, CheckCircle, XCircle, FileText, TrendingUp } from 'lucide-react'

// ─── Tipos ───────────────────────────────────────────────────

interface SolCredito {
  id: string; created_at: string; monto: number; plazo_meses: number
  cuota_final: number; estado: string; observaciones_admin: string | null
  usuario_nombre: string; usuario_cedula: string; tipo_credito_nombre: string
  cedula_url: string | null; selfie_url: string | null
  buro_score: { puntaje: number; categoria: 'apto' | 'observado' | 'no_apto' } | null
}

interface SolInversion {
  id: string; created_at: string; monto: number; plazo_dias: number
  estado: string; usuario_nombre: string; usuario_cedula: string
  producto_nombre: string; documento_identidad_url: string | null
  selfie_url: string | null; biometria_validada: boolean
}

// ─── Constantes ──────────────────────────────────────────────

const ESTADOS_CREDITO = ['todos','pendiente','documentos','biometria','en_revision','aprobada','rechazada','desembolsada']
const ESTADOS_INVERSION = ['todos','pendiente','biometria','en_revision','aprobada','rechazada','activa','vencida']

const BADGES: Record<string, string> = {
  pendiente:    'bg-amber-100 text-amber-700',
  documentos:   'bg-blue-100 text-blue-700',
  biometria:    'bg-indigo-100 text-indigo-700',
  en_revision:  'bg-purple-100 text-purple-700',
  aprobada:     'bg-green-100 text-green-700',
  rechazada:    'bg-red-100 text-red-700',
  desembolsada: 'bg-emerald-100 text-emerald-700',
  activa:       'bg-teal-100 text-teal-700',
  vencida:      'bg-gray-100 text-gray-600',
}

const LABEL: Record<string, string> = {
  todos: 'Todos', pendiente: 'Pendiente', documentos: 'Documentos', biometria: 'Biometría',
  en_revision: 'En revisión', aprobada: 'Aprobada', rechazada: 'Rechazada',
  desembolsada: 'Desembolsada', activa: 'Activa', vencida: 'Vencida',
}

// ─── Componente ───────────────────────────────────────────────

export default function SolicitudesPage() {
  const [tab, setTab] = useState<'credito' | 'inversion'>('credito')
  const [loading, setLoading] = useState(true)

  // Crédito
  const [creditos, setCreditos] = useState<SolCredito[]>([])
  const [filtroCredito, setFiltroCredito] = useState('todos')

  // Inversión
  const [inversiones, setInversiones] = useState<SolInversion[]>([])
  const [filtroInversion, setFiltroInversion] = useState('todos')

  // Dialog
  const [dialogCredito, setDialogCredito] = useState<SolCredito | null>(null)
  const [dialogInversion, setDialogInversion] = useState<SolInversion | null>(null)
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  // ── Cargar créditos ────────────────────────────────────────
  const cargarCreditos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: perfil } = await supabase.from('usuarios').select('institucion_id').eq('id', user.id).single()
    if (!perfil?.institucion_id) return

    let q = supabase
      .from('solicitudes_credito')
      .select('id, created_at, monto, plazo_meses, cuota_final, estado, observaciones_admin, cedula_url, selfie_url, buro_score, usuarios!inner(nombre, apellido, cedula, institucion_id), tipos_credito(nombre)')
      .eq('usuarios.institucion_id', perfil.institucion_id)
      .order('created_at', { ascending: false })

    if (filtroCredito !== 'todos') q = q.eq('estado', filtroCredito)

    const { data, error } = await q
    if (error) { console.error(error); toast.error('Error al cargar solicitudes de crédito') }

    setCreditos((data ?? []).map((s: any) => ({
      id: s.id,
      created_at: s.created_at,
      monto: s.monto,
      plazo_meses: s.plazo_meses,
      cuota_final: s.cuota_final,
      estado: s.estado,
      observaciones_admin: s.observaciones_admin,
      usuario_nombre: `${s.usuarios?.nombre ?? ''} ${s.usuarios?.apellido ?? ''}`.trim() || 'Sin nombre',
      usuario_cedula: s.usuarios?.cedula ?? '—',
      tipo_credito_nombre: s.tipos_credito?.nombre ?? '—',
      cedula_url: s.cedula_url,
      selfie_url: s.selfie_url,
      buro_score: s.buro_score ?? null,
    })))
    setLoading(false)
  }, [filtroCredito])

  // ── Cargar inversiones ─────────────────────────────────────
  const cargarInversiones = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: perfil } = await supabase.from('usuarios').select('institucion_id').eq('id', user.id).single()
    if (!perfil?.institucion_id) return

    let q = supabase
      .from('solicitudes_inversion')
      .select('id, created_at, monto, plazo_dias, estado, documento_identidad_url, selfie_url, biometria_validada, usuarios!inner(nombre, apellido, cedula, institucion_id), productos_inversion(nombre)')
      .eq('usuarios.institucion_id', perfil.institucion_id)
      .order('created_at', { ascending: false })

    if (filtroInversion !== 'todos') q = q.eq('estado', filtroInversion)

    const { data, error } = await q
    if (error) { console.error(error); toast.error('Error al cargar solicitudes de inversión') }

    setInversiones((data ?? []).map((s: any) => ({
      id: s.id,
      created_at: s.created_at,
      monto: s.monto,
      plazo_dias: s.plazo_dias,
      estado: s.estado,
      usuario_nombre: `${s.usuarios?.nombre ?? ''} ${s.usuarios?.apellido ?? ''}`.trim() || 'Sin nombre',
      usuario_cedula: s.usuarios?.cedula ?? '—',
      producto_nombre: s.productos_inversion?.nombre ?? '—',
      documento_identidad_url: s.documento_identidad_url,
      selfie_url: s.selfie_url,
      biometria_validada: s.biometria_validada ?? false,
    })))
    setLoading(false)
  }, [filtroInversion])

  useEffect(() => {
    if (tab === 'credito') cargarCreditos()
    else cargarInversiones()
  }, [tab, cargarCreditos, cargarInversiones])

  // ── Acciones ──────────────────────────────────────────────

  const cambiarEstadoCredito = async (nuevoEstado: string) => {
    if (!dialogCredito) return
    if (nuevoEstado === 'rechazada' && !observaciones.trim()) {
      toast.error('Escribe el motivo de rechazo.')
      return
    }
    setGuardando(true)

    if (nuevoEstado === 'aprobada') {
      // Usar API que genera contrato PDF y envía email
      try {
        const res = await fetch('/api/admin/aprobar-credito', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ solicitudId: dialogCredito.id, observaciones: observaciones.trim() || undefined }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Error al aprobar')
        toast.success('Solicitud aprobada. Se generó el contrato y se notificó al cliente.')
        setDialogCredito(null)
        cargarCreditos()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Error al aprobar')
      }
    } else {
      // Rechazo: actualización directa
      const supabase = createClient()
      const { error } = await supabase
        .from('solicitudes_credito')
        .update({ estado: nuevoEstado, observaciones_admin: observaciones.trim() || null })
        .eq('id', dialogCredito.id)

      if (error) { toast.error('Error al actualizar.') }
      else { toast.success(`Solicitud ${nuevoEstado}.`); setDialogCredito(null); cargarCreditos() }
    }

    setGuardando(false)
  }

  const cambiarEstadoInversion = async (nuevoEstado: string) => {
    if (!dialogInversion) return
    setGuardando(true)
    try {
      const res = await fetch('/api/admin/gestionar-inversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId: dialogInversion.id, nuevoEstado }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al actualizar')
      toast.success(`Inversión ${nuevoEstado === 'activa' ? 'aprobada y activada' : nuevoEstado}.`)
      setDialogInversion(null)
      cargarInversiones()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setGuardando(false)
    }
  }

  // ── Helpers UI ─────────────────────────────────────────────

  const BadgeFiltro = ({ value, active, onClick, count }: { value: string; active: boolean; onClick: () => void; count?: number }) => (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer border ${
        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      }`}
    >
      {LABEL[value]}
      {count !== undefined && count > 0 && <span className="ml-1 opacity-60">({count})</span>}
    </button>
  )

  const fmt = (n: number) => `$${Number(n).toLocaleString()}`

  // ── Render ─────────────────────────────────────────────────

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Solicitudes</h1>
      <p className="text-gray-500 text-sm mb-6">Revisa y gestiona las solicitudes de crédito e inversión.</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('credito')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            tab === 'credito' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="size-3.5" /> Crédito
        </button>
        <button
          onClick={() => setTab('inversion')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
            tab === 'inversion' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <TrendingUp className="size-3.5" /> Inversión
        </button>
      </div>

      {/* ══ TAB CRÉDITO ══ */}
      {tab === 'credito' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {ESTADOS_CREDITO.map(e => (
              <BadgeFiltro
                key={e} value={e}
                active={filtroCredito === e}
                onClick={() => setFiltroCredito(e)}
                count={e !== 'todos' ? creditos.filter(s => s.estado === e).length : undefined}
              />
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
          ) : creditos.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <p className="text-gray-400 text-sm">No hay solicitudes de crédito{filtroCredito !== 'todos' ? ` con estado "${LABEL[filtroCredito]}"` : ''}.</p>
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
                    <TableHead className="text-right">Cuota</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditos.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.usuario_nombre}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-500">{s.usuario_cedula}</TableCell>
                      <TableCell className="text-sm text-gray-600">{s.tipo_credito_nombre}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(s.monto)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{s.cuota_final ? `$${Number(s.cuota_final).toFixed(2)}` : '—'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGES[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {LABEL[s.estado] ?? s.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="cursor-pointer h-7 px-2"
                          onClick={() => { setDialogCredito(s); setObservaciones(s.observaciones_admin ?? '') }}>
                          <Eye className="size-3.5 mr-1" /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ══ TAB INVERSIÓN ══ */}
      {tab === 'inversion' && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {ESTADOS_INVERSION.map(e => (
              <BadgeFiltro
                key={e} value={e}
                active={filtroInversion === e}
                onClick={() => setFiltroInversion(e)}
                count={e !== 'todos' ? inversiones.filter(s => s.estado === e).length : undefined}
              />
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
          ) : inversiones.length === 0 ? (
            <div className="bg-white rounded-xl border p-12 text-center">
              <TrendingUp className="size-8 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No hay solicitudes de inversión{filtroInversion !== 'todos' ? ` con estado "${LABEL[filtroInversion]}"` : ''}.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Plazo</TableHead>
                    <TableHead>Biometría</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inversiones.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.usuario_nombre}</TableCell>
                      <TableCell className="font-mono text-sm text-gray-500">{s.usuario_cedula}</TableCell>
                      <TableCell className="text-sm text-gray-600">{s.producto_nombre}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmt(s.monto)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{s.plazo_dias} días</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.biometria_validada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {s.biometria_validada ? 'Verificada' : 'Pendiente'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGES[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>
                          {LABEL[s.estado] ?? s.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="cursor-pointer h-7 px-2"
                          onClick={() => setDialogInversion(s)}>
                          <Eye className="size-3.5 mr-1" /> Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}

      {/* ══ DIALOG CRÉDITO ══ */}
      <Dialog open={!!dialogCredito} onOpenChange={(o) => !o && setDialogCredito(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Solicitud de Crédito</DialogTitle></DialogHeader>
          {dialogCredito && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                <p><span className="font-medium">Cliente:</span> {dialogCredito.usuario_nombre}</p>
                <p><span className="font-medium">Cédula:</span> {dialogCredito.usuario_cedula}</p>
                <p><span className="font-medium">Tipo:</span> {dialogCredito.tipo_credito_nombre}</p>
                <p><span className="font-medium">Monto:</span> {fmt(dialogCredito.monto)}</p>
                <p><span className="font-medium">Plazo:</span> {dialogCredito.plazo_meses} meses</p>
                <p><span className="font-medium">Cuota:</span> ${dialogCredito.cuota_final?.toFixed(2) ?? '—'}</p>
                <p><span className="font-medium">Estado:</span>{' '}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGES[dialogCredito.estado] ?? ''}`}>
                    {LABEL[dialogCredito.estado] ?? dialogCredito.estado}
                  </span>
                </p>
                {dialogCredito.buro_score && (
                  <p><span className="font-medium">SimulaScore®:</span>{' '}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                      dialogCredito.buro_score.categoria === 'apto' ? 'bg-green-100 text-green-700' :
                      dialogCredito.buro_score.categoria === 'observado' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {dialogCredito.buro_score.categoria === 'apto' ? 'Apto' :
                       dialogCredito.buro_score.categoria === 'observado' ? 'Observado' : 'No apto'}
                      {' '}({dialogCredito.buro_score.puntaje}/100)
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Observaciones</Label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Motivo de aprobación o rechazo..."
                  className="w-full min-h-[72px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring outline-none"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => cambiarEstadoCredito('rechazada')}
              disabled={guardando || dialogCredito?.estado === 'rechazada'}
              className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer">
              <XCircle className="size-4" /> Rechazar
            </Button>
            <Button onClick={() => cambiarEstadoCredito('aprobada')}
              disabled={guardando || dialogCredito?.estado === 'aprobada'}
              className="text-white bg-green-600 hover:bg-green-700 cursor-pointer">
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG INVERSIÓN ══ */}
      <Dialog open={!!dialogInversion} onOpenChange={(o) => !o && setDialogInversion(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Solicitud de Inversión</DialogTitle></DialogHeader>
          {dialogInversion && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg bg-gray-50 p-3 space-y-1.5 text-sm">
                <p><span className="font-medium">Cliente:</span> {dialogInversion.usuario_nombre}</p>
                <p><span className="font-medium">Cédula:</span> {dialogInversion.usuario_cedula}</p>
                <p><span className="font-medium">Producto:</span> {dialogInversion.producto_nombre}</p>
                <p><span className="font-medium">Monto:</span> {fmt(dialogInversion.monto)}</p>
                <p><span className="font-medium">Plazo:</span> {dialogInversion.plazo_dias} días</p>
                <p><span className="font-medium">Biometría:</span> {dialogInversion.biometria_validada ? '✓ Verificada' : 'Pendiente'}</p>
                <p><span className="font-medium">Estado:</span>{' '}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${BADGES[dialogInversion.estado] ?? ''}`}>
                    {LABEL[dialogInversion.estado] ?? dialogInversion.estado}
                  </span>
                </p>
              </div>

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => cambiarEstadoInversion('rechazada')}
              disabled={guardando || dialogInversion?.estado === 'rechazada'}
              className="text-red-600 border-red-200 hover:bg-red-50 cursor-pointer">
              <XCircle className="size-4" /> Rechazar
            </Button>
            <Button onClick={() => cambiarEstadoInversion('activa')}
              disabled={guardando || ['activa','rechazada'].includes(dialogInversion?.estado ?? '')}
              className="text-white bg-green-600 hover:bg-green-700 cursor-pointer">
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Aprobar y Activar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
