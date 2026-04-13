// ============================================================
// SimulaFinance — TablaAmortizacion: Tabla con paginación
// ============================================================
'use client'

import { useState } from 'react'
import type { TablaAmortizacionRow, CobroDesglose } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TablaAmortizacionProps {
  filas: TablaAmortizacionRow[]
  cobrosDesglose: CobroDesglose[]
  sistema: string
}

const FILAS_POR_PAGINA = 25

export function TablaAmortizacion({ filas, cobrosDesglose, sistema }: TablaAmortizacionProps) {
  const [pagina, setPagina] = useState(0)

  const filasReales = filas.filter((f) => f.numero > 0)
  const totalPaginas = Math.ceil(filasReales.length / FILAS_POR_PAGINA)
  const necesitaPaginacion = filasReales.length > FILAS_POR_PAGINA

  const filasVisibles = necesitaPaginacion
    ? filasReales.slice(pagina * FILAS_POR_PAGINA, (pagina + 1) * FILAS_POR_PAGINA)
    : filasReales

  const nombresCobrosCols = cobrosDesglose.map((c) => c.nombre)

  // Fila de totales
  const totalCuotaBase = filasReales.reduce((a, f) => a + f.cuota_base, 0)
  const totalCuotaFinal = filasReales.reduce((a, f) => a + f.cuota_final, 0)
  const totalInteres = filasReales.reduce((a, f) => a + f.interes, 0)
  const totalCapital = filasReales.reduce((a, f) => a + f.capital, 0)

  const fmt = (n: number) => `$${n.toFixed(2)}`

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ backgroundColor: 'var(--color-inst-primary)' }}>
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-white">#</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white">Cuota base</th>
              {nombresCobrosCols.map((nombre) => (
                <th key={nombre} className="px-3 py-2.5 text-right text-xs font-semibold text-white whitespace-nowrap">
                  {nombre}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white">Cuota final</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white">Interés</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white">Capital</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold text-white">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {/* Fila 0: saldo inicial */}
            <tr className="bg-gray-50 border-b">
              <td className="px-3 py-2 font-mono text-xs text-gray-500">0</td>
              <td className="px-3 py-2 text-right text-gray-400">—</td>
              {nombresCobrosCols.map((n) => (
                <td key={n} className="px-3 py-2 text-right text-gray-400">—</td>
              ))}
              <td className="px-3 py-2 text-right text-gray-400">—</td>
              <td className="px-3 py-2 text-right text-gray-400">—</td>
              <td className="px-3 py-2 text-right text-gray-400">—</td>
              <td className="px-3 py-2 text-right font-mono font-semibold text-sm">
                {fmt(filas[0]?.saldo ?? 0)}
              </td>
            </tr>

            {/* Filas de cuotas */}
            {filasVisibles.map((fila) => (
              <tr
                key={fila.numero}
                className={`border-b transition-colors hover:bg-gray-50/80 ${
                  fila.numero % 2 === 0 ? 'bg-gray-50/40' : ''
                }`}
              >
                <td className="px-3 py-2 font-mono text-xs text-gray-600">{fila.numero}</td>
                <td className="px-3 py-2 text-right font-mono text-sm">{fmt(fila.cuota_base)}</td>
                {nombresCobrosCols.map((nombre) => (
                  <td key={nombre} className="px-3 py-2 text-right font-mono text-sm text-gray-600">
                    {fmt(fila.cobros[nombre] ?? 0)}
                  </td>
                ))}
                <td className="px-3 py-2 text-right font-mono text-sm font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                  {fmt(fila.cuota_final)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-sm text-gray-600">{fmt(fila.interes)}</td>
                <td className="px-3 py-2 text-right font-mono text-sm text-gray-600">{fmt(fila.capital)}</td>
                <td className="px-3 py-2 text-right font-mono text-sm">{fmt(fila.saldo)}</td>
              </tr>
            ))}

            {/* Fila de totales (solo en última página o sin paginación) */}
            {(!necesitaPaginacion || pagina === totalPaginas - 1) && (
              <tr className="font-bold text-white" style={{ backgroundColor: 'var(--color-inst-secondary)' }}>
                <td className="px-3 py-2.5 text-xs">TOTAL</td>
                <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(totalCuotaBase)}</td>
                {cobrosDesglose.map((c) => (
                  <td key={c.nombre} className="px-3 py-2.5 text-right font-mono text-sm">
                    {fmt(c.total)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(totalCuotaFinal)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(totalInteres)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-sm">{fmt(totalCapital)}</td>
                <td className="px-3 py-2.5 text-right font-mono text-sm">$0.00</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {necesitaPaginacion && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Mostrando cuotas {pagina * FILAS_POR_PAGINA + 1}–
            {Math.min((pagina + 1) * FILAS_POR_PAGINA, filasReales.length)} de {filasReales.length}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.max(0, p - 1))}
              disabled={pagina === 0}
              className="cursor-pointer"
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-xs px-2">
              {pagina + 1} / {totalPaginas}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
              disabled={pagina >= totalPaginas - 1}
              className="cursor-pointer"
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-right">
        Sistema: {sistema === 'francesa' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'}
      </p>
    </div>
  )
}
