// ============================================================
// SimulaFinance — Paso 3: Subida de Documentos
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadDocumentoSolicitud } from '@/lib/supabase/storage'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  FileUp, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  Upload,
  X,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface Requisito {
  id: string
  nombre: string
  obligatorio: boolean
  tipo_archivo: string
}

interface DocumentUploaderProps {
  solicitudId: string
  tipoCreditoId: string
  onBack: () => void
  onNext: (documentos: Record<string, string>) => void
  loading?: boolean
}

export function DocumentUploader({
  solicitudId,
  tipoCreditoId,
  onBack,
  onNext,
  loading = false,
}: DocumentUploaderProps) {
  const [requisitos, setRequisitos] = useState<Requisito[]>([])
  const [fetching, setFetching] = useState(true)
  const [uploads, setUploads] = useState<Record<string, { file: File | null, path: string | null, status: 'idle' | 'uploading' | 'success' | 'error', progress: number }>>({})

  // Cargar requisitos dinámicos
  useEffect(() => {
    const loadRequisitos = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('requisitos_credito')
        .select('*')
        .eq('tipo_credito_id', tipoCreditoId)
        .eq('obligatorio', true)

      // Siempre agregar Cédula como obligatorio por defecto si no está
      const baseRequisitos: Requisito[] = [
        { id: 'cedula_base', nombre: 'Cédula de Identidad', obligatorio: true, tipo_archivo: 'cedula' }
      ]

      const docs = data ? [...baseRequisitos, ...data] : baseRequisitos
      setRequisitos(docs)
      
      const initialUploads: typeof uploads = {}
      docs.forEach(req => {
        initialUploads[req.id] = { file: null, path: null, status: 'idle', progress: 0 }
      })
      setUploads(initialUploads)
      setFetching(false)
    }

    loadRequisitos()
  }, [tipoCreditoId])

  const handleFileChange = async (reqId: string, nombre: string, file: File) => {
    if (!file) return

    setUploads(prev => ({
      ...prev,
      [reqId]: { ...prev[reqId], file, status: 'uploading', progress: 10 }
    }))

    try {
      // Nota: Aquí se implementa una simulación de progreso ya que el SDK de Supabase 
      // no expone progreso nativo en upload() directo sin configurar un handler complejo.
      const path = await uploadDocumentoSolicitud(file, solicitudId, nombre)
      
      setUploads(prev => ({
        ...prev,
        [reqId]: { ...prev[reqId], path, status: 'success', progress: 100 }
      }))
      toast.success(`${nombre} subido correctamente`)
    } catch (error) {
      setUploads(prev => ({
        ...prev,
        [reqId]: { ...prev[reqId], status: 'error', progress: 0 }
      }))
      toast.error(`Error al subir ${nombre}`)
      console.error(error)
    }
  }

  const handleClear = async (reqId: string, path: string) => {
    try {
      // Opcional: eliminar de storage real
      // await deleteDocumento('solicitudes-docs', path)

      setUploads(prev => ({
        ...prev,
        [reqId]: { file: null, path: null, status: 'idle', progress: 0 }
      }))
      toast.info('Archivo removido')
    } catch (err) {
      toast.error('Error al remover archivo')
    }
  }

  const allRequiredUploaded = requisitos
    .filter(req => req.obligatorio)
    .every(req => uploads[req.id]?.status === 'success')

  const handleContinue = () => {
    const docsMapa: Record<string, string> = {}
    Object.keys(uploads).forEach(id => {
      if (uploads[id].path) {
        const req = requisitos.find(r => r.id === id)
        docsMapa[req?.nombre || id] = uploads[id].path!
      }
    })
    onNext(docsMapa)
  }

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Cargando requisitos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
        <div className="flex gap-3">
          <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-900">Documentación Requerida</p>
            <p className="text-blue-700">Sube fotos o PDFs claros de los siguientes documentos. Formatos permitidos: JPG, PNG, PDF.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requisitos.map((req) => (
          <Card key={req.id} className={`overflow-hidden transition-all ${uploads[req.id]?.status === 'success' ? 'border-green-200 bg-green-50/20' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${uploads[req.id]?.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm inline-flex items-center gap-2">
                      {req.nombre}
                      {req.obligatorio && <span className="text-red-500 text-xs">*</span>}
                    </h4>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{req.tipo_archivo}</p>
                  </div>
                </div>
                
                {uploads[req.id]?.status === 'success' ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white text-green-600 border-green-200">
                      <CheckCircle2 className="size-3 mr-1" /> Listo
                    </Badge>
                    <button 
                      onClick={() => handleClear(req.id, uploads[req.id].path!)}
                      className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-500">Pendiente</Badge>
                )}
              </div>

              <div className="mt-4">
                {uploads[req.id]?.status === 'idle' || uploads[req.id]?.status === 'error' ? (
                  <div className="relative">
                    <input
                      type="file"
                      id={`file-${req.id}`}
                      className="hidden"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileChange(req.id, req.nombre, file)
                      }}
                    />
                    <label
                      htmlFor={`file-${req.id}`}
                      className="flex items-center justify-center gap-2 w-full h-10 border-2 border-dashed rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:border-gray-300 cursor-pointer transition-colors"
                    >
                      <Upload className="size-3.5" />
                      Seleccionar archivo
                    </label>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="truncate max-w-[150px]">{uploads[req.id].file?.name}</span>
                      <span>{uploads[req.id].progress}%</span>
                    </div>
                    <Progress value={uploads[req.id].progress} className="h-1.5" />
                    {uploads[req.id].status === 'error' && (
                      <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1">
                        <AlertCircle className="size-3" /> Error al subir. Intenta de nuevo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t mt-8">
        <Button variant="outline" onClick={onBack} disabled={loading} className="cursor-pointer">
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!allRequiredUploaded || loading}
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
