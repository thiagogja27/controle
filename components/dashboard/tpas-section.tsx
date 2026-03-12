'use client'

import { useState, useEffect } from "react"
import { LogIn, LogOut, Plus, Search, Ship, Users, Loader2, FilePenLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{registros.length}</p><p className="text-sm text-muted-foreground">Total do Dia</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Ship className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-primary">{totalPresentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEG</span></div><div><p className="text-2xl font-bold">{totalTeg}</p><p className="text-sm text-muted-foreground">Pier TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEAG</span></div><div><p className="text-2xl font-bold">{totalTeag}</p><p className="text-sm text-muted-foreground">Pier TEAG</p></div></CardContent></Card>
      </div>

      {/* Search & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome, documento ou navio..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" />Registrar Entrada</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{selectedTPA ? "Editar Registro TPA" : "Registrar Entrada TPA"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="nome">Nome</Label><Input id="nome" placeholder="Nome completo" value={formState.nome} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="funcao">Função</Label><Input id="funcao" placeholder="Ex: Operador, Técnico" value={formState.funcao} onChange={handleInputChange} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="documento">Documento</Label><Input id="documento" placeholder="CPF / RG" value={formState.documento} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="destino">Destino</Label><Input id="destino" placeholder="Ex: Convés Principal" value={formState.destino} onChange={handleInputChange} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label htmlFor="navio">Navio</Label><Input id="navio" placeholder="Nome do navio" value={formState.navio} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="pier">Pier</Label><Select value={formState.pier} onValueChange={v => handleSelectChange("pier", v as "teg" | "teag")}><SelectTrigger id="pier"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2"><Label htmlFor="hora">Hora Entrada</Label><Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} /></div>
                 {selectedTPA && <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida || ""} onChange={handleInputChange} /></div>}
            </div>
            <div className="grid gap-2"><Label htmlFor="vigilante">Vigilante</Label><Input id="vigilante" placeholder="Nome do vigilante responsável" value={formState.vigilante} onChange={handleInputChange} /></div>
            <div className="grid gap-2"><Label htmlFor="observacao">Observação</Label><Textarea id="observacao" placeholder="Observações adicionais (opcional)" value={formState.observacao} onChange={handleInputChange} rows={2} /></div>
            <Button onClick={handleSave} disabled={!isFormValid || isSaving} className="mt-2">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedTPA ? "Salvar Alterações" : "Registrar Entrada"}</Button>
          </div>
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

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Data / Hora</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Função</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Documento</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Navio</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Destino</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Pier</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Vigilante</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground">Observações</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">Hora Saída</th>
              <th className="px-4 py-3 text-sm font-medium text-muted-foreground text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr><td colSpan={11} className="py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</td></tr>
            ) : (
              filtered.map(r => (
                <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
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
                            <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)} className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground whitespace-nowrap text-xs"><LogOut className="h-3 w-3" />Registrar Saída</Button>
                        ) : (
                            <Button size="sm" variant="outline" onClick={() => handleReEntry(r)} className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground whitespace-nowrap text-xs"><LogIn className="h-3 w-3" />Nova Entrada</Button>
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
    </div>
  )
}
