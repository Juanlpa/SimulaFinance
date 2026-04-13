// ============================================================
// SimulaFinance — Cliente: Mis Solicitudes
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Loader2, FileText } from 'lucide-react'

interface Solicitud {
  id: string
  created_at: string
  monto: number
  plazo_meses: number
  cuota_final: number
  estado: string
  observaciones_admin: string | null
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

export default function MisSolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('solicitudes_credito')
      .select(`
        id, created_at, monto, plazo_meses, cuota_final, estado, observaciones_admin,
        tipos_credito!inner(nombre)
      `)
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    const filas: Solicitud[] = (data ?? []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      created_at: s.created_at as string,
      monto: s.monto as number,
      plazo_meses: s.plazo_meses as number,
      cuota_final: s.cuota_final as number,
      estado: s.estado as string,
      observaciones_admin: s.observaciones_admin as string | null,
      tipo_credito_nombre: (s.tipos_credito as Record<string, string>)?.nombre ?? '',
    }))

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
      <p className="text-gray-500 text-sm mb-8">Revisa el estado de tus solicitudes de crédito.</p>

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
                <TableHead>Tipo crédito</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead className="text-right">Cuota final</TableHead>
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
                    <TableCell className="font-medium">{s.tipo_credito_nombre}</TableCell>
                    <TableCell className="text-right font-mono text-sm">${s.monto.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{s.plazo_meses} meses</TableCell>
                    <TableCell className="text-right font-mono text-sm">${s.cuota_final?.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(s.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                      {s.observaciones_admin || '—'}
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
