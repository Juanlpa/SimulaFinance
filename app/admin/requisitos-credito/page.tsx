// ============================================================
// SimulaFinance — Admin: Requisitos de Crédito (CRUD)
// ============================================================
// Gestión de documentos requeridos por tipo de crédito.
// Nota: Cédula y RUC son automáticos; aquí solo documentos adicionales.
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RequisitoCredito, TipoCredito, TipoArchivo } from '@/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { Plus, Pencil, Loader2, Save, Trash2, FileText, Info } from 'lucide-react'

const requisitoVacio = {
  tipo_credito_id: '',
  nombre: '',
  descripcion: '',
  tipo_archivo: 'documento' as TipoArchivo,
  obligatorio: true,
}

const TIPOS_ARCHIVO: { value: TipoArchivo; label: string }[] = [
  { value: 'documento', label: 'Documento PDF' },
  { value: 'imagen', label: 'Imagen' },
  { value: 'cedula', label: 'Cédula' },
  { value: 'ruc', label: 'RUC' },
]

export default function RequisitosPage() {
  const [requisitos, setRequisitos] = useState<RequisitoCredito[]>([])
  const [tiposCredito, setTiposCredito] = useState<TipoCredito[]>([])
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [loading, setLoading] = useState(true)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<RequisitoCredito | null>(null)
  const [form, setForm] = useState(requisitoVacio)
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('institucion_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.institucion_id) { setLoading(false); return }

    const [reqRes, tiposRes] = await Promise.all([
      supabase
        .from('requisitos_credito')
        .select('*')
        .order('nombre'),
      supabase
        .from('tipos_credito')
        .select('id, nombre')
        .eq('institucion_id', perfil.institucion_id)
        .eq('activo', true)
        .order('nombre'),
    ])

    setRequisitos(reqRes.data ?? [])
    setTiposCredito((tiposRes.data as TipoCredito[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // Requisitos filtrados
  const requisitosFiltrados = filtroTipo === 'todos'
    ? requisitos
    : requisitos.filter((r) => r.tipo_credito_id === filtroTipo)

  const getNombreTipo = (id: string) => {
    return tiposCredito.find((t) => t.id === id)?.nombre ?? 'Desconocido'
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm({
      ...requisitoVacio,
      tipo_credito_id: filtroTipo !== 'todos' ? filtroTipo : '',
    })
    setDialogOpen(true)
  }

  const abrirEditar = (req: RequisitoCredito) => {
    setEditando(req)
    setForm({
      tipo_credito_id: req.tipo_credito_id,
      nombre: req.nombre,
      descripcion: req.descripcion ?? '',
      tipo_archivo: req.tipo_archivo,
      obligatorio: req.obligatorio,
    })
    setDialogOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido.'); return }
    if (!form.tipo_credito_id) { toast.error('Selecciona un tipo de crédito.'); return }

    setGuardando(true)
    const supabase = createClient()

    const datos = {
      tipo_credito_id: form.tipo_credito_id,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      tipo_archivo: form.tipo_archivo,
      obligatorio: form.obligatorio,
    }

    try {
      if (editando) {
        const { error } = await supabase.from('requisitos_credito').update(datos).eq('id', editando.id)
        if (error) throw error
        toast.success('Requisito actualizado.')
      } else {
        const { error } = await supabase.from('requisitos_credito').insert(datos)
        if (error) throw error
        toast.success('Requisito creado.')
      }
      setDialogOpen(false)
      cargarDatos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (req: RequisitoCredito) => {
    if (!confirm(`¿Eliminar "${req.nombre}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('requisitos_credito').delete().eq('id', req.id)
    if (error) {
      toast.error('Error al eliminar.')
    } else {
      toast.success('Requisito eliminado.')
      cargarDatos()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitos de crédito</h1>
          <p className="text-gray-500 text-sm mt-1">
            Documentos adicionales requeridos por tipo de crédito.
          </p>
        </div>
        <Button
          onClick={abrirCrear}
          className="text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          <Plus className="size-4" />
          Nuevo requisito
        </Button>
      </div>

      {/* Nota */}
      <Alert className="mb-6">
        <Info className="size-4" />
        <AlertDescription className="text-xs">
          La cédula de identidad siempre se solicita automáticamente. El RUC se solicita si el tipo de crédito tiene activado &quot;Requiere RUC&quot;. Aquí solo configuras documentos adicionales.
        </AlertDescription>
      </Alert>

      {/* Filtro por tipo */}
      <div className="mb-4 flex items-center gap-3">
        <Label>Filtrar por tipo:</Label>
        <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v ?? 'todos')}>
          <SelectTrigger className="w-64 h-9">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposCredito.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requisitosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <FileText className="size-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay requisitos configurados{filtroTipo !== 'todos' ? ' para este tipo' : ''}.</p>
          <Button onClick={abrirCrear} variant="outline" className="mt-4 cursor-pointer">
            <Plus className="size-4" />
            Crear requisito
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo de crédito</TableHead>
                <TableHead>Tipo archivo</TableHead>
                <TableHead className="text-center">Obligatorio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requisitosFiltrados.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">{req.nombre}</TableCell>
                  <TableCell className="text-sm text-gray-600">{getNombreTipo(req.tipo_credito_id)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TIPOS_ARCHIVO.find((t) => t.value === req.tipo_archivo)?.label ?? req.tipo_archivo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={req.obligatorio ? 'default' : 'secondary'}>
                      {req.obligatorio ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => abrirEditar(req)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => eliminar(req)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar requisito' : 'Nuevo requisito'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Tipo de crédito *</Label>
              <Select
                value={form.tipo_credito_id}
                onValueChange={(v) => setForm({ ...form, tipo_credito_id: v ?? '' })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {tiposCredito.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del documento *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Rol de pagos, Escritura del bien"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Indicaciones para el cliente..."
                className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo de archivo</Label>
              <Select
                value={form.tipo_archivo}
                onValueChange={(v) => setForm({ ...form, tipo_archivo: (v ?? 'documento') as TipoArchivo })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ARCHIVO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.obligatorio}
                onChange={(e) => setForm({ ...form, obligatorio: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Obligatorio</span>
            </label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              onClick={guardar}
              disabled={guardando}
              className="text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}
            >
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
