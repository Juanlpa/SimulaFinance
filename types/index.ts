// ============================================================
// SimulaFinance — Tipos e interfaces del dominio
// ============================================================

// ─── Institución financiera ──────────────────────────────────
export interface Institucion {
  id: string
  nombre: string
  logo_url: string | null
  slogan: string | null
  color_primario: string    // hex, ej: '#1a1a2e'
  color_secundario: string
  color_acento: string
  direccion: string | null
  ciudad: string | null
  telefono: string | null
  email: string | null
  sitio_web: string | null
  ruc_institucion: string | null
  created_at: string
  updated_at: string
}

// ─── Usuarios ────────────────────────────────────────────────
export type RolUsuario = 'admin' | 'cliente'

export interface Usuario {
  id: string
  institucion_id: string | null
  nombre: string
  apellido: string
  email: string
  cedula: string | null
  ruc: string | null
  telefono: string | null
  direccion: string | null
  rol: RolUsuario
  foto_perfil_url: string | null
  created_at: string
}

// ─── Tasas de referencia BCE ─────────────────────────────────
export interface TasaReferencia {
  id: string
  segmento: string
  subsegmento: string | null
  tasa_referencial: number   // porcentaje anual, ej: 8.23
  tasa_maxima: number        // porcentaje anual máximo legal
  vigencia_desde: string     // ISO date
  vigencia_hasta: string | null
  resolucion_legal: string
  fuente: string
  activo: boolean
  created_at: string
}

// ─── Tipos de crédito ────────────────────────────────────────
export interface TipoCredito {
  id: string
  institucion_id: string
  nombre: string
  segmento_bce: string       // nombre del segmento BCE correspondiente
  tasa_interes_anual: number // debe ser <= tasa_maxima del segmento
  descripcion: string | null
  requiere_ruc: boolean
  activo: boolean
  created_at: string
  // Relaciones expandidas
  subtipos?: SubtipoCredito[]
  cobros_indirectos?: CobroIndirecto[]
}

// ─── Subtipos de crédito ─────────────────────────────────────
export interface SubtipoCredito {
  id: string
  tipo_credito_id: string
  nombre: string
  monto_min: number
  monto_max: number
  plazo_min_meses: number
  plazo_max_meses: number
  descripcion: string | null
  activo: boolean
  created_at: string
}

// ─── Cobros indirectos ───────────────────────────────────────
export type TipoCobro = 'porcentaje' | 'fijo'
export type BaseCalculo = 'monto_credito' | 'valor_bien'

export interface CobroIndirecto {
  id: string
  institucion_id: string
  tipo_credito_id: string | null  // null = aplica a todos
  nombre: string                  // 'SOLCA', 'Seguro desgravamen', etc.
  tipo_cobro: TipoCobro
  valor: number                   // si porcentaje: 0.50 para 0.5%. Si fijo: 700.00
  base_calculo: BaseCalculo
  obligatorio: boolean
  es_global: boolean              // true = aplica a todos los créditos
  es_solca: boolean               // true = lógica especial de proporcionalidad
  created_at: string
}

// ─── Requisitos de crédito ───────────────────────────────────
export type TipoArchivo = 'documento' | 'imagen' | 'cedula' | 'ruc'

export interface RequisitoCredito {
  id: string
  tipo_credito_id: string
  nombre: string
  descripcion: string | null
  obligatorio: boolean
  tipo_archivo: TipoArchivo
  created_at: string
}

// ─── Análisis financiero ─────────────────────────────────────
export interface AnalisisFinanciero {
  id: string
  usuario_id: string
  ingresos_mensuales: number
  gastos_mensuales: number
  otros_creditos_cuota: number    // cuotas mensuales de otros créditos vigentes
  patrimonio: number
  descripcion_ingresos: string | null
  descripcion_patrimonio: string | null
  capacidad_pago_mensual: number | null
  porcentaje_endeudamiento: number | null
  created_at: string
}

// ─── Tabla de amortización ───────────────────────────────────
export interface TablaAmortizacionRow {
  numero: number          // 0 = fila inicial (solo saldo), 1..n = cuotas
  cuota_base: number      // cuota base sin cobros (fija en francesa, variable en alemana)
  interes: number
  capital: number
  saldo: number
  cobros: Record<string, number>  // { 'SOLCA': 4.38, 'Seguro desgravamen': 87.50, ... }
  cuota_final: number     // cuota_base + suma de todos los cobros mensuales
}

export interface CobroDesglose {
  nombre: string
  tipo_cobro: TipoCobro
  valor_configurado: number
  base_calculo: BaseCalculo
  total: number    // monto total para todo el crédito
  mensual: number  // total / plazo_meses (valor fijo en cada cuota)
}

export interface ResumenCredito {
  monto: number
  plazo_meses: number
  tasa_anual: number
  sistema_amortizacion: SistemaAmortizacion
  cuota_base_inicial: number   // primer valor de cuota base
  cuota_final: number          // cuota base + todos los cobros mensuales
  total_capital: number
  total_intereses: number
  cobros_desglose: CobroDesglose[]
  total_cobros_adicionales: number  // suma de todos los totales de cobros
  costo_total_credito: number        // capital + intereses + todos los cobros
}

// ─── Sistema de amortización ─────────────────────────────────
export type SistemaAmortizacion = 'francesa' | 'alemana'

// ─── Simulaciones ────────────────────────────────────────────
export interface Simulacion {
  id: string
  usuario_id: string | null
  tipo_credito_id: string
  subtipo_credito_id: string
  monto: number
  valor_bien: number | null       // para cobros sobre valor_bien (ej: seguro vehicular)
  plazo_meses: number
  tasa_aplicada: number
  sistema_amortizacion: SistemaAmortizacion
  cuota_base: number
  cuota_final: number
  total_a_pagar: number
  total_intereses: number
  tabla_json: TablaAmortizacionRow[]
  cobros_desglose_json: CobroDesglose[]
  created_at: string
}

// ─── Solicitudes de crédito ──────────────────────────────────
export type EstadoSolicitudCredito =
  | 'pendiente'
  | 'documentos'
  | 'analisis'
  | 'biometria'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'

export interface SolicitudCredito {
  id: string
  usuario_id: string
  simulacion_id: string | null
  tipo_credito_id: string
  subtipo_credito_id: string
  analisis_financiero_id: string | null
  monto: number
  valor_bien: number | null
  plazo_meses: number
  tasa_aplicada: number
  cuota_base: number
  cuota_final: number
  sistema_amortizacion: SistemaAmortizacion
  estado: EstadoSolicitudCredito
  cedula_url: string | null
  ruc_url: string | null
  documentos_adicionales_json: Record<string, string> | null
  selfie_url: string | null
  biometria_validada: boolean
  cuota_maxima_sugerida: number | null
  motivo_rechazo: string | null
  observaciones_admin: string | null
  created_at: string
  updated_at: string
  // Relaciones expandidas
  usuario?: Usuario
  tipo_credito?: TipoCredito
  subtipo_credito?: SubtipoCredito
  analisis_financiero?: AnalisisFinanciero
}

// ─── Productos de inversión ──────────────────────────────────
export type TipoInversion = 'plazo_fijo' | 'ahorro_programado' | 'ahorro_objetivo'
export type FrecuenciaAporte = 'unico' | 'mensual' | 'trimestral' | 'semestral' | 'anual'

export interface ProductoInversion {
  id: string
  institucion_id: string
  nombre: string
  tipo_inversion: TipoInversion
  tasa_interes_anual: number
  plazo_min_dias: number
  plazo_max_dias: number
  monto_min: number
  monto_max: number | null
  frecuencia_aporte: FrecuenciaAporte
  objetivo: string | null
  descripcion: string | null
  activo: boolean
  created_at: string
}

// ─── Solicitudes de inversión ─────────────────────────────────
export type EstadoSolicitudInversion =
  | 'pendiente'
  | 'documentos'
  | 'biometria'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'

export interface SolicitudInversion {
  id: string
  usuario_id: string
  producto_id: string
  monto: number
  plazo_dias: number
  rendimiento_estimado: number | null
  aporte_periodico: number | null
  estado: EstadoSolicitudInversion
  documento_identidad_url: string | null
  selfie_url: string | null
  biometria_validada: boolean
  observaciones_admin: string | null
  created_at: string
  updated_at: string
  // Relaciones expandidas
  usuario?: Usuario
  producto?: ProductoInversion
}

// ─── Configuración para generación de PDF ────────────────────
export interface ConfigPDF {
  institucion: Institucion
  usuario: Pick<Usuario, 'nombre' | 'apellido' | 'cedula'>
  tipo_credito: string
  subtipo_credito: string
  sistema_amortizacion: SistemaAmortizacion
  monto: number
  valor_bien: number | null
  plazo_meses: number
  tasa_anual: number
  tasa_mensual: number
  tabla: TablaAmortizacionRow[]
  cobros_desglose: CobroDesglose[]
  resumen: ResumenCredito
  fecha_generacion: string
}

// ─── Resultado de capacidad de pago ──────────────────────────
export interface ResultadoCapacidadPago {
  capacidad_maxima: number
  porcentaje_endeudamiento_actual: number   // % con deudas existentes
  porcentaje_con_nueva_cuota: number        // % si se aprueba el crédito
  puede_pagar: boolean
  mensaje: string
}

// ─── Resultado de simulación de inversión ────────────────────
export interface ResultadoSimulacionInversion {
  monto_invertido: number
  rendimiento_estimado: number
  total_a_recibir: number
  fecha_vencimiento: string    // ISO date
  tasa_anual: number
  plazo_dias: number
  desglose?: Array<{
    periodo: number
    aporte: number
    interes: number
    acumulado: number
  }>
}

// ─── Colores del tema institucional ──────────────────────────
export interface ColoresInstitucion {
  primario: string
  secundario: string
  acento: string
}

export interface CSSVarsInstitucion {
  '--color-inst-primary': string
  '--color-inst-primary-light': string
  '--color-inst-primary-dark': string
  '--color-inst-secondary': string
  '--color-inst-secondary-light': string
  '--color-inst-secondary-dark': string
  '--color-inst-accent': string
  '--color-inst-accent-light': string
  '--color-inst-accent-dark': string
}

// ─── Parámetros de cálculo de amortización ───────────────────
export interface ParamsAmortizacion {
  monto: number
  plazo_meses: number
  tasa_anual: number
}

export interface ParamsTablaCompleta extends ParamsAmortizacion {
  sistema: SistemaAmortizacion
  cobros: CobroIndirecto[]
  valor_bien?: number
}

// ─── Validaciones ────────────────────────────────────────────
export interface ResultadoValidacion {
  valido: boolean
  mensaje: string
}
