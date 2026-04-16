// ============================================================
// SimulaFinance — Cálculo de cobros indirectos
// ============================================================
// Lógica de 3 pasos para TODOS los cobros (SOLCA, seguros, etc.)
// Paso 1: Calcular el TOTAL del cobro para todo el crédito
// Paso 2: Caso especial SOLCA (proporcional si plazo <= 12 meses)
// Paso 3: cobro_mensual = total / plazo_meses (valor FIJO en cada cuota)
// ============================================================
import type { CobroIndirecto, CobroDesglose } from '@/types'
import { PORCENTAJE_SOLCA } from '@/lib/constants/tasas-bce'

/**
 * Calcula el desglose de cobros indirectos.
 *
 * @param cobros       - Array de cobros configurados por el admin
 * @param montoCredito - Monto del crédito solicitado
 * @param valorBien    - Valor del bien (necesario para cobros con base_calculo = 'valor_bien')
 * @param plazoMeses   - Número de cuotas
 * @returns Array de CobroDesglose con total y mensual para cada cobro
 */
export function calcularCobrosIndirectos(
  cobros: CobroIndirecto[],
  montoCredito: number,
  valorBien: number | null | undefined,
  plazoMeses: number
): CobroDesglose[] {
  return cobros.map((cobro) => {
    // ── Caso especial: desgravamen variable ─────────────────
    // El cálculo real lo hace generarTablaCompleta fila por fila
    // Aquí solo retornamos un marcador con total=0
    if (cobro.es_desgravamen) {
      return {
        nombre: cobro.nombre,
        tipo_cobro: cobro.tipo_cobro,
        valor_configurado: cobro.valor,
        base_calculo: cobro.base_calculo,
        total: 0,
        mensual: 0,
        es_desgravamen: true,
        mensual_inicial: null,
        mensual_final: null,
      }
    }

    // ── Paso 1: Calcular el total del cobro ──────────────────
    let total: number

    if (cobro.tipo_cobro === 'fijo') {
      // El valor es directamente el total en USD
      total = cobro.valor
    } else {
      // tipo_cobro === 'porcentaje'
      const base =
        cobro.base_calculo === 'valor_bien' && valorBien != null
          ? valorBien
          : montoCredito
      total = (cobro.valor / 100) * base
    }

    // ── Paso 2: Caso especial SOLCA ──────────────────────────
    if (cobro.es_solca) {
      if (plazoMeses <= 12) {
        // Proporcional al plazo
        total = montoCredito * PORCENTAJE_SOLCA * (plazoMeses / 12)
      } else {
        // Cobro completo del 0.5%
        total = montoCredito * PORCENTAJE_SOLCA
      }
    }

    // ── Paso 3: Dividir entre el número de cuotas ────────────
    const mensual = redondear(total / plazoMeses)
    total = redondear(total)

    return {
      nombre: cobro.nombre,
      tipo_cobro: cobro.tipo_cobro,
      valor_configurado: cobro.valor,
      base_calculo: cobro.base_calculo,
      total,
      mensual,
      es_desgravamen: false,
      mensual_inicial: null,
      mensual_final: null,
    }
  })
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
