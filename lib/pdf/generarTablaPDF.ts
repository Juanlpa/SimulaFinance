// ============================================================
// SimulaFinance — Generador de PDF institucional
// jsPDF + jspdf-autotable
// ============================================================
// NOTA: Este módulo usa jsPDF que requiere entorno browser/SSR.
// Importar dinámicamente en componentes: import dynamic from 'next/dynamic'
// ============================================================
import type { ConfigPDF, TablaAmortizacionRow, CobroDesglose } from '@/types'
import { NOTA_LEGAL_COMPLETA, NOTA_PIE_PDF } from '@/lib/constants/tasas-bce'

/**
 * Genera y descarga el PDF institucional completo de la simulación.
 * Debe llamarse desde el cliente (browser).
 *
 * Estructura del PDF:
 * 1. Encabezado: logo + nombre + slogan (colores institucionales)
 * 2. Datos institución: dirección, teléfono, email, sitio web
 * 3. Separador
 * 4. Datos del cliente: nombre, cédula, fecha de generación
 * 5. Tipo de crédito, subtipo, sistema de amortización
 * 6. Condiciones: monto, valor bien, plazo, tasa anual y mensual
 * 7. Resumen de cobros indirectos
 * 8. Tabla de amortización completa (fila 0 + filas 1..n + totales)
 * 9. Resumen financiero final
 * 10. Nota legal
 * 11. Pie de página
 */
export async function generarTablaPDF(config: ConfigPDF): Promise<void> {
  // Importación dinámica para evitar SSR issues
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const { institucion, usuario, resumen, tabla, cobros_desglose } = config

  const colorPrimario = hexToRgb(institucion.color_primario)
  const colorSecundario = hexToRgb(institucion.color_secundario)
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 15

  // ── 1. Encabezado ─────────────────────────────────────────
  doc.setFillColor(colorPrimario.r, colorPrimario.g, colorPrimario.b)
  doc.rect(0, 0, pageWidth, 30, 'F')

  // Logo (si existe)
  if (institucion.logo_url) {
    try {
      doc.addImage(institucion.logo_url, 'PNG', 10, 5, 20, 20)
    } catch {
      // Logo no disponible, continuar sin él
    }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(institucion.nombre, institucion.logo_url ? 35 : 15, 14)

  if (institucion.slogan) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(institucion.slogan, institucion.logo_url ? 35 : 15, 22)
  }

  y = 38

  // ── 2. Datos de la institución ────────────────────────────
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(8)
  const datosInst: string[] = []
  if (institucion.direccion) datosInst.push(`Dirección: ${institucion.direccion}`)
  if (institucion.telefono) datosInst.push(`Tel: ${institucion.telefono}`)
  if (institucion.email) datosInst.push(`Email: ${institucion.email}`)
  if (institucion.sitio_web) datosInst.push(`Web: ${institucion.sitio_web}`)
  doc.text(datosInst.join('  |  '), 15, y)
  y += 5

  // ── 3. Separador ─────────────────────────────────────────
  doc.setDrawColor(colorSecundario.r, colorSecundario.g, colorSecundario.b)
  doc.setLineWidth(0.5)
  doc.line(15, y, pageWidth - 15, y)
  y += 5

  // ── 4. Datos del cliente ──────────────────────────────────
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Cliente: ${usuario.nombre} ${usuario.apellido}`, 15, y)
  doc.text(`Cédula: ${usuario.cedula ?? 'N/A'}`, pageWidth / 2, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text(`Fecha de generación: ${config.fecha_generacion}`, 15, y)
  y += 8

  // ── 5 & 6. Tipo de crédito y condiciones ──────────────────
  doc.setFont('helvetica', 'bold')
  doc.text('CONDICIONES DEL CRÉDITO', 15, y)
  y += 5

  const condiciones = [
    [`Tipo de crédito:`, config.tipo_credito],
    [`Subtipo:`, config.subtipo_credito],
    [`Sistema:`, config.sistema_amortizacion === 'francesa' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)'],
    [`Monto solicitado:`, `$${config.monto.toFixed(2)}`],
    ...(config.valor_bien ? [[`Valor del bien:`, `$${config.valor_bien.toFixed(2)}`]] : []),
    [`Plazo:`, `${config.plazo_meses} meses`],
    [`Tasa de interés anual:`, `${config.tasa_anual.toFixed(2)}%`],
    [`Tasa mensual:`, `${config.tasa_mensual.toFixed(4)}%`],
    [`Cuota final:`, `$${resumen.cuota_final.toFixed(2)}`],
  ]

  autoTable(doc, {
    startY: y,
    head: [],
    body: condiciones,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 60 } },
    margin: { left: 15 },
    tableWidth: 120,
  })

  // ── 7. Resumen de cobros indirectos ───────────────────────
  if (cobros_desglose.length > 0) {
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('COBROS INDIRECTOS', 15, y)
    y += 3

    autoTable(doc, {
      startY: y,
      head: [['Cobro', 'Tipo', 'Valor config.', 'Total crédito', 'Mensual por cuota']],
      body: cobros_desglose.map((c: CobroDesglose) => [
        c.nombre,
        c.tipo_cobro === 'porcentaje' ? `${c.valor_configurado}%` : 'Fijo',
        c.tipo_cobro === 'porcentaje' ? `${c.valor_configurado}%` : `$${c.valor_configurado.toFixed(2)}`,
        `$${c.total.toFixed(2)}`,
        `$${c.mensual.toFixed(2)}`,
      ]),
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [colorPrimario.r, colorPrimario.g, colorPrimario.b] },
      margin: { left: 15 },
    })
  }

  // ── 8. Tabla de amortización ──────────────────────────────
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Nueva página si no hay espacio
  if (y > 170) {
    doc.addPage()
    y = 15
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TABLA DE AMORTIZACIÓN', 15, y)
  y += 3

  const nombresCobrosCols = cobros_desglose.map((c: CobroDesglose) => c.nombre)
  const headRow = [
    '# Cuota', 'Cuota base',
    ...nombresCobrosCols,
    'Cuota final', 'Interés', 'Capital', 'Saldo',
  ]

  // Filas de datos + fila 0 (saldo inicial)
  const bodyRows = tabla.map((fila: TablaAmortizacionRow) => {
    if (fila.numero === 0) {
      return [
        '0',
        '—',
        ...nombresCobrosCols.map(() => '—'),
        '—', '—', '—',
        `$${fila.saldo.toFixed(2)}`,
      ]
    }
    return [
      `${fila.numero}`,
      `$${fila.cuota_base.toFixed(2)}`,
      ...nombresCobrosCols.map((nombre: string) => `$${(fila.cobros[nombre] ?? 0).toFixed(2)}`),
      `$${fila.cuota_final.toFixed(2)}`,
      `$${fila.interes.toFixed(2)}`,
      `$${fila.capital.toFixed(2)}`,
      `$${fila.saldo.toFixed(2)}`,
    ]
  })

  // Fila de totales
  const filasReales = tabla.filter((f: TablaAmortizacionRow) => f.numero > 0)
  const totalRow = [
    'TOTAL',
    `$${filasReales.reduce((a: number, f: TablaAmortizacionRow) => a + f.cuota_base, 0).toFixed(2)}`,
    ...nombresCobrosCols.map((nombre: string) =>
      `$${cobros_desglose.find((c: CobroDesglose) => c.nombre === nombre)?.total.toFixed(2) ?? '0.00'}`
    ),
    `$${resumen.costo_total_credito.toFixed(2)}`,
    `$${resumen.total_intereses.toFixed(2)}`,
    `$${resumen.total_capital.toFixed(2)}`,
    '$0.00',
  ]

  autoTable(doc, {
    startY: y,
    head: [headRow],
    body: [...bodyRows, totalRow],
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [colorPrimario.r, colorPrimario.g, colorPrimario.b], fontSize: 7 },
    footStyles: { fillColor: [colorSecundario.r, colorSecundario.g, colorSecundario.b], fontStyle: 'bold' },
    didParseCell: (hookData) => {
      if (hookData.row.index === bodyRows.length - 1 && hookData.section === 'body') {
        hookData.cell.styles.fillColor = [colorSecundario.r, colorSecundario.g, colorSecundario.b]
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.textColor = [255, 255, 255]
      }
    },
    margin: { left: 15, right: 15 },
  })

  // ── 9. Resumen final ──────────────────────────────────────
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (y > 170) { doc.addPage(); y = 15 }

  autoTable(doc, {
    startY: y,
    head: [['RESUMEN FINANCIERO', '']],
    body: [
      ['Total Capital:', `$${resumen.total_capital.toFixed(2)}`],
      ['Total Intereses:', `$${resumen.total_intereses.toFixed(2)}`],
      ...resumen.cobros_desglose.map((c: CobroDesglose) => [`Total ${c.nombre}:`, `$${c.total.toFixed(2)}`]),
      ['COSTO TOTAL DEL CRÉDITO:', `$${resumen.costo_total_credito.toFixed(2)}`],
    ],
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [colorPrimario.r, colorPrimario.g, colorPrimario.b], fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 40 } },
    didParseCell: (hookData) => {
      const isLastRow = hookData.row.index === resumen.cobros_desglose.length + 2
      if (hookData.section === 'body' && isLastRow) {
        hookData.cell.styles.fontStyle = 'bold'
        hookData.cell.styles.fontSize = 9
      }
    },
    margin: { left: 15 },
    tableWidth: 120,
  })

  // ── 10. Nota legal ────────────────────────────────────────
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'italic')
  const notaLines = doc.splitTextToSize(NOTA_LEGAL_COMPLETA, pageWidth - 30)
  doc.text(notaLines, 15, y)

  // ── 11. Pie de página ─────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `${NOTA_PIE_PDF.replace('[fecha]', config.fecha_generacion)}  |  Página ${i} de ${pageCount}`,
      15,
      doc.internal.pageSize.getHeight() - 8
    )
  }

  // Descargar
  const nombreArchivo = `SimulaFinance_${config.tipo_credito.replace(/\s+/g, '_')}_${config.fecha_generacion}.pdf`
  doc.save(nombreArchivo)
}

// Helper
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const limpio = hex.replace('#', '')
  return {
    r: parseInt(limpio.substring(0, 2), 16),
    g: parseInt(limpio.substring(2, 4), 16),
    b: parseInt(limpio.substring(4, 6), 16),
  }
}
