// ============================================================
// SimulaFinance — Paso 5: Resumen y Envío Final
// ============================================================
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Loader2, ArrowLeft, Send } from 'lucide-react'

interface ResumenSolicitudProps {
  data: {
    personales: any
    financieros: any
    tipoCredito: string
    subtipoCredito: string
    monto: number
    plazo: number
    cuotaFinal: number
    sistema: string
  }
  onBack: () => void
  onConfirm: () => void
  loading?: boolean
}

export function ResumenSolicitud({
  data,
  onBack,
  onConfirm,
  loading = false,
}: ResumenSolicitudProps) {
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2 mb-8">
        <div className="bg-green-100 text-green-600 p-3 rounded-full inline-block mb-2">
          <CheckCircle2 className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">¡Todo está listo!</h2>
        <p className="text-gray-500 text-sm">Revisa tu información antes de enviar la solicitud.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Crédito */}
        <Card>
          <div className="p-4 border-b font-semibold text-sm bg-gray-50">Resumen del Crédito</div>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Producto:</span>
              <span className="font-medium">{data.tipoCredito} - {data.subtipoCredito}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Monto:</span>
              <span className="font-medium font-mono">{formatCurrency(data.monto)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plazo:</span>
              <span className="font-medium">{data.plazo} meses</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sistema:</span>
              <span className="font-medium capitalize">{data.sistema}</span>
            </div>
            <div className="pt-2 border-t flex justify-between text-sm font-bold">
              <span className="text-gray-900">Cuota Final:</span>
              <span className="text-primary" style={{ color: 'var(--color-inst-primary)' }}>
                {formatCurrency(data.cuotaFinal)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Datos */}
        <Card>
          <div className="p-4 border-b font-semibold text-sm bg-gray-50">Información Personal</div>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente:</span>
              <span className="font-medium">{data.personales.nombre} {data.personales.apellido}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cédula:</span>
              <span className="font-medium font-mono">{data.personales.cedula}</span>
            </div>
            {data.personales.ruc && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">RUC:</span>
                <span className="font-medium font-mono">{data.personales.ruc}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Teléfono:</span>
              <span className="font-medium">{data.personales.telefono}</span>
            </div>
            <div className="flex flex-col text-sm">
              <span className="text-gray-500">Dirección:</span>
              <span className="font-medium mt-1 leading-tight">{data.personales.direccion}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-xs text-amber-800">
        <p className="flex items-center gap-2 mb-1">
          <Info className="size-3.5" />
          <b>Información legal importante:</b>
        </p>
        <p>Al hacer clic en "Enviar Solicitud", autorizas a la institución a verificar tu historial crediticio en los burós de información autorizados. La aprobación está sujeta a revisión técnica de documentos y biometría.</p>
      </div>

      <div className="flex items-center justify-between pt-6 border-t mt-8">
        <Button variant="outline" onClick={onBack} disabled={loading} className="cursor-pointer">
          <ArrowLeft className="size-4" />
          Modificar datos
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="text-white cursor-pointer px-10 h-12 text-lg shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          {loading ? <Loader2 className="size-5 animate-spin mr-2" /> : <Send className="size-5 mr-2" />}
          Enviar Solicitud
        </Button>
      </div>
    </div>
  )
}

function Info({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  )
}
