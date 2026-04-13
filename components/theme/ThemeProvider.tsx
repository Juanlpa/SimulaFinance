'use client'
// ============================================================
// SimulaFinance — ThemeProvider institucional
// Aplica colores dinámicos desde la configuración de la institución
// ============================================================
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Institucion, ColoresInstitucion } from '@/types'
import { generateCSSString, COLORES_DEFAULT } from '@/lib/theme/dynamic-colors'

interface ThemeContextValue {
  institucion: Institucion | null
  colores: ColoresInstitucion
  cargando: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  institucion: null,
  colores: COLORES_DEFAULT,
  cargando: true,
})

export function useInstitucion() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
  institucionInicial?: Institucion | null
}

/**
 * ThemeProvider: inyecta CSS variables de colores institucionales en el DOM.
 * Recibe la institución como prop (cargada en Server Component) o la obtiene del contexto.
 *
 * Uso en app/layout.tsx:
 *   <ThemeProvider institucionInicial={institucion}>
 *     {children}
 *   </ThemeProvider>
 */
export function ThemeProvider({ children, institucionInicial = null }: ThemeProviderProps) {
  const [institucion, setInstitucion] = useState<Institucion | null>(institucionInicial)
  const [cargando, setCargando] = useState(!institucionInicial)

  const colores: ColoresInstitucion = institucion
    ? {
        primario: institucion.color_primario,
        secundario: institucion.color_secundario,
        acento: institucion.color_acento,
      }
    : COLORES_DEFAULT

  useEffect(() => {
    if (institucionInicial) {
      setInstitucion(institucionInicial)
      setCargando(false)
    }
  }, [institucionInicial])

  useEffect(() => {
    // Inyectar CSS variables en el documento
    const cssString = generateCSSString(colores)
    let styleEl = document.getElementById('simulafinance-theme')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'simulafinance-theme'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = cssString
  }, [colores.primario, colores.secundario, colores.acento])

  return (
    <ThemeContext.Provider value={{ institucion, colores, cargando }}>
      {children}
    </ThemeContext.Provider>
  )
}
