// ============================================================
// SimulaFinance — Página de Solicitud de Crédito (Wizard)
// ============================================================
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

import { FormularioDatosPersonales } from '@/components/solicitud/FormularioDatosPersonales'
import { Analisisfinanciero } from '@/components/solicitud/AnalisisFinanciero'
import { DocumentUploader } from '@/components/solicitud/DocumentUploader'
import { ValidacionBiometrica } from '@/components/solicitud/ValidacionBiometrica'
import { ResumenSolicitud } from '@/components/solicitud/ResumenSolicitud'

import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react'

// --- Definición de Pasos ---
const PASOS = [
  { id: 1, nombre: 'Datos Personales', icono: '1' },
  { id: 2, nombre: 'Análisis Financiero', icono: '2' },
  { id: 3, nombre: 'Documentación', icono: '3' },
  { id: 4, nombre: 'Biometría', icono: '4' },
  { id: 5, nombre: 'Confirmación', icono: '5' },
]

function SolicitudCreditoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const simulacionId = searchParams.get('simulacion')

  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  // Estado de la solicitud
  const [solicitud, setSolicitud] = useState<any>(null)
  const [simulacion, setSimulacion] = useState<any>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [cedulaUrlLocal, setCedulaUrlLocal] = useState<string | null>(null)

  // 1. Cargar datos iniciales
  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Cargar perfil de usuario
      const { data: perf } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      setUsuario(perf)

      // Cargar simulación si existe
      if (simulacionId) {
        const { data: sim } = await supabase
          .from('simulaciones')
          .select('*, tipos_credito(nombre, requiere_ruc), subtipos_credito(nombre)')
          .eq('id', simulacionId)
          .single()
        
        if (sim) setSimulacion(sim)
      }

      setLoading(false)
    }
    init()
  }, [simulacionId, router])

  // 2. Guardar progreso (Step 1)
  const handlePaso1 = async (datos: any) => {
    if (!simulacion) { toast.error('Se requiere una simulación previa.'); return }
    setProcesando(true)
    const supabase = createClient()

    try {
      // Registrar o actualizar solicitud
      const payload = {
        usuario_id: usuario.id,
        simulacion_id: simulacion.id,
        tipo_credito_id: simulacion.tipo_credito_id,
        subtipo_credito_id: simulacion.subtipo_credito_id,
        monto: simulacion.monto,
        valor_bien: simulacion.valor_bien,
        plazo_meses: simulacion.plazo_meses,
        tasa_aplicada: simulacion.tasa_aplicada,
        cuota_base: simulacion.cuota_base,
        cuota_final: simulacion.cuota_final,
        sistema_amortizacion: simulacion.sistema_amortizacion,
        estado: 'pendiente'
      }

      let solId = solicitud?.id
      if (!solId) {
        const { data, error } = await supabase.from('solicitudes_credito').insert(payload).select().single()
        if (error) throw error
        solId = data.id
        setSolicitud(data)
      } else {
        await supabase.from('solicitudes_credito').update(payload).eq('id', solId)
      }

      // Actualizar datos del usuario
      await supabase.from('usuarios').update({
        cedula: datos.cedula,
        ruc: datos.ruc,
        telefono: datos.telefono,
        direccion: datos.direccion
      }).eq('id', usuario.id)

      setPaso(2)
    } catch (err) {
      toast.error('Error al guardar datos personales')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  // 3. Guardar progreso (Step 2)
  const handlePaso2 = async (analisis: any) => {
    setProcesando(true)
    const supabase = createClient()

    try {
      // Registrar análisis financiero
      const { data: ana, error: anaErr } = await supabase.from('analisis_financiero').insert({
        usuario_id: usuario.id,
        ingresos_mensuales: analisis.ingresos,
        gastos_mensuales: analisis.gastos,
        otros_creditos_cuota: analisis.otrasCuotas,
        patrimonio: analisis.patrimonio,
        descripcion_ingresos: analisis.descripcionIngresos
      }).select().single()

      if (anaErr) throw anaErr

      // Vincular a solicitud
      await supabase.from('solicitudes_credito')
        .update({ analisis_financiero_id: ana.id, estado: 'documentos' })
        .eq('id', solicitud.id)

      setSolicitud({ ...solicitud, analisis_financiero_id: ana.id })
      setPaso(3)
    } catch (err) {
      toast.error('Error al guardar análisis financiero')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  // 4. Guardar documentos (Step 3)
  const handlePaso3 = async (docsMapa: Record<string, string>, localUrls: Record<string, string>) => {
    setProcesando(true)
    const supabase = createClient()

    try {
      const cedulaPath = Object.values(docsMapa).find(p => p.includes('cedula')) || null

      await supabase.from('solicitudes_credito').update({
        cedula_url: cedulaPath,
        documentos_adicionales_json: docsMapa,
        estado: 'biometria'
      }).eq('id', solicitud.id)

      // Usar URL local del archivo (object URL) para face-api — evita CORS
      const cedulaLocal = Object.entries(localUrls).find(([k]) => k.toLowerCase().includes('céd') || k.toLowerCase().includes('cedula'))
      setCedulaUrlLocal(cedulaLocal?.[1] ?? null)

      setPaso(4)
    } catch (err) {
      toast.error('Error al procesar documentos')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  // 5. Selfie (Step 4) — usa /api/upload para evitar restricciones RLS
  const handlePaso4 = async (selfieBlob: Blob) => {
    setProcesando(true)

    try {
      const fileName = `${solicitud.id}/selfie.jpg`
      const selfieFile = new File([selfieBlob], 'selfie.jpg', { type: 'image/jpeg' })
      const form = new FormData()
      form.append('file', selfieFile)
      form.append('bucket', 'solicitudes-docs')
      form.append('path', fileName)
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error((await res.json()).error)

      const supabase = createClient()
      await supabase.from('solicitudes_credito').update({
        selfie_url: fileName,
        biometria_validada: true,
        estado: 'en_revision'
      }).eq('id', solicitud.id)

      setPaso(5)
    } catch (err) {
      toast.error('Error al guardar validación biométrica')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  // 6. Confirmación Final (Step 5)
  const handleConfirmar = async () => {
    setProcesando(true)
    try {
      // Ya marcamos como 'en_revision' en el paso 4, así que solo confirmamos flujo.
      toast.success('¡Solicitud enviada con éxito!')
      router.push('/cliente/mis-solicitudes')
    } catch (err) {
      toast.error('Error final')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="size-10 animate-spin text-gray-300" />
        <p className="text-gray-500 animate-pulse">Iniciando proceso de solicitud...</p>
      </div>
    )
  }

  // Sin simulación previa → mostrar alerta prominente
  if (!simulacion) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <ChevronRight className="size-8 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Primero debes simular tu crédito</h2>
          <p className="text-gray-500 text-sm">
            Para iniciar una solicitud formal, debes primero calcular tu tabla de amortización
            en el simulador y hacer clic en <strong>"Me interesa →"</strong>.
          </p>
        </div>
        <a
          href="/cliente/simulador-credito"
          className="inline-block px-6 py-3 rounded-lg text-white font-semibold text-sm"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          Ir al Simulador de Crédito
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Indicador de pasos */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          {PASOS.map((p, idx) => (
            <div key={p.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 group relative">
                <div 
                  className={`size-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm
                    ${paso > p.id ? 'bg-green-500 border-green-500 text-white' : 
                      paso === p.id ? 'border-primary bg-primary text-white shadow-lg scale-110' : 
                      'border-gray-200 text-gray-400'}`}
                  style={paso === p.id ? { backgroundColor: 'var(--color-inst-primary)', borderColor: 'var(--color-inst-primary)' } : {}}
                >
                  {paso > p.id ? <CheckCircle2 className="size-5" /> : p.icono}
                </div>
                <span className={`text-[10px] absolute -bottom-6 font-semibold whitespace-nowrap transition-colors
                  ${paso === p.id ? 'text-gray-900' : 'text-gray-400'}`}>
                  {p.nombre}
                </span>
              </div>
              {idx < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-500
                  ${paso > p.id + 1 ? 'bg-green-500' : paso === p.id + 1 ? 'bg-gray-300' : 'bg-gray-100'}`} 
                />
              )}
            </div>
          ))}
        </div>
        <div className="pt-4">
          <Progress value={(paso / 5) * 100} className="h-1 bg-gray-100" />
        </div>
      </div>

      {/* Contenido dinámico */}
      <div className="bg-white rounded-2xl border shadow-sm p-6 md:p-8 min-h-[500px]">
        {paso === 1 && (
          <FormularioDatosPersonales 
            initialData={usuario} 
            requiereRUC={simulacion?.tipos_credito?.requiere_ruc}
            onNext={handlePaso1}
            loading={procesando}
          />
        )}
        {paso === 2 && (
          <Analisisfinanciero 
            cuotaMensualSimulada={simulacion?.cuota_final || 0}
            onBack={() => setPaso(1)}
            onNext={handlePaso2}
            loading={procesando}
          />
        )}
        {paso === 3 && (
          <DocumentUploader 
            solicitudId={solicitud?.id}
            tipoCreditoId={simulacion?.tipo_credito_id}
            onBack={() => setPaso(2)}
            onNext={handlePaso3}
            loading={procesando}
          />
        )}
        {paso === 4 && (
          <ValidacionBiometrica 
            cedulaUrl={cedulaUrlLocal}
            onBack={() => setPaso(3)}
            onNext={handlePaso4}
            loading={procesando}
          />
        )}
        {paso === 5 && (
          <ResumenSolicitud 
            data={{
              personales: usuario,
              financieros: {}, // Se podría expandir
              tipoCredito: simulacion?.tipos_credito?.nombre,
              subtipoCredito: simulacion?.subtipo_credito?.nombre,
              monto: simulacion?.monto,
              plazo: simulacion?.plazo_meses,
              cuotaFinal: simulacion?.cuota_final,
              sistema: simulacion?.sistema_amortizacion
            }}
            onBack={() => setPaso(4)}
            onConfirm={handleConfirmar}
            loading={procesando}
          />
        )}
      </div>

      <p className="text-center text-[10px] text-gray-400 mt-8">
        SimulaFinance — Proceso de solicitud segura con cumplimiento normativo BCE.
      </p>
    </div>
  )
}

export default function SolicitudCreditoPage() {
  return (
    <Suspense fallback={<div>Cargando simulador...</div>}>
      <SolicitudCreditoContent />
    </Suspense>
  )
}
