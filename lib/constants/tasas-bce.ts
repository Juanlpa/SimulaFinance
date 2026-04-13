// ============================================================
// SimulaFinance — Tasas de referencia BCE (marzo 2026)
// Banco Central del Ecuador — Tasas Activas Efectivas Máximas
// ============================================================

export interface SegmentoBCE {
  segmento: string
  subsegmento: string | null
  tasa_referencial: number  // % anual efectivo
  tasa_maxima: number       // % anual efectivo máximo legal
  vigencia_desde: string    // ISO date
  resolucion_legal: string
}

// Tasas vigentes a marzo 2026 — Junta de Política y Regulación Financiera
export const TASAS_BCE: SegmentoBCE[] = [
  {
    segmento: 'Productivo Corporativo',
    subsegmento: null,
    tasa_referencial: 8.23,
    tasa_maxima: 8.23,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Productivo Empresarial',
    subsegmento: null,
    tasa_referencial: 10.44,
    tasa_maxima: 10.44,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Productivo PYMES',
    subsegmento: null,
    tasa_referencial: 10.69,
    tasa_maxima: 10.69,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Consumo Ordinario',
    subsegmento: null,
    tasa_referencial: 16.77,
    tasa_maxima: 16.77,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Consumo Prioritario',
    subsegmento: null,
    tasa_referencial: 16.77,
    tasa_maxima: 16.77,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Educativo',
    subsegmento: null,
    tasa_referencial: 9.50,
    tasa_maxima: 9.50,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Educativo',
    subsegmento: 'Social',
    tasa_referencial: 7.50,
    tasa_maxima: 7.50,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Inmobiliario',
    subsegmento: null,
    tasa_referencial: 10.96,
    tasa_maxima: 10.96,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Vivienda de Interés Público',
    subsegmento: null,
    tasa_referencial: 4.99,
    tasa_maxima: 4.99,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Vivienda de Interés Social',
    subsegmento: null,
    tasa_referencial: 4.99,
    tasa_maxima: 4.99,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Microcrédito',
    subsegmento: 'Minorista',
    tasa_referencial: 28.23,
    tasa_maxima: 28.23,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Microcrédito',
    subsegmento: 'Acumulación Simple',
    tasa_referencial: 24.89,
    tasa_maxima: 24.89,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Microcrédito',
    subsegmento: 'Acumulación Ampliada',
    tasa_referencial: 22.05,
    tasa_maxima: 22.05,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
  {
    segmento: 'Inversión Pública',
    subsegmento: null,
    tasa_referencial: 9.33,
    tasa_maxima: 9.33,
    vigencia_desde: '2026-03-01',
    resolucion_legal: 'Resolución No. JPRF-F-2024-0XXX de la Junta de Política y Regulación Financiera',
  },
]

// Textos legales oficiales
export const NOTA_LEGAL_TASAS = `Tasas de interés conforme a la Codificación de Resoluciones Monetarias, Financieras, de Valores y Seguros, Libro I: Sistema Monetario y Financiero, Capítulo XI. Tasas vigentes publicadas por el Banco Central del Ecuador.`

export const NOTA_LEGAL_SOLCA = `Contribución SOLCA del 0.5% según Disposición General Décima Cuarta del Código Orgánico Monetario y Financiero y Resolución No. 003-2014-F de la Junta de Política y Regulación Monetaria y Financiera.`

export const NOTA_LEGAL_COMPLETA = `${NOTA_LEGAL_TASAS} ${NOTA_LEGAL_SOLCA} Los valores son referenciales y están sujetos a análisis crediticio.`

export const NOTA_PIE_PDF = `Documento generado por SimulaFinance — Este documento no constituye una aprobación de crédito.`

// Constante SOLCA
export const PORCENTAJE_SOLCA = 0.005  // 0.5%

// Obtener tasa máxima por nombre de segmento
export function getTasaMaxima(segmento: string, subsegmento?: string): number | null {
  const found = TASAS_BCE.find(
    (t) =>
      t.segmento.toLowerCase() === segmento.toLowerCase() &&
      (subsegmento ? t.subsegmento?.toLowerCase() === subsegmento.toLowerCase() : true)
  )
  return found ? found.tasa_maxima : null
}

// Lista de nombres de segmentos para select
export const SEGMENTOS_BCE_NOMBRES = TASAS_BCE.map((t) =>
  t.subsegmento ? `${t.segmento} — ${t.subsegmento}` : t.segmento
)
