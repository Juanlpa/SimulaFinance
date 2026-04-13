// ============================================================
// SimulaFinance — Generador de tabla de amortización completa
// Combina amortización base + cobros indirectos
// ============================================================
import type {
  TablaAmortizacionRow,
  CobroDesglose,
  ResumenCredito,
  ParamsTablaCompleta,
} from '@/types'
import { calcularAmortizacionFrancesa } from './amortizacion-francesa'
import { calcularAmortizacionAlemana } from './amortizacion-alemana'
import { calcularCobrosIndirectos } from './cobros-indirectos'

export interface ResultadoTablaCompleta {
  filas: TablaAmortizacionRow[]
  cobros_desglose: CobroDesglose[]
  resumen: ResumenCredito
}

/**
 * Genera la tabla de amortización completa:
 * 1. Calcula la tabla base (francesa o alemana)
 * 2. Calcula los cobros indirectos
 * 3. Agrega una columna por cobro a cada fila
 * 4. Calcula cuota_final = cuota_base + suma de cobros mensuales
 * 5. Calcula el resumen financiero total
 */
export function generarTablaCompleta(params: ParamsTablaCompleta): ResultadoTablaCompleta {
  const { monto, plazo_meses, tasa_anual, sistema, cobros, valor_bien } = params

  // ── 1. Tabla base ─────────────────────────────────────────
  const filasBase =
    sistema === 'francesa'
      ? calcularAmortizacionFrancesa({ monto, plazo_meses, tasa_anual })
      : calcularAmortizacionAlemana({ monto, plazo_meses, tasa_anual })

  // ── 2. Cobros indirectos ──────────────────────────────────
  const cobrosDesglose = calcularCobrosIndirectos(cobros, monto, valor_bien, plazo_meses)
  const sumaCobrosmensuales = cobrosDesglose.reduce((acc, c) => acc + c.mensual, 0)

  // ── 3 & 4. Agregar cobros a cada fila ────────────────────
  const filas: TablaAmortizacionRow[] = filasBase.map((fila) => {
    if (fila.numero === 0) {
      // Fila inicial: solo saldo
      return { ...fila, cobros: {}, cuota_final: 0 }
    }

    const cobrosMap: Record<string, number> = {}
    cobrosDesglose.forEach((c) => {
      cobrosMap[c.nombre] = c.mensual
    })

    return {
      ...fila,
      cobros: cobrosMap,
      cuota_final: redondear(fila.cuota_base + sumaCobrosmensuales),
    }
  })

  // ── 5. Resumen financiero ─────────────────────────────────
  const filasReales = filas.filter((f) => f.numero > 0)
  const totalCapital = redondear(filasReales.reduce((acc, f) => acc + f.capital, 0))
  const totalIntereses = redondear(filasReales.reduce((acc, f) => acc + f.interes, 0))
  const totalCobrosAdicionales = redondear(cobrosDesglose.reduce((acc, c) => acc + c.total, 0))

  const resumen: ResumenCredito = {
    monto,
    plazo_meses,
    tasa_anual,
    sistema_amortizacion: sistema,
    cuota_base_inicial: filasReales[0]?.cuota_base ?? 0,
    cuota_final: filasReales[0]?.cuota_final ?? 0,
    total_capital: totalCapital,
    total_intereses: totalIntereses,
    cobros_desglose: cobrosDesglose,
    total_cobros_adicionales: totalCobrosAdicionales,
    costo_total_credito: redondear(totalCapital + totalIntereses + totalCobrosAdicionales),
  }

  return { filas, cobros_desglose: cobrosDesglose, resumen }
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
