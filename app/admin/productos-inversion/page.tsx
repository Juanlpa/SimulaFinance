// ============================================================
// SimulaFinance — Admin: Productos de Inversión (CRUD)
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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

import { Plus, Pencil, Loader2, Save, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react'

interface ProductoInversion {
  id: string
  nombre: string
  tasa_interes_anual: number
  plazo_min_dias: number
  plazo_max_dias: number
  monto_min: number
  monto_max: number
  descripcion: string | null
  activo: boolean
}

const productoVacio = {
  nombre: '',
  tasa_interes_anual: 0,
  plazo_min_dias: 30,
  plazo_max_dias: 365,
  monto_min: 500,
  monto_max: 100000,
  descripcion: '',
  activo: true,
}

export default function ProductosInversionPage() {
  const [productos, setProductos] = useState<ProductoInversion[]>([])
  const [loading, setLoading] = useState(true)
  const [institucionId, setInstitucionId] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<ProductoInversion | null>(null)
  const [form, setForm] = useState(productoVacio)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: perfil } = await supabase
      .from('usuarios')
      .select('institucion_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.institucion_id) { setLoading(false); return }
    setInstitucionId(perfil.institucion_id)

    const { data } = await supabase
      .from('productos_inversion')
      .select('*')
      .eq('institucion_id', perfil.institucion_id)
      .order('nombre')

    setProductos((data as ProductoInversion[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => {
    setEditando(null)
    setForm(productoVacio)
    setDialogOpen(true)
  }

  const abrirEditar = (p: ProductoInversion) => {
    setEditando(p)
    setForm({
      nombre: p.nombre,
      tasa_interes_anual: p.tasa_interes_anual,
      plazo_min_dias: p.plazo_min_dias,
      plazo_max_dias: p.plazo_max_dias,
      monto_min: p.monto_min,
      monto_max: p.monto_max,
      descripcion: p.descripcion ?? '',
      activo: p.activo,
    })
    setDialogOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido.'); return }

    setGuardando(true)
    const supabase = createClient()

    const datos = {
      institucion_id: institucionId,
      nombre: form.nombre.trim(),
      tasa_interes_anual: form.tasa_interes_anual,
      plazo_min_dias: form.plazo_min_dias,
      plazo_max_dias: form.plazo_max_dias,
      monto_min: form.monto_min,
      monto_max: form.monto_max,
      descripcion: form.descripcion.trim() || null,
      activo: form.activo,
    }

    try {
      if (editando) {
        const { error } = await supabase.from('productos_inversion').update(datos).eq('id', editando.id)
        if (error) throw error
        toast.success('Producto actualizado.')
      } else {
        const { error } = await supabase.from('productos_inversion').insert(datos)
        if (error) throw error
        toast.success('Producto creado.')
      }
      setDialogOpen(false)
      cargar()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async (p: ProductoInversion) => {
    const supabase = createClient()
    const { error } = await supabase.from('productos_inversion').update({ activo: !p.activo }).eq('id', p.id)
    if (error) toast.error('Error al cambiar estado.')
    else { toast.success(p.activo ? 'Desactivado.' : 'Activado.'); cargar() }
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
          <h1 className="text-2xl font-bold text-gray-900">Productos de inversión</h1>
          <p className="text-gray-500 text-sm mt-1">Configura los productos de inversión a plazo fijo.</p>
        </div>
        <Button onClick={abrirCrear} className="text-white cursor-pointer" style={{ backgroundColor: 'var(--color-inst-primary)' }}>
          <Plus className="size-4" />
          Nuevo producto
        </Button>
      </div>

      {productos.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <TrendingUp className="size-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay productos de inversión configurados.</p>
          <Button onClick={abrirCrear} variant="outline" className="mt-4 cursor-pointer">
            <Plus className="size-4" />
            Crear primer producto
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Tasa % anual</TableHead>
                <TableHead>Plazo (días)</TableHead>
                <TableHead>Monto ($)</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-right font-mono text-sm" style={{ color: 'var(--color-inst-primary)' }}>
                    {p.tasa_interes_anual}%
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{p.plazo_min_dias} – {p.plazo_max_dias}</TableCell>
                  <TableCell className="text-sm font-mono text-gray-600">
                    ${p.monto_min.toLocaleString()} – ${p.monto_max.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={p.activo ? 'default' : 'secondary'}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => abrirEditar(p)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => toggleActivo(p)}>
                        {p.activo ? <ToggleRight className="size-3.5 text-green-600" /> : <ToggleLeft className="size-3.5 text-gray-400" />}
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
            <DialogTitle>{editando ? 'Editar producto' : 'Nuevo producto de inversión'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Póliza a 90 días" className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label>Tasa de interés anual (%)</Label>
              <Input type="number" step="0.01" value={form.tasa_interes_anual} onChange={(e) => setForm({ ...form, tasa_interes_anual: parseFloat(e.target.value) || 0 })} className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plazo mín (días)</Label>
                <Input type="number" value={form.plazo_min_dias} onChange={(e) => setForm({ ...form, plazo_min_dias: parseInt(e.target.value) || 0 })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Plazo máx (días)</Label>
                <Input type="number" value={form.plazo_max_dias} onChange={(e) => setForm({ ...form, plazo_max_dias: parseInt(e.target.value) || 0 })} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Monto mín ($)</Label>
                <Input type="number" value={form.monto_min} onChange={(e) => setForm({ ...form, monto_min: parseFloat(e.target.value) || 0 })} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label>Monto máx ($)</Label>
                <Input type="number" value={form.monto_max} onChange={(e) => setForm({ ...form, monto_max: parseFloat(e.target.value) || 0 })} className="h-10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del producto..." className="w-full min-h-[60px] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm resize-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="rounded" />
              <span className="text-sm">Activo</span>
            </label>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button onClick={guardar} disabled={guardando} className="text-white cursor-pointer" style={{ backgroundColor: 'var(--color-inst-primary)' }}>
              {guardando ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
