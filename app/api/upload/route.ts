// ============================================================
// SimulaFinance — API Route para subida de archivos a Storage
// POST /api/upload
// Usa el service role key para bypasear RLS y subir al bucket correcto
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verificar que el usuario esté autenticado
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Parsear FormData
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const path = formData.get('path') as string | null

  if (!file || !bucket || !path) {
    return NextResponse.json({ error: 'Faltan parámetros: file, bucket, path' }, { status: 400 })
  }

  // Validar bucket permitido
  const bucketsPermitidos = ['solicitudes-docs', 'inversiones-docs', 'logos']
  if (!bucketsPermitidos.includes(bucket)) {
    return NextResponse.json({ error: `Bucket no permitido: ${bucket}` }, { status: 400 })
  }

  // Validar tipo de archivo
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!tiposPermitidos.includes(file.type)) {
    return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.type}` }, { status: 400 })
  }

  // Limitar tamaño a 10 MB
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'El archivo excede 10 MB' }, { status: 400 })
  }

  // Usar service role key para subir (bypasea RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: true,
    })

  if (error) {
    console.error('Storage upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, path })
}
