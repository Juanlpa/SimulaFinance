// ============================================================
// SimulaFinance — BotonMeInteresa: Navega a solicitud de crédito
// ============================================================
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

interface BotonMeInteresaProps {
  simulacionId: string | null
  disabled: boolean
}

export function BotonMeInteresa({ simulacionId, disabled }: BotonMeInteresaProps) {
  const router = useRouter()

  const handleClick = () => {
    if (simulacionId) {
      router.push(`/cliente/solicitud-credito?simulacion=${simulacionId}`)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !simulacionId}
      className="text-white cursor-pointer"
      style={{ backgroundColor: 'var(--color-inst-primary)' }}
    >
      Me interesa
      <ArrowRight className="size-4" />
    </Button>
  )
}
