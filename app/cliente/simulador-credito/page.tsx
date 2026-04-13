// ============================================================
// SimulaFinance — Cliente: Simulador de Crédito (Página principal)
// ============================================================
// Integra SimuladorForm + TablaAmortizacion + ResumenCostos + PDF + BotonMeInteresa
// Al calcular, guarda la simulación en Supabase automáticamente.
// ============================================================
'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useInstitucion } from '@/components/theme/ThemeProvider'
import { generarTablaCompleta, type ResultadoTablaCompleta } from '@/lib/calculos/tabla-completa'
import type { ConfigPDF } from '@/types'

import { SimuladorForm, type ParamsSimulador } from '@/components/credito/SimuladorForm'
import { TablaAmortizacion } from '@/components/credito/TablaAmortizacion'
import { ResumenCostos } from '@/components/credito/ResumenCostos'
import { PDFGenerator } from '@/components/credito/PDFGenerator'
import { BotonMeInteresa } from '@/components/credito/BotonMeInteresa'
import { NotaLegal } from '@/components/shared/NotaLegal'

import { toast } from 'sonner'

export default function SimuladorCreditoPage() {
  const { institucion } = useInstitucion()
  const [resultado, setResultado] = useState<ResultadoTablaCompleta | null>(null)
  const [params, setParams] = useState<ParamsSimulador | null>(null)
  const [simulacionId, setSimulacionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const tablaRef = useRef<HTMLDivElement>(null)

  const handleCalcular = async (p: ParamsSimulador) => {
    setLoading(true)
    try {
      // 1. Calcular tabla
      const res = generarTablaCompleta({
        monto: p.monto,
        plazo_meses: p.plazoMeses,
        tasa_anual: p.tasaAnual,
        sistema: p.sistema,
        cobros: p.cobros,
        valor_bien: p.valorBien ?? undefined,
      })

      setResultado(res)
      setParams(p)

      // 2. Guardar simulación en Supabase
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: sim } = await supabase
          .from('simulaciones')
          .insert({
            usuario_id: user.id,
            tipo_credito_id: p.tipoCreditoId,
            subtipo_credito_id: p.subtipoCreditoId,
            monto: p.monto,
            valor_bien: p.valorBien,
            plazo_meses: p.plazoMeses,
            tasa_aplicada: p.tasaAnual,
            sistema_amortizacion: p.sistema,
            cuota_base: res.resumen.cuota_base_inicial,
            cuota_final: res.resumen.cuota_final,
            total_intereses: res.resumen.total_intereses,
            total_a_pagar: res.resumen.costo_total_credito,
            tabla_json: res.filas,
            cobros_desglose_json: res.cobros_desglose,
          })
          .select('id')
          .single()

        if (sim) {
          setSimulacionId(sim.id)
        }
      }

      toast.success('Tabla calculada correctamente')

      // Scroll a la tabla
      setTimeout(() => {
        tablaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } catch (err) {
      console.error(err)
      toast.error('Error al calcular la tabla')
    } finally {
      setLoading(false)
    }
  }

  // Configuración para PDF
  const configPDF: ConfigPDF | null = resultado && params && institucion ? {
    institucion: institucion,
    usuario: {
      nombre: '',
      apellido: '',
      cedula: null,
    },
    tipo_credito: params.tipoCreditoNombre,
    subtipo_credito: params.subtipoCreditoNombre,
    sistema_amortizacion: params.sistema,
    monto: params.monto,
    valor_bien: params.valorBien,
    plazo_meses: params.plazoMeses,
    tasa_anual: params.tasaAnual,
    tasa_mensual: params.tasaAnual / 12,
    resumen: resultado.resumen,
    tabla: resultado.filas,
    cobros_desglose: resultado.cobros_desglose,
    fecha_generacion: new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  } : null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Simulador de crédito</h1>
      <p className="text-gray-500 text-sm mb-8">
        Calcula tu tabla de amortización e infórmate sobre el costo total de tu crédito.
      </p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Panel izquierdo: formulario de parámetros */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-5 sticky top-6">
            <h2 className="font-semibold mb-4">Parámetros del crédito</h2>
            <SimuladorForm onCalcular={handleCalcular} loading={loading} />
          </div>
        </div>

        {/* Panel derecho: resultado */}
        <div className="lg:col-span-2 space-y-6" ref={tablaRef}>
          {resultado ? (
            <>
              {/* Resumen */}
              <ResumenCostos resumen={resultado.resumen} />

              {/* Tabla */}
              <div className="bg-white rounded-xl border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Tabla de amortización</h2>
                  <div className="flex items-center gap-2">
                    <PDFGenerator config={configPDF!} disabled={!configPDF} />
                    <BotonMeInteresa simulacionId={simulacionId} disabled={!simulacionId} />
                  </div>
                </div>
                <TablaAmortizacion
                  filas={resultado.filas}
                  cobrosDesglose={resultado.cobros_desglose}
                  sistema={params?.sistema ?? 'francesa'}
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg
                  className="size-8 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-gray-600 font-medium mb-1">Sin simulación</h3>
              <p className="text-gray-400 text-sm max-w-xs">
                Selecciona un tipo de crédito, monto y plazo para visualizar tu tabla de amortización.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nota legal */}
      <div className="mt-8">
        <NotaLegal tipo="completo" />
      </div>
    </div>
  )
}
