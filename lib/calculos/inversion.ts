// ============================================================
// SimulaFinance — Cálculos de simulación de inversiones
// ============================================================
import type { ResultadoSimulacionInversion, FrecuenciaAporte } from '@/types'

const DIAS_ANIO = 365

/**
 * Plazo fijo: interés simple
 * rendimiento = monto × (tasa/100) × (plazo_dias / 365)
 */
export function calcularPlazoFijo(
  monto: number,
  tasaAnual: number,
  plazoDias: number
): ResultadoSimulacionInversion {
  const rendimiento = redondear(monto * (tasaAnual / 100) * (plazoDias / DIAS_ANIO))
  const totalRecibir = redondear(monto + rendimiento)
  const fechaVencimiento = calcularFechaVencimiento(plazoDias)

  return {
    monto_invertido: monto,
    rendimiento_estimado: rendimiento,
    total_a_recibir: totalRecibir,
    fecha_vencimiento: fechaVencimiento,
    tasa_anual: tasaAnual,
    plazo_dias: plazoDias,
  }
}

/**
 * Ahorro programado: aportes periódicos con interés compuesto
 * Cada aporte genera su propio rendimiento compuesto.
 */
export function calcularAhorroProgramado(
  aportePeriodico: number,
  tasaAnual: number,
  frecuencia: FrecuenciaAporte,
  periodos: number
): ResultadoSimulacionInversion {
  const periodosDias = frecuenciaToDias(frecuencia)
  const tasaPeriodica = (tasaAnual / 100) * (periodosDias / DIAS_ANIO)
  const plazoDiasTotales = periodos * periodosDias

  let acumulado = 0
  const desglose: ResultadoSimulacionInversion['desglose'] = []

  for (let i = 1; i <= periodos; i++) {
    // Cada aporte crece durante los períodos restantes
    const periodosRestantes = periodos - i + 1
    const valorFinal = aportePeriodico * Math.pow(1 + tasaPeriodica, periodosRestantes)
    acumulado += valorFinal

    desglose?.push({
      periodo: i,
      aporte: aportePeriodico,
      interes: redondear(valorFinal - aportePeriodico),
      acumulado: redondear(
        desglose.length > 0
          ? (desglose[desglose.length - 1]?.acumulado ?? 0) + valorFinal
          : valorFinal
      ),
    })
  }

  const totalAportado = redondear(aportePeriodico * periodos)
  acumulado = redondear(acumulado)
  const rendimiento = redondear(acumulado - totalAportado)

  return {
    monto_invertido: totalAportado,
    rendimiento_estimado: rendimiento,
    total_a_recibir: acumulado,
    fecha_vencimiento: calcularFechaVencimiento(plazoDiasTotales),
    tasa_anual: tasaAnual,
    plazo_dias: plazoDiasTotales,
    desglose,
  }
}

/**
 * Ahorro objetivo: calcula el aporte mensual necesario para alcanzar una meta
 * Usa la fórmula de cuota de una anualidad con interés compuesto
 */
export function calcularAhorroObjetivo(
  meta: number,
  tasaAnual: number,
  plazoDias: number,
  frecuencia: FrecuenciaAporte = 'mensual'
): ResultadoSimulacionInversion & { aporte_necesario: number } {
  const periodosDias = frecuenciaToDias(frecuencia)
  const periodos = Math.floor(plazoDias / periodosDias)
  const tasaPeriodica = (tasaAnual / 100) * (periodosDias / DIAS_ANIO)

  // Aporte necesario = meta × tasa / [(1 + tasa)^n - 1]
  let aporteNecesario: number
  if (tasaPeriodica === 0 || periodos === 0) {
    aporteNecesario = periodos > 0 ? meta / periodos : meta
  } else {
    aporteNecesario = redondear(
      (meta * tasaPeriodica) / (Math.pow(1 + tasaPeriodica, periodos) - 1)
    )
  }

  const totalAportado = redondear(aporteNecesario * periodos)
  const rendimiento = redondear(meta - totalAportado)

  return {
    monto_invertido: totalAportado,
    rendimiento_estimado: Math.max(0, rendimiento),
    total_a_recibir: meta,
    fecha_vencimiento: calcularFechaVencimiento(plazoDias),
    tasa_anual: tasaAnual,
    plazo_dias: plazoDias,
    aporte_necesario: aporteNecesario,
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function frecuenciaToDias(frecuencia: FrecuenciaAporte): number {
  const map: Record<FrecuenciaAporte, number> = {
    unico: 365,
    mensual: 30,
    trimestral: 90,
    semestral: 180,
    anual: 365,
  }
  return map[frecuencia]
}

function calcularFechaVencimiento(plazoDias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + plazoDias)
  return fecha.toISOString().split('T')[0]
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
