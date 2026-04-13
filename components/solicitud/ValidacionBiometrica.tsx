// ============================================================
// SimulaFinance — Paso 4: Validación Biométrica
// ============================================================
'use client'

import { useState, useEffect, useRef } from 'react'
import * as faceapi from 'face-api.js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Camera, 
  UserCheck, 
  AlertCircle, 
  Loader2, 
  ArrowLeft, 
  ArrowRight,
  RefreshCcw,
  ShieldCheck
} from 'lucide-react'
import { toast } from 'sonner'

interface BiometricValidationProps {
  cedulaUrl: string | null // Signed URL o path local para face-api
  onBack: () => void
  onNext: (selfieBlob: Blob) => void
  loading?: boolean
}

export function ValidacionBiometrica({
  cedulaUrl,
  onBack,
  onNext,
  loading = false,
}: BiometricValidationProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [validating, setValidating] = useState(false)
  const [match, setMatch] = useState<boolean | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [errorHeader, setErrorHeader] = useState<string | null>(null)

  // 1. Cargar modelos de face-api.js
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models'
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
      } catch (err) {
        console.error('Error al cargar modelos de biometría:', err)
        setErrorHeader('No se pudieron cargar los modelos de biometría. Verifica que los archivos estén en /public/models/')
      }
    }
    loadModels()
  }, [])

  // 2. Activar cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      toast.error('No se pudo acceder a la cámara')
      console.error(err)
    }
  }

  // 3. Detener cámara
  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      setCameraActive(false)
    }
  }

  // 4. Validar rostro
  const performValidation = async () => {
    if (!modelsLoaded || !cameraActive || !cedulaUrl) return

    setValidating(true)
    setMatch(null)

    try {
      // A. Cargar imagen de la cédula y detectar rostro
      // Nota: En un entorno real, cedulaUrl debe ser accesible via CORS
      const cedulaImg = await faceapi.fetchImage(cedulaUrl)
      const cedulaDetection = await faceapi
        .detectSingleFace(cedulaImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!cedulaDetection) {
        toast.error('No se detectó un rostro claro en la foto de la cédula subida.')
        setValidating(false)
        return
      }

      // B. Capturar rostro de la cámara
      if (!videoRef.current) return
      const cameraDetection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!cameraDetection) {
        toast.error('No se detecta tu rostro. Asegúrate de estar en un lugar iluminado.')
        setValidating(false)
        return
      }

      // C. Comparar (Distancia Euclidiana)
      const distance = faceapi.euclideanDistance(
        cedulaDetection.descriptor,
        cameraDetection.descriptor
      )

      // Umbral 0.6 es estándar para face-recognition
      const isMatch = distance <= 0.6
      setMatch(isMatch)
      setAttempts(prev => prev + 1)

      if (isMatch) {
        toast.success('Validación biométrica exitosa.')
        // Capturar el frame como blob para subir como selfie
        const canvas = document.createElement('canvas')
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
        canvas.toBlob((blob) => {
          if (blob) {
            // Detenemos cámara antes de ir al siguiente paso (lo hará el padre o el cleanup)
          }
        }, 'image/jpeg')
      } else {
        toast.error('La identidad no coincide. Intenta de nuevo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error durante la validación técnica.')
    } finally {
      setValidating(false)
    }
  }

  const handleContinue = () => {
    if (!videoRef.current || !match) return
    
    // Capturar selfie final
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        stopCamera()
        onNext(blob)
      }
    }, 'image/jpeg')
  }

  // Cleanup
  useEffect(() => {
    return () => stopCamera()
  }, [])

  if (!modelsLoaded && !errorHeader) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-pulse">
        <div className="bg-gray-100 p-8 rounded-full">
          <Loader2 className="size-10 text-gray-400 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-medium text-gray-900">Preparando Inteligencia Artificial</p>
          <p className="text-sm text-gray-500">Cargando modelos de reconocimiento facial...</p>
        </div>
      </div>
    )
  }

  if (errorHeader) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error de Configuración</AlertTitle>
        <AlertDescription>{errorHeader}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 mb-6 rounded-r-lg">
        <div className="flex gap-3">
          <ShieldCheck className="size-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <p className="font-semibold">Protección de Identidad</p>
            <p>Para tu seguridad, compararemos tu rostro actual con la foto de tu cédula.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <Card className="w-full max-w-lg border-2 overflow-hidden bg-black relative aspect-[4/3] flex items-center justify-center">
          {cameraActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                <div className="w-full h-full border-2 border-white/50 rounded-[100px] flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-white/20 animate-ping" />
                </div>
              </div>
            </>
          ) : (
            <div className="text-center p-8 space-y-4">
              <div className="bg-gray-800 p-6 rounded-full inline-block">
                <Camera className="size-12 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Cámara inactiva</p>
              <Button onClick={startCamera} className="bg-white text-black hover:bg-gray-200 cursor-pointer">
                Activar Cámara
              </Button>
            </div>
          )}

          {validating && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Loader2 className="size-10 animate-spin text-white" />
              <p className="text-white font-medium">Validando identidad...</p>
            </div>
          )}

          {match === true && (
            <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center gap-3 backdrop-blur-sm animate-in zoom-in-95 duration-300">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <UserCheck className="size-12 text-green-500" />
              </div>
              <p className="text-white font-bold text-xl">¡Identidad Verificada!</p>
            </div>
          )}
        </Card>

        {match === false && (
          <Alert variant="destructive" className="mt-4 max-w-lg">
            <AlertCircle className="size-4" />
            <AlertTitle>No coinciden</AlertTitle>
            <AlertDescription>
              No pudimos verificar tu identidad frente a la cédula. Asegúrate de tener buena luz y no usar anteojos o gorras.
              (Intento {attempts}/3)
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        {cameraActive && match !== true && (
          <Button 
            onClick={performValidation} 
            disabled={validating || !modelsLoaded}
            style={{ backgroundColor: 'var(--color-inst-primary)' }}
            className="text-white cursor-pointer px-10 h-12"
          >
            {validating ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Validar Rostro
          </Button>
        )}
        {match === false && (
          <Button variant="outline" onClick={() => setMatch(null)} className="cursor-pointer">
            <RefreshCcw className="size-4" />
            Reintentar
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t mt-8">
        <Button variant="outline" onClick={onBack} disabled={loading} className="cursor-pointer">
          <ArrowLeft className="size-4" />
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!match || loading}
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
