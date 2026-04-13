// ============================================================
// SimulaFinance — Cliente: Mis Solicitudes (Crédito + Inversión)
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, FileText, TrendingUp, CreditCard } from 'lucide-react'

interface FilaSolicitud {
  id: string
  tipo: 'credito' | 'inversion'
  created_at: string
  monto: number
  plazo: string
  cuota_o_rendimiento: string
  estado: string
  observaciones: string | null
  descripcion: string
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

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<FilaSolicitud[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Cargar solicitudes de crédito
    const { data: creditos, error: errCred } = await supabase
      .from('solicitudes_credito')
      .select('id, created_at, monto, plazo_meses, cuota_final, estado, observaciones_admin, tipo_credito_id, tipos_credito(nombre)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (errCred) console.error('Error solicitudes_credito:', errCred)

    // Cargar solicitudes de inversión
    const { data: inversiones, error: errInv } = await supabase
      .from('solicitudes_inversion')
      .select('id, created_at, monto, plazo_dias, estado, producto_id, productos_inversion(nombre)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    if (errInv) console.error('Error solicitudes_inversion:', errInv)

    const filas: FilaSolicitud[] = []

    for (const s of (creditos ?? [])) {
      const tc = s.tipos_credito as unknown as { nombre?: string } | null
      filas.push({
        id: s.id,
        tipo: 'credito',
        created_at: s.created_at,
        monto: s.monto,
        plazo: `${s.plazo_meses} meses`,
        cuota_o_rendimiento: s.cuota_final ? `$${Number(s.cuota_final).toFixed(2)}/mes` : '—',
        estado: s.estado,
        observaciones: s.observaciones_admin,
        descripcion: tc?.nombre ?? 'Crédito',
      })
    }

    for (const s of (inversiones ?? [])) {
      const prod = s.productos_inversion as unknown as { nombre?: string } | null
      filas.push({
        id: s.id,
        tipo: 'inversion',
        created_at: s.created_at,
        monto: s.monto,
        plazo: s.plazo_dias ? `${s.plazo_dias} días` : '—',
        cuota_o_rendimiento: '—',
        estado: s.estado,
        observaciones: null,
        descripcion: (prod as { nombre?: string } | null)?.nombre ?? 'Inversión',
      })
    }

    // Ordenar por fecha descendente
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
                        {s.tipo === 'credito'
                          ? <CreditCard className="size-3" />
                          : <TrendingUp className="size-3" />}
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
                    <TableCell className="text-sm text-gray-400 max-w-[180px] truncate">
                      {s.observaciones || '—'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
