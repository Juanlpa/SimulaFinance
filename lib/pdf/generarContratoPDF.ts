// ============================================================
// SimulaFinance — Generador de Contrato PDF (Server-side)
// Retorna un Buffer/Uint8Array para subir a Supabase Storage
// ============================================================
import type { CobroDesglose } from '@/types'

export interface DatosContrato {
  institucion: {
    nombre: string
    color_primario: string
    color_secundario: string
    logo_url?: string | null
    slogan?: string | null
    direccion?: string | null
    telefono?: string | null
    email?: string | null
    sitio_web?: string | null
  }
  cliente: {
    nombre: string
    apellido: string
    cedula: string | null
    email: string
    telefono?: string | null
    direccion?: string | null
  }
  credito: {
    tipo: string
    subtipo?: string | null
    monto: number
    plazo_meses: number
    tasa_anual: number
    cuota_final: number
    sistema_amortizacion: 'francesa' | 'alemana'
  }
  cobros_desglose: CobroDesglose[]
  observaciones?: string | null
  fecha_aprobacion: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const limpio = hex.replace('#', '')
  return {
    r: parseInt(limpio.substring(0, 2), 16),
    g: parseInt(limpio.substring(2, 4), 16),
    b: parseInt(limpio.substring(4, 6), 16),
  }
}

export async function generarContratoPDFBuffer(datos: DatosContrato): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const { institucion, cliente, credito, cobros_desglose, observaciones, fecha_aprobacion } = datos

  const colorP = hexToRgb(institucion.color_primario)
  const colorS = hexToRgb(institucion.color_secundario)
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 0

  // ── 1. Encabezado institucional ───────────────────────────
  doc.setFillColor(colorP.r, colorP.g, colorP.b)
  doc.rect(0, 0, pageWidth, 35, 'F')

  if (institucion.logo_url) {
    try { doc.addImage(institucion.logo_url, 'PNG', 12, 7, 20, 20) } catch { /* sin logo */ }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(institucion.nombre, institucion.logo_url ? 37 : 15, 16)
  if (institucion.slogan) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(institucion.slogan, institucion.logo_url ? 37 : 15, 24)
  }
  // Título contrato en el lado derecho del header
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('CONTRATO DE CRÉDITO', pageWidth - 15, 16, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Aprobado: ${fecha_aprobacion}`, pageWidth - 15, 23, { align: 'right' })

  y = 43

  // ── 2. Datos institución ─────────────────────────────────
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(7.5)
  const lineaInst: string[] = []
  if (institucion.direccion) lineaInst.push(`Dirección: ${institucion.direccion}`)
  if (institucion.telefono) lineaInst.push(`Tel: ${institucion.telefono}`)
  if (institucion.email) lineaInst.push(`Email: ${institucion.email}`)
  if (lineaInst.length) {
    doc.text(lineaInst.join('  ·  '), 15, y)
    y += 5
  }

  // Línea divisoria
  doc.setDrawColor(colorS.r, colorS.g, colorS.b)
  doc.setLineWidth(0.4)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // ── 3. Partes del contrato ───────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PARTES DEL CONTRATO', 15, y)
  y += 5

  autoTable(doc, {
    startY: y,
    body: [
      ['PRESTAMISTA (Institución):', institucion.nombre],
      ['PRESTATARIO (Cliente):', `${cliente.nombre} ${cliente.apellido}`],
      ['Cédula / Identificación:', cliente.cedula ?? 'N/A'],
      ['Correo electrónico:', cliente.email],
      ...(cliente.telefono ? [['Teléfono:', cliente.telefono]] : []),
      ...(cliente.direccion ? [['Dirección:', cliente.direccion]] : []),
    ] as string[][],
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
    margin: { left: 15, right: 15 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // Línea divisoria
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 6

  // ── 4. Condiciones del crédito ───────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('CONDICIONES DEL CRÉDITO', 15, y)
  y += 4

  const tasaMensual = credito.tasa_anual / 12
  const totalCobros = cobros_desglose.reduce((s, c) => s + c.total, 0)
  const totalCapital = credito.monto
  const totalPagos = credito.cuota_final * credito.plazo_meses

  autoTable(doc, {
    startY: y,
    body: [
      ['Tipo de crédito:', credito.tipo, 'Sistema de amortización:', credito.sistema_amortizacion === 'francesa' ? 'Sistema Francés (cuota fija)' : 'Sistema Alemán (capital fijo)'],
      ['Subtipo:', credito.subtipo ?? '—', 'Tasa de interés anual:', `${credito.tasa_anual.toFixed(2)}%`],
      ['Monto del crédito:', `$${credito.monto.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`, 'Tasa de interés mensual:', `${tasaMensual.toFixed(4)}%`],
      ['Plazo:', `${credito.plazo_meses} meses`, 'Cuota mensual final:', `$${credito.cuota_final.toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 55 },
      3: { cellWidth: 40 },
    },
    margin: { left: 15, right: 15 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ── 5. Cobros indirectos ─────────────────────────────────
  if (cobros_desglose.length > 0) {
    doc.setDrawColor(220, 220, 220)
    doc.line(15, y, pageWidth - 15, y)
    y += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('COBROS Y SEGUROS ASOCIADOS', 15, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Cobro / Seguro', 'Valor configurado', 'Mensual', 'Total crédito']],
      body: cobros_desglose.map((c) => [
        c.nombre,
        c.tipo_cobro === 'porcentaje' ? `${c.valor_configurado}% anual` : `$${c.valor_configurado.toFixed(2)}`,
        c.es_desgravamen && c.mensual_inicial != null && c.mensual_final != null
          ? `$${c.mensual_inicial.toFixed(2)} → $${c.mensual_final.toFixed(2)} (variable)`
          : `$${c.mensual.toFixed(2)} (fijo)`,
        `$${c.total.toFixed(2)}`,
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [colorP.r, colorP.g, colorP.b] },
      margin: { left: 15, right: 15 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── 6. Resumen financiero ────────────────────────────────
  doc.setDrawColor(220, 220, 220)
  doc.line(15, y, pageWidth - 15, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [['RESUMEN FINANCIERO TOTAL', '']],
    body: [
      ['Capital prestado:', `$${totalCapital.toLocaleString('es-EC', { minimumFractionDigits: 2 })}`],
      ['Total cobros/seguros:', `$${totalCobros.toFixed(2)}`],
      ['Total de pagos:', `$${totalPagos.toFixed(2)}`],
      ...(observaciones ? [['Observaciones del analista:', observaciones]] : []),
    ],
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 2 },
    headStyles: { fillColor: [colorP.r, colorP.g, colorP.b], fontSize: 8.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65 } },
    didParseCell: (hookData) => {
      // Resaltar última fila (total pagos)
      if (hookData.section === 'body' && hookData.row.index === 2) {
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.fontSize = 9.5
      }
    },
    margin: { left: 15, right: 15 },
    tableWidth: 120,
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // ── 7. Cláusulas legales ─────────────────────────────────
  if (y > 230) { doc.addPage(); y = 20 }

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('CLÁUSULAS Y CONDICIONES', 15, y)
  y += 5

  const clausulas = [
    '1. El PRESTATARIO se compromete a pagar la cuota mensual en las fechas establecidas por la institución.',
    '2. En caso de mora, se aplicarán los intereses moratorios vigentes según las tasas máximas del Banco Central del Ecuador.',
    '3. El crédito podrá ser cancelado anticipadamente en cualquier momento, sin penalidad, conforme a la normativa vigente.',
    '4. Los seguros incluidos en la cuota son de carácter obligatorio según la categoría del crédito.',
    '5. Cualquier cambio en las condiciones del crédito deberá ser pactado por escrito entre las partes.',
    '6. Este contrato se rige por las disposiciones de la Junta de Política y Regulación Monetaria y Financiera del Ecuador.',
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(60, 60, 60)
  for (const clausula of clausulas) {
    const lines = doc.splitTextToSize(clausula, pageWidth - 30)
    if (y + lines.length * 5 > 265) { doc.addPage(); y = 20 }
    doc.text(lines, 15, y)
    y += lines.length * 5 + 2
  }

  y += 10

  // ── 8. Firmas ────────────────────────────────────────────
  if (y > 245) { doc.addPage(); y = 20 }

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)

  const col1 = 25
  const col2 = pageWidth / 2 + 15
  const lineY = y + 15

  doc.line(col1, lineY, col1 + 60, lineY)
  doc.line(col2, lineY, col2 + 60, lineY)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('PRESTAMISTA', col1 + 30, lineY + 5, { align: 'center' })
  doc.text('PRESTATARIO', col2 + 30, lineY + 5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(institucion.nombre, col1 + 30, lineY + 10, { align: 'center' })
  doc.text(`${cliente.nombre} ${cliente.apellido}`, col2 + 30, lineY + 10, { align: 'center' })
  doc.text(`C.I.: ${cliente.cedula ?? 'N/A'}`, col2 + 30, lineY + 15, { align: 'center' })

  y = lineY + 22

  // ── 9. Pie legal ─────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(6.5)
    doc.setTextColor(160, 160, 160)
    doc.setFont('helvetica', 'italic')
    const pieTexto = `SimulaFinance — Documento generado electrónicamente el ${fecha_aprobacion}. Página ${i} de ${pageCount}.`
    doc.text(pieTexto, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
  }

  return doc.output('arraybuffer') as unknown as Uint8Array
}
