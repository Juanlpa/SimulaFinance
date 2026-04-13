// ============================================================
// SimulaFinance — PDFGenerator: Botón de descarga de PDF
// ============================================================
'use client'

import { useState } from 'react'
import type { ConfigPDF } from '@/types'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PDFGeneratorProps {
  config: ConfigPDF
  disabled: boolean
}

export function PDFGenerator({ config, disabled }: PDFGeneratorProps) {
  const [generando, setGenerando] = useState(false)

  const handleDescargar = async () => {
    setGenerando(true)
    try {
      // Importación dinámica para evitar SSR issues
      const { generarTablaPDF } = await import('@/lib/pdf/generarTablaPDF')
      await generarTablaPDF(config)
      toast.success('PDF descargado correctamente.')
    } catch (err) {
      console.error('Error al generar PDF:', err)
      toast.error('Error al generar el PDF. Intenta nuevamente.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDescargar}
      disabled={disabled || generando}
      className="cursor-pointer"
    >
      {generando ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <FileDown className="size-4" />
          Descargar PDF
        </>
      )}
    </Button>
  )
}
