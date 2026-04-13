// ============================================================
// SimulaFinance — Página de Solicitud de Inversión (Wizard)
// ============================================================
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getDocumentoUrl } from '@/lib/supabase/storage'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

import { FormularioDatosPersonales } from '@/components/solicitud/FormularioDatosPersonales'
import { DocumentUploader } from '@/components/solicitud/DocumentUploader'
import { ValidacionBiometrica } from '@/components/solicitud/ValidacionBiometrica'

import { Loader2, CheckCircle2 } from 'lucide-react'

const PASOS = [
  { id: 1, nombre: 'Datos Personales', icono: '1' },
  { id: 2, nombre: 'Documentación', icono: '2' },
  { id: 3, nombre: 'Biometría y Envío', icono: '3' },
]

function SolicitudInversionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productoId = searchParams.get('producto')
  const monto = parseFloat(searchParams.get('monto') || '0')
  const plazo = parseInt(searchParams.get('plazo') || '0')

  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  const [solicitud, setSolicitud] = useState<any>(null)
  const [producto, setProducto] = useState<any>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [cedulaUrlFirmada, setCedulaUrlFirmada] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: perf } = await supabase.from('usuarios').select('*').eq('id', user.id).single()
      setUsuario(perf)

      if (productoId) {
        const { data: prod } = await supabase
          .from('productos_inversion')
          .select('*')
          .eq('id', productoId)
          .single()
        if (prod) setProducto(prod)
      }

      setLoading(false)
    }
    init()
  }, [productoId, router])

  const handlePaso1 = async (datos: any) => {
    if (!producto) { toast.error('Se requiere un producto de inversión.'); return }
    setProcesando(true)
    const supabase = createClient()

    try {
      const payload = {
        usuario_id: usuario.id,
        producto_id: producto.id,
        monto: monto,
        plazo_dias: plazo,
        estado: 'pendiente'
      }

      let solId = solicitud?.id
      if (!solId) {
        const { data, error } = await supabase.from('solicitudes_inversion').insert(payload).select().single()
        if (error) throw error
        solId = data.id
        setSolicitud(data)
      }

      await supabase.from('usuarios').update({
        cedula: datos.cedula,
        telefono: datos.telefono,
        direccion: datos.direccion
      }).eq('id', usuario.id)

      setPaso(2)
    } catch (err) {
      toast.error('Error al guardar datos')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  const handlePaso2 = async (docsMapa: Record<string, string>) => {
    setProcesando(true)
    const supabase = createClient()

    try {
      const cedulaPath = Object.values(docsMapa).find(p => p.includes('cedula')) || null
      
      await supabase.from('solicitudes_inversion').update({
        documento_identidad_url: cedulaPath,
        estado: 'biometria'
      }).eq('id', solicitud.id)

      if (cedulaPath) {
        const url = await getDocumentoUrl('inversiones-docs', cedulaPath)
        setCedulaUrlFirmada(url)
      }

      setPaso(3)
    } catch (err) {
      toast.error('Error al procesar documentos')
      console.error(err)
    } finally {
      setProcesando(false)
    }
  }

  const handlePaso3 = async (selfieBlob: Blob) => {
    setProcesando(true)
    const supabase = createClient()

    try {
      const fileName = `${solicitud.id}/selfie.jpg`
      const { error: upErr } = await supabase.storage.from('inversiones-docs').upload(fileName, selfieBlob, { upsert: true })
      if (upErr) throw upErr

      await supabase.from('solicitudes_inversion').update({
        selfie_url: fileName,
        biometria_validada: true,
        estado: 'en_revision'
      }).eq('id', solicitud.id)

      toast.success('¡Solicitud de inversión enviada!')
      router.push('/cliente/mis-solicitudes')
    } catch (err) {
      toast.error('Error al finalizar solicitud')
    } finally {
      setProcesando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="size-10 animate-spin text-gray-300" />
        <p className="text-gray-500">Preparando solicitud de inversión...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          {PASOS.map((p, idx) => (
            <div key={p.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2 group relative">
                <div 
                  className={`size-10 rounded-full flex items-center justify-center border-2 transition-all font-bold text-sm
                    ${paso > p.id ? 'bg-green-500 border-green-500 text-white' : 
                      paso === p.id ? 'border-primary bg-primary text-white shadow-lg' : 'border-gray-200 text-gray-400'}`}
                  style={paso === p.id ? { backgroundColor: 'var(--color-inst-primary)', borderColor: 'var(--color-inst-primary)' } : {}}
                >
                  {paso > p.id ? <CheckCircle2 className="size-5" /> : p.icono}
                </div>
                <span className={`text-[10px] absolute -bottom-6 font-semibold whitespace-nowrap
                  ${paso === p.id ? 'text-gray-900' : 'text-gray-400'}`}>
                  {p.nombre}
                </span>
              </div>
              {idx < PASOS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full ${paso > p.id + 1 ? 'bg-green-500' : 'bg-gray-100'}`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={(paso / 3) * 100} className="h-1 bg-gray-100 mt-8" />
      </div>

      <div className="bg-white rounded-2xl border p-6 md:p-8 min-h-[400px]">
        {paso === 1 && (
          <FormularioDatosPersonales 
            initialData={usuario} 
            onNext={handlePaso1}
            loading={procesando}
          />
        )}
        {paso === 2 && (
          <DocumentUploader 
            solicitudId={solicitud?.id}
            tipoCreditoId="" // No aplica para inversión de la misma forma, pero el uploader lo pide
            onBack={() => setPaso(1)}
            onNext={handlePaso2}
            loading={procesando}
          />
        )}
        {paso === 3 && (
          <ValidacionBiometrica 
            cedulaUrl={cedulaUrlFirmada}
            onBack={() => setPaso(2)}
            onNext={handlePaso3}
            loading={procesando}
          />
        )}
      </div>
    </div>
  )
}

export default function SolicitudInversionPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SolicitudInversionContent />
    </Suspense>
  )
}
