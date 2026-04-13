// ============================================================
// SimulaFinance — Paso 2: Análisis Financiero
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { calcularCapacidadPago } from '@/lib/calculos/capacidad-pago'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Info, AlertTriangle, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'

interface AnalisisfinancieroProps {
  cuotaMensualSimulada: number
  onBack: () => void
  onNext: (data: any) => void
  loading?: boolean
}

export function Analisisfinanciero({
  cuotaMensualSimulada,
  onBack,
  onNext,
  loading = false,
}: AnalisisfinancieroProps) {
  const [form, setForm] = useState({
    ingresos: 0,
    gastos: 0,
    otrasCuotas: 0,
    patrimonio: 0,
    descripcionIngresos: '',
  })

  const [resultado, setResultado] = useState<any>(null)

  // Recalcular capacidad de pago automáticamente
  useEffect(() => {
    const res = calcularCapacidadPago(
      form.ingresos,
      form.gastos,
      form.otrasCuotas,
      cuotaMensualSimulada
    )
    setResultado(res)
  }, [form, cuotaMensualSimulada])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (resultado?.puede_pagar) {
      onNext(form)
    }
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(val)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulario de entradas */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ingresos">Ingresos mensuales totales ($) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                id="ingresos"
                type="number"
                min="0"
                step="0.01"
                value={form.ingresos || ''}
                onChange={(e) => setForm({ ...form, ingresos: parseFloat(e.target.value) || 0 })}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gastos">Gastos mensuales fijos ($) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                id="gastos"
                type="number"
                min="0"
                step="0.01"
                value={form.gastos || ''}
                onChange={(e) => setForm({ ...form, gastos: parseFloat(e.target.value) || 0 })}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="otrasCuotas">Cuotas de otros créditos vigentes ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                id="otrasCuotas"
                type="number"
                min="0"
                step="0.01"
                value={form.otrasCuotas || ''}
                onChange={(e) => setForm({ ...form, otrasCuotas: parseFloat(e.target.value) || 0 })}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="patrimonio">Patrimonio total estimado ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                id="patrimonio"
                type="number"
                min="0"
                step="0.01"
                value={form.patrimonio || ''}
                onChange={(e) => setForm({ ...form, patrimonio: parseFloat(e.target.value) || 0 })}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-400">Suma de bienes inmuebles, vehículos y ahorros.</p>
          </div>
        </div>

        {/* Panel de resultados interactivo */}
        <div className="space-y-4">
          <Card className="border-2 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
              <Info className="size-4 text-gray-500" />
              <h3 className="font-semibold text-sm">Cálculo de Capacidad</h3>
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-gray-500">Capacidad máxima:</span>
                <span className="text-xl font-bold font-mono">
                  {formatCurrency(resultado?.capacidad_maxima || 0)}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Nivel de endeudamiento:</span>
                  <span className={resultado?.porcentaje_con_nueva_cuota > 40 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}>
                    {resultado?.porcentaje_con_nueva_cuota.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${resultado?.porcentaje_con_nueva_cuota > 40 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(100, resultado?.porcentaje_con_nueva_cuota)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400">Límite académico sugerido: 40%</p>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Cuota solicitada:</span>
                  <span className="font-mono font-semibold">{formatCurrency(cuotaMensualSimulada)}</span>
                </div>
              </div>

              {resultado && (
                <Alert variant={resultado.puede_pagar ? 'default' : 'destructive'} className="mt-4 border-none bg-opacity-10 py-3">
                  {resultado.puede_pagar ? <CheckCircle2 className="size-4 text-green-600" /> : <AlertTriangle className="size-4" />}
                  <AlertTitle className="text-xs font-bold leading-none mb-1">
                    {resultado.puede_pagar ? 'Califica' : 'No califica'}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {resultado.mensaje}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={loading} className="cursor-pointer">
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!resultado?.puede_pagar || loading}
          className="text-white cursor-pointer px-8"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
          Continuar
        </Button>
      </div>
    </div>
  )
}
