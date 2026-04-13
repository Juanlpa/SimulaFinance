// ============================================================
// SimulaFinance — Amortización Alemana (capital fijo)
// ============================================================
import type { TablaAmortizacionRow, ParamsAmortizacion } from '@/types'

/**
 * Genera la tabla de amortización alemana.
 * - capital_fijo = monto / n (igual en cada cuota)
 * - interes_i = saldo_i × r (decrece con el saldo)
 * - cuota_base_i = capital_fijo + interes_i (va disminuyendo)
 * - saldo_i = saldo_anterior - capital_fijo
 *
 * Fila 0: solo saldo inicial.
 */
export function calcularAmortizacionAlemana(params: ParamsAmortizacion): TablaAmortizacionRow[] {
  const { monto, plazo_meses: plazoMeses, tasa_anual: tasaAnual } = params
  const r = tasaAnual / 12 / 100
  const capitalFijo = redondear(monto / plazoMeses)

  const filas: TablaAmortizacionRow[] = []

  // Fila 0: saldo inicial
  filas.push({
    numero: 0,
    cuota_base: 0,
    interes: 0,
    capital: 0,
    saldo: redondear(monto),
    cobros: {},
    cuota_final: 0,
  })

  let saldo = monto

  for (let i = 1; i <= plazoMeses; i++) {
    const interes = redondear(saldo * r)

    // En la última cuota, el capital es exactamente el saldo restante
    const capital = i === plazoMeses ? redondear(saldo) : capitalFijo
    const cuotaBase = redondear(capital + interes)

    saldo = redondear(saldo - capital)

    filas.push({
      numero: i,
      cuota_base: cuotaBase,
      interes,
      capital,
      saldo: Math.max(0, saldo),
      cobros: {},
      cuota_final: cuotaBase, // se actualiza al combinar cobros
    })
  }

  return filas
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
