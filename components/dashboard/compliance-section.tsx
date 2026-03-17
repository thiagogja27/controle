'use client'

import { useState, useEffect } from "react"
import { Plus, Search, Loader2, FilePenLine, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Label } from "@/components/ui/label"
import { type OcorrenciaCompliance } from "@/lib/store"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
import { cn } from "@/lib/utils"

const initialFormState: Omit<OcorrenciaCompliance, "id" | "autor"> = {
  nomeIndividuo: "",
  documentoIndividuo: "",
  dataOcorrencia: "",
  motivo: "",
  descricao: "",
}

export function ComplianceSection() {
  const { data: ocorrencias, loading, addItem, updateItem, deleteItem } = useOcorrenciasCompliance()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<OcorrenciaCompliance | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    if (isFormOpen && selectedOcorrencia) {
      setFormState(selectedOcorrencia)
    } else {
      setFormState(initialFormState)
    }
  }, [isFormOpen, selectedOcorrencia])

  const filteredOcorrencias = ocorrencias.filter(o => 
    o.nomeIndividuo.toLowerCase().includes(search.toLowerCase()) ||
    o.documentoIndividuo.includes(search)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleAddNew = () => {
    setSelectedOcorrencia(null)
    const now = new Date();
    setFormState({
      ...initialFormState,
      dataOcorrencia: now.toISOString().split("T")[0],
    });
    setIsFormOpen(true)
  }

  const handleEdit = (ocorrencia: OcorrenciaCompliance) => {
    setSelectedOcorrencia(ocorrencia)
    setIsFormOpen(true)
  }

  const handleDelete = (ocorrencia: OcorrenciaCompliance) => {
    setSelectedOcorrencia(ocorrencia)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedOcorrencia) return
    setIsSaving(true)
    try {
      await deleteItem(selectedOcorrencia.id)
      setIsDeleteConfirmOpen(false)
      setSelectedOcorrencia(null)
    } catch (error) {
      console.error("Erro ao excluir ocorrência:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    // Basic validation
    if (!formState.nomeIndividuo || !formState.documentoIndividuo || !formState.motivo) {
        alert("Por favor, preencha todos os campos obrigatórios: Nome, Documento e Motivo.");
        return;
    }

    setIsSaving(true)
    try {
        const dataToSave = { 
            ...formState, 
            // Hardcoded author for now, should be replaced with real user data
            autor: "Compliance User" 
        };

        if (selectedOcorrencia) {
            await updateItem(selectedOcorrencia.id, dataToSave);
        } else {
            await addItem(dataToSave);
        }

        setIsFormOpen(false)
        setSelectedOcorrencia(null)
    } catch (error) {
        console.error("Erro ao salvar ocorrência:", error)
    } finally {
        setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Controle de Compliance</CardTitle>
                <Button onClick={handleAddNew}><Plus className="mr-2 h-4 w-4" /> Adicionar Ocorrência</Button>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nome ou documento..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
                </div>
            </CardContent>
        </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selectedOcorrencia ? "Editar Ocorrência" : "Registrar Nova Ocorrência"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label htmlFor="nomeIndividuo">Nome do Indivíduo</Label><Input id="nomeIndividuo" value={formState.nomeIndividuo} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="documentoIndividuo">Documento (CPF)</Label><Input id="documentoIndividuo" value={formState.documentoIndividuo} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="dataOcorrencia">Data da Ocorrência</Label><Input id="dataOcorrencia" type="date" value={formState.dataOcorrencia} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="motivo">Motivo</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="descricao">Descrição Detalhada</Label><Textarea id="descricao" value={formState.descricao} onChange={handleInputChange} /></div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedOcorrencia ? "Salvar Alterações" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir a ocorrência de "{selectedOcorrencia?.nomeIndividuo}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Occurrences List */}
      <Card>
        <CardHeader><CardTitle>Histórico de Ocorrências</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="px-4 py-3 font-medium">Indivíduo</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Data da Ocorrência</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Registrado por</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOcorrencias.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Nenhuma ocorrência encontrada.</td></tr>
                ) : (
                  filteredOcorrencias.map(o => (
                    <tr key={o.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{o.nomeIndividuo}</td>
                      <td className="px-4 py-3">{o.documentoIndividuo}</td>
                      <td className="px-4 py-3">{formatDate(o.dataOcorrencia)}</td>
                      <td className="px-4 py-3">{o.motivo}</td>
                      <td className="px-4 py-3">{o.autor}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(o)}>Editar</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDelete(o)} className="text-destructive">Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
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
