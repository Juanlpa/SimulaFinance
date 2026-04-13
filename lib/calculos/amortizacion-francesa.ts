// ============================================================
// SimulaFinance — Amortización Francesa (cuota fija)
// ============================================================
import type { TablaAmortizacionRow, ParamsAmortizacion } from '@/types'

/**
 * Calcula la cuota fija mensual del método francés.
 * cuota = monto × [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calcularCuotaFrancesa(monto: number, tasaAnual: number, plazoMeses: number): number {
  const r = tasaAnual / 12 / 100
  if (r === 0) return monto / plazoMeses
  const factor = Math.pow(1 + r, plazoMeses)
  return monto * (r * factor) / (factor - 1)
}

/**
 * Genera la tabla de amortización francesa.
 * Retorna un array de filas donde:
 *   - Fila 0: solo muestra saldo inicial (cuota_base = 0, interes = 0, capital = 0)
 *   - Filas 1..n: cada cuota con su desglose
 *
 * Los cobros se agregan en una fase posterior con `generarTablaCompleta`.
 */
export function calcularAmortizacionFrancesa(params: ParamsAmortizacion): TablaAmortizacionRow[] {
  const { monto, plazo_meses: plazoMeses, tasa_anual: tasaAnual } = params
  const r = tasaAnual / 12 / 100
  const cuota = calcularCuotaFrancesa(monto, tasaAnual, plazoMeses)

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
    let capital = redondear(cuota - interes)

    // Ajuste en última cuota para evitar decimales residuales
    if (i === plazoMeses) {
      capital = redondear(saldo)
    }

    saldo = redondear(saldo - capital)

    filas.push({
      numero: i,
      cuota_base: redondear(cuota),
      interes,
      capital,
      saldo: Math.max(0, saldo),
      cobros: {},
      cuota_final: redondear(cuota), // se actualiza al combinar cobros
    })
  }

  return filas
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
