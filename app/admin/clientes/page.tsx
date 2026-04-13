// ============================================================
// SimulaFinance — Admin: Gestión de Clientes
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2, Users, Search, CreditCard, TrendingUp, Mail, Phone } from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  apellido: string
  email: string
  cedula: string | null
  telefono: string | null
  direccion: string | null
  created_at: string
  total_solicitudes_credito: number
  total_solicitudes_inversion: number
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [detalle, setDetalle] = useState<Cliente | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, cedula, telefono, direccion, created_at')
      .eq('rol', 'cliente')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    // Cargar conteos de solicitudes
    const ids = (data ?? []).map((u: any) => u.id)

    const [{ data: creditos }, { data: inversiones }] = await Promise.all([
      supabase.from('solicitudes_credito').select('usuario_id').in('usuario_id', ids),
      supabase.from('solicitudes_inversion').select('usuario_id').in('usuario_id', ids),
    ])

    const contCredito: Record<string, number> = {}
    const contInversion: Record<string, number> = {}
    for (const s of creditos ?? []) contCredito[s.usuario_id] = (contCredito[s.usuario_id] ?? 0) + 1
    for (const s of inversiones ?? []) contInversion[s.usuario_id] = (contInversion[s.usuario_id] ?? 0) + 1

    setClientes((data ?? []).map((u: any) => ({
      id: u.id,
      nombre: u.nombre ?? '',
      apellido: u.apellido ?? '',
      email: u.email ?? '',
      cedula: u.cedula,
      telefono: u.telefono,
      direccion: u.direccion,
      created_at: u.created_at,
      total_solicitudes_credito: contCredito[u.id] ?? 0,
      total_solicitudes_inversion: contInversion[u.id] ?? 0,
    })))

    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const filtrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    return (
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.cedula ?? '').includes(q)
    )
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Clientes</h1>
      <p className="text-gray-500 text-sm mb-6">Usuarios registrados como clientes en la institución.</p>

      {/* Barra de búsqueda */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, email o cédula..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="size-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            {busqueda ? 'No se encontraron resultados.' : 'No hay clientes registrados aún.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">Solicitudes crédito</TableHead>
                <TableHead className="text-center">Solicitudes inversión</TableHead>
                <TableHead>Registrado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtrados.map(c => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setDetalle(c)}
                >
                  <TableCell className="font-medium text-sm">
                    {c.nombre} {c.apellido}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{c.email}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">{c.cedula || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{c.telefono || '—'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                      ${c.total_solicitudes_credito > 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-300'}`}>
                      <CreditCard className="size-3" />
                      {c.total_solicitudes_credito}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                      ${c.total_solicitudes_inversion > 0 ? 'bg-teal-50 text-teal-600' : 'text-gray-300'}`}>
                      <TrendingUp className="size-3" />
                      {c.total_solicitudes_inversion}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {new Date(c.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-400">
            {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''}
            {busqueda && ` encontrado${filtrados.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      )}

      {/* Dialog detalle cliente */}
      <Dialog open={!!detalle} onOpenChange={o => !o && setDetalle(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del cliente</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="space-y-4 py-1">
              {/* Avatar inicial */}
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: 'var(--color-inst-primary)' }}>
                  {detalle.nombre.charAt(0)}{detalle.apellido.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{detalle.nombre} {detalle.apellido}</p>
                  <p className="text-sm text-gray-400">Cliente</p>
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="size-3.5 text-gray-400" />
                  {detalle.email}
                </div>
                {detalle.telefono && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="size-3.5 text-gray-400" />
                    {detalle.telefono}
                  </div>
                )}
                <div className="flex gap-4 pt-1">
                  <div>
                    <p className="text-xs text-gray-400">Cédula</p>
                    <p className="font-mono font-medium">{detalle.cedula || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Dirección</p>
                    <p className="font-medium">{detalle.direccion || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <CreditCard className="size-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{detalle.total_solicitudes_credito}</p>
                  <p className="text-xs text-blue-500">Solicitudes crédito</p>
                </div>
                <div className="bg-teal-50 rounded-lg p-3 text-center">
                  <TrendingUp className="size-4 text-teal-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-teal-700">{detalle.total_solicitudes_inversion}</p>
                  <p className="text-xs text-teal-500">Solicitudes inversión</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-right">
                Registrado: {new Date(detalle.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
