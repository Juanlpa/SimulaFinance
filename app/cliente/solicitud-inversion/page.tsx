// ============================================================
// SimulaFinance — Cliente: Solicitud de Inversión
// ============================================================
// Propósito: Proceso formal de solicitud de un producto de inversión.
//
// Flujo similar a solicitud de crédito pero simplificado:
//   Paso 1: Datos personales (cédula, teléfono, dirección)
//   Paso 2: Subida de documento de identidad
//   Paso 3: Validación biométrica (foto vs cédula)
//   Paso 4: Resumen y confirmación
//
// Diferencias con solicitud de crédito:
//   - No hay análisis financiero (inversión no requiere capacidad de pago)
//   - Los documentos son mínimos (solo identidad)
//   - No requiere RUC (a menos que el admin lo configure)
//
// Componentes:
//   - FormularioDatosPersonales, DocumentUploader
//   - ValidacionBiometrica, ResumenSolicitud
//   - Progress, Card, Button (shadcn/ui)
//
// Datos desde Supabase:
//   - solicitudes_inversion: INSERT → UPDATE en cada paso
//   - Supabase Storage: documento_identidad_url, selfie_url
//
// Acceso: Cliente autenticado
// ============================================================

export default function SolicitudInversionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Solicitud de inversión</h1>
      <p className="text-gray-500 text-sm mb-8">
        Formaliza tu solicitud de inversión en pocos pasos.
      </p>

      {/* TODO: Implementar flujo de 4 pasos:
        Datos → Documentos → Biometría → Confirmación
      */}
      <div className="bg-white rounded-xl border p-6">
        <p className="text-sm text-gray-400">Solicitud de inversión — Por implementar</p>
      </div>
    </div>
  )
}
