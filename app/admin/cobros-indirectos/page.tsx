// ============================================================
// SimulaFinance — Admin: Cobros Indirectos (CRUD completo)
// ============================================================
// CRUD de cobros indirectos (SOLCA, seguros, fundaciones, etc.)
// Incluye preview de cálculo y alerta informativa sobre SOLCA.
// ============================================================
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PORCENTAJE_SOLCA, NOTA_LEGAL_SOLCA } from '@/lib/constants/tasas-bce'
import type { CobroIndirecto, TipoCredito } from '@/types'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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

import {
  Plus,
  Pencil,
  Loader2,
  Save,
  Info,
  DollarSign,
  Percent,
  Trash2,
} from 'lucide-react'

const cobroVacio = {
  nombre: '',
  tipo_cobro: 'porcentaje' as 'porcentaje' | 'fijo',
  valor: 0,
  base_calculo: 'monto_credito' as 'monto_credito' | 'valor_bien',
  obligatorio: true,
  es_global: true,
  tipo_credito_id: '' as string,
  es_solca: false,
}

export default function CobrosIndirectosPage() {
  const [cobros, setCobros] = useState<CobroIndirecto[]>([])
  const [tiposCredito, setTiposCredito] = useState<TipoCredito[]>([])
  const [loading, setLoading] = useState(true)
  const [institucionId, setInstitucionId] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<CobroIndirecto | null>(null)
  const [form, setForm] = useState(cobroVacio)
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
    setInstitucionId(perfil.institucion_id)

    const [cobrosRes, tiposRes] = await Promise.all([
      supabase
        .from('cobros_indirectos')
        .select('*')
        .eq('institucion_id', perfil.institucion_id)
        .order('nombre'),
      supabase
        .from('tipos_credito')
        .select('id, nombre')
        .eq('institucion_id', perfil.institucion_id)
        .eq('activo', true)
        .order('nombre'),
    ])

    setCobros(cobrosRes.data ?? [])
    setTiposCredito((tiposRes.data as TipoCredito[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { cargarDatos() }, [cargarDatos])

  // ─── Handlers ────────────────────────────────────────────────
  const abrirCrear = () => {
    setEditando(null)
    setForm(cobroVacio)
    setDialogOpen(true)
  }

  const abrirEditar = (cobro: CobroIndirecto) => {
    setEditando(cobro)
    setForm({
      nombre: cobro.nombre,
      tipo_cobro: cobro.tipo_cobro,
      valor: cobro.valor,
      base_calculo: cobro.base_calculo,
      obligatorio: cobro.obligatorio,
      es_global: cobro.es_global,
      tipo_credito_id: cobro.tipo_credito_id ?? '',
      es_solca: cobro.es_solca,
    })
    setDialogOpen(true)
  }

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.error('Nombre requerido.'); return }
    if (form.valor <= 0) { toast.error('El valor debe ser mayor a 0.'); return }

    setGuardando(true)
    const supabase = createClient()

    const datos = {
      institucion_id: institucionId,
      nombre: form.nombre.trim(),
      tipo_cobro: form.tipo_cobro,
      valor: form.valor,
      base_calculo: form.base_calculo,
      obligatorio: form.obligatorio,
      es_global: form.es_global,
      tipo_credito_id: form.es_global ? null : (form.tipo_credito_id || null),
      es_solca: form.es_solca,
    }

    try {
      if (editando) {
        const { error } = await supabase.from('cobros_indirectos').update(datos).eq('id', editando.id)
        if (error) throw error
        toast.success('Cobro actualizado.')
      } else {
        const { error } = await supabase.from('cobros_indirectos').insert(datos)
        if (error) throw error
        toast.success('Cobro creado.')
      }
      setDialogOpen(false)
      cargarDatos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (cobro: CobroIndirecto) => {
    if (!confirm(`¿Eliminar el cobro "${cobro.nombre}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('cobros_indirectos').delete().eq('id', cobro.id)
    if (error) {
      toast.error('Error al eliminar.')
    } else {
      toast.success('Cobro eliminado.')
      cargarDatos()
    }
  }

  // ─── Preview de cálculo ──────────────────────────────────────
  const calcPreview = () => {
    const monto = 10000
    const plazo = 12
    if (form.es_solca) {
      const total = monto * PORCENTAJE_SOLCA
      return { total, mensual: total / plazo }
    }
    if (form.tipo_cobro === 'porcentaje') {
      const total = monto * (form.valor / 100)
      return { total, mensual: total / plazo }
    }
    return { total: form.valor, mensual: form.valor / plazo }
  }

  const preview = calcPreview()

  // Nombre del tipo asociado
  const getNombreTipo = (id: string | null) => {
    if (!id) return 'Todos los créditos'
    const tipo = tiposCredito.find((t) => t.id === id)
    return tipo?.nombre ?? 'Desconocido'
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
          <h1 className="text-2xl font-bold text-gray-900">Cobros indirectos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Configura SOLCA, seguros y otros cobros. Se distribuyen en cuotas iguales.
          </p>
        </div>
        <Button
          onClick={abrirCrear}
          className="text-white cursor-pointer"
          style={{ backgroundColor: 'var(--color-inst-primary)' }}
        >
          <Plus className="size-4" />
          Nuevo cobro
        </Button>
      </div>

      {/* Alerta SOLCA */}
      <Alert className="mb-6">
        <Info className="size-4" />
        <AlertTitle>Sobre SOLCA</AlertTitle>
        <AlertDescription className="text-xs">{NOTA_LEGAL_SOLCA}</AlertDescription>
      </Alert>

      {cobros.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <p className="text-gray-400 text-sm">No hay cobros indirectos configurados.</p>
          <Button onClick={abrirCrear} variant="outline" className="mt-4 cursor-pointer">
            <Plus className="size-4" />
            Crear primer cobro
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Aplica a</TableHead>
                <TableHead className="text-center">SOLCA</TableHead>
                <TableHead className="text-center">Obligatorio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cobros.map((cobro) => (
                <TableRow key={cobro.id}>
                  <TableCell className="font-medium">{cobro.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {cobro.tipo_cobro === 'porcentaje' ? (
                        <><Percent className="size-3 mr-0.5" /> Porcentaje</>
                      ) : (
                        <><DollarSign className="size-3 mr-0.5" /> Fijo</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {cobro.tipo_cobro === 'porcentaje' ? `${cobro.valor}%` : `$${cobro.valor.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {cobro.base_calculo === 'monto_credito' ? 'Monto crédito' : 'Valor bien'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {cobro.es_global ? (
                      <Badge variant="default">Global</Badge>
                    ) : (
                      <span className="text-gray-600">{getNombreTipo(cobro.tipo_credito_id)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {cobro.es_solca && <Badge variant="secondary">SOLCA</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cobro.obligatorio ? 'default' : 'secondary'}>
                      {cobro.obligatorio ? 'Sí' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => abrirEditar(cobro)} title="Editar">
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => eliminar(cobro)} title="Eliminar" className="text-red-500 hover:text-red-700">
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

      {/* ─── Dialog crear/editar cobro ──────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar cobro indirecto' : 'Nuevo cobro indirecto'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder='Ej: SOLCA, Seguro desgravamen'
                className="h-10"
              />
            </div>

            {/* Tipo: % o fijo */}
            <div className="space-y-1.5">
              <Label>Tipo de cobro</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.tipo_cobro === 'porcentaje'}
                    onChange={() => setForm({ ...form, tipo_cobro: 'porcentaje' })}
                  />
                  <span className="text-sm">Porcentaje sobre monto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.tipo_cobro === 'fijo'}
                    onChange={() => setForm({ ...form, tipo_cobro: 'fijo' })}
                  />
                  <span className="text-sm">Valor fijo</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Valor {form.tipo_cobro === 'porcentaje' ? '(%)' : '($)'}</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: parseFloat(e.target.value) || 0 })}
                  className="h-10 pl-6"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                  {form.tipo_cobro === 'porcentaje' ? '%' : '$'}
                </span>
              </div>
              {form.tipo_cobro === 'porcentaje' && (
                <p className="text-xs text-gray-400">Ej: 0.5 para 0.5%</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Base de cálculo</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.base_calculo === 'monto_credito'}
                    onChange={() => setForm({ ...form, base_calculo: 'monto_credito' })}
                  />
                  <span className="text-sm">Sobre monto del crédito</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={form.base_calculo === 'valor_bien'}
                    onChange={() => setForm({ ...form, base_calculo: 'valor_bien' })}
                  />
                  <span className="text-sm">Sobre valor del bien</span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Aplica a</Label>
              <div className="flex items-center gap-3 mb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.es_global}
                    onChange={(e) => setForm({ ...form, es_global: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Todos los créditos (global)</span>
                </label>
              </div>
              {!form.es_global && (
                <Select
                  value={form.tipo_credito_id}
                  onValueChange={(v) => setForm({ ...form, tipo_credito_id: v ?? '' })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar tipo de crédito" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposCredito.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.es_solca}
                  onChange={(e) => setForm({ ...form, es_solca: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Es SOLCA</span>
              </label>
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

            {/* SOLCA info */}
            {form.es_solca && (
              <Alert>
                <Info className="size-4" />
                <AlertDescription className="text-xs">
                  Si &quot;Es SOLCA&quot; está activo, el cálculo aplica regla de proporcionalidad:<br />
                  • Plazo ≤ 12 meses: total = monto × 0.5% × (plazo/12)<br />
                  • Plazo &gt; 12 meses: total = monto × 0.5%
                </AlertDescription>
              </Alert>
            )}

            {/* Preview de cálculo */}
            <div className="bg-gray-50 rounded-lg p-3 border">
              <p className="text-xs font-medium text-gray-600 mb-1">
                Preview (crédito de $10,000 a 12 meses)
              </p>
              <div className="flex gap-4 text-sm">
                <span>Total: <strong className="font-mono">${preview.total.toFixed(2)}</strong></span>
                <span>Mensual: <strong className="font-mono">${preview.mensual.toFixed(2)}</strong></span>
              </div>
            </div>
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
