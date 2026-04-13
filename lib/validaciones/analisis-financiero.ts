// ============================================================
// SimulaFinance — Validaciones de análisis financiero
// ============================================================
import type { ResultadoValidacion } from '@/types'

export interface DatosAnalisisFinanciero {
  ingresos_mensuales: number
  gastos_mensuales: number
  otros_creditos_cuota: number
  patrimonio: number
}

/**
 * Valida el formulario de análisis financiero completo
 */
export function validarAnalisisFinanciero(datos: DatosAnalisisFinanciero): ResultadoValidacion {
  const { ingresos_mensuales, gastos_mensuales, otros_creditos_cuota, patrimonio } = datos

  if (ingresos_mensuales <= 0) {
    return { valido: false, mensaje: 'Los ingresos mensuales deben ser mayores a $0.' }
  }

  if (gastos_mensuales < 0) {
    return { valido: false, mensaje: 'Los gastos mensuales no pueden ser negativos.' }
  }

  if (gastos_mensuales >= ingresos_mensuales) {
    return {
      valido: false,
      mensaje: 'Los gastos mensuales no pueden ser iguales o mayores a los ingresos.',
    }
  }

  if (otros_creditos_cuota < 0) {
    return {
      valido: false,
      mensaje: 'Las cuotas de otros créditos no pueden ser negativas.',
    }
  }

  if (patrimonio < 0) {
    return { valido: false, mensaje: 'El patrimonio no puede ser negativo.' }
  }

  const gastosTotales = gastos_mensuales + otros_creditos_cuota
  if (gastosTotales >= ingresos_mensuales) {
    return {
      valido: false,
      mensaje: `Tus gastos totales ($${gastosTotales.toFixed(2)}) son iguales o superiores a tus ingresos. No tienes capacidad de pago disponible.`,
    }
  }

  return { valido: true, mensaje: 'Análisis financiero válido.' }
}

/**
 * Valida un campo individual de forma reactiva para formularios
 */
export function validarCampoFinanciero(
  campo: keyof DatosAnalisisFinanciero,
  valor: number,
  contexto?: Partial<DatosAnalisisFinanciero>
): ResultadoValidacion {
  switch (campo) {
    case 'ingresos_mensuales':
      if (valor <= 0) return { valido: false, mensaje: 'Los ingresos deben ser mayores a $0.' }
      break
    case 'gastos_mensuales':
      if (valor < 0) return { valido: false, mensaje: 'Los gastos no pueden ser negativos.' }
      if (contexto?.ingresos_mensuales && valor >= contexto.ingresos_mensuales) {
        return { valido: false, mensaje: 'Los gastos no pueden superar los ingresos.' }
      }
      break
    case 'otros_creditos_cuota':
      if (valor < 0) return { valido: false, mensaje: 'No puede ser negativo.' }
      break
    case 'patrimonio':
      if (valor < 0) return { valido: false, mensaje: 'El patrimonio no puede ser negativo.' }
      break
  }

  return { valido: true, mensaje: '' }
}
