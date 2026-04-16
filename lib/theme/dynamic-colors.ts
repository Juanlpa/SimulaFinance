// ============================================================
// SimulaFinance — Generador de CSS variables dinámicas
// Genera variantes claras/oscuras desde colores hex del admin
// ============================================================
import type { ColoresInstitucion, CSSVarsInstitucion } from '@/types'

/**
 * Convierte un color hex a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const limpio = hex.replace('#', '')
  if (limpio.length !== 6) return null
  return {
    r: parseInt(limpio.substring(0, 2), 16),
    g: parseInt(limpio.substring(2, 4), 16),
    b: parseInt(limpio.substring(4, 6), 16),
  }
}

/**
 * Convierte RGB a hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, '0')).join('')
}

/**
 * Aclara un color hex en un porcentaje dado (0-100)
 */
function aclarar(hex: string, porcentaje: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = porcentaje / 100
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * factor),
    Math.round(rgb.g + (255 - rgb.g) * factor),
    Math.round(rgb.b + (255 - rgb.b) * factor)
  )
}

/**
 * Oscurece un color hex en un porcentaje dado (0-100)
 */
function oscurecer(hex: string, porcentaje: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const factor = 1 - porcentaje / 100
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  )
}

/**
 * Genera el objeto de CSS variables desde los colores de la institución.
 * Produce 3 variantes por color: base, light (+30% brightness), dark (-20%)
 */
export function generateCSSVars(colores: ColoresInstitucion): CSSVarsInstitucion {
  return {
    '--color-inst-primary': colores.primario,
    '--color-inst-primary-light': aclarar(colores.primario, 30),
    '--color-inst-primary-dark': oscurecer(colores.primario, 20),
    '--color-inst-secondary': colores.secundario,
    '--color-inst-secondary-light': aclarar(colores.secundario, 30),
    '--color-inst-secondary-dark': oscurecer(colores.secundario, 20),
    '--color-inst-accent': colores.acento,
    '--color-inst-accent-light': aclarar(colores.acento, 30),
    '--color-inst-accent-dark': oscurecer(colores.acento, 20),
  }
}

/**
 * Convierte el objeto de CSS vars a un string inyectable en <style>
 */
export function generateCSSString(colores: ColoresInstitucion): string {
  const vars = generateCSSVars(colores)
  const entries = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')
  return `:root {\n${entries}\n}`
}

/**
 * Colores por defecto (instituciones sin configurar)
 */
export const COLORES_DEFAULT: ColoresInstitucion = {
  primario: '#0f172a',    // Slate 900 (Deep rich blue-gray)
  secundario: '#1e293b',  // Slate 800
  acento: '#3b82f6',      // Blue 500 (Vibrant accent)
}
