// ============================================================
// SimulaFinance — Componente NotaLegal reutilizable
// ============================================================
import { NOTA_LEGAL_TASAS, NOTA_LEGAL_SOLCA, NOTA_LEGAL_COMPLETA } from '@/lib/constants/tasas-bce'

interface NotaLegalProps {
  tipo?: 'credito' | 'solca' | 'completo'
  className?: string
}

export function NotaLegal({ tipo = 'completo', className = '' }: NotaLegalProps) {
  const textos: Record<string, string> = {
    credito: NOTA_LEGAL_TASAS,
    solca: NOTA_LEGAL_SOLCA,
    completo: NOTA_LEGAL_COMPLETA,
  }

  const texto = textos[tipo]

  return (
    <div className={`rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 ${className}`}>
      <p className="font-semibold mb-1">Nota Legal</p>
      <p className="leading-relaxed">{texto}</p>
    </div>
  )
}
