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
import { Loader2, Calculator, ArrowRight } from 'lucide-react'

interface Simulacion {
  id: string
  created_at: string
  monto: number
  plazo_meses: number
  tasa_aplicada: number
  sistema_amortizacion: string
  cuota_base: number
  cuota_final: number
  total_intereses: number
  total_a_pagar: number
}

export default function MisSimulacionesPage() {
  const [simulaciones, setSimulaciones] = useState<Simulacion[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('simulaciones')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })

    setSimulaciones((data as Simulacion[]) ?? [])
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
            <Button
              variant="outline"
              className="cursor-pointer"
            >
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
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead className="text-right">Tasa %</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Cuota final</TableHead>
                <TableHead className="text-right">Intereses</TableHead>
                <TableHead className="text-right">Costo total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulaciones.map((sim) => (
                <TableRow key={sim.id}>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(sim.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${sim.monto.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-sm">{sim.plazo_meses} m</TableCell>
                  <TableCell className="text-right font-mono text-sm">{sim.tasa_aplicada}%</TableCell>
                  <TableCell className="text-sm">
                    {sim.sistema_amortizacion === 'francesa' ? 'Francés' : 'Alemán'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                    ${sim.cuota_final?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm text-gray-600">
                    ${sim.total_intereses?.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-medium">
                    ${sim.total_a_pagar?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
