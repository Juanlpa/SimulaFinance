// ============================================================
// SimulaFinance — API para cambiar estado de solicitud inversión
// POST /api/admin/gestionar-inversion
// Usa service role key para evitar restricciones RLS
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // ── Autenticación ─────────────────────────────────────────
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: perfil } = await supabaseUser
    .from('usuarios')
    .select('rol, institucion_id')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden gestionar solicitudes' }, { status: 403 })
  }

  const { solicitudId, nuevoEstado, observaciones } = await request.json() as {
    solicitudId: string
    nuevoEstado: string
    observaciones?: string
  }

  if (!solicitudId || !nuevoEstado) {
    return NextResponse.json({ error: 'solicitudId y nuevoEstado son requeridos' }, { status: 400 })
  }

  const estadosPermitidos = ['activa', 'aprobada', 'rechazada', 'vencida', 'en_revision']
  if (!estadosPermitidos.includes(nuevoEstado)) {
    return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
  }

  // Usar service role para bypassear RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const updateData: Record<string, unknown> = { estado: nuevoEstado }
  if (observaciones?.trim()) updateData.observaciones_admin = observaciones.trim()

  const { error } = await supabaseAdmin
    .from('solicitudes_inversion')
    .update(updateData)
    .eq('id', solicitudId)

  if (error) {
    console.error('Error actualizando inversión:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
