// ============================================================
// SimulaFinance — SimulaScore: Buró de crédito simulado
// Evalúa al cliente basándose en su análisis financiero
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import type { AnalisisFinanciero, BuroScore } from '@/types'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertTriangle, XCircle, Loader2, ShieldCheck } from 'lucide-react'

interface SimulaScoreProps {
  analisis: Pick<AnalisisFinanciero,
    'ingresos_mensuales' | 'gastos_mensuales' | 'otros_creditos_cuota' | 'patrimonio'>
  cuotaNueva: number
  onContinuar: (score: BuroScore) => void
  onAtras: () => void
}

function calcularSimulaScore(
  analisis: SimulaScoreProps['analisis'],
  cuotaNueva: number
): BuroScore {
  let puntaje = 100

  const ratio = analisis.ingresos_mensuales > 0
    ? (analisis.otros_creditos_cuota + cuotaNueva) / analisis.ingresos_mensuales
    : 1

  const capacidadCubreCuota = ratio <= 0.40
  const gastosRazonables = analisis.gastos_mensuales <= analisis.ingresos_mensuales * 0.80
  const patrimonioSuficiente = analisis.patrimonio >= cuotaNueva * 3

  if (ratio > 0.40) puntaje -= 40
  else if (ratio > 0.30) puntaje -= 15

  if (!gastosRazonables) puntaje -= 20
  if (!patrimonioSuficiente) puntaje -= 10

  puntaje = Math.max(0, Math.min(100, puntaje))

  const categoria: BuroScore['categoria'] =
    puntaje >= 70 ? 'apto' : puntaje >= 50 ? 'observado' : 'no_apto'

  return {
    puntaje,
    categoria,
    detalle: {
      ratio_endeudamiento: Math.round(ratio * 100),
      capacidad_cubre_cuota: capacidadCubreCuota,
      gastos_razonables: gastosRazonables,
      patrimonio_suficiente: patrimonioSuficiente,
    },
    evaluado_en: new Date().toISOString(),
  }
}

const CATEGORIA_CONFIG = {
  apto: {
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    ring: 'ring-green-400',
    icon: CheckCircle,
    label: 'Apto para continuar',
    desc: 'Tu perfil financiero cumple los requisitos para solicitar este crédito.',
  },
  observado: {
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    ring: 'ring-amber-400',
    icon: AlertTriangle,
    label: 'Perfil en observación',
    desc: 'Puedes continuar, pero el analista revisará tu solicitud con mayor detalle.',
  },
  no_apto: {
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    ring: 'ring-red-400',
    icon: XCircle,
    label: 'No apto en este momento',
    desc: 'Tu capacidad de pago actual no es suficiente para asumir esta cuota. Considera un monto o plazo diferente.',
  },
}

export function SimulaScore({ analisis, cuotaNueva, onContinuar, onAtras }: SimulaScoreProps) {
  const [fase, setFase] = useState<'consultando' | 'resultado'>('consultando')
  const [score, setScore] = useState<BuroScore | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      const s = calcularSimulaScore(analisis, cuotaNueva)
      setScore(s)
      setFase('resultado')
    }, 1800)
    return () => clearTimeout(t)
  }, [analisis, cuotaNueva])

  if (fase === 'consultando') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="size-16 rounded-full border-4 border-gray-200 flex items-center justify-center">
            <ShieldCheck className="size-7 text-gray-300" />
          </div>
          <Loader2 className="size-6 animate-spin text-blue-500 absolute -bottom-1 -right-1" />
        </div>
        <div className="text-center">
          <p className="font-medium text-gray-700">Consultando SimulaScore®</p>
          <p className="text-sm text-gray-400 mt-1">Evaluando tu perfil financiero...</p>
        </div>
      </div>
    )
  }

  if (!score) return null

  const cfg = CATEGORIA_CONFIG[score.categoria]
  const Icon = cfg.icon

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Resultado SimulaScore®</h2>
        <p className="text-sm text-gray-500 mt-0.5">Evaluación basada en tu análisis financiero</p>
      </div>

      {/* Resultado principal */}
      <div className={`rounded-xl border p-6 ${cfg.bg}`}>
        <div className="flex items-start gap-4">
          {/* Círculo de puntaje */}
          <div className={`shrink-0 size-20 rounded-full border-4 ${cfg.ring} flex flex-col items-center justify-center bg-white`}>
            <span className={`text-2xl font-bold ${cfg.color}`}>{score.puntaje}</span>
            <span className="text-xs text-gray-400">/ 100</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`size-5 ${cfg.color}`} />
              <span className={`font-semibold ${cfg.color}`}>{cfg.label}</span>
            </div>
            <p className="text-sm text-gray-600">{cfg.desc}</p>
          </div>
        </div>
      </div>

      {/* Detalle del análisis */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detalle de la evaluación</p>

        <div className="space-y-2.5">
          <ScoreItem
            ok={score.detalle.capacidad_cubre_cuota}
            label="Capacidad de pago"
            value={`Ratio de endeudamiento: ${score.detalle.ratio_endeudamiento}% (límite: 40%)`}
          />
          <ScoreItem
            ok={score.detalle.gastos_razonables}
            label="Gastos vs ingresos"
            value={score.detalle.gastos_razonables ? 'Gastos dentro del rango aceptable (≤80% ingresos)' : 'Gastos superan el 80% de los ingresos'}
          />
          <ScoreItem
            ok={score.detalle.patrimonio_suficiente}
            label="Respaldo patrimonial"
            value={score.detalle.patrimonio_suficiente ? 'Patrimonio suficiente como respaldo' : 'Patrimonio bajo respecto a la cuota'}
          />
        </div>
      </div>

      {/* Nota */}
      <p className="text-xs text-gray-400 text-center">
        SimulaScore® es una evaluación orientativa. La aprobación final queda a criterio de la institución financiera.
      </p>

      {/* Acciones */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onAtras} className="cursor-pointer">
          Atrás
        </Button>
        <Button
          onClick={() => onContinuar(score)}
          disabled={score.categoria === 'no_apto'}
          className="text-white cursor-pointer"
          style={{ backgroundColor: score.categoria !== 'no_apto' ? 'var(--color-inst-primary)' : undefined }}
        >
          {score.categoria === 'no_apto' ? 'No puede continuar' : 'Continuar solicitud →'}
        </Button>
      </div>
    </div>
  )
}

function ScoreItem({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      {ok
        ? <CheckCircle className="size-4 text-green-500 shrink-0 mt-0.5" />
        : <XCircle className="size-4 text-red-400 shrink-0 mt-0.5" />}
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <p className="text-xs text-gray-500">{value}</p>
      </div>
    </div>
  )
}
