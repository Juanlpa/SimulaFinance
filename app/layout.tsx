import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import type { Institucion } from '@/types'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
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
  // Cargar la configuración de la institución para el tema dinámico
  let institucion: Institucion | null = null

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('instituciones')
      .select('*')
      .limit(1)
      .single()
    institucion = data ?? null
  } catch {
    // Supabase no configurado todavía — usar colores por defecto
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider institucionInicial={institucion}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
