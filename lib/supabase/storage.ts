// ============================================================
// SimulaFinance — Helpers de Supabase Storage
// ============================================================
// Las subidas van a través del API route /api/upload (server-side)
// para usar el service role key y evitar problemas de políticas RLS.
// Las lecturas de URLs firmadas siguen usando el cliente de Supabase.
// ============================================================
import { createClient } from './client'

/**
 * Sube un archivo a través del API route del servidor (bypasea RLS).
 */
async function uploadViaServer(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('bucket', bucket)
  formData.append('path', path)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.error || `Error al subir archivo (${res.status})`)
  }

  return json.path as string
}

/**
 * Sube el logo de la institución al bucket público 'logos'.
 * @returns Ruta del logo en el bucket
 */
export async function uploadLogoInstitucion(
  file: File,
  institucionId: string
): Promise<string> {
  const extension = file.name.split('.').pop() || 'png'
  const path = `${institucionId}/logo.${extension}`
  return uploadViaServer(file, 'logos', path)
}

/**
 * Obtiene la URL pública de un logo en el bucket 'logos'.
 */
export function getLogoPublicUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Sube un documento relacionado a una solicitud de crédito.
 * @returns Ruta del archivo en el bucket
 */
export async function uploadDocumentoSolicitud(
  file: File,
  solicitudId: string,
  nombre: string
): Promise<string> {
  const extension = file.name.split('.').pop() || 'pdf'
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
  const path = `${solicitudId}/${nombreLimpio}.${extension}`
  return uploadViaServer(file, 'solicitudes-docs', path)
}

/**
 * Sube un documento para una solicitud de inversión.
 * @returns Ruta del archivo en el bucket
 */
export async function uploadDocumentoInversion(
  file: File,
  solicitudId: string,
  nombre: string
): Promise<string> {
  const extension = file.name.split('.').pop() || 'pdf'
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
  const path = `${solicitudId}/${nombreLimpio}.${extension}`
  return uploadViaServer(file, 'inversiones-docs', path)
}

/**
 * Obtiene una URL temporal firmada para un documento privado.
 * Usa el API route del servidor para bypasear restricciones RLS.
 * La URL expira en 1 hora (3600 segundos) por defecto.
 */
export async function getDocumentoUrl(
  bucket: 'solicitudes-docs' | 'inversiones-docs',
  path: string,
  expiresIn = 3600
): Promise<string> {
  const res = await fetch('/api/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket, path, expiresIn }),
  })

  const json = await res.json()

  if (!res.ok || !json.signedUrl) {
    throw new Error(`Error al obtener URL del documento: ${json.error || 'desconocido'}`)
  }

  return json.signedUrl as string
}

/**
 * Elimina un documento de un bucket (vía service role implícito si se usa desde server).
 */
export async function deleteDocumento(
  bucket: 'logos' | 'solicitudes-docs' | 'inversiones-docs',
  path: string
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) {
    throw new Error(`Error al eliminar documento: ${error.message}`)
  }
}
