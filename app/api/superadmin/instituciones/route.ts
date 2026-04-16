// ============================================================
// SimulaFinance — API: CRUD de instituciones (solo superadmin)
// POST /api/superadmin/instituciones  → crear
// PUT  /api/superadmin/instituciones  → actualizar
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

async function verificarSuperadmin() {
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabaseUser.from('usuarios').select('rol').eq('id', user.id).single()
  return perfil?.rol === 'superadmin' ? user : null
}

export async function POST(request: NextRequest) {
  const user = await verificarSuperadmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { nombre, ciudad, ruc_institucion, email, telefono, color_primario, color_secundario, color_acento, slug } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabaseAdmin
    .from('instituciones')
    .insert({ nombre, ciudad, ruc_institucion, email, telefono, color_primario, color_secundario, color_acento, slug: slug || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}

export async function PUT(request: NextRequest) {
  const user = await verificarSuperadmin()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const body = await request.json()
  const { id, nombre, ciudad, ruc_institucion, email, telefono, color_primario, color_secundario, color_acento, slug } = body

  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await supabaseAdmin
    .from('instituciones')
    .update({ nombre, ciudad, ruc_institucion, email, telefono, color_primario, color_secundario, color_acento, slug: slug || null, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
