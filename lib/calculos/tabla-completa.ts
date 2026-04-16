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
 * 2. Separa cobros fijos de cobros de desgravamen
 * 3. Aplica cobros fijos uniformemente
 * 4. Calcula desgravamen fila por fila sobre saldo insoluto
 * 5. Recalcula cuota_final por fila
 * 6. Calcula el resumen financiero total
 */
export function generarTablaCompleta(params: ParamsTablaCompleta): ResultadoTablaCompleta {
  const { monto, plazo_meses, tasa_anual, sistema, cobros, valor_bien } = params

  // ── 1. Tabla base ─────────────────────────────────────────
  const filas: TablaAmortizacionRow[] = (
    sistema === 'francesa'
      ? calcularAmortizacionFrancesa({ monto, plazo_meses, tasa_anual })
      : calcularAmortizacionAlemana({ monto, plazo_meses, tasa_anual })
  ).map(f => ({ ...f, cobros: {}, cuota_final: f.numero === 0 ? 0 : f.cuota_base }))

  // ── 2. Separar cobros fijos de desgravamen ────────────────
  const cobrosFijos      = cobros.filter(c => !c.es_desgravamen)
  const cobrosDesgravamen = cobros.filter(c => c.es_desgravamen)

  // ── 3. Cobros fijos: valor mensual uniforme ───────────────
  const desgloses: CobroDesglose[] = calcularCobrosIndirectos(cobrosFijos, monto, valor_bien, plazo_meses)
  const sumaFijosMensual = desgloses.reduce((s, c) => s + c.mensual, 0)

  for (let i = 1; i < filas.length; i++) {
    desgloses.forEach(c => { filas[i].cobros[c.nombre] = c.mensual })
  }

  // ── 4. Desgravamen: calculado fila por fila ───────────────
  // saldo_inicio_mes_i = filas[i-1].saldo (balance ANTES del pago i)
  const desglosesDes: CobroDesglose[] = cobrosDesgravamen.map(cobro => {
    const tasaMensual = cobro.valor / 12 / 100
    const valores: number[] = []

    for (let i = 1; i < filas.length; i++) {
      const val = redondear(filas[i - 1].saldo * tasaMensual)
      filas[i].cobros[cobro.nombre] = val
      valores.push(val)
    }

    const total = redondear(valores.reduce((s, v) => s + v, 0))
    return {
      nombre: cobro.nombre,
      tipo_cobro: cobro.tipo_cobro,
      valor_configurado: cobro.valor,
      base_calculo: cobro.base_calculo,
      total,
      mensual: redondear(total / plazo_meses),
      es_desgravamen: true,
      mensual_inicial: valores[0] ?? null,
      mensual_final: valores[valores.length - 1] ?? null,
    }
  })

  // ── 5. Recalcular cuota_final por fila ────────────────────
  for (let i = 1; i < filas.length; i++) {
    const sumaCobros = Object.values(filas[i].cobros).reduce((s, v) => s + v, 0)
    filas[i].cuota_final = redondear(filas[i].cuota_base + sumaCobros)
  }

  // ── 6. Resumen financiero ─────────────────────────────────
  const cobrosDesglose = [...desgloses, ...desglosesDes]
  const filasReales = filas.filter(f => f.numero > 0)
  const totalCapital = redondear(filasReales.reduce((s, f) => s + f.capital, 0))
  const totalIntereses = redondear(filasReales.reduce((s, f) => s + f.interes, 0))
  const totalCobrosAdicionales = redondear(cobrosDesglose.reduce((s, c) => s + c.total, 0))

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
