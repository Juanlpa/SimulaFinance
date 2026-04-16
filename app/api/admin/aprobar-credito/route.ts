// ============================================================
// SimulaFinance — API para aprobar solicitud de crédito
// POST /api/admin/aprobar-credito
// 1. Verifica que el caller sea admin de la institución
// 2. Genera contrato PDF
// 3. Sube a Storage bucket 'contratos'
// 4. Actualiza solicitud a 'aprobada' + contrato_url
// 5. Envía email al cliente con PDF adjunto (Resend)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { generarContratoPDFBuffer, type DatosContrato } from '@/lib/pdf/generarContratoPDF'

export async function POST(request: NextRequest) {
  // ── Autenticación ─────────────────────────────────────────
  const supabaseUser = await createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Verificar rol admin
  const { data: perfil } = await supabaseUser.from('usuarios').select('rol, institucion_id').eq('id', user.id).single()
  if (!perfil || perfil.rol !== 'admin') {
    return NextResponse.json({ error: 'Solo admins pueden aprobar solicitudes' }, { status: 403 })
  }

  const { solicitudId, observaciones } = await request.json() as { solicitudId: string; observaciones?: string }
  if (!solicitudId) return NextResponse.json({ error: 'solicitudId requerido' }, { status: 400 })

  // ── Cargar datos con service role ────────────────────────
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: sol, error: solErr } = await supabaseAdmin
    .from('solicitudes_credito')
    .select(`
      id, monto, plazo_meses, tasa_aplicada, cuota_final, sistema_amortizacion,
      tipo_credito_id, subtipo_credito_id,
      tipos_credito(nombre),
      subtipos_credito(nombre),
      usuario_id
    `)
    .eq('id', solicitudId)
    .single()

  if (solErr || !sol) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  // Verificar que la solicitud pertenece a la institución del admin
  const { data: tipoCred } = await supabaseAdmin
    .from('tipos_credito')
    .select('institucion_id')
    .eq('id', sol.tipo_credito_id)
    .single()

  if (!tipoCred || tipoCred.institucion_id !== perfil.institucion_id) {
    return NextResponse.json({ error: 'No tienes permiso sobre esta solicitud' }, { status: 403 })
  }

  // Cargar datos del cliente
  const { data: cliente } = await supabaseAdmin
    .from('usuarios')
    .select('nombre, apellido, cedula, email, telefono, direccion')
    .eq('id', sol.usuario_id)
    .single()

  if (!cliente) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  // Cargar institución
  const { data: inst } = await supabaseAdmin
    .from('instituciones')
    .select('*')
    .eq('id', perfil.institucion_id)
    .single()

  if (!inst) return NextResponse.json({ error: 'Institución no encontrada' }, { status: 404 })

  // Cargar cobros indirectos de la institución para ese tipo de crédito
  const { data: cobros } = await supabaseAdmin
    .from('cobros_indirectos')
    .select('*')
    .eq('institucion_id', perfil.institucion_id)
    .eq('activo', true)

  const fechaAprobacion = new Date().toLocaleDateString('es-EC', {
    day: '2-digit', month: 'long', year: 'numeric'
  })

  // ── Calcular cobros desglose (simplificado para el contrato) ──
  const cobrosDesglose = (cobros ?? []).map((c: Record<string, unknown>) => {
    const valor = Number(c.valor) || 0
    const monto = Number(sol.monto)
    const plazo = Number(sol.plazo_meses)
    let total = 0
    let mensual = 0
    let mensualInicial: number | null = null
    let mensualFinal: number | null = null

    if (c.es_desgravamen) {
      const tasaMensual = valor / 12 / 100
      // Aproximación: usar monto completo para mes 1 y cuota mínima para último mes
      mensualInicial = parseFloat((monto * tasaMensual).toFixed(2))
      // Saldo último mes ≈ monto / plazo (estimación)
      mensualFinal = parseFloat(((monto / plazo) * tasaMensual).toFixed(2))
      total = parseFloat(((mensualInicial + mensualFinal) / 2 * plazo).toFixed(2))
      mensual = parseFloat((total / plazo).toFixed(2))
    } else if (c.tipo_cobro === 'porcentaje') {
      const base = c.base_calculo === 'monto_credito' ? monto : (Number(sol.monto) || monto)
      total = parseFloat((base * valor / 100).toFixed(2))
      mensual = parseFloat((total / plazo).toFixed(2))
    } else {
      mensual = valor
      total = parseFloat((valor * plazo).toFixed(2))
    }

    return {
      nombre: String(c.nombre),
      tipo_cobro: String(c.tipo_cobro) as 'porcentaje' | 'fijo',
      valor_configurado: valor,
      base_calculo: String(c.base_calculo || 'monto_credito') as 'monto_credito' | 'valor_bien',
      total,
      mensual,
      es_desgravamen: Boolean(c.es_desgravamen),
      mensual_inicial: mensualInicial,
      mensual_final: mensualFinal,
    }
  })

  // ── Generar PDF ───────────────────────────────────────────
  const datosContrato: DatosContrato = {
    institucion: {
      nombre: inst.nombre,
      color_primario: inst.color_primario ?? '#1e40af',
      color_secundario: inst.color_secundario ?? '#3b82f6',
      logo_url: inst.logo_url,
      slogan: inst.slogan,
      direccion: inst.direccion,
      telefono: inst.telefono,
      email: inst.email,
      sitio_web: inst.sitio_web,
    },
    cliente: {
      nombre: cliente.nombre ?? '',
      apellido: cliente.apellido ?? '',
      cedula: cliente.cedula,
      email: cliente.email ?? '',
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    },
    credito: {
      tipo: (sol.tipos_credito as { nombre?: string } | null)?.nombre ?? 'Crédito',
      subtipo: (sol.subtipos_credito as { nombre?: string } | null)?.nombre ?? null,
      monto: Number(sol.monto),
      plazo_meses: Number(sol.plazo_meses),
      tasa_anual: Number(sol.tasa_aplicada),
      cuota_final: Number(sol.cuota_final),
      sistema_amortizacion: (sol.sistema_amortizacion ?? 'francesa') as 'francesa' | 'alemana',
    },
    cobros_desglose: cobrosDesglose,
    observaciones: observaciones || null,
    fecha_aprobacion: fechaAprobacion,
  }

  let pdfBuffer: Uint8Array
  try {
    pdfBuffer = await generarContratoPDFBuffer(datosContrato)
  } catch (pdfErr) {
    console.error('Error generando PDF:', pdfErr)
    return NextResponse.json({ error: 'Error generando contrato PDF' }, { status: 500 })
  }

  // ── Subir PDF a Storage ───────────────────────────────────
  const contratoPath = `${solicitudId}/contrato_${Date.now()}.pdf`
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('contratos')
    .upload(contratoPath, Buffer.from(pdfBuffer), {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadErr) {
    console.error('Error subiendo contrato:', uploadErr)
    return NextResponse.json({ error: 'Error subiendo contrato al storage' }, { status: 500 })
  }

  // ── Actualizar solicitud ──────────────────────────────────
  const { error: updateErr } = await supabaseAdmin
    .from('solicitudes_credito')
    .update({
      estado: 'aprobada',
      observaciones_admin: observaciones?.trim() || null,
      contrato_url: contratoPath,
    })
    .eq('id', solicitudId)

  if (updateErr) {
    console.error('Error actualizando solicitud:', updateErr)
    return NextResponse.json({ error: 'Error actualizando solicitud' }, { status: 500 })
  }

  // ── Enviar email con Resend ───────────────────────────────
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey && cliente.email) {
    try {
      const { Resend } = await import('resend')
      const resend = new Resend(resendKey)

      await resend.emails.send({
        from: `${inst.nombre} <notificaciones@simulafinance.com>`,
        to: cliente.email,
        subject: `¡Tu crédito ha sido aprobado! — ${inst.nombre}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${inst.color_primario ?? '#1e40af'}; padding: 24px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 20px;">${inst.nombre}</h1>
              ${inst.slogan ? `<p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">${inst.slogan}</p>` : ''}
            </div>
            <div style="background: white; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #111827; margin-top: 0;">¡Felicitaciones, ${cliente.nombre}!</h2>
              <p style="color: #374151;">Tu solicitud de crédito ha sido <strong style="color: #16a34a;">aprobada</strong>.</p>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px; color: #374151; font-size: 14px;">Condiciones aprobadas:</h3>
                <table style="width: 100%; font-size: 13px; color: #4b5563;">
                  <tr><td style="padding: 4px 0; font-weight: bold;">Tipo de crédito:</td><td>${datosContrato.credito.tipo}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Monto:</td><td>$${Number(sol.monto).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Plazo:</td><td>${sol.plazo_meses} meses</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Cuota mensual:</td><td>$${Number(sol.cuota_final).toFixed(2)}</td></tr>
                  <tr><td style="padding: 4px 0; font-weight: bold;">Tasa anual:</td><td>${Number(sol.tasa_aplicada).toFixed(2)}%</td></tr>
                </table>
              </div>

              ${observaciones ? `<p style="color: #374151;"><strong>Observaciones:</strong> ${observaciones}</p>` : ''}

              <p style="color: #374151;">Tu contrato de crédito está adjunto a este correo. También puedes descargarlo desde tu portal en SimulaFinance.</p>

              <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
                ${inst.nombre}${inst.telefono ? ` · ${inst.telefono}` : ''}${inst.email ? ` · ${inst.email}` : ''}
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `Contrato_Credito_${cliente.nombre}_${cliente.apellido}.pdf`,
            content: Buffer.from(pdfBuffer).toString('base64'),
          },
        ],
      })
    } catch (emailErr) {
      // El email falla silenciosamente — el contrato ya está en Storage
      console.error('Error enviando email:', emailErr)
    }
  }

  return NextResponse.json({ ok: true, contrato_url: contratoPath })
}
