// ============================================================
// SimulaFinance — SuperAdmin: Gestión de Administradores
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Users, Plus, Building2 } from 'lucide-react'

interface AdminFila {
  id: string
  nombre: string
  apellido: string
  email: string
  institucion_id: string | null
  institucion_nombre: string
  created_at: string
}

interface Institucion { id: string; nombre: string }

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminFila[]>([])
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [institucionId, setInstitucionId] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [{ data: adminsData }, { data: instsData }] = await Promise.all([
      supabase.from('usuarios')
        .select('id, nombre, apellido, email, institucion_id, created_at, instituciones(nombre)')
        .eq('rol', 'admin')
        .order('created_at', { ascending: false }),
      supabase.from('instituciones').select('id, nombre').order('nombre'),
    ])

    setAdmins((adminsData ?? []).map((a: any) => ({
      id: a.id,
      nombre: a.nombre ?? '',
      apellido: a.apellido ?? '',
      email: a.email,
      institucion_id: a.institucion_id,
      institucion_nombre: a.instituciones?.nombre ?? 'Sin asignar',
      created_at: a.created_at,
    })))
    setInstituciones((instsData as Institucion[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNuevo = () => {
    setNombre(''); setApellido(''); setEmail(''); setPassword(''); setInstitucionId('')
    setDialogOpen(true)
  }

  const crearAdmin = async () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password.trim()) {
      toast.error('Todos los campos son requeridos')
      return
    }
    if (password.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return }
    if (!institucionId) { toast.error('Selecciona una institución'); return }

    setGuardando(true)
    const res = await fetch('/api/superadmin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, email, password, institucion_id: institucionId }),
    })
    const json = await res.json()

    if (!res.ok) { toast.error(json.error ?? 'Error al crear admin'); setGuardando(false); return }

    toast.success(`Admin ${nombre} ${apellido} creado correctamente`)
    setDialogOpen(false)
    cargar()
    setGuardando(false)
  }

  const cambiarInstitucion = async (adminId: string, nuevaInstId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('usuarios')
      .update({ institucion_id: nuevaInstId })
      .eq('id', adminId)
    if (error) { toast.error('Error al cambiar institución'); return }
    toast.success('Institución actualizada')
    cargar()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Administradores</h1>
          <p className="text-gray-500 text-sm">Crea y gestiona las cuentas de administrador por institución.</p>
        </div>
        <Button onClick={abrirNuevo} className="text-white cursor-pointer" style={{ backgroundColor: 'var(--color-inst-primary)' }}>
          <Plus className="size-4" /> Nuevo admin
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
      ) : admins.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="size-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay administradores. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Institución</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead>Cambiar institución</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nombre} {a.apellido}</TableCell>
                  <TableCell className="text-sm text-gray-500">{a.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                      <Building2 className="size-3" /> {a.institucion_nombre}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {new Date(a.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={a.institucion_id ?? ''}
                      onValueChange={val => cambiarInstitucion(a.id, val || '')}
                    >
                      <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {instituciones.map(inst => (
                          <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" />
              </div>
              <div className="space-y-1.5">
                <Label>Apellido *</Label>
                <Input value={apellido} onChange={e => setApellido(e.target.value)} placeholder="López" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@cooperativa.ec" />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña temporal *</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <p className="text-xs text-gray-400">El admin deberá cambiarla en su primer ingreso.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Institución *</Label>
              <Select value={institucionId} onValueChange={(v) => setInstitucionId(v || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={crearAdmin} disabled={guardando} className="text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}>
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Crear admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
