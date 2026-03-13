'use client'

import { useState, useEffect } from "react"
import { Plus, Search, UserCheck, UserX, Clock, Building2, Loader2, FilePenLine, Trash2, LogIn, MoreVertical } from "lucide-react"
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { type Visitante } from "@/lib/store"
import { useVisitantes } from "@/hooks/use-firebase"
import { cn } from "@/lib/utils"

const initialFormState: Omit<Visitante, "id" | "dataEntrada" | "status"> = {
  nome: "",
  documento: "",
  empresa: "",
  motivo: "",
  destino: "",
  notaFiscal: "",
  placa: "",
  observacoes: "",
  horaEntrada: "",
  horaSaida: "",
  diversos: false,
  rg: "",
  cnh: "",
  dataNascimento: "",
  validadeRg: "",
  validadeCnh: "",
  telefone: "",
  categoriaCnh: "",
}

const destinos = [
  "Recepção",
  "Supervisão",
  "Segurança",
  "Classificação",
  "Almoxarifado",
  "Pier TEG",
  "Pier TEAG",
  "Central de Resíduos",
  "RH",
  "Outros",
];

export function VisitantesSection() {
  const { data: visitantes, loading, addItem, updateItem, deleteItem } = useVisitantes()
  const [search, setSearch] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null)
  const [formState, setFormState] = useState(initialFormState)
  const [outroDestino, setOutroDestino] = useState("");

  const handleReEntry = (visitante: Visitante) => {
    setSelectedVisitante(null); // Ensure we are creating a new entry
    const now = new Date();
    setFormState({
        ...initialFormState,
        nome: visitante.nome,
        documento: visitante.documento,
        empresa: visitante.empresa,
        motivo: visitante.motivo,
        destino: visitante.destino,
        notaFiscal: visitante.notaFiscal || "",
        placa: visitante.placa || "",
        observacoes: visitante.observacoes || "",
        diversos: visitante.diversos || false,
        rg: visitante.rg || "",
        cnh: visitante.cnh || "",
        dataNascimento: visitante.dataNascimento || "",
        validadeRg: visitante.validadeRg || "",
        validadeCnh: visitante.validadeCnh || "",
        telefone: visitante.telefone || "",
        categoriaCnh: visitante.categoriaCnh || "",
        horaEntrada: now.toTimeString().slice(0, 5),
        horaSaida: "",
    });
    if (!destinos.includes(visitante.destino)) {
      setOutroDestino(visitante.destino);
      setFormState(prev => ({ ...prev, destino: "Outros" }));
    } else {
      setOutroDestino("");
    }
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen) {
      if (selectedVisitante) {
        const isOutro = !destinos.includes(selectedVisitante.destino);
        setFormState({
          nome: selectedVisitante.nome,
          documento: selectedVisitante.documento,
          empresa: selectedVisitante.empresa,
          motivo: selectedVisitante.motivo,
          destino: isOutro ? "Outros" : selectedVisitante.destino,
          notaFiscal: selectedVisitante.notaFiscal || "",
          placa: selectedVisitante.placa || "",
          observacoes: selectedVisitante.observacoes || "",
          diversos: selectedVisitante.diversos || false,
          rg: selectedVisitante.rg || "",
          cnh: selectedVisitante.cnh || "",
          dataNascimento: selectedVisitante.dataNascimento || "",
          validadeRg: selectedVisitante.validadeRg || "",
          validadeCnh: selectedVisitante.validadeCnh || "",
          telefone: selectedVisitante.telefone || "",
          categoriaCnh: selectedVisitante.categoriaCnh || "",
          horaEntrada: selectedVisitante.horaEntrada,
          horaSaida: selectedVisitante.horaSaida || "",
        });
        setOutroDestino(isOutro ? selectedVisitante.destino : "");
      } else if (!formState.nome) {
        const now = new Date();
        setFormState({ ...initialFormState, horaEntrada: now.toTimeString().slice(0, 5) });
        setOutroDestino("");
      }
    }
  }, [isFormOpen, selectedVisitante, formState.nome]);


  const presentes = visitantes.filter(v => v.status === "presente").length
  const sairam = visitantes.filter(v => v.status === "saiu").length

  const filteredVisitantes = visitantes.filter(
    v =>
      v.nome.toLowerCase().includes(search.toLowerCase()) ||
      v.empresa.toLowerCase().includes(search.toLowerCase()) ||
      v.documento.includes(search)
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }
  
  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    if (id === 'destino' && value !== 'Outros') {
      setOutroDestino("");
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [id]: checked }))
  }

  const handleAddNew = () => {
    setSelectedVisitante(null)
    setFormState(initialFormState) // Clear form for new entry
    setOutroDestino("");
    setIsFormOpen(true)
  }

  const handleEdit = (visitante: Visitante) => {
    setSelectedVisitante(visitante)
    setIsFormOpen(true)
  }

  const handleDelete = (visitante: Visitante) => {
    setSelectedVisitante(visitante)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedVisitante) return
    setIsSaving(true)
    try {
      await deleteItem(selectedVisitante.id)
      setIsDeleteConfirmOpen(false)
      setSelectedVisitante(null)
    } catch (error) {
      console.error("Erro ao excluir visitante:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const finalDestino = formState.destino === "Outros" ? outroDestino : formState.destino;
        if (!finalDestino.trim()) {
            // Optionally, show an error message to the user
            setIsSaving(false);
            return;
        }

        const dataToSave = { 
            ...formState, 
            destino: finalDestino, 
            status: formState.horaSaida ? "saiu" : "presente" 
        };

        if (selectedVisitante) {
            await updateItem(selectedVisitante.id, dataToSave);
        } else {
            const now = new Date();
            const newV: Omit<Visitante, "id"> = {
                ...dataToSave,
                placa: formState.placa || "N/A",
                dataEntrada: now.toISOString().split("T")[0],
                status: "presente",
                horaSaida: "",
            };
            await addItem(newV);
        }
        setIsFormOpen(false);
        setFormState(initialFormState);
        setSelectedVisitante(null);
        setOutroDestino("");
    } catch (error) {
        console.error("Erro ao salvar visitante:", error);
    } finally {
        setIsSaving(false);
    }
};


  const handleRegistrarSaida = async (id: string) => {
    try {
      await updateItem(id, {
        status: "saiu",
        horaSaida: new Date().toTimeString().slice(0, 5),
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">Presentes</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><UserX className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{sairam}</p><p className="text-sm text-muted-foreground">Saíram Hoje</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Clock className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{visitantes.length}</p><p className="text-sm text-muted-foreground">Total Hoje</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Building2 className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{new Set(visitantes.map(v => v.empresa)).size}</p><p className="text-sm text-muted-foreground">Empresas</p></div></CardContent></Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 md:grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar visitante..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]" />
        </div>
        <Button onClick={handleAddNew} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" />Registrar Entrada</Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>{selectedVisitante ? "Editar Visitante" : "Registrar Novo Visitante"}</DialogTitle></DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={formState.nome} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="documento">Documento (CPF)</Label><Input id="documento" value={formState.documento} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" value={formState.empresa} onChange={handleInputChange} /></div>
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="motivo">Motivo da Visita</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} /></div>
              
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="destino">Destino</Label>
                <Select value={formState.destino} onValueChange={(value) => handleSelectChange("destino", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {destinos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {formState.destino === "Outros" && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="outroDestino">Especifique o Destino</Label>
                  <Input id="outroDestino" value={outroDestino} onChange={(e) => setOutroDestino(e.target.value)} />
                </div>
              )}

              <div className="grid gap-2"><Label htmlFor="notaFiscal">Nota Fiscal</Label><Input id="notaFiscal" value={formState.notaFiscal || ""} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="placa">Placa</Label><Input id="placa" placeholder="N/A se não houver" value={formState.placa || ""} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="horaEntrada">Hora Entrada</Label><Input id="horaEntrada" type="time" value={formState.horaEntrada} onChange={handleInputChange} /></div>
              {selectedVisitante && <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida || ""} onChange={handleInputChange} /></div>}
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" value={formState.observacoes || ""} onChange={handleInputChange} /></div>
              <div className="flex items-center space-x-2 sm:col-span-2"><Checkbox id="diversos" checked={formState.diversos} onCheckedChange={(checked) => handleCheckboxChange("diversos", checked as boolean)} /><Label htmlFor="diversos">Diversos</Label></div>
              
              {formState.diversos && (
                <>
                  <div className="grid gap-2"><Label htmlFor="rg">RG</Label><Input id="rg" value={formState.rg || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="validadeRg">Validade RG</Label><Input id="validadeRg" type="date" value={formState.validadeRg || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="cnh">CNH</Label><Input id="cnh" value={formState.cnh || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="validadeCnh">Validade CNH</Label><Input id="validadeCnh" type="date" value={formState.validadeCnh || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="categoriaCnh">Categoria CNH</Label><Input id="categoriaCnh" value={formState.categoriaCnh || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formState.dataNascimento || ""} onChange={handleInputChange} /></div>
                  <div className="grid gap-2"><Label htmlFor="telefone">Telefone</Label><Input id="telefone" value={formState.telefone || ""} onChange={handleInputChange} /></div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedVisitante ? "Salvar Alterações" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir o registro de "{selectedVisitante?.nome}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Visitors List */}
      <Card>
        <CardHeader><CardTitle>Visitantes de Hoje</CardTitle></CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {filteredVisitantes.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum visitante registrado.</p>
                ) : (
                    filteredVisitantes.map(v => (
                        <div key={v.id} className="rounded-lg border bg-card p-4 space-y-3 flex flex-col">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{v.nome}</p>
                                    <p className="text-sm text-muted-foreground">{v.empresa}</p>
                                </div>
                                 <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", v.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{v.status === "presente" ? "Presente" : "Saiu"}</span>
                            </div>
                             <div className="border-t pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                                <div className="flex flex-col"><span className="text-muted-foreground">Documento</span><span>{v.documento}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Destino</span><span>{v.destino}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Entrada</span><span>{v.horaEntrada}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Saída</span><span>{v.horaSaida || '-'}</span></div>
                                {v.placa && <div className="flex flex-col"><span className="text-muted-foreground">Placa</span><span>{v.placa}</span></div>}
                                {v.notaFiscal && <div className="flex flex-col"><span className="text-muted-foreground">Nota Fiscal</span><span>{v.notaFiscal}</span></div>}
                             </div>
                             {v.observacoes && <div className="border-t pt-3 text-sm flex-grow"><p className="text-muted-foreground">Observações</p><p>{v.observacoes}</p></div>}
                             <div className="border-t pt-3 flex items-center justify-end gap-2">
                                {v.status === "presente" ? (
                                    <Button size="sm" variant="outline" onClick={() => handleRegistrarSaida(v.id)}>Sair</Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleReEntry(v)}>Nova Entrada</Button>
                                )}
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(v)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(v)} className="text-destructive">Excluir</DropdownMenuItem>
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
                  <th className="px-4 py-3 font-medium">Visitante</th>
                  <th className="px-4 py-3 font-medium">Documento</th>
                  <th className="px-4 py-3 font-medium">Empresa</th>
                  <th className="px-4 py-3 font-medium">Motivo</th>
                  <th className="px-4 py-3 font-medium">Destino</th>
                  <th className="px-4 py-3 font-medium">Placa</th>
                  <th className="px-4 py-3 font-medium">Nota Fiscal</th>
                  <th className="px-4 py-3 font-medium">Observações</th>
                  <th className="px-4 py-3 font-medium">Diversos</th>
                  <th className="px-4 py-3 font-medium">Data & Hora</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredVisitantes.length === 0 ? (
                  <tr><td colSpan={12} className="py-8 text-center text-muted-foreground">Nenhum visitante registrado.</td></tr>
                ) : (
                  filteredVisitantes.map(v => (
                    <tr key={v.id}>
                      <td className="px-4 py-3 font-medium">{v.nome}</td>
                      <td className="px-4 py-3">{v.documento}</td>
                      <td className="px-4 py-3">{v.empresa}</td>
                      <td className="px-4 py-3">{v.motivo}</td>
                      <td className="px-4 py-3">{v.destino}</td>
                      <td className="px-4 py-3">{v.placa}</td>
                      <td className="px-4 py-3">{v.notaFiscal}</td>
                      <td className="px-4 py-3">{v.observacoes}</td>
                      <td className="px-4 py-3">{v.diversos ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3"><div className="text-xs">{new Date(v.dataEntrada + 'T00:00:00-03:00').toLocaleDateString('pt-BR')}</div><div><span className="font-medium">Ent:</span> {v.horaEntrada}</div><div><span className="font-medium">Saí:</span> {v.horaSaida || "-"}</div></td>
                      <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", v.status === "presente" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")}>{v.status === "presente" ? "Presente" : "Saiu"}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {v.status === "presente" ? (
                            <Button size="sm" variant="outline" onClick={() => handleRegistrarSaida(v.id)} className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Sair</span></Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleReEntry(v)} className="flex items-center gap-2"><LogIn className="h-4 w-4" /><span>Nova Entrada</span></Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(v)}><FilePenLine className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v)} className="text-destructive hover:text-destructive/90"><Trash2 className="h-4 w-4" /></Button>
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
