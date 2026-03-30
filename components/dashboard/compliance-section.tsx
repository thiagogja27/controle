'use client'

import { useState, useEffect, forwardRef } from "react"
import { Plus, Search, Loader2, MoreVertical, Trash2, AlertTriangle } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type OcorrenciaCompliance } from "@/lib/store"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"
import { IMaskInput } from 'react-imask';

const ForwardedInput: any = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { as, ...rest } = props;
    return <Input ref={ref} {...rest} />;
});
ForwardedInput.displayName = 'ForwardedInput';

// Adjusted to match the OcorrenciaCompliance interface from store.ts
const initialFormState: Omit<OcorrenciaCompliance, "id" | "registradoPor"> = {
  nomeIndividuo: "",
  documentoIndividuo: "",
  dataOcorrencia: "",
  motivo: "",
  isCritical: false,
}

export function ComplianceSection() {
  const { data: ocorrencias, loading, addItem, updateItem, deleteItem } = useOcorrenciasCompliance()
  const { user } = useAuth();
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<OcorrenciaCompliance | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    if (isFormOpen && selectedOcorrencia) {
      // Ensure all fields from the selected item are populated, including isCritical
      setFormState({
        nomeIndividuo: selectedOcorrencia.nomeIndividuo,
        documentoIndividuo: selectedOcorrencia.documentoIndividuo,
        dataOcorrencia: selectedOcorrencia.dataOcorrencia,
        motivo: selectedOcorrencia.motivo,
        isCritical: selectedOcorrencia.isCritical || false, // Default to false if undefined
      })
    } else {
      // Reset form to its initial state when closing or adding new
      setFormState(initialFormState)
    }
  }, [isFormOpen, selectedOcorrencia])

  const filteredOcorrencias = ocorrencias.filter(o => 
    o.nomeIndividuo.toLowerCase().includes(search.toLowerCase()) ||
    o.documentoIndividuo.includes(search)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormState(prev => ({ ...prev, isCritical: checked }))
  }

  const handleMaskedInputChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

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
      toast.success("Ocorrência excluída com sucesso!");
      setIsDeleteConfirmOpen(false)
      setSelectedOcorrencia(null)
    } catch (error) {
      console.error("Erro ao excluir ocorrência:", error)
      toast.error("Falha ao excluir a ocorrência.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    const unmaskedDoc = formState.documentoIndividuo.replace(/\D/g, '');
    if (!formState.nomeIndividuo || !unmaskedDoc || unmaskedDoc.length < 11 || !formState.motivo) {
        toast.warning("Por favor, preencha todos os campos obrigatórios: Nome, Documento (CPF válido) e Motivo.");
        return;
    }

    setIsSaving(true)
    try {
        const dataToSave: Omit<OcorrenciaCompliance, 'id'> = {
            ...formState, 
            registradoPor: user?.email || "sistema", // Capture user email
        };

        if (selectedOcorrencia) {
            await updateItem(selectedOcorrencia.id, dataToSave);
            toast.success("Ocorrência atualizada com sucesso!");
        } else {
            await addItem(dataToSave);
            toast.success("Ocorrência registrada com sucesso!");
        }

        setIsFormOpen(false)
        setSelectedOcorrencia(null)
    } catch (error) {
        console.error("Erro ao salvar ocorrência:", error)
        toast.error("Falha ao salvar a ocorrência.")
    } finally {
        setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}/${month}/${year}`;
  }

  return (
    <TooltipProvider>
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

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selectedOcorrencia ? "Editar Ocorrência" : "Registrar Nova Ocorrência"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="nomeIndividuo">Nome do Indivíduo</Label><Input id="nomeIndividuo" value={formState.nomeIndividuo} onChange={handleInputChange} /></div>
                 <div className="grid gap-2">
                  <Label htmlFor="documentoIndividuo">Documento (CPF)</Label>
                  <IMaskInput
                    mask="000.000.000-00"
                    id="documentoIndividuo"
                    value={formState.documentoIndividuo}
                    onAccept={(value) => handleMaskedInputChange('documentoIndividuo', value as string)}
                    as={ForwardedInput as any}
                    placeholder="___.___.___-__"
                  />
                </div>
                <div className="grid gap-2"><Label htmlFor="dataOcorrencia">Data da Ocorrência</Label><Input id="dataOcorrencia" type="date" value={formState.dataOcorrencia} onChange={handleInputChange} /></div>
                <div className="grid gap-2"><Label htmlFor="motivo">Motivo</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} /></div>
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                  <Checkbox id="isCritical" checked={formState.isCritical} onCheckedChange={handleCheckboxChange} />
                  <Label htmlFor="isCritical" className="font-bold text-destructive">Marcar como Alerta Crítico (Bloqueia o Registro)</Label>
                </div>
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
                      <tr key={o.id} className={o.isCritical ? 'bg-destructive/10 hover:bg-destructive/20' : 'hover:bg-muted/50'}>
                        <td className="px-4 py-3 font-medium">
                          <div className="flex items-center gap-2">
                              {o.isCritical && <Tooltip><TooltipTrigger><AlertTriangle className="h-4 w-4 text-destructive" /></TooltipTrigger><TooltipContent>Este é um alerta crítico.</TooltipContent></Tooltip>}
                              {o.nomeIndividuo}
                          </div>
                        </td>
                        <td className="px-4 py-3">{o.documentoIndividuo}</td>
                        <td className="px-4 py-3">{formatDate(o.dataOcorrencia)}</td>
                        <td className="px-4 py-3">{o.motivo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{o.registradoPor}</td>
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
    </TooltipProvider>
  )
}
