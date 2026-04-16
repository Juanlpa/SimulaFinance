import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import type { Institucion } from '@/types'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SimulaFinance',
  description: 'Simulador de tablas de amortización e inversiones',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Cargar la institución del usuario autenticado para el tema dinámico
  let institucion: Institucion | null = null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: perfil } = await supabase
        .from('usuarios')
        .select('institucion_id')
        .eq('id', user.id)
        .single()

      if (perfil?.institucion_id) {
        const { data } = await supabase
          .from('instituciones')
          .select('*')
          .eq('id', perfil.institucion_id)
          .single()
        institucion = data ?? null
      }
    }
  } catch {
    // Supabase no configurado todavía — usar colores por defecto
  }

  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider institucionInicial={institucion}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
