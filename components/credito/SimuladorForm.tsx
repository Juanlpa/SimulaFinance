// ============================================================
// SimulaFinance — SimuladorForm: Formulario de parámetros
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TipoCredito, SubtipoCredito, CobroIndirecto, SistemaAmortizacion } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Calculator, Loader2, Info } from 'lucide-react'

export interface ParamsSimulador {
  tipoCreditoId: string
  subtipoCreditoId: string
  monto: number
  valorBien: number | null
  plazoMeses: number
  sistema: SistemaAmortizacion
  tasaAnual: number
  tipoCreditoNombre: string
  subtipoCreditoNombre: string
  cobros: CobroIndirecto[]
}

interface SimuladorFormProps {
  onCalcular: (params: ParamsSimulador) => void
  loading: boolean
  institucionId?: string
}

export function SimuladorForm({ onCalcular, loading, institucionId }: SimuladorFormProps) {
  // Datos cargados
  const [tipos, setTipos] = useState<TipoCredito[]>([])
  const [subtipos, setSubtipos] = useState<SubtipoCredito[]>([])
  const [cobros, setCobros] = useState<CobroIndirecto[]>([])
  const [cargandoTipos, setCargandoTipos] = useState(true)
  const [cargandoSubtipos, setCargandoSubtipos] = useState(false)

  // Selecciones
  const [tipoId, setTipoId] = useState('')
  const [tipoNombre, setTipoNombre] = useState('')
  const [subtipoId, setSubtipoId] = useState('')
  const [subtipoNombre, setSubtipoNombre] = useState('')
  const [monto, setMonto] = useState<number>(0)
  const [valorBien, setValorBien] = useState<number>(0)
  const [plazoMeses, setPlazoMeses] = useState<number>(0)
  const [sistema, setSistema] = useState<SistemaAmortizacion>('francesa')

  // Constraints del subtipo seleccionado
  const [montoMin, setMontoMin] = useState(0)
  const [montoMax, setMontoMax] = useState(0)
  const [plazoMin, setPlazoMin] = useState(0)
  const [plazoMax, setPlazoMax] = useState(0)

  // ¿Necesita valor_bien?
  const [necesitaValorBien, setNecesitaValorBien] = useState(false)

  // Tasa del tipo seleccionado
  const [tasaAnual, setTasaAnual] = useState(0)

  // Cargar tipos al montar
  useEffect(() => {
    (async () => {
      const supabase = createClient()
      let instId = institucionId
      if (!instId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: perfil } = await supabase
          .from('usuarios')
          .select('institucion_id')
          .eq('id', user.id)
          .single()

        if (!perfil?.institucion_id) { setCargandoTipos(false); return }
        instId = perfil.institucion_id
      }

      const { data } = await supabase
        .from('tipos_credito')
        .select('*')
        .eq('institucion_id', instId)
        .eq('activo', true)
        .order('nombre')

      setTipos(data ?? [])
      setCargandoTipos(false)
    })()
  }, [])

  // Al seleccionar tipo: cargar subtipos + cobros
  const handleTipoChange = useCallback(async (id: string) => {
    setTipoId(id)
    setSubtipoId('')
    setSubtipoNombre('')
    setMonto(0)
    setPlazoMeses(0)
    setSubtipos([])

    const tipo = tipos.find((t) => t.id === id)
    if (tipo) {
      setTasaAnual(tipo.tasa_interes_anual)
      setTipoNombre(tipo.nombre)
    }

    setCargandoSubtipos(true)
    const supabase = createClient()

    const [subtiposRes, cobrosGlobalesRes, cobrosEspecificosRes] = await Promise.all([
      supabase
        .from('subtipos_credito')
        .select('*')
        .eq('tipo_credito_id', id)
        .eq('activo', true)
        .order('nombre'),
      supabase
        .from('cobros_indirectos')
        .select('*')
        .eq('es_global', true),
      supabase
        .from('cobros_indirectos')
        .select('*')
        .eq('tipo_credito_id', id),
    ])

    const todosLosCobros = [
      ...(cobrosGlobalesRes.data ?? []),
      ...(cobrosEspecificosRes.data ?? []),
    ]
    setCobros(todosLosCobros)
    setSubtipos(subtiposRes.data ?? [])
    setCargandoSubtipos(false)

    // ¿Algún cobro tiene base_calculo = 'valor_bien'?
    setNecesitaValorBien(todosLosCobros.some((c) => c.base_calculo === 'valor_bien'))
  }, [tipos])

  // Al seleccionar subtipo: actualizar constraints
  const handleSubtipoChange = (id: string) => {
    setSubtipoId(id)
    const sub = subtipos.find((s) => s.id === id)
    if (sub) {
      setSubtipoNombre(sub.nombre)
      setMontoMin(sub.monto_min)
      setMontoMax(sub.monto_max)
      setPlazoMin(sub.plazo_min_meses)
      setPlazoMax(sub.plazo_max_meses)
      // Reset to defaults
      setMonto(sub.monto_min)
      setPlazoMeses(sub.plazo_min_meses)
    }
  }

  // Validaciones
  const montoValido = monto >= montoMin && monto <= montoMax && monto > 0
  const plazoValido = plazoMeses >= plazoMin && plazoMeses <= plazoMax && plazoMeses > 0
  const formValido = tipoId && subtipoId && montoValido && plazoValido

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValido) return

    const tipoNombre = tipos.find((t) => t.id === tipoId)?.nombre ?? ''
    const subtipoNombre = subtipos.find((s) => s.id === subtipoId)?.nombre ?? ''

    onCalcular({
      tipoCreditoId: tipoId,
      subtipoCreditoId: subtipoId,
      monto,
      valorBien: necesitaValorBien && valorBien > 0 ? valorBien : null,
      plazoMeses,
      sistema,
      tasaAnual,
      tipoCreditoNombre: tipoNombre,
      subtipoCreditoNombre: subtipoNombre,
      cobros,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 1. Tipo de crédito */}
      <div className="space-y-1.5">
        <Label>Tipo de crédito</Label>
        {cargandoTipos ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <Loader2 className="size-4 animate-spin" /> Cargando tipos...
          </div>
        ) : (
          <Select value={tipoId} onValueChange={(v) => handleTipoChange(v ?? '')}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Seleccionar tipo">
                {tipoNombre || undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tipos.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {tipoId && (
          <p className="text-xs text-gray-400">
            Tasa: {tasaAnual}% anual
          </p>
        )}
      </div>

      {/* 2. Subtipo */}
      {tipoId && (
        <div className="space-y-1.5">
          <Label>Subtipo</Label>
          {cargandoSubtipos ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="size-4 animate-spin" /> Cargando subtipos...
            </div>
          ) : subtipos.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">No hay subtipos configurados para este tipo.</p>
          ) : (
            <Select value={subtipoId} onValueChange={(v) => handleSubtipoChange(v ?? '')}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Seleccionar subtipo">
                  {subtipoNombre || undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {subtipos.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* 3. Monto */}
      {subtipoId && (
        <div className="space-y-1.5">
          <Label>Monto solicitado ($)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <Input
              type="number"
              value={monto || ''}
              onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
              className="h-10 pl-7"
              min={montoMin}
              max={montoMax}
              step="100"
              aria-invalid={monto > 0 && !montoValido}
            />
          </div>
          <p className="text-xs text-gray-400">
            Entre ${montoMin.toLocaleString()} y ${montoMax.toLocaleString()}
          </p>
          {monto > 0 && !montoValido && (
            <p className="text-xs text-destructive">
              El monto debe estar entre ${montoMin.toLocaleString()} y ${montoMax.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* 4. Valor del bien (condicional) */}
      {subtipoId && necesitaValorBien && (
        <div className="space-y-1.5">
          <Label>
            Valor del bien ($)
            <Info className="inline size-3 ml-1 text-gray-400" />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <Input
              type="number"
              value={valorBien || ''}
              onChange={(e) => setValorBien(parseFloat(e.target.value) || 0)}
              className="h-10 pl-7"
              step="100"
              placeholder="Ej: 25000"
            />
          </div>
          <p className="text-xs text-gray-400">Requerido para calcular cobros sobre valor del bien</p>
        </div>
      )}

      {/* 5. Plazo */}
      {subtipoId && (
        <div className="space-y-1.5">
          <Label>Plazo (meses)</Label>
          <Input
            type="number"
            value={plazoMeses || ''}
            onChange={(e) => setPlazoMeses(parseInt(e.target.value) || 0)}
            className="h-10"
            min={plazoMin}
            max={plazoMax}
            aria-invalid={plazoMeses > 0 && !plazoValido}
          />
          <p className="text-xs text-gray-400">
            Entre {plazoMin} y {plazoMax} meses
          </p>
          {plazoMeses > 0 && !plazoValido && (
            <p className="text-xs text-destructive">
              El plazo debe estar entre {plazoMin} y {plazoMax} meses
            </p>
          )}
        </div>
      )}

      {/* 6. Sistema de amortización */}
      {subtipoId && (
        <div className="space-y-2">
          <Label>Sistema de amortización</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSistema('francesa')}
              className={`rounded-lg border p-3 text-left text-sm transition-all cursor-pointer ${
                sistema === 'francesa'
                  ? 'border-2 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={sistema === 'francesa' ? { borderColor: 'var(--color-inst-primary)' } : {}}
            >
              <p className="font-medium">Francesa</p>
              <p className="text-xs text-gray-400 mt-0.5">Cuota fija mensual</p>
            </button>
            <button
              type="button"
              onClick={() => setSistema('alemana')}
              className={`rounded-lg border p-3 text-left text-sm transition-all cursor-pointer ${
                sistema === 'alemana'
                  ? 'border-2 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={sistema === 'alemana' ? { borderColor: 'var(--color-inst-primary)' } : {}}
            >
              <p className="font-medium">Alemana</p>
              <p className="text-xs text-gray-400 mt-0.5">Capital fijo, cuota decreciente</p>
            </button>
          </div>
        </div>
      )}

      {/* 7. Botón calcular */}
      {subtipoId && (
        <Button
          type="submit"
          disabled={!formValido || loading}
          className="w-full h-10 text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              <Calculator className="size-4" />
              Calcular tabla
            </>
          )}
        </Button>
      )}

      {/* Info cobros cargados */}
      {cobros.length > 0 && subtipoId && (
        <div className="rounded-lg bg-gray-50 border p-3">
          <p className="text-xs font-medium text-gray-600 mb-1">
            Cobros incluidos ({cobros.length}):
          </p>
          <div className="flex flex-wrap gap-1">
            {cobros.map((c) => (
              <span key={c.id} className="text-xs bg-white rounded px-1.5 py-0.5 border text-gray-500">
                {c.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </form>
  )
}
