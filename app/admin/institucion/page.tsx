// ============================================================
// SimulaFinance — Admin: Configuración de la Institución
// ============================================================
// Carga los datos de la institución del admin actual y renderiza
// el formulario de configuración completo.
// ============================================================
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InstitucionForm } from '@/components/admin/InstitucionForm'
import type { Institucion } from '@/types'
import { Loader2 } from 'lucide-react'

export default function InstitucionPage() {
  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const supabase = createClient()

      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Obtener el perfil del admin (con institucion_id)
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('institucion_id')
        .eq('id', user.id)
        .single()

      if (perfil?.institucion_id) {
        // Cargar la institución
        const { data: inst } = await supabase
          .from('instituciones')
          .select('*')
          .eq('id', perfil.institucion_id)
          .single()

        setInstitucion(inst ?? null)
      }

      setLoading(false)
    }

    cargar()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuración de la institución</h1>
      <p className="text-gray-500 text-sm mb-6">
        Personaliza el branding de tu institución. Los cambios se reflejan en todo el sistema.
      </p>

      <InstitucionForm
        institucionInicial={institucion}
        adminUsuarioId={userId}
      />
    </div>
  )
}
