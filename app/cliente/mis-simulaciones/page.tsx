// ============================================================
// SimulaFinance — Cliente: Mis Simulaciones
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { TablaAmortizacion } from '@/components/credito/TablaAmortizacion'
import { ResumenCostos } from '@/components/credito/ResumenCostos'
import { Loader2, Calculator, Eye, ArrowRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { TablaAmortizacionRow, CobroDesglose, ResumenCredito } from '@/types'

interface Simulacion {
  id: string
  created_at: string
  monto: number
  valor_bien: number | null
  plazo_meses: number
  tasa_aplicada: number
  sistema_amortizacion: string
  cuota_base: number
  cuota_final: number
  total_intereses: number
  total_a_pagar: number
  tabla_json: TablaAmortizacionRow[] | null
  cobros_desglose_json: CobroDesglose[] | null
  tipo_credito_id: string | null
  tipos_credito: { nombre: string } | null
}

// Se obtendrán todos los estados de las solicitudes

export default function MisSimulacionesPage() {
  const [simulaciones, setSimulaciones] = useState<Simulacion[]>([])
  const [loading, setLoading] = useState(true)
  const [detalle, setDetalle] = useState<Simulacion | null>(null)
  // Estado de las solicitudes asociadas a cada simulación
  const [simulacionesEstado, setSimulacionesEstado] = useState<Record<string, string>>({})

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data }, { data: solsActivas }] = await Promise.all([
      supabase
        .from('simulaciones')
        .select('*, tipos_credito(nombre)')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('solicitudes_credito')
        .select('simulacion_id, estado')
        .eq('usuario_id', user.id),
    ])

    setSimulaciones((data as unknown as Simulacion[]) ?? [])
    const estadoMap: Record<string, string> = {}
    ;(solsActivas ?? []).forEach((s: any) => {
      if (s.simulacion_id) {
        estadoMap[s.simulacion_id] = s.estado
      }
    })
    setSimulacionesEstado(estadoMap)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  // Construir ResumenCredito desde los datos de la simulación
  const buildResumen = (sim: Simulacion): ResumenCredito | null => {
    if (!sim.cobros_desglose_json) return null
    return {
      monto: sim.monto,
      plazo_meses: sim.plazo_meses,
      tasa_anual: sim.tasa_aplicada,
      sistema_amortizacion: sim.sistema_amortizacion as 'francesa' | 'alemana',
      cuota_base_inicial: sim.cuota_base,
      cuota_final: sim.cuota_final,
      total_capital: sim.monto,
      total_intereses: sim.total_intereses,
      cobros_desglose: sim.cobros_desglose_json,
      total_cobros_adicionales: sim.cobros_desglose_json.reduce((s, c) => s + c.total, 0),
      costo_total_credito: sim.total_a_pagar,
    }
  }

  const renderEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'aprobada':
      case 'desembolsada':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-medium whitespace-nowrap">
            <CheckCircle className="size-3" /> Aprobada
          </span>
        )
      case 'rechazada':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 font-medium whitespace-nowrap">
            <XCircle className="size-3" /> Rechazada
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-600 font-medium whitespace-nowrap">
            <Clock className="size-3" /> En proceso
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Mis simulaciones</h1>
          <p className="text-gray-500 text-sm">Historial de tus simulaciones de crédito guardadas.</p>
        </div>
        <Link href="/cliente/simulador-credito">
          <Button
            className="text-white cursor-pointer"
            style={{ backgroundColor: 'var(--color-inst-primary)' }}
          >
            <Calculator className="size-4" />
            Nueva simulación
          </Button>
        </Link>
      </div>

      {simulaciones.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Calculator className="size-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-4">No tienes simulaciones guardadas aún.</p>
          <Link href="/cliente/simulador-credito">
            <Button variant="outline" className="cursor-pointer">
              <Calculator className="size-4" />
              Ir al simulador
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead className="text-right">Tasa %</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Cuota final</TableHead>
                <TableHead className="text-right">Costo total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulaciones.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(sim.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {sim.tipos_credito?.nombre ?? '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${Number(sim.monto).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{sim.plazo_meses} m</TableCell>
                  <TableCell className="text-right font-mono text-sm">{sim.tasa_aplicada}%</TableCell>
                  <TableCell className="text-sm">
                    {sim.sistema_amortizacion === 'francesa' ? 'Francés' : 'Alemán'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                    ${Number(sim.cuota_final)?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${Number(sim.total_a_pagar)?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {sim.tabla_json && (
                        <button
                          onClick={() => setDetalle(sim)}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-colors cursor-pointer"
                        >
                          <Eye className="size-3" /> Tabla
                        </button>
                      )}
                      {simulacionesEstado[sim.id] ? (
                        renderEstadoBadge(simulacionesEstado[sim.id])
                      ) : (
                        <Link
                          href={`/cliente/solicitud-credito?simulacion=${sim.id}`}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium text-white transition-colors"
                          style={{ backgroundColor: 'var(--color-inst-primary)' }}
                        >
                          Solicitar <ArrowRight className="size-3" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Dialog de detalle ─────────────────────────────── */}
      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="sm:max-w-6xl max-w-6xl w-[95vw] max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>
              Tabla de amortización —{' '}
              {detalle?.tipos_credito?.nombre ?? 'Crédito'}{' '}
              ${Number(detalle?.monto).toLocaleString()} · {detalle?.plazo_meses} meses
            </DialogTitle>
          </DialogHeader>
          {detalle && (() => {
            const resumen = buildResumen(detalle)
            return (
              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4">
                {resumen && <ResumenCostos resumen={resumen} />}
                {detalle.tabla_json && detalle.cobros_desglose_json && (
                  <div className="overflow-x-auto rounded-lg border">
                    <TablaAmortizacion
                      filas={detalle.tabla_json}
                      cobrosDesglose={detalle.cobros_desglose_json}
                      sistema={detalle.sistema_amortizacion}
                    />
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
