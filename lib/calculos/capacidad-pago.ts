// ============================================================
// SimulaFinance — Análisis de capacidad de pago (regla del 40%)
// ============================================================
import type { ResultadoCapacidadPago } from '@/types'

const LIMITE_ENDEUDAMIENTO = 0.40  // 40% de los ingresos

/**
 * Calcula la capacidad de pago del cliente.
 *
 * IMPORTANTE: la validación se hace contra la CUOTA FINAL
 * (que incluye todos los cobros indirectos), no contra la cuota base.
 *
 * @param ingresosMensuales      - Ingresos mensuales totales del cliente
 * @param gastosMensuales        - Gastos mensuales fijos
 * @param cuotasOtrosCreditos    - Suma de cuotas de créditos vigentes
 * @param cuotaFinalNueva        - Cuota final del crédito que quiere solicitar
 */
export function calcularCapacidadPago(
  ingresosMensuales: number,
  gastosMensuales: number,
  cuotasOtrosCreditos: number,
  cuotaFinalNueva: number
): ResultadoCapacidadPago {
  // Capacidad disponible después de gastos y deudas existentes
  const capacidadMaxima = redondear(
    ingresosMensuales - gastosMensuales - cuotasOtrosCreditos
  )

  // % actual sin el nuevo crédito
  const porcentajeActual =
    ingresosMensuales > 0
      ? redondear(((gastosMensuales + cuotasOtrosCreditos) / ingresosMensuales) * 100)
      : 100

  // % si se aprueba el nuevo crédito
  const porcentajeConNuevaCuota =
    ingresosMensuales > 0
      ? redondear(
          ((gastosMensuales + cuotasOtrosCreditos + cuotaFinalNueva) / ingresosMensuales) * 100
        )
      : 100

  const puedePagar =
    capacidadMaxima >= cuotaFinalNueva &&
    porcentajeConNuevaCuota <= LIMITE_ENDEUDAMIENTO * 100

  let mensaje: string
  if (ingresosMensuales <= 0) {
    mensaje = 'Debes ingresar tus ingresos mensuales para calcular tu capacidad de pago.'
  } else if (puedePagar) {
    mensaje = `Tu capacidad máxima de cuota mensual es $${capacidadMaxima.toFixed(2)}. La cuota de este crédito ($${cuotaFinalNueva.toFixed(2)}) está dentro de tu capacidad de pago.`
  } else if (capacidadMaxima < cuotaFinalNueva) {
    mensaje = `Tu capacidad máxima de cuota mensual es $${capacidadMaxima.toFixed(2)}, pero la cuota de este crédito es $${cuotaFinalNueva.toFixed(2)}. No cuentas con suficiente capacidad de pago.`
  } else {
    mensaje = `Con este crédito, tu nivel de endeudamiento sería del ${porcentajeConNuevaCuota.toFixed(1)}%, superando el límite del 40% de tus ingresos.`
  }

  return {
    capacidad_maxima: Math.max(0, capacidadMaxima),
    porcentaje_endeudamiento_actual: porcentajeActual,
    porcentaje_con_nueva_cuota: porcentajeConNuevaCuota,
    puede_pagar: puedePagar,
    mensaje,
  }
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100
}
