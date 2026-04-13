// ============================================================
// SimulaFinance — Paso 4: Validación Biométrica
// ============================================================
'use client'

import { useState, useEffect, useRef } from 'react'
import * as faceapi from 'face-api.js'
import { Button } from '@/components/ui/button'
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
  cedulaUrl: string | null
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
  const streamRef = useRef<MediaStream | null>(null)

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
        setErrorHeader('No se pudieron cargar los modelos de biometría.')
      }
    }
    loadModels()
  }, [])

  // 2. Cuando cameraActive cambia a true, conectar el stream al video
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(console.error)
    }
  }, [cameraActive])

  // Cleanup al desmontar
  useEffect(() => {
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      })
      streamRef.current = stream
      // Activar primero: el useEffect se encargará de asignar srcObject
      setCameraActive(true)
    } catch (err: any) {
      const msg = err?.name === 'NotAllowedError'
        ? 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.'
        : 'No se pudo acceder a la cámara.'
      toast.error(msg)
      console.error(err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // 3. Validar rostro
  const performValidation = async () => {
    if (!modelsLoaded) { toast.error('Los modelos de IA aún no están listos.'); return }
    if (!cameraActive) { toast.error('Activa la cámara primero.'); return }
    if (!cedulaUrl) { toast.error('No se encontró la foto de la cédula. Vuelve al paso anterior y sube el documento.'); return }

    setValidating(true)
    setMatch(null)

    try {
      // A. Detectar rostro en la cédula
      const cedulaImg = await faceapi.fetchImage(cedulaUrl)
      const cedulaDetection = await faceapi
        .detectSingleFace(cedulaImg, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!cedulaDetection) {
        toast.error('No se detectó un rostro en la foto de la cédula.')
        setValidating(false)
        return
      }

      // B. Detectar rostro en la cámara
      if (!videoRef.current) { setValidating(false); return }
      const cameraDetection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!cameraDetection) {
        toast.error('No se detecta tu rostro. Asegúrate de estar bien iluminado.')
        setValidating(false)
        return
      }

      // C. Comparar (Distancia Euclidiana, umbral estándar 0.6)
      const distance = faceapi.euclideanDistance(
        cedulaDetection.descriptor,
        cameraDetection.descriptor
      )

      const isMatch = distance <= 0.6
      setMatch(isMatch)
      setAttempts(prev => prev + 1)

      if (isMatch) {
        toast.success('Validación biométrica exitosa.')
      } else {
        toast.error('La identidad no coincide. Intenta de nuevo.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error durante la validación.')
    } finally {
      setValidating(false)
    }
  }

  const handleContinue = () => {
    if (!videoRef.current || !match) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 480
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) {
        stopCamera()
        onNext(blob)
      }
    }, 'image/jpeg', 0.9)
  }

  if (!modelsLoaded && !errorHeader) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="size-10 text-gray-400 animate-spin" />
        <div className="text-center space-y-1">
          <p className="font-medium text-gray-900">Preparando reconocimiento facial</p>
          <p className="text-sm text-gray-500">Cargando modelos de IA...</p>
        </div>
      </div>
    )
  }

  if (errorHeader) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Error de configuración</AlertTitle>
        <AlertDescription>{errorHeader}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
        <div className="flex gap-3">
          <ShieldCheck className="size-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-sm text-purple-900">
            <p className="font-semibold">Protección de Identidad</p>
            <p>Compararemos tu rostro actual con la foto de tu cédula para verificar tu identidad.</p>
          </div>
        </div>
      </div>

      {/* Contenedor de cámara — el <video> SIEMPRE está en el DOM */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-lg rounded-2xl overflow-hidden border-2 bg-black relative aspect-[4/3] flex items-center justify-center">

          {/* Video: siempre montado, visible solo cuando cameraActive */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Overlay guía de encuadre */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
              <div className="w-full h-full border-2 border-white/50 rounded-[100px] flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-white/20 animate-ping" />
              </div>
            </div>
          )}

          {/* Pantalla inactiva */}
          {!cameraActive && (
            <div className="text-center p-8 space-y-4">
              <div className="bg-gray-800 p-6 rounded-full inline-block">
                <Camera className="size-12 text-gray-500" />
              </div>
              <p className="text-gray-400 text-sm">Cámara inactiva</p>
              <Button
                onClick={startCamera}
                className="bg-white text-black hover:bg-gray-200 cursor-pointer"
              >
                <Camera className="size-4" />
                Activar Cámara
              </Button>
            </div>
          )}

          {/* Overlay validando */}
          {validating && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
              <Loader2 className="size-10 animate-spin text-white" />
              <p className="text-white font-medium">Validando identidad...</p>
            </div>
          )}

          {/* Overlay éxito */}
          {match === true && (
            <div className="absolute inset-0 bg-green-500/80 flex flex-col items-center justify-center gap-3 backdrop-blur-sm animate-in zoom-in-95 duration-300">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <UserCheck className="size-12 text-green-500" />
              </div>
              <p className="text-white font-bold text-xl">¡Identidad Verificada!</p>
            </div>
          )}

          {/* Overlay fallo */}
          {match === false && (
            <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center gap-3 backdrop-blur-sm animate-in zoom-in-95 duration-300">
              <div className="bg-white p-4 rounded-full shadow-lg">
                <AlertCircle className="size-12 text-red-500" />
              </div>
              <p className="text-white font-bold text-xl">Identidad no verificada</p>
              <p className="text-white/80 text-sm text-center px-6">
                Tu rostro no coincide con la foto de la cédula
              </p>
            </div>
          )}
        </div>

        {/* Mensaje de fallo debajo de la cámara */}
        {match === false && attempts < 3 && (
          <div className="mt-4 max-w-lg w-full bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-800">No se pudo verificar tu identidad</p>
                <p className="text-red-600 mt-0.5">
                  La imagen capturada no coincide con la foto de tu cédula. Intento {attempts} de 3.
                </p>
                <ul className="mt-2 text-red-500 text-xs space-y-0.5 list-disc list-inside">
                  <li>Colócate en un lugar bien iluminado</li>
                  <li>Mira directamente a la cámara</li>
                  <li>Retira lentes, gorras o mascarillas</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bloqueo tras 3 intentos fallidos */}
        {match === false && attempts >= 3 && (
          <div className="mt-4 max-w-lg w-full bg-red-50 border-2 border-red-300 rounded-xl p-5 text-center">
            <AlertCircle className="size-8 text-red-500 mx-auto mb-2" />
            <p className="font-bold text-red-800 text-base mb-1">Validación bloqueada</p>
            <p className="text-red-600 text-sm mb-3">
              Se agotaron los 3 intentos de verificación biométrica. Por favor vuelve al paso anterior
              y verifica que la foto de tu cédula sea clara y legible.
            </p>
            <button
              onClick={onBack}
              className="text-xs underline text-red-500 hover:text-red-700 cursor-pointer"
            >
              ← Volver a subir documentos
            </button>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex items-center justify-center gap-4">
        {cameraActive && match !== true && attempts < 3 && (
          <Button
            onClick={performValidation}
            disabled={validating || !modelsLoaded}
            style={{ backgroundColor: 'var(--color-inst-primary)' }}
            className="text-white cursor-pointer px-10 h-12"
          >
            {validating
              ? <Loader2 className="size-4 animate-spin" />
              : <ShieldCheck className="size-4" />}
            Validar Rostro
          </Button>
        )}
        {match === false && attempts < 3 && (
          <Button variant="outline" onClick={() => setMatch(null)} className="cursor-pointer border-red-200 text-red-600 hover:bg-red-50">
            <RefreshCcw className="size-4" />
            Reintentar ({3 - attempts} intento{3 - attempts !== 1 ? 's' : ''} restante{3 - attempts !== 1 ? 's' : ''})
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t mt-4">
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
