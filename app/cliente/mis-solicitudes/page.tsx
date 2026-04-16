// ============================================================
// SimulaFinance — Cliente: Mis Solicitudes (Crédito + Inversión)
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, FileText, TrendingUp, CreditCard, Download, Eye,
         CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import type { BuroScore } from '@/types'

interface FilaSolicitud {
  id: string
  tipo: 'credito' | 'inversion'
  created_at: string
  monto: number
  plazo: string
  plazo_meses: number | null
  cuota_o_rendimiento: string
  cuota_final: number | null
  estado: string
  observaciones: string | null
  descripcion: string
  contrato_url: string | null
  simulacion_id: string | null
  tasa_aplicada: number | null
  sistema_amortizacion: string | null
  buro_score: BuroScore | null
  cedula_url: string | null
  selfie_url: string | null
  biometria_validada: boolean
  // inversión
  rendimiento_estimado: number | null
  total_a_recibir: number | null
}

const ESTADO_BADGES: Record<string, { label: string; color: string }> = {
  pendiente:    { label: 'Pendiente',    color: 'bg-amber-100 text-amber-700' },
  documentos:   { label: 'Documentos',   color: 'bg-blue-100 text-blue-700' },
  biometria:    { label: 'Biometría',    color: 'bg-indigo-100 text-indigo-700' },
  en_revision:  { label: 'En revisión',  color: 'bg-purple-100 text-purple-700' },
  aprobada:     { label: 'Aprobada',     color: 'bg-green-100 text-green-700' },
  rechazada:    { label: 'Rechazada',    color: 'bg-red-100 text-red-700' },
  desembolsada: { label: 'Desembolsada', color: 'bg-emerald-100 text-emerald-700' },
  activa:       { label: 'Activa',       color: 'bg-teal-100 text-teal-700' },
  vencida:      { label: 'Vencida',      color: 'bg-gray-100 text-gray-600' },
}

const ESTADOS_FINALES = ['aprobada', 'rechazada', 'desembolsada', 'activa', 'vencida']

function fmt(n: number) { return `$${Number(n).toLocaleString('es-EC', { minimumFractionDigits: 2 })}` }

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<FilaSolicitud[]>([])
  const [loading, setLoading] = useState(true)
  const [descargando, setDescargando] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<FilaSolicitud | null>(null)

  const descargarContrato = async (solicitudId: string, contratoUrl: string) => {
    setDescargando(solicitudId)
    try {
      const res = await fetch('/api/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucket: 'contratos', path: contratoUrl, expiresIn: 300 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      window.open(json.signedUrl, '_blank')
    } catch {
      alert('No se pudo obtener el contrato. Intenta de nuevo.')
    } finally {
      setDescargando(null)
    }
  }

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: creditos } = await supabase
      .from('solicitudes_credito')
      .select('id, created_at, monto, plazo_meses, cuota_final, tasa_aplicada, sistema_amortizacion, estado, observaciones_admin, contrato_url, simulacion_id, cedula_url, selfie_url, biometria_validada, buro_score, tipo_credito_id, tipos_credito(nombre)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    const { data: inversiones } = await supabase
      .from('solicitudes_inversion')
      .select('id, created_at, monto, plazo_dias, estado, observaciones_admin, rendimiento_estimado, producto_id, productos_inversion(nombre)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    const filas: FilaSolicitud[] = []

    for (const s of (creditos ?? [])) {
      const tc = s.tipos_credito as unknown as { nombre?: string } | null
      const raw = s as unknown as Record<string, unknown>
      filas.push({
        id: s.id,
        tipo: 'credito',
        created_at: s.created_at,
        monto: s.monto,
        plazo: `${s.plazo_meses} meses`,
        plazo_meses: s.plazo_meses,
        cuota_o_rendimiento: s.cuota_final ? `${fmt(s.cuota_final)}/mes` : '—',
        cuota_final: s.cuota_final ?? null,
        estado: s.estado,
        observaciones: s.observaciones_admin,
        descripcion: tc?.nombre ?? 'Crédito',
        contrato_url: (raw.contrato_url as string | null) ?? null,
        simulacion_id: (raw.simulacion_id as string | null) ?? null,
        tasa_aplicada: s.tasa_aplicada ?? null,
        sistema_amortizacion: s.sistema_amortizacion ?? null,
        buro_score: (raw.buro_score as BuroScore | null) ?? null,
        cedula_url: s.cedula_url ?? null,
        selfie_url: s.selfie_url ?? null,
        biometria_validada: Boolean(raw.biometria_validada),
        rendimiento_estimado: null,
        total_a_recibir: null,
      })
    }

    for (const s of (inversiones ?? [])) {
      const prod = s.productos_inversion as unknown as { nombre?: string } | null
      const rawInv = s as unknown as Record<string, unknown>
      const rend = (rawInv.rendimiento_estimado as number | null) ?? null
      // total_a_recibir no existe en la tabla, calcular como monto + rendimiento
      const total = rend != null ? s.monto + rend : null
      filas.push({
        id: s.id,
        tipo: 'inversion',
        created_at: s.created_at,
        monto: s.monto,
        plazo: s.plazo_dias ? `${s.plazo_dias} días` : '—',
        plazo_meses: null,
        cuota_o_rendimiento: rend ? `+${fmt(rend)}` : '—',
        cuota_final: null,
        estado: s.estado,
        observaciones: (rawInv.observaciones_admin as string | null) ?? null,
        descripcion: prod?.nombre ?? 'Inversión',
        contrato_url: null,
        simulacion_id: null,
        tasa_aplicada: null,
        sistema_amortizacion: null,
        buro_score: null,
        cedula_url: null,
        selfie_url: null,
        biometria_validada: false,
        rendimiento_estimado: rend,
        total_a_recibir: total,
      })
    }

    filas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setSolicitudes(filas)
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis solicitudes</h1>
      <p className="text-gray-500 text-sm mb-8">Revisa el estado de tus solicitudes de crédito e inversión.</p>

      {solicitudes.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="size-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No has enviado solicitudes aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead className="text-right">Cuota / Rendimiento</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Observaciones</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {solicitudes.map((s) => {
                const badge = ESTADO_BADGES[s.estado] ?? { label: s.estado, color: 'bg-gray-100 text-gray-600' }
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                        ${s.tipo === 'credito' ? 'bg-blue-50 text-blue-600' : 'bg-teal-50 text-teal-600'}`}>
                        {s.tipo === 'credito' ? <CreditCard className="size-3" /> : <TrendingUp className="size-3" />}
                        {s.tipo === 'credito' ? 'Crédito' : 'Inversión'}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{s.descripcion}</TableCell>
                    <TableCell className="text-right font-mono text-sm">${Number(s.monto).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-gray-500">{s.plazo}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-600">{s.cuota_o_rendimiento}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400 max-w-[160px] truncate">
                      {s.observaciones || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {/* Detalle para créditos e inversiones */}
                        <button
                          onClick={() => setDetalle(s)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="size-3" /> Ver
                        </button>
                        {/* Descargar contrato si aprobado */}
                        {s.tipo === 'credito' && s.estado === 'aprobada' && s.contrato_url && (
                          <button
                            onClick={() => descargarContrato(s.id, s.contrato_url!)}
                            disabled={descargando === s.id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {descargando === s.id ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                            Contrato
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ══ Dialog detalle solicitud ══ */}
      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detalle?.tipo === 'inversion' ? <TrendingUp className="inline size-4 mr-1.5 text-teal-500" /> : <CreditCard className="inline size-4 mr-1.5 text-blue-500" />}
              {detalle?.descripcion}
            </DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-4 py-1 text-sm">

              {/* Estado actual */}
              <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
                detalle.estado === 'aprobada' || detalle.estado === 'activa' ? 'bg-green-50 border border-green-200' :
                detalle.estado === 'rechazada' ? 'bg-red-50 border border-red-200' :
                'bg-gray-50 border border-gray-200'
              }`}>
                {detalle.estado === 'aprobada' || detalle.estado === 'activa'
                  ? <CheckCircle className="size-5 text-green-600 shrink-0" />
                  : detalle.estado === 'rechazada'
                  ? <XCircle className="size-5 text-red-500 shrink-0" />
                  : <Clock className="size-5 text-gray-400 shrink-0" />}
                <div>
                  <p className="font-semibold text-gray-800">
                    {ESTADO_BADGES[detalle.estado]?.label ?? detalle.estado}
                  </p>
                  {detalle.observaciones && (
                    <p className="text-xs text-gray-500 mt-0.5">{detalle.observaciones}</p>
                  )}
                </div>
              </div>

              {/* Condiciones */}
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {detalle.tipo === 'inversion' ? 'Detalles de la inversión' : 'Condiciones del crédito'}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <span className="text-gray-500">Monto:</span>
                  <span className="font-medium text-gray-800">{fmt(detalle.monto)}</span>
                  <span className="text-gray-500">Plazo:</span>
                  <span className="font-medium text-gray-800">{detalle.plazo}</span>
                  {detalle.tasa_aplicada && (
                    <>
                      <span className="text-gray-500">Tasa anual:</span>
                      <span className="font-medium text-gray-800">{detalle.tasa_aplicada}%</span>
                    </>
                  )}
                  {/* Crédito */}
                  {detalle.cuota_final && (
                    <>
                      <span className="text-gray-500">Cuota mensual:</span>
                      <span className="font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                        {fmt(detalle.cuota_final)}
                      </span>
                    </>
                  )}
                  {detalle.sistema_amortizacion && (
                    <>
                      <span className="text-gray-500">Sistema:</span>
                      <span className="font-medium text-gray-800">
                        {detalle.sistema_amortizacion === 'francesa' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'}
                      </span>
                    </>
                  )}
                  {/* Inversión */}
                  {detalle.rendimiento_estimado && (
                    <>
                      <span className="text-gray-500">Rendimiento:</span>
                      <span className="font-semibold text-teal-600">+{fmt(detalle.rendimiento_estimado)}</span>
                    </>
                  )}
                  {detalle.total_a_recibir && (
                    <>
                      <span className="text-gray-500">Total a recibir:</span>
                      <span className="font-semibold text-green-600">{fmt(detalle.total_a_recibir)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* SimulaScore — solo créditos */}
              {detalle.buro_score && (
                <div className={`rounded-lg border p-3 flex items-center gap-3 ${
                  detalle.buro_score.categoria === 'apto' ? 'bg-green-50 border-green-200' :
                  detalle.buro_score.categoria === 'observado' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className={`size-10 rounded-full border-2 flex flex-col items-center justify-center bg-white shrink-0 ${
                    detalle.buro_score.categoria === 'apto' ? 'border-green-400' :
                    detalle.buro_score.categoria === 'observado' ? 'border-amber-400' : 'border-red-400'
                  }`}>
                    <span className={`text-sm font-bold ${
                      detalle.buro_score.categoria === 'apto' ? 'text-green-600' :
                      detalle.buro_score.categoria === 'observado' ? 'text-amber-600' : 'text-red-600'
                    }`}>{detalle.buro_score.puntaje}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide">SimulaScore®</p>
                    <p className="text-sm text-gray-600">
                      {detalle.buro_score.categoria === 'apto' ? 'Apto para crédito' :
                       detalle.buro_score.categoria === 'observado' ? 'Perfil en observación' : 'No apto'}
                    </p>
                  </div>
                </div>
              )}

              {/* Documentos y biometría — solo créditos */}
              {detalle.tipo === 'credito' && (
                <div className="rounded-lg border bg-gray-50 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Documentación</p>
                  <div className="flex items-center gap-2">
                    {detalle.cedula_url
                      ? <CheckCircle className="size-4 text-green-500" />
                      : <AlertTriangle className="size-4 text-amber-400" />}
                    <span className="text-gray-600">Cédula de identidad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {detalle.biometria_validada
                      ? <CheckCircle className="size-4 text-green-500" />
                      : <AlertTriangle className="size-4 text-amber-400" />}
                    <span className="text-gray-600">Validación biométrica</span>
                  </div>
                </div>
              )}

              {/* Fecha */}
              <p className="text-xs text-gray-400 text-center">
                Enviada el {new Date(detalle.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>

              {/* Botón contrato — solo créditos aprobados */}
              {detalle.tipo === 'credito' && detalle.estado === 'aprobada' && detalle.contrato_url && (
                <button
                  onClick={() => descargarContrato(detalle.id, detalle.contrato_url!)}
                  disabled={descargando === detalle.id}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {descargando === detalle.id ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  Descargar contrato firmado
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
