// ============================================================
// SimulaFinance — API Route para generar URLs firmadas de Storage
// POST /api/signed-url
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { bucket, path, expiresIn = 3600 } = body as { bucket: string; path: string; expiresIn?: number }

  if (!bucket || !path) {
    return NextResponse.json({ error: 'Faltan parámetros: bucket, path' }, { status: 400 })
  }

  const bucketsPermitidos = ['solicitudes-docs', 'inversiones-docs', 'logos']
  if (!bucketsPermitidos.includes(bucket)) {
    return NextResponse.json({ error: 'Bucket no permitido' }, { status: 400 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message || 'No se pudo generar la URL' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
