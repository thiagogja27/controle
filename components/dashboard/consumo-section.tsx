'use client'

import { useState, useEffect } from "react"
import { LogOut, Plus, Search, Ship, Truck, Users, X, Loader2, FilePenLine, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { type ConsumoBordo, type Individuo } from "@/lib/store"
import { useConsumos } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

const initialFormState: Omit<ConsumoBordo, "id" | "data"> = {
  individuos: [{ id: `new-${Date.now()}`, nome: "", status: "presente", horaSaida: "" }],
  veiculo: "",
  placa: "",
  produto: "",
  notaFiscal: "",
  navio: "",
  terminal: "teg",
  empresa: "",
  vigilante: "",
  hora: "",
}

export function ConsumoSection() {
  const { data: consumos, loading, addItem, updateItem, deleteItem } = useConsumos()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedConsumo, setSelectedConsumo] = useState<ConsumoBordo | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    if (isFormOpen) {
      if (selectedConsumo) {
        setFormState({
          ...selectedConsumo,
          individuos: selectedConsumo.individuos.map(ind => ({ ...ind, horaSaida: ind.horaSaida || "" })),
        })
      } else {
        const now = new Date()
        setFormState({
          ...initialFormState,
          hora: now.toTimeString().slice(0, 5),
          individuos: [{ id: `new-${Date.now()}`, nome: "", status: "presente", horaSaida: "" }],
        })
      }
    }
  }, [isFormOpen, selectedConsumo])

  const filteredConsumos = consumos.filter(consumo => {
    const searchLower = search.toLowerCase()
    if (!searchLower) return true
    const matchInConsumo =
      consumo.veiculo.toLowerCase().includes(searchLower) ||
      consumo.placa.toLowerCase().includes(searchLower) ||
      consumo.produto.toLowerCase().includes(searchLower) ||
      consumo.navio.toLowerCase().includes(searchLower) ||
      consumo.empresa.toLowerCase().includes(searchLower)
    const matchInIndividuos = consumo.individuos.some(individuo =>
      individuo.nome.toLowerCase().includes(searchLower)
    )
    return matchInConsumo || matchInIndividuos
  })

  const allIndividuos = consumos.flatMap(c => c.individuos || [])
  const totalRegistros = consumos.length
  const presentes = allIndividuos.filter(i => i.status === "presente").length
  const totalIndividuos = allIndividuos.length
  const totalTeg = consumos.filter(c => c.terminal === "teg").length
  const totalTeag = consumos.filter(c => c.terminal === "teag").length

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleIndividuoChange = (index: number, field: keyof Individuo, value: string) => {
    const newIndividuos = [...formState.individuos]
    const newIndividuo = { ...newIndividuos[index], [field]: value }
    newIndividuos[index] = newIndividuo as Individuo
    setFormState(prev => ({ ...prev, individuos: newIndividuos }))
  }

  const addIndividuo = () => {
    setFormState(prev => ({
      ...prev,
      individuos: [...prev.individuos, { id: `new-${Date.now()}`, nome: "", status: "presente", horaSaida: "" }],
    }))
  }

  const removeIndividuo = (index: number) => {
    if (formState.individuos.length > 1) {
      setFormState(prev => ({ ...prev, individuos: prev.individuos.filter((_, i) => i !== index) }))
    }
  }

  const handleAddNew = () => {
    setSelectedConsumo(null)
    setIsFormOpen(true)
  }

  const handleEdit = (consumoId: string) => {
    const consumoToEdit = consumos.find(c => c.id === consumoId)
    if (consumoToEdit) {
      setSelectedConsumo(consumoToEdit)
      setIsFormOpen(true)
    }
  }

  const handleDelete = (consumoId: string) => {
    const consumoToDelete = consumos.find(c => c.id === consumoId)
    if (consumoToDelete) {
      setSelectedConsumo(consumoToDelete)
      setIsDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedConsumo) return
    setIsSaving(true)
    try {
      await deleteItem(selectedConsumo.id)
      setIsDeleteConfirmOpen(false)
      setSelectedConsumo(null)
    } catch (error) {
      console.error("Erro ao excluir consumo:", error)
    } finally {
      setIsSaving(false)
    }
  }

 const handleSave = async () => {
    setIsSaving(true)
    try {
      const individuosToSave = formState.individuos
        .filter(ind => ind.nome.trim() !== "")
        .map(ind => ({ ...ind, status: ind.horaSaida ? 'saiu' : 'presente' }))

      if (individuosToSave.length === 0) {
        setIsSaving(false)
        return
      }
      
      const dataToSave = { ...formState, individuos: individuosToSave };

      if (selectedConsumo) {
        await updateItem(selectedConsumo.id, dataToSave)
      } else {
        const now = new Date()
        const entry: Omit<ConsumoBordo, "id"> = {
          ...dataToSave,
          data: now.toISOString().split("T")[0],
          individuos: dataToSave.individuos.map(ind => ({
             ...ind,
             id: ind.id.startsWith('new-') ? `ind-${now.getTime()}-${Math.random().toString(36).substring(2, 9)}` : ind.id
          })),
        }
        await addItem(entry)
      }
      setIsFormOpen(false)
    } catch (error) {
      console.error("Erro ao salvar consumo:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaida = async (consumoId: string, individuoId: string) => {
    const consumo = consumos.find(c => c.id === consumoId)
    if (!consumo) return

    const now = new Date()
    const updatedIndividuos = consumo.individuos.map(ind =>
      ind.id === individuoId
        ? { ...ind, status: "saiu", horaSaida: now.toTimeString().slice(0, 5) }
        : ind
    )

    try {
      await updateItem(consumoId, { individuos: updatedIndividuos })
    } catch (error) {
      console.error("Erro ao registrar saída do indivíduo:", error)
    }
  }

  const formatDateTime = (data: string, hora: string) => {
    if(!data || !hora) return "-";
    const [year, month, day] = data.split("-")
    return `${day}/${month}/${year} ${hora}`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{totalRegistros}</p><p className="text-sm text-muted-foreground">Total Registros</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/10"><Ship className="h-6 w-6 text-blue-400" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-400/10"><Users className="h-6 w-6 text-purple-400" /></div><div><p className="text-2xl font-bold">{totalIndividuos}</p><p className="text-sm text-muted-foreground">Total Indivíduos</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEG</span></div><div><p className="text-2xl font-bold">{totalTeg}</p><p className="text-sm text-muted-foreground">Pier TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEAG</span></div><div><p className="text-2xl font-bold">{totalTeag}</p><p className="text-sm text-muted-foreground">Pier TEAG</p></div></CardContent></Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome, veículo, placa, navio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" />Novo Registro</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>{selectedConsumo ? "Editar Registro" : "Registrar Consumo de Bordo"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border bg-secondary/30 p-4 space-y-3"><div className="flex items-center justify-between"><Label>Indivíduos</Label><Button type="button" variant="outline" size="sm" onClick={addIndividuo}><Plus className="mr-1 h-3 w-3" />Adicionar</Button></div><div className="space-y-3">{formState.individuos.map((ind, index) => (<div key={ind.id || index} className="grid grid-cols-[1fr_auto_auto] items-end gap-2"><Input placeholder={`Nome do indivíduo ${index + 1}`} value={ind.nome} onChange={e => handleIndividuoChange(index, "nome", e.target.value)} /><div className="grid w-full gap-1.5"><Label htmlFor={`horaSaida-${index}`} className="text-xs">H. Saída</Label><Input type="time" id={`horaSaida-${index}`} value={ind.horaSaida || ""} onChange={e => handleIndividuoChange(index, "horaSaida", e.target.value)} /></div>{formState.individuos.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeIndividuo(index)} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>}</div>))}</div></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="veiculo">Veículo</Label><Input id="veiculo" placeholder="Ex: Caminhão Baú" value={formState.veiculo} onChange={handleInputChange} /></div><div className="grid gap-2"><Label htmlFor="placa">Placa</Label><Input id="placa" placeholder="Ex: ABC-1234" value={formState.placa} onChange={handleInputChange} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="produto">Produto</Label><Input id="produto" placeholder="Ex: Água Mineral" value={formState.produto} onChange={handleInputChange} /></div><div className="grid gap-2"><Label htmlFor="notaFiscal">Nota Fiscal</Label><Input id="notaFiscal" placeholder="Ex: NF-001234" value={formState.notaFiscal} onChange={handleInputChange} /></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="navio">Navio</Label><Input id="navio" placeholder="Nome do navio" value={formState.navio} onChange={handleInputChange} /></div><div className="grid gap-2"><Label htmlFor="terminal">Terminal</Label><Select value={formState.terminal} onValueChange={v => handleSelectChange("terminal", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" placeholder="Nome da empresa" value={formState.empresa} onChange={handleInputChange} /></div><div className="grid gap-2"><Label htmlFor="vigilante">Vigilante</Label><Input id="vigilante" placeholder="Nome do vigilante" value={formState.vigilante} onChange={handleInputChange} /></div></div>
            <div className="grid gap-2"><Label htmlFor="hora">Hora de Entrada do Grupo</Label><Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} /></div>
          </div>
          <Button onClick={handleSave} className="mt-2" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedConsumo ? "Salvar Alterações" : "Registrar Entrada"}</Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza de que deseja excluir o registro de consumo para o navio "{selectedConsumo?.navio}"? Todos os indivíduos associados serão removidos. Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Registro de Consumo de Bordo</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Entrada</th>
                  <th className="px-4 py-3 font-medium">Saída</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Navio</th>
                  <th className="px-4 py-3 font-medium">Terminal</th>
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Vigilante</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredConsumos.length === 0 ? (
                  <tr><td colSpan={12} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                ) : (
                  filteredConsumos.map(consumo =>
                    consumo.individuos.map((individuo, individuoIndex) => (
                      <tr key={individuo.id} className={cn(individuoIndex > 0 && "border-t-0", "transition-colors hover:bg-muted/50")}>
                        <td className="px-4 py-3 font-medium">{individuo.nome}</td>
                        <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")}>{individuo.status === "presente" ? "A Bordo" : "Saiu"}</span></td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{individuoIndex === 0 ? formatDateTime(consumo.data, consumo.hora) : ''}</td>
                        <td className="px-4 py-3 tabular-nums text-muted-foreground">{individuo.horaSaida || (individuo.status === 'presente' ? <Button size="xs" variant="outline" onClick={() => handleSaida(consumo.id, individuo.id)}>Sair</Button> : '-')}</td>
                        {individuoIndex === 0 ? (
                           <>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{consumo.empresa}</td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{consumo.navio}</td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top"><span className={cn("font-semibold", consumo.terminal === "teg" ? "text-primary" : "text-info")}>{consumo.terminal.toUpperCase()}</span></td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{consumo.produto}</td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{consumo.veiculo}</td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 font-mono text-muted-foreground align-top">{consumo.placa}</td>
                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{consumo.vigilante}</td>
                           </>
                        ) : null}
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-2">
                            {individuoIndex === 0 && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(consumo.id)}><FilePenLine className="mr-2 h-4 w-4" />Editar Grupo</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(consumo.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Grupo</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
