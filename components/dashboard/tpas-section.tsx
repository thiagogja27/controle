'use client'

import { useState, useEffect } from "react"
import { LogIn, LogOut, Plus, Search, Ship, Users, Loader2, FilePenLine, Trash2, MoreVertical } from "lucide-react"
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
  DialogClose
} from "@/components/ui/dialog"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { type TPA } from "@/lib/store"
import { useTPAs } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

const initialFormState: Omit<TPA, "id" | "data" | "status"> = {
  nome: "",
  funcao: "",
  documento: "",
  destino: "",
  navio: "",
  pier: "teg",
  observacao: "",
  vigilante: "",
  hora: "",
  horaSaida: "",
}

export function TPAsSection() {
  const { data: registros, loading, addItem, updateItem, deleteItem } = useTPAs()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedTPA, setSelectedTPA] = useState<TPA | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  const handleReEntry = (tpa: TPA) => {
    setSelectedTPA(null); // Ensure we are creating a new entry
    const now = new Date();
    setFormState({
        ...initialFormState,
        nome: tpa.nome,
        funcao: tpa.funcao,
        documento: tpa.documento,
        destino: tpa.destino,
        navio: tpa.navio,
        pier: tpa.pier,
        observacao: tpa.observacao,
        vigilante: tpa.vigilante,
        hora: now.toTimeString().slice(0, 5),
        horaSaida: "",
    });
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen) {
      if (selectedTPA) {
        setFormState({
          nome: selectedTPA.nome,
          funcao: selectedTPA.funcao,
          documento: selectedTPA.documento,
          destino: selectedTPA.destino,
          navio: selectedTPA.navio,
          pier: selectedTPA.pier,
          observacao: selectedTPA.observacao,
          vigilante: selectedTPA.vigilante,
          hora: selectedTPA.hora,
          horaSaida: selectedTPA.horaSaida || "",
        })
      } else if (!formState.nome) {
        const now = new Date()
        setFormState({ ...initialFormState, hora: now.toTimeString().slice(0, 5) })
      }
    }
  }, [selectedTPA, isFormOpen, formState.nome])

  const totalPresentes = registros.filter(r => r.status === "presente").length
  const totalTeg = registros.filter(r => r.pier === "teg").length
  const totalTeag = registros.filter(r => r.pier === "teag").length

  const filtered = registros.filter(r => {
    const searchLower = search.toLowerCase().trim()
    if (!searchLower) return true
    return (
      r.nome?.toLowerCase().includes(searchLower) ||
      r.documento?.toLowerCase().includes(searchLower) ||
      r.navio?.toLowerCase().includes(searchLower)
    )
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: "teg" | "teag") => {
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleAddNew = () => {
    setSelectedTPA(null)
    setFormState(initialFormState)
    setIsFormOpen(true)
  }

  const handleEdit = (tpa: TPA) => {
    setSelectedTPA(tpa)
    setIsFormOpen(true)
  }

  const handleDelete = (tpa: TPA) => {
    setSelectedTPA(tpa)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTPA) return
    setIsSaving(true)
    try {
      await deleteItem(selectedTPA.id)
      setIsDeleteConfirmOpen(false)
      setSelectedTPA(null)
    } catch (error) {
      console.error("Erro ao excluir TPA:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const status = formState.horaSaida ? "saiu" : "presente"
      if (selectedTPA) {
        await updateItem(selectedTPA.id, { ...formState, status })
      } else {
        const now = new Date()
        const entry: Omit<TPA, "id"> = {
          ...formState,
          data: now.toISOString().split("T")[0],
          status: "presente",
          horaSaida: "",
        }
        await addItem(entry)
      }
      setIsFormOpen(false)
    } catch (error) {
      console.error("Erro ao salvar TPA:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaida = async (id: string) => {
    try {
      await updateItem(id, {
        status: "saiu",
        horaSaida: new Date().toTimeString().slice(0, 5),
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
  }

  const formatDate = (data: string, hora: string) => {
    if (!data || !hora) return ""
    const [y, m, d] = data.split("-")
    return `${d}/${m}/${y} ${hora}`
  }

  const isFormValid =
    formState.nome.trim() &&
    formState.funcao.trim() &&
    formState.documento.trim() &&
    formState.destino.trim() &&
    formState.navio.trim() &&
    formState.vigilante.trim()

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{registros.length}</p><p className="text-sm text-muted-foreground">Total do Dia</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Ship className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-primary">{totalPresentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEG</span></div><div><p className="text-2xl font-bold">{totalTeg}</p><p className="text-sm text-muted-foreground">Pier TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEAG</span></div><div><p className="text-2xl font-bold">{totalTeag}</p><p className="text-sm text-muted-foreground">Pier TEAG</p></div></CardContent></Card>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar registro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]" />
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Registrar Entrada</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>{selectedTPA ? "Editar Registro TPA" : "Registrar Entrada TPA"}</DialogTitle></DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="nome">Nome</Label><Input id="nome" placeholder="Nome completo" value={formState.nome} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="funcao">Função</Label><Input id="funcao" placeholder="Ex: Operador, Técnico" value={formState.funcao} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="documento">Documento</Label><Input id="documento" placeholder="CPF / RG" value={formState.documento} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="destino">Destino</Label><Input id="destino" placeholder="Ex: Convés Principal" value={formState.destino} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="navio">Navio</Label><Input id="navio" placeholder="Nome do navio" value={formState.navio} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="pier">Pier</Label><Select value={formState.pier} onValueChange={v => handleSelectChange("pier", v as "teg" | "teag")}><SelectTrigger id="pier"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label htmlFor="hora">Hora Entrada</Label><Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} /></div>
              {selectedTPA && <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida || ""} onChange={handleInputChange} /></div>}
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="vigilante">Vigilante</Label><Input id="vigilante" placeholder="Nome do vigilante responsável" value={formState.vigilante} onChange={handleInputChange} /></div>
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacao">Observação</Label><Textarea id="observacao" placeholder="Observações adicionais (opcional)" value={formState.observacao} onChange={handleInputChange} rows={3} /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={!isFormValid || isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedTPA ? "Salvar Alterações" : "Registrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza de que deseja excluir o registro de "{selectedTPA?.nome}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Registros TPA</CardTitle></CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {filtered.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum registro encontrado.</p>
                ) : (
                    filtered.map(r => (
                        <div key={r.id} className="rounded-lg border bg-card p-4 space-y-3 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{r.nome}</p>
                                    <p className="text-sm text-muted-foreground">{r.funcao}</p>
                                </div>
                                 <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", r.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{r.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                                <div className="flex flex-col"><span className="text-muted-foreground">Documento</span><span>{r.documento}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Navio</span><span>{r.navio}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Entrada</span><span>{formatDate(r.data, r.hora)}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Saída</span><span>{r.horaSaida || '-'}</span></div>
                            </div>
                             <div className="border-t pt-3 flex items-center justify-end gap-2">
                                {r.status === "presente" ? (
                                    <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)}>Registrar Saída</Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleReEntry(r)}>Nova Entrada</Button>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(r)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(r)} className="text-destructive">Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="hidden lg:block overflow-x-auto">
                 <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                            <th className="px-4 py-3 font-medium">Data / Hora</th>
                            <th className="px-4 py-3 font-medium">Nome</th>
                            <th className="px-4 py-3 font-medium">Função</th>
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">Navio</th>
                            <th className="px-4 py-3 font-medium">Destino</th>
                            <th className="px-4 py-3 font-medium">Pier</th>
                            <th className="px-4 py-3 font-medium">Vigilante</th>
                            <th className="px-4 py-3 font-medium">Observações</th>
                            <th className="px-4 py-3 font-medium">Hora Saída</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={11} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className="hover:bg-muted/50">
                                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">{formatDate(r.data, r.hora)}</td>
                                    <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">{r.nome}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.funcao}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.documento}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{r.navio}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.destino}</td>
                                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${r.pier === "teg" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>{r.pier.toUpperCase()}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{r.vigilante}</td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.observacao}</td>
                                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">{r.horaSaida || "-"}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {r.status === "presente" ? (
                                                <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)}><LogOut className="mr-2 h-3 w-3" />Registrar Saída</Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleReEntry(r)}><LogIn className="mr-2 h-3 w-3" />Nova Entrada</Button>
                                            )}
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(r)}><FilePenLine className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
