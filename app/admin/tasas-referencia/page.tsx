// ============================================================
// SimulaFinance — Admin: Tasas de Referencia BCE
// ============================================================
'use client'

import { TASAS_BCE, NOTA_LEGAL_TASAS } from '@/lib/constants/tasas-bce'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Info } from 'lucide-react'

export default function TasasReferenciaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tasas de referencia BCE</h1>
      <p className="text-gray-500 text-sm mb-6">
        Tasas activas efectivas máximas vigentes del Banco Central del Ecuador.
      </p>

      <Alert className="mb-6">
        <Info className="size-4" />
        <AlertDescription className="text-xs">{NOTA_LEGAL_TASAS}</AlertDescription>
      </Alert>

      <div className="bg-white rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <tr style={{ backgroundColor: 'var(--color-inst-primary)' }}>
              <TableHead className="text-white font-semibold">Segmento</TableHead>
              <TableHead className="text-white font-semibold">Subsegmento</TableHead>
              <TableHead className="text-right text-white font-semibold">Tasa referencial (%)</TableHead>
              <TableHead className="text-right text-white font-semibold">Tasa máxima (%)</TableHead>
              <TableHead className="text-white font-semibold">Vigencia desde</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {TASAS_BCE.map((tasa, i) => (
              <TableRow key={i} className={i % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <TableCell className="font-medium">{tasa.segmento}</TableCell>
                <TableCell className="text-sm text-gray-600">{tasa.subsegmento ?? '—'}</TableCell>
                <TableCell className="text-right font-mono text-sm">{tasa.tasa_referencial.toFixed(2)}%</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold" style={{ color: 'var(--color-inst-primary)' }}>
                  {tasa.tasa_maxima.toFixed(2)}%
                </TableCell>
                <TableCell className="text-sm text-gray-500">{tasa.vigencia_desde}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Los datos se cargan desde las constantes del sistema. En el futuro se podrán sincronizar automáticamente con el BCE.
      </p>
    </div>
  )
}
