// ============================================================
// SimulaFinance — SuperAdmin: Panel Global
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Building2, Users, FileText, TrendingUp } from 'lucide-react'

interface MetricasGlobales {
  totalInstituciones: number
  totalAdmins: number
  totalClientes: number
  totalSolicitudesCredito: number
  totalSolicitudesInversion: number
}

interface FilaInstitucion {
  id: string
  nombre: string
  ciudad: string | null
  admins: number
  clientes: number
  solicitudesCredito: number
  solicitudesInversion: number
}

export default function SuperAdminDashboard() {
  const [metricas, setMetricas] = useState<MetricasGlobales | null>(null)
  const [instituciones, setInstituciones] = useState<FilaInstitucion[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()

    const [
      { data: insts },
      { data: admins },
      { data: clientes },
      { data: solCredito },
      { data: solInversion },
    ] = await Promise.all([
      supabase.from('instituciones').select('id, nombre, ciudad'),
      supabase.from('usuarios').select('id, institucion_id').eq('rol', 'admin'),
      supabase.from('usuarios').select('id, institucion_id').eq('rol', 'cliente'),
      supabase.from('solicitudes_credito').select('id, tipo_credito_id, tipos_credito(institucion_id)'),
      supabase.from('solicitudes_inversion').select('id, producto_id, productos_inversion(institucion_id)'),
    ])

    const totalInstituciones = insts?.length ?? 0
    const totalAdmins = admins?.length ?? 0
    const totalClientes = clientes?.length ?? 0
    const totalSolicitudesCredito = solCredito?.length ?? 0
    const totalSolicitudesInversion = solInversion?.length ?? 0

    setMetricas({ totalInstituciones, totalAdmins, totalClientes, totalSolicitudesCredito, totalSolicitudesInversion })

    // Construir filas por institución
    const filas: FilaInstitucion[] = (insts ?? []).map((inst: any) => ({
      id: inst.id,
      nombre: inst.nombre,
      ciudad: inst.ciudad,
      admins: (admins ?? []).filter((u: any) => u.institucion_id === inst.id).length,
      clientes: (clientes ?? []).filter((u: any) => u.institucion_id === inst.id).length,
      solicitudesCredito: (solCredito ?? []).filter((s: any) =>
        (s.tipos_credito as any)?.institucion_id === inst.id
      ).length,
      solicitudesInversion: (solInversion ?? []).filter((s: any) =>
        (s.productos_inversion as any)?.institucion_id === inst.id
      ).length,
    }))

    setInstituciones(filas)
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  if (loading) return (
    <div className="flex items-center justify-center py-40">
      <Loader2 className="size-8 animate-spin text-gray-300" />
    </div>
  )

  const cards = [
    { label: 'Instituciones', value: metricas?.totalInstituciones, icon: Building2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Administradores', value: metricas?.totalAdmins, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Clientes', value: metricas?.totalClientes, icon: Users, color: 'text-teal-600 bg-teal-50' },
    { label: 'Sol. Crédito', value: metricas?.totalSolicitudesCredito, icon: FileText, color: 'text-amber-600 bg-amber-50' },
    { label: 'Sol. Inversión', value: metricas?.totalSolicitudesInversion, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel Global</h1>
      <p className="text-gray-500 text-sm mb-8">Vista consolidada de todas las instituciones del sistema.</p>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className={`size-10 rounded-lg flex items-center justify-center mb-3 ${c.color}`}>
                <c.icon className="size-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value ?? 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabla por institución */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Resumen por Institución</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Institución</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead className="text-center">Admins</TableHead>
              <TableHead className="text-center">Clientes</TableHead>
              <TableHead className="text-center">Sol. Crédito</TableHead>
              <TableHead className="text-center">Sol. Inversión</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instituciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                  No hay instituciones registradas
                </TableCell>
              </TableRow>
            ) : (
              instituciones.map(inst => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.nombre}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{inst.ciudad || '—'}</TableCell>
                  <TableCell className="text-center text-sm">{inst.admins}</TableCell>
                  <TableCell className="text-center text-sm">{inst.clientes}</TableCell>
                  <TableCell className="text-center text-sm">{inst.solicitudesCredito}</TableCell>
                  <TableCell className="text-center text-sm">{inst.solicitudesInversion}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
