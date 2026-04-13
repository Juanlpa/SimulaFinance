// ============================================================
// SimulaFinance — Helpers de Supabase Storage
// ============================================================
// Funciones para subir archivos a los buckets de Supabase Storage:
//   - logos: logos de instituciones (público)
//   - solicitudes-docs: documentos de solicitudes de crédito (privado)
//   - inversiones-docs: documentos de solicitudes de inversión (privado)
// ============================================================
import { createClient } from './client'

/**
 * Sube el logo de la institución al bucket público 'logos'.
 * @returns URL pública del logo subido
 */
export async function uploadLogoInstitucion(
  file: File,
  institucionId: string
): Promise<string> {
  const supabase = createClient()
  const extension = file.name.split('.').pop() || 'png'
  const path = `${institucionId}/logo.${extension}`

  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true, // Sobreescribir si ya existe
    })

  if (error) {
    throw new Error(`Error al subir logo: ${error.message}`)
  }

  // Obtener la URL pública
  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Sube un documento relacionado a una solicitud de crédito.
 * @param file Archivo a subir
 * @param solicitudId ID de la solicitud
 * @param nombre Nombre del documento (ej: 'cedula', 'ruc', 'rol_de_pagos')
 * @returns Ruta del archivo en el bucket
 */
export async function uploadDocumentoSolicitud(
  file: File,
  solicitudId: string,
  nombre: string
): Promise<string> {
  const supabase = createClient()
  const extension = file.name.split('.').pop() || 'pdf'
  // Limpiar el nombre para que sea seguro como nombre de archivo
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
  const path = `${solicitudId}/${nombreLimpio}.${extension}`

  const { error } = await supabase.storage
    .from('solicitudes-docs')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw new Error(`Error al subir documento: ${error.message}`)
  }

  return path
}

/**
 * Sube un documento para una solicitud de inversión.
 * @param file Archivo a subir
 * @param solicitudId ID de la solicitud de inversión
 * @param nombre Nombre del documento
 * @returns Ruta del archivo en el bucket
 */
export async function uploadDocumentoInversion(
  file: File,
  solicitudId: string,
  nombre: string
): Promise<string> {
  const supabase = createClient()
  const extension = file.name.split('.').pop() || 'pdf'
  const nombreLimpio = nombre
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
  const path = `${solicitudId}/${nombreLimpio}.${extension}`

  const { error } = await supabase.storage
    .from('inversiones-docs')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    throw new Error(`Error al subir documento de inversión: ${error.message}`)
  }

  return path
}

/**
 * Obtiene una URL temporal firmada para un documento privado.
 * La URL expira en 1 hora (3600 segundos).
 * @param bucket Nombre del bucket ('solicitudes-docs' | 'inversiones-docs')
 * @param path Ruta del archivo en el bucket
 * @returns URL temporal firmada
 */
export async function getDocumentoUrl(
  bucket: 'solicitudes-docs' | 'inversiones-docs',
  path: string
): Promise<string> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600) // 1 hora de expiración

  if (error || !data?.signedUrl) {
    throw new Error(`Error al obtener URL del documento: ${error?.message || 'No se pudo generar la URL'}`)
  }

  return data.signedUrl
}

/**
 * Elimina un documento de un bucket.
 * @param bucket Nombre del bucket
 * @param path Ruta del archivo en el bucket
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
