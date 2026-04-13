// ============================================================
// SimulaFinance — Cliente: Solicitud de Crédito (flujo multi-paso)
// ============================================================
// Propósito: Proceso formal de solicitud de crédito con múltiples etapas.
//
// Etapas (estados en BD):
//   pendiente   → documentos → analisis → biometria → en_revision
//
// Paso 1 — DATOS PERSONALES (FormularioDatosPersonales.tsx)
//   - nombre, apellido, cédula (con validación módulo 10)
//   - Si requiere_ruc: campo RUC (con validación de 3 tipos)
//   - dirección, teléfono
//
// Paso 2 — ANÁLISIS FINANCIERO (AnalisisFinanciero.tsx)
//   - Ingresos mensuales, gastos mensuales
//   - Cuotas de otros créditos vigentes
//   - Patrimonio, descripción de ingresos
//   - Sistema calcula capacidad_pago_mensual
//   - Muestra: "Tu capacidad máxima de cuota es $X"
//   - Si cuota_final > capacidad → BLOQUEAR con alerta clara
//   - INSERT INTO analisis_financiero
//
// Paso 3 — DOCUMENTOS (DocumentUploader.tsx)
//   - Subida de cédula (obligatorio siempre)
//   - Subida de RUC (si requiere_ruc del tipo de crédito)
//   - Otros documentos configurados en requisitos_credito
//   - Validación automática de formato al subir la cédula
//   - Supabase Storage: solicitudes/{solicitud_id}/cedula.jpg, etc.
//
// Paso 4 — VALIDACIÓN BIOMÉTRICA (ValidacionBiometrica.tsx)
//   - Toma foto con cámara del dispositivo (face-api.js)
//   - Compara con foto extraída de la cédula subida
//   - Umbral de similitud configurable (ej: >= 0.6)
//   - biometria_validada = true si pasa la comparación
//
// Paso 5 — RESUMEN Y CONFIRMACIÓN (ResumenSolicitud.tsx)
//   - Resumen de datos personales, análisis, documentos, biometría
//   - Tabla de amortización resumida (cuota, intereses, cobros)
//   - Botón "Enviar solicitud" → UPDATE estado = 'en_revision'
//
// Componentes:
//   - FormularioDatosPersonales, AnalisisFinanciero, DocumentUploader
//   - ValidacionBiometrica, ResultadoCapacidad, ResumenSolicitud
//   - Progress, Separator, Alert, Button, Card (shadcn/ui)
//
// Datos desde Supabase:
//   - solicitudes_credito: INSERT (paso inicial) → UPDATE en cada paso
//   - analisis_financiero: INSERT en paso 2
//   - Supabase Storage: upload de documentos en paso 3 y 4
//
// Acceso: Cliente autenticado
// ============================================================

export default function SolicitudCreditoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Solicitud de crédito</h1>
      <p className="text-gray-500 text-sm mb-8">
        Completa el proceso en 5 pasos para enviar tu solicitud formal.
      </p>

      {/* TODO: Implementar flujo multi-paso con Progress indicator:
        Paso 1: Datos personales
        Paso 2: Análisis financiero
        Paso 3: Documentos
        Paso 4: Validación biométrica
        Paso 5: Resumen y confirmación
      */}
      <div className="bg-white rounded-xl border p-6">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {['Datos', 'Financiero', 'Documentos', 'Biometría', 'Confirmación'].map((paso, i) => (
            <div key={paso} className="flex-1 text-center">
              <div
                className="h-2 rounded-full mb-1"
                style={{ backgroundColor: i === 0 ? 'var(--color-inst-primary)' : '#e5e7eb' }}
              />
              <span className="text-xs text-gray-500">{paso}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-400">Flujo multi-paso de solicitud — Por implementar</p>
      </div>
    </div>
  )
}
