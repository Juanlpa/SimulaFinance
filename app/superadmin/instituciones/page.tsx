// ============================================================
// SimulaFinance — SuperAdmin: Gestión de Instituciones
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
import { Loader2, Building2, Plus, Pencil } from 'lucide-react'

interface Institucion {
  id: string
  nombre: string
  ciudad: string | null
  ruc_institucion: string | null
  email: string | null
  telefono: string | null
  color_primario: string
  color_secundario: string
  color_acento: string
  slug: string | null
  created_at: string
}

const EMPTY: Omit<Institucion, 'id' | 'created_at'> = {
  nombre: '', ciudad: '', ruc_institucion: '', email: '', telefono: '',
  color_primario: '#1a1a2e', color_secundario: '#16213e', color_acento: '#0f3460',
  slug: '',
}

export default function InstitucionesPage() {
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Institucion | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, ciudad, ruc_institucion, email, telefono, color_primario, color_secundario, color_acento, created_at')
      .order('created_at', { ascending: false })
    if (error) toast.error('Error al cargar instituciones')
    setInstituciones((data as Institucion[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirNueva = () => {
    setEditando(null)
    setForm(EMPTY)
    setDialogOpen(true)
  }

  const abrirEditar = (inst: Institucion) => {
    setEditando(inst)
    setForm({
      nombre: inst.nombre, ciudad: inst.ciudad ?? '', ruc_institucion: inst.ruc_institucion ?? '',
      email: inst.email ?? '', telefono: inst.telefono ?? '',
      color_primario: inst.color_primario, color_secundario: inst.color_secundario, color_acento: inst.color_acento,
      slug: inst.slug ?? '',
    })
    setDialogOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
    setGuardando(true)

    const res = await fetch('/api/superadmin/instituciones', {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(editando ? { id: editando.id } : {}), ...form }),
    })
    const json = await res.json()

    if (!res.ok) { toast.error(json.error ?? 'Error al guardar'); setGuardando(false); return }

    toast.success(editando ? 'Institución actualizada' : 'Institución creada')
    setDialogOpen(false)
    cargar()
    setGuardando(false)
  }

  const f = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Instituciones</h1>
          <p className="text-gray-500 text-sm">Gestiona las instituciones financieras del sistema.</p>
        </div>
        <Button onClick={abrirNueva} className="text-white cursor-pointer" style={{ backgroundColor: 'var(--color-inst-primary)' }}>
          <Plus className="size-4" /> Nueva institución
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-gray-400" /></div>
      ) : instituciones.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="size-8 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No hay instituciones. Crea la primera.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>RUC</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Link público</TableHead>
                <TableHead>Colores</TableHead>
                <TableHead>Registrada</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {instituciones.map(inst => (
                <TableRow key={inst.id}>
                  <TableCell className="font-medium">{inst.nombre}</TableCell>
                  <TableCell className="text-sm text-gray-500">{inst.ciudad || '—'}</TableCell>
                  <TableCell className="font-mono text-sm text-gray-500">{inst.ruc_institucion || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-500">{inst.email || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {inst.slug ? (
                      <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">/app/{inst.slug}</span>
                    ) : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {[inst.color_primario, inst.color_secundario, inst.color_acento].map((c, i) => (
                        <div key={i} className="size-5 rounded-full border border-gray-200" style={{ backgroundColor: c }} title={c} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    {new Date(inst.created_at).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="cursor-pointer h-7 px-2" onClick={() => abrirEditar(inst)}>
                      <Pencil className="size-3.5 mr-1" /> Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={o => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar institución' : 'Nueva institución'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre *</Label>
                <Input value={form.nombre} onChange={f('nombre')} placeholder="Cooperativa SimulaFinance" />
              </div>
              <div className="space-y-1.5">
                <Label>Ciudad</Label>
                <Input value={form.ciudad ?? ''} onChange={f('ciudad')} placeholder="Quito" />
              </div>
              <div className="space-y-1.5">
                <Label>RUC</Label>
                <Input value={form.ruc_institucion ?? ''} onChange={f('ruc_institucion')} placeholder="1791234567001" maxLength={13} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={form.email ?? ''} onChange={f('email')} placeholder="info@cooperativa.ec" />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono ?? ''} onChange={f('telefono')} placeholder="02-123-4567" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL pública)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 shrink-0">/app/</span>
                <Input
                  value={form.slug ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                  placeholder="cooperativa-jardin"
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-400">Solo letras minúsculas, números y guiones. Usado para el simulador público de la institución.</p>
              {form.slug && (
                <p className="text-xs text-blue-600 font-mono">URL: /app/{form.slug}</p>
              )}
            </div>

            <div className="border-t pt-3">
              <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Colores institucionales</p>
              <div className="grid grid-cols-3 gap-3">
                {(['color_primario', 'color_secundario', 'color_acento'] as const).map((campo, i) => (
                  <div key={campo} className="space-y-1">
                    <Label className="text-xs">{['Primario', 'Secundario', 'Acento'][i]}</Label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={form[campo]} onChange={f(campo)}
                        className="size-8 rounded cursor-pointer border border-gray-200" />
                      <Input value={form[campo]} onChange={f(campo)} className="h-8 text-xs font-mono" maxLength={7} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="cursor-pointer">Cancelar</Button>
            <Button onClick={guardar} disabled={guardando} className="text-white cursor-pointer"
              style={{ backgroundColor: 'var(--color-inst-primary)' }}>
              {guardando ? <Loader2 className="size-4 animate-spin" /> : null}
              {editando ? 'Guardar cambios' : 'Crear institución'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
