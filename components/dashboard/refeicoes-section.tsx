'use client'

import { useState, useEffect, useMemo } from "react"
import { LogIn, LogOut, Plus, Search, Shield, Users, Loader2, FilePenLine, Trash2, X, MoreVertical } from "lucide-react"
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
  DialogClose
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type RefeicaoPolicial as RefeicaoPolicialType, type IndividuoRefeicao } from "@/lib/store"
import { useRefeicoes } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

const categoriaConfig = {
  pm: { label: "PM", icon: Shield, color: "text-blue-400", bg: "bg-blue-400/10" },
  civil: { label: "Civil", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10" },
}

const initialFormState: Omit<RefeicaoPolicialType, "id" | "data"> = {
  individuos: [{ id: `new-${Date.now()}`, nome: "", status: "presente", horaSaida: "" }],
  prefixo: "",
  categoria: "pm",
  vigilante: "",
  hora: "",
}

// Temporary type for backward compatibility
export type OldRefeicaoPolicial = Omit<RefeicaoPolicialType, 'individuos'> & { nome?: string; status?: 'presente' | 'saiu', horaSaida?: string };
export type RefeicaoPolicial = RefeicaoPolicialType;

export function RefeicoesSection() {
  const { data: rawRefeicoes, loading, addItem, updateItem, deleteItem } = useRefeicoes()
  
  const refeicoes = useMemo(() => {
    return (rawRefeicoes as Array<OldRefeicaoPolicial | RefeicaoPolicial>).map(r => {
      if ('individuos' in r && r.individuos) {
        return r as RefeicaoPolicial;
      }
      // This is an old record, normalize it
      const oldRecord = r as OldRefeicaoPolicial;
      return {
        ...oldRecord,
        individuos: [{
          id: oldRecord.id, // Use the main record ID for the individual
          nome: oldRecord.nome || 'Nome não registrado',
          status: oldRecord.status || "presente",
          horaSaida: oldRecord.horaSaida || "",
        }]
      } as RefeicaoPolicial;
    });
  }, [rawRefeicoes]);

  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedRefeicao, setSelectedRefeicao] = useState<RefeicaoPolicial | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    if (isFormOpen) {
      if (selectedRefeicao) {
        setFormState({
          ...selectedRefeicao,
          individuos: selectedRefeicao.individuos.map(ind => ({ ...ind, horaSaida: ind.horaSaida || "" })),
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
  }, [isFormOpen, selectedRefeicao])

  const allIndividuos = refeicoes.flatMap(r => r.individuos?.map(i => ({ ...i, categoria: r.categoria })) || [])
  const totalPM = allIndividuos.filter(i => i.categoria === "pm").length
  const totalCivil = allIndividuos.filter(i => i.categoria === "civil").length

  const filteredRefeicoes = refeicoes.filter(r => {
    const searchLower = search.toLowerCase().trim()
    if (!searchLower) return true
    return (
      (r.prefixo && r.prefixo.toLowerCase().includes(searchLower)) ||
      (r.vigilante && r.vigilante.toLowerCase().includes(searchLower)) ||
      r.individuos?.some(i => i.nome.toLowerCase().includes(searchLower))
    )
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleCategoryChange = (categoria: "pm" | "civil") => {
    setFormState(prev => ({ ...prev, categoria }))
  }
  
  const handleIndividuoChange = (index: number, field: keyof IndividuoRefeicao, value: string) => {
    const newIndividuos = [...formState.individuos]
    const newIndividuo = { ...newIndividuos[index], [field]: value }
    newIndividuos[index] = newIndividuo as IndividuoRefeicao
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
    setSelectedRefeicao(null)
    setFormState(initialFormState) // Reset the form state completely
    setIsFormOpen(true)
  }

  const handleEdit = (refeicao: RefeicaoPolicial) => {
    setSelectedRefeicao(refeicao)
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
    setIsSaving(true)
    try {
      const individuosToSave = formState.individuos
        .filter(ind => ind.nome.trim() !== "")
        .map(ind => ({ ...ind, status: ind.horaSaida ? 'saiu' : 'presente' }))

      if (individuosToSave.length === 0 || !formState.vigilante.trim()) {
        setIsSaving(false)
        return
      }

      const dataToSave = { ...formState, individuos: individuosToSave }

      if (selectedRefeicao) {
        // When saving an edited old record, we must remove the legacy fields
        const { nome, status, horaSaida, ...restOfData } = dataToSave as any;
        await updateItem(selectedRefeicao.id, { ...restOfData, individuos: dataToSave.individuos })
      } else {
        const now = new Date()
        const entry: Omit<RefeicaoPolicial, "id"> = {
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
      console.error("Erro ao salvar refeição:", error)
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleSaida = async (refeicaoId: string, individuoId: string) => {
    const refeicao = refeicoes.find(r => r.id === refeicaoId);
    if (!refeicao || !refeicao.individuos) return;

    const now = new Date();
    const updatedIndividuos = refeicao.individuos.map(ind =>
      ind.id === individuoId
        ? { ...ind, status: "saiu", horaSaida: now.toTimeString().slice(0, 5) }
        : ind
    );

    try {
      await updateItem(refeicaoId, { individuos: updatedIndividuos });
    } catch (error) {
      console.error("Erro ao registrar saída do indivíduo:", error);
    }
  };
  
  const handleReEntry = (refeicao: RefeicaoPolicial, individuo: IndividuoRefeicao) => {
    setSelectedRefeicao(null);
    const now = new Date();
    setFormState({
      ...initialFormState,
      prefixo: refeicao.prefixo,
      categoria: refeicao.categoria,
      vigilante: refeicao.vigilante,
      hora: now.toTimeString().slice(0, 5),
      individuos: [{
          id: `new-${Date.now()}`,
          nome: individuo.nome,
          status: "presente",
          horaSaida: "",
      }],
    });
    setIsFormOpen(true);
  };

  const formatDateTime = (data: string, hora: string) => {
    if (!data) return ""
    const [year, month, day] = data.split("-")
    return `${day}/${month}/${year} ${hora}`
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {(["pm", "civil"] as const).map(cat => {
          const { label, icon: Icon, color, bg } = categoriaConfig[cat]
          const count = cat === "pm" ? totalPM : totalCivil
          return (
            <Card key={cat}><CardContent className="flex items-center gap-4 p-4"><div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-6 w-6", color)} /></div><div><p className="text-2xl font-bold">{count}</p><p className="text-sm text-muted-foreground">Total {label}</p></div></CardContent></Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 md:grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, prefixo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]" />
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Registrar Refeição</Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>{selectedRefeicao ? "Editar Refeição" : "Registrar Refeição"}</DialogTitle></DialogHeader>
           <div className="max-h-[80vh] overflow-y-auto p-1">
                <div className="grid gap-5 py-4">
                    <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Policiais</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addIndividuo} disabled={!!selectedRefeicao}><Plus className="mr-1 h-3 w-3" />Adicionar</Button>
                        </div>
                        <div className="space-y-3">
                            {formState.individuos.map((ind, index) => (
                                <div key={ind.id || index} className="grid grid-cols-[1fr_auto] items-end gap-2">
                                    <Input placeholder={`Nome do policial ${index + 1}`} value={ind.nome} onChange={e => handleIndividuoChange(index, "nome", e.target.value)} />
                                    {formState.individuos.length > 1 && !selectedRefeicao && <Button type="button" variant="ghost" size="icon" onClick={() => removeIndividuo(index)} className="shrink-0 text-destructive hover:text-destructive"><X className="h-4 w-4" /></Button>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label htmlFor="prefixo">Prefixo</Label><Input id="prefixo" placeholder="Ex: VTR 1234, Cia..." value={formState.prefixo} onChange={handleInputChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="vigilante">Vigilante</Label><Input id="vigilante" placeholder="Nome do vigilante" value={formState.vigilante} onChange={handleInputChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="hora">Hora Entrada</Label><Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} /></div>
                        <div className="grid gap-3"><Label>Categoria</Label><div className="grid grid-cols-2 gap-3"><div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-pm" checked={formState.categoria === "pm"} onCheckedChange={() => handleCategoryChange("pm")} /><Label htmlFor="cat-pm" className="flex cursor-pointer items-center gap-2 font-normal"><Shield className="h-4 w-4 text-blue-400" />PM</Label></div><div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-civil" checked={formState.categoria === "civil"} onCheckedChange={() => handleCategoryChange("civil")} /><Label htmlFor="cat-civil" className="flex cursor-pointer items-center gap-2 font-normal"><Users className="h-4 w-4 text-amber-400" />Civil</Label></div></div></div>
                    </div>
                </div>
           </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleSave} disabled={isSaving || formState.individuos.every(i => i.nome.trim() === "")}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedRefeicao ? "Salvar Alterações" : "Registrar"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza de que deseja excluir este registro? Todos os policiais associados serão removidos. Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Refeições Registradas</CardTitle></CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                 {filteredRefeicoes.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum registro encontrado.</p>
                ) : (
                    filteredRefeicoes.map(refeicao => (
                         <div key={refeicao.id} className="rounded-lg border bg-card p-4 space-y-3 flex flex-col">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{refeicao.prefixo} <span className={cn("font-normal", refeicao.categoria === 'pm' ? categoriaConfig.pm.color : categoriaConfig.civil.color)}>({refeicao.categoria.toUpperCase()})</span></p>
                                    <p className="text-sm text-muted-foreground">Por: {refeicao.vigilante}</p>
                                </div>
                                <p className="text-sm text-muted-foreground">{formatDateTime(refeicao.data, refeicao.hora)}</p>
                            </div>

                             <div className="border-t pt-3 space-y-3 flex-grow">
                                {refeicao.individuos?.map((individuo) => (
                                    <div key={individuo.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <p>{individuo.nome}</p>
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{individuo.status === "presente" ? "Presente" : "Saiu"}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <span className="text-muted-foreground">Saída: {individuo.horaSaida || '-'}</span>
                                             <div className="flex items-center justify-end gap-2">
                                                {individuo.status === "presente" ? (
                                                    <Button size="xs" variant="outline" onClick={() => handleSaida(refeicao.id, individuo.id)}>Sair</Button>
                                                ) : (
                                                    <Button size="xs" variant="outline" onClick={() => handleReEntry(refeicao, individuo)}>Nova Entrada</Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-3 flex items-center justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(refeicao)}>Editar Grupo</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(refeicao)} className="text-destructive">Excluir Grupo</DropdownMenuItem>
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
                        <th className="px-4 py-3 font-medium">Nome</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Entrada</th>
                        <th className="px-4 py-3 font-medium">Saída</th>
                        <th className="px-4 py-3 font-medium">Prefixo</th>
                        <th className="px-4 py-3 font-medium">Categoria</th>
                        <th className="px-4 py-3 font-medium">Vigilante</th>
                        <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredRefeicoes.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                        ) : (
                        filteredRefeicoes.map(refeicao =>
                            refeicao.individuos?.map((individuo, indIndex) => (
                            <tr key={individuo.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3 font-medium">{individuo.nome}</td>
                                <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")}>{individuo.status === "presente" ? "Presente" : "Saiu"}</span></td>
                                <td className="px-4 py-3 tabular-nums text-muted-foreground">{indIndex === 0 ? formatDateTime(refeicao.data, refeicao.hora) : ''}</td>
                                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                    {individuo.status === 'presente' ? (
                                        <Button size="xs" variant="outline" onClick={() => handleSaida(refeicao.id, individuo.id)}>Sair</Button>
                                    ) : individuo.horaSaida ? (
                                        <div className="flex items-center gap-2">
                                        <span>{individuo.horaSaida}</span>
                                        <Button size="xs" variant="outline" onClick={() => handleReEntry(refeicao, individuo)}><LogIn className="h-3 w-3 mr-1" />Nova Entrada</Button>
                                        </div>
                                    ) : '-'}
                                </td>
                                {indIndex === 0 ? (
                                <>
                                    <td rowSpan={refeicao.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{refeicao.prefixo}</td>
                                    <td rowSpan={refeicao.individuos.length} className="px-4 py-3 align-top"><span className={cn("font-semibold", refeicao.categoria === 'pm' ? categoriaConfig.pm.color : categoriaConfig.civil.color)}>{refeicao.categoria.toUpperCase()}</span></td>
                                    <td rowSpan={refeicao.individuos.length} className="px-4 py-3 text-muted-foreground align-top">{refeicao.vigilante}</td>
                                    <td rowSpan={refeicao.individuos.length} className="px-4 py-3 text-right align-top">
                                        <div className="flex items-center justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(refeicao)}><FilePenLine className="mr-2 h-4 w-4" />Editar Grupo</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(refeicao)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Grupo</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </>
                                ) : null}
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
