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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Columna 1: Estructura del crédito */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-inst-primary)' }} />
          Estructura del crédito
        </h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Monto solicitado</span>
            <span className="font-mono font-medium text-right">{fmt(resumen.monto)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Plazo</span>
            <span className="font-medium text-right">{resumen.plazo_meses} meses</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Tasa anual</span>
            <span className="font-mono font-medium text-right">{resumen.tasa_anual.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Sistema</span>
            <span className="font-medium text-right">
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
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Cuota base</span>
            <span className="font-mono font-medium text-right">{fmt(resumen.cuota_base_inicial)}</span>
          </div>
          {resumen.cobros_desglose.map((c) => (
            <div key={c.nombre} className="flex justify-between items-start gap-2">
              <span className="text-gray-500 pr-2">{c.nombre}</span>
              {c.es_desgravamen && c.mensual_inicial != null && c.mensual_final != null ? (
                <span className="font-mono text-gray-600 text-right text-xs leading-5">
                  +{fmt(c.mensual_inicial)} → {fmt(c.mensual_final)}
                  <span className="block text-gray-400">variable / mes</span>
                </span>
              ) : (
                <span className="font-mono text-gray-600">+{fmt(c.mensual)}/mes</span>
              )}
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-baseline gap-2">
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
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Total capital</span>
            <span className="font-mono font-medium text-right">{fmt(resumen.total_capital)}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-500">Total intereses</span>
            <span className="font-mono font-medium text-right">{fmt(resumen.total_intereses)}</span>
          </div>
          {resumen.cobros_desglose.map((c) => (
            <div key={c.nombre} className="flex justify-between items-start gap-2">
              <span className="text-gray-500 pr-2">Total {c.nombre}</span>
              <div className="text-right">
                <span className="font-mono text-gray-600">{fmt(c.total)}</span>
                {c.es_desgravamen && (
                  <span className="block text-xs text-gray-400">saldo decreciente</span>
                )}
              </div>
            </div>
          ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-baseline gap-2">
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
