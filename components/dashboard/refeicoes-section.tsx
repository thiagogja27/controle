'use client'

import { useState } from "react"
import { LogOut, Plus, Search, Shield, Users, Loader2, FilePenLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { type RefeicaoPolicial } from "@/lib/store"
import { useRefeicoes } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

const categoriaConfig = {
  pm: { label: "PM", icon: Shield, color: "text-blue-400", bg: "bg-blue-400/10" },
  civil: { label: "Civil", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10" },
}

const initialFormState: Omit<RefeicaoPolicial, "id" | "data" | "hora" | "status" | "horaSaida"> = {
  nome: "",
  prefixo: "",
  categoria: "pm",
  vigilante: "",
}

export function RefeicoesSection() {
  const { data: refeicoes, loading, addItem, updateItem, deleteItem } = useRefeicoes()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedRefeicao, setSelectedRefeicao] = useState<RefeicaoPolicial | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  const totalPM = refeicoes.filter(r => r.categoria === "pm").length
  const totalCivil = refeicoes.filter(r => r.categoria === "civil").length

  const filteredRefeicoes = refeicoes.filter(
    r =>
      r.nome.toLowerCase().includes(search.toLowerCase()) ||
      r.prefixo.toLowerCase().includes(search.toLowerCase()) ||
      r.vigilante.toLowerCase().includes(search.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleCategoryChange = (categoria: "pm" | "civil") => {
    setFormState(prev => ({ ...prev, categoria }))
  }

  const handleAddNew = () => {
    setSelectedRefeicao(null)
    setFormState(initialFormState)
    setIsFormOpen(true)
  }

  const handleEdit = (refeicao: RefeicaoPolicial) => {
    setSelectedRefeicao(refeicao)
    setFormState({
      nome: refeicao.nome,
      prefixo: refeicao.prefixo,
      categoria: refeicao.categoria,
      vigilante: refeicao.vigilante,
    })
    setIsFormOpen(true)
  }

  const handleDelete = (refeicao: RefeicaoPolicial) => {
    setSelectedRefeicao(refeicao)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRefeicao) return
    setIsSaving(true)
    try {
      await deleteItem(selectedRefeicao.id)
      setIsDeleteConfirmOpen(false)
      setSelectedRefeicao(null)
    } catch (error) {
      console.error("Erro ao excluir refeição:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!formState.nome.trim() || !formState.vigilante.trim()) return
    setIsSaving(true)
    try {
      if (selectedRefeicao) {
        await updateItem(selectedRefeicao.id, formState)
      } else {
        const now = new Date()
        const entry: Omit<RefeicaoPolicial, "id"> = {
          ...formState,
          data: now.toISOString().split("T")[0],
          hora: now.toTimeString().slice(0, 5),
          status: "presente",
        }
        await addItem(entry)
      }
      setIsFormOpen(false)
      setFormState(initialFormState)
      setSelectedRefeicao(null)
    } catch (error) {
      console.error("Erro ao salvar refeição:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaida = async (id: string) => {
    try {
      await updateItem(id, {
        horaSaida: new Date().toTimeString().slice(0, 5),
        status: "saiu",
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
  }

  const formatDateTime = (data: string, hora: string) => {
    const [year, month, day] = data.split("-")
    return `${day}/${month}/${year} ${hora}`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {(["pm", "civil"] as const).map(cat => {
          const { label, icon: Icon, color, bg } = categoriaConfig[cat]
          const count = cat === "pm" ? totalPM : totalCivil
          return (
            <Card key={cat}><CardContent className="flex items-center gap-4 p-4"><div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-6 w-6", color)} /></div><div><p className="text-2xl font-bold">{count}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>
          )
        })}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Buscar por nome, prefixo ou vigilante..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
        <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" />Registrar Refeição</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selectedRefeicao ? "Editar Refeição" : "Registrar Refeição"}</DialogTitle></DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2"><Label htmlFor="prefixo">Prefixo</Label><Input id="prefixo" placeholder="Ex: Sgt, Cb, Sd, Del..." value={formState.prefixo} onChange={handleInputChange} /></div>
            <div className="grid gap-2"><Label htmlFor="nome">Nome</Label><Input id="nome" placeholder="Nome completo" value={formState.nome} onChange={handleInputChange} /></div>
            <div className="grid gap-2"><Label htmlFor="vigilante">Vigilante</Label><Input id="vigilante" placeholder="Nome do vigilante responsável" value={formState.vigilante} onChange={handleInputChange} /></div>
            <div className="grid gap-3"><Label>Categoria</Label>
              <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-pm" checked={formState.categoria === "pm"} onCheckedChange={() => handleCategoryChange("pm")} /><Label htmlFor="cat-pm" className="flex cursor-pointer items-center gap-2 font-normal"><Shield className="h-4 w-4 text-blue-400" />PM (Polícia Militar)</Label></div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-civil" checked={formState.categoria === "civil"} onCheckedChange={() => handleCategoryChange("civil")} /><Label htmlFor="cat-civil" className="flex cursor-pointer items-center gap-2 font-normal"><Users className="h-4 w-4 text-amber-400" />Civil (Polícia Civil)</Label></div>
              </div>
            </div>
            <Button onClick={handleSave} className="mt-2" disabled={!formState.nome.trim() || !formState.vigilante.trim() || isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedRefeicao ? "Salvar Alterações" : "Registrar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza de que deseja excluir o registro de "{selectedRefeicao?.nome}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle>Refeições Registradas</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left"><th className="pb-3 text-sm font-medium text-muted-foreground">Data / Hora</th><th className="pb-3 text-sm font-medium text-muted-foreground">Nome</th><th className="pb-3 text-sm font-medium text-muted-foreground">Prefixo</th><th className="pb-3 text-sm font-medium text-muted-foreground">PM / Civil</th><th className="pb-3 text-sm font-medium text-muted-foreground">Vigilante</th><th className="pb-3 text-sm font-medium text-muted-foreground">Saída</th><th className="pb-3 text-sm font-medium text-muted-foreground text-right">Ações</th></tr>
              </thead>
              <tbody>
                {filteredRefeicoes.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</td></tr>
                ) : (
                  filteredRefeicoes.map(r => (
                    <tr key={r.id} className="border-b border-border/50 last:border-0">
                      <td className="py-4 text-sm tabular-nums text-muted-foreground">{formatDateTime(r.data, r.hora)}</td>
                      <td className="py-4 font-medium">{r.nome}</td>
                      <td className="py-4"><span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground">{r.prefixo || "—"}</span></td>
                      <td className="py-4"><div className="flex items-center gap-3"><span className={cn("font-medium text-sm", r.categoria === "pm" ? "text-blue-400" : "text-muted-foreground")}>PM</span><span className={cn("font-medium text-sm", r.categoria === "civil" ? "text-amber-400" : "text-muted-foreground")}>Civil</span></div></td>
                      <td className="py-4 font-medium">{r.vigilante}</td>
                      <td className="py-4">{r.horaSaida ? <span className="text-sm tabular-nums text-muted-foreground">{r.horaSaida}</span> : <span className="text-sm text-muted-foreground">—</span>}</td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-2">
                          {r.status === "presente" && <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)} className="gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"><LogOut className="h-3.5 w-3.5" />Dar Saída</Button>}
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
