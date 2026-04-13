// ============================================================
// SimulaFinance — ResumenCostos: Panel de resumen financiero
// ============================================================
import type { ResumenCredito } from '@/types'

interface ResumenCostosProps {
  resumen: ResumenCredito
}

export function ResumenCostos({ resumen }: ResumenCostosProps) {
  const fmt = (n: number) => `$${n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Columna 1: Estructura del crédito */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-inst-primary)' }} />
          Estructura del crédito
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Monto solicitado</span>
            <span className="font-mono font-medium">{fmt(resumen.monto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Plazo</span>
            <span className="font-medium">{resumen.plazo_meses} meses</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tasa anual</span>
            <span className="font-mono font-medium">{resumen.tasa_anual.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Sistema</span>
            <span className="font-medium">
              {resumen.sistema_amortizacion === 'francesa' ? 'Francés' : 'Alemán'}
            </span>
          </div>
        </div>
      </div>

      {/* Columna 2: Por cuota */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-inst-accent)' }} />
          Detalle por cuota
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Cuota base</span>
            <span className="font-mono font-medium">{fmt(resumen.cuota_base_inicial)}</span>
          </div>
          {resumen.cobros_desglose.length > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500">Cobros adicionales</span>
              <span className="font-mono text-gray-600">
                +{fmt(resumen.cobros_desglose.reduce((a, c) => a + c.mensual, 0))}
              </span>
            </div>
          )}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                Cuota final
              </span>
              <span
                className="font-mono text-lg font-bold"
                style={{ color: 'var(--color-inst-primary)' }}
              >
                {fmt(resumen.cuota_final)}
              </span>
            </div>
            {resumen.sistema_amortizacion === 'alemana' && (
              <p className="text-xs text-gray-400 mt-1">
                Primera cuota — las siguientes serán menores
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Columna 3: Totales del crédito */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-inst-secondary)' }} />
          Totales del crédito
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total capital</span>
            <span className="font-mono font-medium">{fmt(resumen.total_capital)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total intereses</span>
            <span className="font-mono font-medium">{fmt(resumen.total_intereses)}</span>
          </div>
          {resumen.cobros_desglose.map((c) => (
            <div key={c.nombre} className="flex justify-between">
              <span className="text-gray-500">Total {c.nombre}</span>
              <span className="font-mono text-gray-600">{fmt(c.total)}</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-gray-800">Costo total</span>
              <span className="font-mono text-xl font-bold text-gray-900">
                {fmt(resumen.costo_total_credito)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
