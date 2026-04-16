// ============================================================
// SimulaFinance — Simulador público por institución (/app/[slug])
// Permite simular créditos sin login con los productos de la institución
// ============================================================
'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generarTablaCompleta, type ResultadoTablaCompleta } from '@/lib/calculos/tabla-completa'
import { SimuladorForm, type ParamsSimulador } from '@/components/credito/SimuladorForm'
import { TablaAmortizacion } from '@/components/credito/TablaAmortizacion'
import { ResumenCostos } from '@/components/credito/ResumenCostos'
import { NotaLegal } from '@/components/shared/NotaLegal'
import { Loader2 } from 'lucide-react'
import { use } from 'react'
import type { Institucion } from '@/types'

interface Props {
  params: Promise<{ slug: string }>
}

export default function SlugSimuladorPage({ params }: Props) {
  const { slug } = use(params)
  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [resultado, setResultado] = useState<ResultadoTablaCompleta | null>(null)
  const [params2, setParams2] = useState<ParamsSimulador | null>(null)
  const [calculando, setCalculando] = useState(false)
  const tablaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('instituciones')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setInstitucion(data as Institucion)
        setCargando(false)
      })
  }, [slug])

  const handleCalcular = (p: ParamsSimulador) => {
    setCalculando(true)
    const res = generarTablaCompleta({
      monto: p.monto,
      plazo_meses: p.plazoMeses,
      tasa_anual: p.tasaAnual,
      sistema: p.sistema,
      cobros: p.cobros,
      valor_bien: p.valorBien ?? undefined,
    })
    setResultado(res)
    setParams2(p)
    setCalculando(false)
    setTimeout(() => tablaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-8 animate-spin text-gray-300" />
      </div>
    )
  }

  if (!institucion) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Simulador de crédito</h2>
        <p className="text-gray-500 text-sm">
          Calcula tu cuota mensual y el desglose completo de tu crédito con {institucion.nombre}.
        </p>
      </div>

      <SimuladorForm
        institucionId={institucion.id}
        onCalcular={handleCalcular}
        loading={calculando}
      />

      {resultado && params2 && (
        <div ref={tablaRef} className="space-y-6">
          <ResumenCostos resumen={resultado.resumen} />
          <TablaAmortizacion
            filas={resultado.filas}
            cobrosDesglose={resultado.cobros_desglose}
            sistema={params2.sistema}
          />

          <div className="flex justify-center">
            <a
              href={`/login?from=/app/${slug}`}
              className="inline-flex items-center gap-2 text-white font-medium px-6 py-3 rounded-xl text-sm"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              Solicitar este crédito
              <span>→</span>
            </a>
          </div>

          <NotaLegal tipo="completo" />
        </div>
      )}
    </div>
  )
}
