// ============================================================
// SimulaFinance — API: Crear usuario administrador
// POST /api/superadmin/create-admin
// Solo accesible por superadmin
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // 1. Verificar que el caller es superadmin
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabaseUser.from('usuarios').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'superadmin') {
    return NextResponse.json({ error: 'Solo el superadmin puede crear administradores' }, { status: 403 })
  }

  // 2. Parsear body
  const body = await request.json()
  const { nombre, apellido, email, password, institucion_id } = body as {
    nombre: string; apellido: string; email: string; password: string; institucion_id: string
  }

  if (!nombre || !apellido || !email || !password || !institucion_id) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  // 3. Crear usuario en auth.users con service role key
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, apellido, rol: 'admin' },
  })

  if (authError || !authUser.user) {
    console.error('Error creando usuario auth:', authError)
    return NextResponse.json({ error: authError?.message ?? 'Error al crear usuario' }, { status: 500 })
  }

  // 4. Actualizar la fila en usuarios (creada por el trigger) con rol e institucion_id
  const { error: updateError } = await supabaseAdmin
    .from('usuarios')
    .update({ rol: 'admin', institucion_id })
    .eq('id', authUser.user.id)

  if (updateError) {
    console.error('Error actualizando perfil:', updateError)
    // Intentar limpiar el usuario auth creado
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    return NextResponse.json({ error: 'Error al configurar el perfil del admin' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: authUser.user.id })
}
