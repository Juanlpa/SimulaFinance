// ============================================================
// SimulaFinance — Validación de RUC ecuatoriano
// Tres tipos según el tercer dígito
// ============================================================
import type { ResultadoValidacion } from '@/types'
import { validarCedula } from './cedula-ecuatoriana'

/**
 * Valida un RUC ecuatoriano.
 *
 * Tipos por tercer dígito:
 *
 * 1. PERSONA NATURAL (tercer dígito 0-5):
 *    - Los primeros 10 dígitos forman una cédula válida (módulo 10)
 *    - Los últimos 3 dígitos deben ser >= "001"
 *
 * 2. SOCIEDAD PRIVADA / EXTRANJEROS SIN CÉDULA (tercer dígito = 9):
 *    - Módulo 11 sobre los primeros 9 dígitos
 *    - Coeficientes: [4,3,2,7,6,5,4,3,2]
 *    - Dígito verificador en posición 10 (índice 9)
 *    - Últimos 3 dígitos >= "001"
 *
 * 3. INSTITUCIÓN PÚBLICA (tercer dígito = 6):
 *    - Módulo 11 sobre los primeros 8 dígitos
 *    - Coeficientes: [3,2,7,6,5,4,3,2]
 *    - Dígito verificador en posición 9 (índice 8)
 *    - Últimos 4 dígitos >= "0001"
 */
export function validarRUC(ruc: string): ResultadoValidacion {
  const limpio = ruc.trim()

  if (!/^\d{13}$/.test(limpio)) {
    return { valido: false, mensaje: 'El RUC debe tener exactamente 13 dígitos numéricos.' }
  }

  const tercerDigito = parseInt(limpio[2], 10)

  if (tercerDigito >= 0 && tercerDigito <= 5) {
    return validarRucPersonaNatural(limpio)
  } else if (tercerDigito === 9) {
    return validarRucSociedadPrivada(limpio)
  } else if (tercerDigito === 6) {
    return validarRucInstitucionPublica(limpio)
  } else {
    return {
      valido: false,
      mensaje: `Tercer dígito '${tercerDigito}' no corresponde a ningún tipo de RUC válido.`,
    }
  }
}

// ─── Persona Natural (tercer dígito 0-5) ─────────────────────
function validarRucPersonaNatural(ruc: string): ResultadoValidacion {
  const ultimosTres = ruc.substring(10, 13)
  if (parseInt(ultimosTres, 10) < 1) {
    return { valido: false, mensaje: 'Los últimos 3 dígitos del RUC no pueden ser "000".' }
  }

  // Los primeros 10 dígitos deben formar una cédula válida
  const cedula = ruc.substring(0, 10)
  const resultadoCedula = validarCedula(cedula)
  if (!resultadoCedula.valido) {
    return { valido: false, mensaje: `RUC inválido: los primeros 10 dígitos no forman una cédula válida. ${resultadoCedula.mensaje}` }
  }

  return { valido: true, mensaje: 'RUC de persona natural válido.' }
}

// ─── Sociedad Privada (tercer dígito = 9) ─────────────────────
function validarRucSociedadPrivada(ruc: string): ResultadoValidacion {
  const ultimosTres = ruc.substring(10, 13)
  if (parseInt(ultimosTres, 10) < 1) {
    return { valido: false, mensaje: 'Los últimos 3 dígitos del RUC no pueden ser "000".' }
  }

  const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digitos = ruc.split('').map(Number)

  let suma = 0
  for (let i = 0; i < 9; i++) {
    suma += digitos[i] * coeficientes[i]
  }

  const residuo = suma % 11
  let verificadorCalculado: number

  if (residuo === 0) {
    verificadorCalculado = 0
  } else if (residuo === 1) {
    return { valido: false, mensaje: 'RUC de sociedad privada inválido (residuo módulo 11 = 1).' }
  } else {
    verificadorCalculado = 11 - residuo
  }

  if (verificadorCalculado !== digitos[9]) {
    return { valido: false, mensaje: 'RUC de sociedad privada inválido. El dígito verificador no coincide.' }
  }

  return { valido: true, mensaje: 'RUC de sociedad privada válido.' }
}

// ─── Institución Pública (tercer dígito = 6) ─────────────────
function validarRucInstitucionPublica(ruc: string): ResultadoValidacion {
  const ultimosCuatro = ruc.substring(9, 13)
  if (parseInt(ultimosCuatro, 10) < 1) {
    return { valido: false, mensaje: 'Los últimos 4 dígitos del RUC de institución pública no pueden ser "0000".' }
  }

  const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2]
  const digitos = ruc.split('').map(Number)

  let suma = 0
  for (let i = 0; i < 8; i++) {
    suma += digitos[i] * coeficientes[i]
  }

  const residuo = suma % 11
  let verificadorCalculado: number

  if (residuo === 0) {
    verificadorCalculado = 0
  } else if (residuo === 1) {
    return { valido: false, mensaje: 'RUC de institución pública inválido (residuo módulo 11 = 1).' }
  } else {
    verificadorCalculado = 11 - residuo
  }

  // Verificador en posición 9 (índice 8)
  if (verificadorCalculado !== digitos[8]) {
    return { valido: false, mensaje: 'RUC de institución pública inválido. El dígito verificador no coincide.' }
  }

  return { valido: true, mensaje: 'RUC de institución pública válido.' }
}

export function esRUCValido(ruc: string): boolean {
  return validarRUC(ruc).valido
}
