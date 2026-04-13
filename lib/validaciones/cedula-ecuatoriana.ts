// ============================================================
// SimulaFinance — Validación de cédula ecuatoriana
// Algoritmo módulo 10
// ============================================================
import type { ResultadoValidacion } from '@/types'

const COEFICIENTES = [2, 1, 2, 1, 2, 1, 2, 1, 2]

/**
 * Valida una cédula de identidad ecuatoriana.
 *
 * Reglas:
 * - Exactamente 10 dígitos
 * - Primeros 2 dígitos = código de provincia (01-24 o 30)
 * - Tercer dígito: NO se restringe (puede ser 0-9, incluyendo 6)
 * - Validación por dígito verificador con módulo 10
 *
 * Coeficientes: [2,1,2,1,2,1,2,1,2] sobre los 9 primeros dígitos
 * Si el producto es > 9, se resta 9
 * Suma todos los resultados
 * Verificador = (10 - suma%10) === 10 ? 0 : (10 - suma%10)
 * El verificador debe coincidir con el dígito 10 (índice 9)
 */
export function validarCedula(cedula: string): ResultadoValidacion {
  const limpia = cedula.trim()

  if (!/^\d{10}$/.test(limpia)) {
    return { valido: false, mensaje: 'La cédula debe tener exactamente 10 dígitos numéricos.' }
  }

  const provincia = parseInt(limpia.substring(0, 2), 10)
  const provinciasValidas = [
    ...Array.from({ length: 24 }, (_, i) => i + 1), // 01-24
    30, // ecuatorianos en el exterior
  ]

  if (!provinciasValidas.includes(provincia)) {
    return { valido: false, mensaje: 'El código de provincia no es válido (debe ser 01-24 o 30).' }
  }

  const digitos = limpia.split('').map(Number)

  let suma = 0
  for (let i = 0; i < 9; i++) {
    let producto = digitos[i] * COEFICIENTES[i]
    if (producto > 9) producto -= 9
    suma += producto
  }

  const residuo = suma % 10
  const verificadorCalculado = residuo === 0 ? 0 : 10 - residuo
  const verificadorCedula = digitos[9]

  if (verificadorCalculado !== verificadorCedula) {
    return { valido: false, mensaje: 'La cédula no es válida. El dígito verificador no coincide.' }
  }

  return { valido: true, mensaje: 'Cédula válida.' }
}

/**
 * Extrae solo el resultado booleano
 */
export function esCedulaValida(cedula: string): boolean {
  return validarCedula(cedula).valido
}
