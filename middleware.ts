// ============================================================
// SimulaFinance — Middleware de autenticación y autorización
// ============================================================
// Protege:
//   /admin/*   → solo usuarios con rol 'admin'
//   /cliente/* → solo usuarios con rol 'cliente' o 'admin'
// Redirige a /login si no hay sesión activa
// ============================================================
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Rutas públicas que no requieren autenticación
  const rutasPublicas = ['/', '/login', '/registro']
  const esRutaPublica =
    rutasPublicas.some((ruta) => pathname === ruta) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/app/')  // simulador + login + registro por slug

  // /registro muestra selector de institución — no redirigir

  // Si no hay usuario y la ruta requiere autenticación
  if (!user && !esRutaPublica) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Si hay usuario, verificar rol para rutas protegidas
  if (user) {
    // Obtener el rol desde la tabla usuarios
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = perfil?.rol ?? 'cliente'

    // Rutas de superadmin: solo superadmin
    if (pathname.startsWith('/superadmin') && rol !== 'superadmin') {
      const url = request.nextUrl.clone()
      url.pathname = rol === 'admin' ? '/admin/dashboard' : '/cliente/dashboard'
      return NextResponse.redirect(url)
    }

    // Rutas de admin: admin o superadmin
    if (pathname.startsWith('/admin') && rol !== 'admin' && rol !== 'superadmin') {
      const url = request.nextUrl.clone()
      url.pathname = '/cliente/dashboard'
      return NextResponse.redirect(url)
    }

    // Si está en login/registro pero ya tiene sesión → redirigir según rol
    if (pathname === '/login' || pathname === '/registro') {
      const url = request.nextUrl.clone()
      url.pathname = rol === 'superadmin'
        ? '/superadmin/dashboard'
        : rol === 'admin' ? '/admin/dashboard' : '/cliente/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
