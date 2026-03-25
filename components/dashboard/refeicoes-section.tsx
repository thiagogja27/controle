'use client'

import { useState, useEffect, useMemo } from "react"
import { LogIn, LogOut, Plus, Search, Shield, Users, Loader2, FilePenLine, Trash2, X, MoreVertical, XCircle, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type RefeicaoPolicial as RefeicaoPolicialType, type IndividuoRefeicao } from "@/lib/store"
import { useRefeicoes } from "@/hooks/use-firebase"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { addToOutbox } from "@/utils/db"
import { cn } from "@/lib/utils"

// ... (o resto do código permanece o mesmo até a função RefeicoesSection)

const categoriaConfig = {
  pm: { label: "PM", icon: Shield, color: "text-blue-400", bg: "bg-blue-400/10" },
  civil: { label: "Civil", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10" },
}

const initialFormState: Omit<RefeicaoPolicialType, "id"> = {
  individuos: [{ id: `new-${Date.now()}`, nome: "", status: "presente", dataSaida: "", horaSaida: "" }],
  prefixo: "",
  categoria: "pm",
  vigilante: "",
  data: "",
  hora: "",
}

export type OldRefeicaoPolicial = Omit<RefeicaoPolicialType, 'individuos'> & { nome?: string; status?: 'presente' | 'saiu', dataSaida?: string, horaSaida?: string, data?: any };
export type RefeicaoPolicial = RefeicaoPolicialType;

export function RefeicoesSection() {
  const { data: rawRefeicoes, loading, addItem, updateItem, deleteItem } = useRefeicoes()
  const isOnline = useOnlineStatus();
  
  const refeicoes = useMemo(() => {
    const transformed = (rawRefeicoes as Array<OldRefeicaoPolicial | RefeicaoPolicial>).map(r => {
      let dataString = r.data;
      if (typeof r.data === 'object' && r.data !== null && 'toDate' in r.data) {
        dataString = r.data.toDate().toISOString().split('T')[0];
      } else if (typeof r.data === 'string' && r.data.includes('T')) {
        dataString = r.data.split('T')[0];
      }

      if ('individuos' in r && Array.isArray(r.individuos)) {
        return { ...r, data: dataString } as RefeicaoPolicial;
      }
      
      const oldRecord = r as OldRefeicaoPolicial;
      const { nome, status, dataSaida, horaSaida, ...rest } = oldRecord;

      return {
        ...rest,
        data: dataString,
        individuos: [{
          id: oldRecord.id,
          nome: nome || 'Nome não registrado',
          status: status || "presente",
          dataSaida: dataSaida || "",
          horaSaida: horaSaida || "",
        }]
      } as RefeicaoPolicial;
    });

    const seen = new Set();
    return transformed.filter(refeicao => {
      if (seen.has(refeicao.id)) {
        console.warn("Duplicate refeicao.id found:", refeicao.id);
        return false;
      }
      seen.add(refeicao.id);
      return true;
    });
  }, [rawRefeicoes]);

  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedRefeicao, setSelectedRefeicao] = useState<RefeicaoPolicial | null>(null)
  const [formState, setFormState] = useState(initialFormState)

  useEffect(() => {
    if (isFormOpen && selectedRefeicao) {
        setFormState({
          ...selectedRefeicao,
          individuos: selectedRefeicao.individuos.map(ind => ({ ...ind, dataSaida: ind.dataSaida || "", horaSaida: ind.horaSaida || "" })),
        })
    }
  }, [isFormOpen, selectedRefeicao])

  const filteredRefeicoes = refeicoes.filter(r => {
    const searchLower = search.toLowerCase().trim();
    const textMatch = !searchLower || (
      (r.prefixo && r.prefixo.toLowerCase().includes(searchLower)) ||
      (r.vigilante && r.vigilante.toLowerCase().includes(searchLower)) ||
      r.individuos?.some(i => i.nome.toLowerCase().includes(searchLower))
    );

    const dateMatch = (() => {
        if (!dataInicio && !dataFim) {
            if (searchLower) {
                return true;
            }
            const today = new Date().toISOString().split('T')[0];
            const entryDateIsToday = r.data === today;
            const exitDateIsToday = r.individuos?.some(ind => ind.dataSaida === today);
            return entryDateIsToday || exitDateIsToday;
        }
        const entrada = r.data;
        const afterStart = dataInicio ? entrada >= dataInicio : true;
        const beforeEnd = dataFim ? entrada <= dataFim : true;
        return afterStart && beforeEnd;
    })();

    return textMatch && dateMatch;
  });

  const allIndividuos = filteredRefeicoes.flatMap(r => r.individuos?.map(i => ({ ...i, categoria: r.categoria })) || [])
  const totalPM = allIndividuos.filter(i => i.categoria === "pm").length
  const totalCivil = allIndividuos.filter(i => i.categoria === "civil").length

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
  }

  const handleCategoryChange = (categoria: "pm" | "civil") => {
    setFormState(prev => ({ ...prev, categoria }))
  }
  
  const handleIndividuoChange = (index: number, field: keyof Omit<IndividuoRefeicao, 'id'>, value: string) => {
    const newIndividuos = [...formState.individuos];
    (newIndividuos[index] as any)[field] = value;
    setFormState(prev => ({ ...prev, individuos: newIndividuos }));
  }

  const addIndividuo = () => {
    setFormState(prev => ({
      ...prev,
      individuos: [...prev.individuos, { id: `new-${Date.now()}`, nome: "", status: "presente", dataSaida: "", horaSaida: "" }],
    }))
  }

  const removeIndividuo = (index: number) => {
    if (formState.individuos.length > 1) {
      setFormState(prev => ({ ...prev, individuos: prev.individuos.filter((_, i) => i !== index) }))
    }
  }

  const handleAddNew = () => {
    setSelectedRefeicao(null)
    const now = new Date();
    setFormState({
      ...initialFormState,
      data: now.toISOString().split("T")[0],
      hora: now.toTimeString().slice(0, 5),
      individuos: [{ id: `new-${Date.now()}`, nome: "", status: "presente", dataSaida: "", horaSaida: "" }],
    }); 
    setIsFormOpen(true)
  }

  const handleEdit = (refeicao: RefeicaoPolicial) => {
    if (!isOnline) {
      toast.error("Funcionalidade desabilitada em modo offline.");
      return;
    }
    setSelectedRefeicao(refeicao)
    setIsFormOpen(true)
  }

  const handleDelete = (refeicao: RefeicaoPolicial) => {
    if (!isOnline) {
      toast.error("Funcionalidade desabilitada em modo offline.");
      return;
    }
    setSelectedRefeicao(refeicao)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedRefeicao || !isOnline) return
    setIsSaving(true)
    try {
      await deleteItem(selectedRefeicao.id)
      toast.success("Registro excluído com sucesso!")
      setIsDeleteConfirmOpen(false)
      setSelectedRefeicao(null)
    } catch (error) {
      console.error("Erro ao excluir refeição:", error)
      toast.error("Erro ao excluir o registro.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true);

    const individuosToSave: IndividuoRefeicao[] = formState.individuos
        .filter(ind => ind.nome.trim() !== "")
        .map((ind): IndividuoRefeicao => {
            const status: "presente" | "saiu" = (ind.horaSaida && ind.dataSaida) ? 'saiu' : 'presente';
            if (status === "presente") {
                return {
                    ...ind,
                    status: "presente",
                    horaSaida: "",
                    dataSaida: "",
                };
            } else {
                return {
                    ...ind,
                    status: "saiu",
                };
            }
        });

    if (individuosToSave.length === 0 || !formState.vigilante.trim()) {
        toast.warning("Preencha o nome do policial e do vigilante.")
        setIsSaving(false);
        return;
    }

    const dataToSave = { ...formState, individuos: individuosToSave };

    if (!isOnline) {
        if (selectedRefeicao) {
            toast.error("Não é possível editar registros existentes enquanto estiver offline.");
            setIsSaving(false);
            return;
        }

        try {
            const tempId = uuidv4();
            const entry: Omit<RefeicaoPolicial, "id"> = {
                ...dataToSave,
                individuos: dataToSave.individuos.map(ind => ({
                    ...ind,
                    id: ind.id.startsWith('new-') ? `ind-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}` : ind.id
                })),
            };
            await addToOutbox({ 
                id: tempId, 
                tableName: 'refeicoes', 
                data: entry,
                action: 'create'
            });
            
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(swRegistration => {
                    return swRegistration.sync.register('sync-new-items');
                });
            }

            toast.success("Salvo com sucesso no navegador! O registro será sincronizado assim que a conexão for restaurada.");
            setIsFormOpen(false);
        } catch (error) {
            console.error("Erro ao salvar offline:", error);
            toast.error("Ocorreu um erro ao salvar o registro localmente.");
        } finally {
            setIsSaving(false);
        }
        return;
    }

    try {
        if (selectedRefeicao) {
            const { nome, status, horaSaida, dataSaida, ...restOfData } = dataToSave as any;
            await updateItem(selectedRefeicao.id, { ...restOfData, individuos: dataToSave.individuos });
            toast.success("Refeição atualizada com sucesso!");
        } else {
            const entry: Omit<RefeicaoPolicial, "id"> = {
                ...dataToSave,
                individuos: dataToSave.individuos.map(ind => ({
                    ...ind,
                    id: ind.id.startsWith('new-') ? `ind-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}` : ind.id
                })),
            };
            await addItem(entry);
            toast.success("Refeição registrada com sucesso!");
        }
        setIsFormOpen(false);
    } catch (error) {
        console.error("Erro ao salvar refeição:", error);
        toast.error("Ocorreu um erro ao salvar a refeição.");
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleSaida = async (refeicaoId: string, individuoId: string) => {
    const now = new Date();
    const saidaData = { 
        status: "saiu" as const, 
        dataSaida: now.toISOString().split("T")[0], 
        horaSaida: now.toTimeString().slice(0, 5) 
    };

    const refeicao = refeicoes.find(r => r.id === refeicaoId);
    if (!refeicao || !refeicao.individuos) return;

    try {
      if (!isOnline) {
        // Find existing individuals and update the specific one
        const updatedIndividuos = refeicao.individuos.map(ind =>
          ind.id === individuoId ? { ...ind, ...saidaData } : ind
        );

        await addToOutbox({ 
          id: uuidv4(), 
          tableName: 'refeicoes', 
          action: 'update',
          originalId: refeicaoId,
          data: { individuos: updatedIndividuos } 
        });

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
        }
        toast.success("Saída salva com sucesso no navegador! Será sincronizada quando a conexão for restaurada.");
        return;
      }

      const updatedIndividuos = refeicao.individuos.map(ind =>
        ind.id === individuoId ? { ...ind, ...saidaData } : ind
      );
      await updateItem(refeicaoId, { individuos: updatedIndividuos });
      toast.success("Saída registrada com sucesso!")
    } catch (error) {
      console.error("Erro ao registrar saída do indivíduo:", error);
      toast.error("Erro ao registrar a saída.")
    }
  };
  
  const handleReEntry = (refeicao: RefeicaoPolicial, individuo: IndividuoRefeicao) => {
    setSelectedRefeicao(null);
    const now = new Date();
    
    const { individuos, id, ...restOfRefeicao } = refeicao;

    setFormState({
      ...restOfRefeicao,
      data: now.toISOString().split("T")[0],
      hora: now.toTimeString().slice(0, 5),
      individuos: [{
          id: `new-${Date.now()}`,
          nome: individuo.nome, 
          status: "presente",
          dataSaida: "",
          horaSaida: "",
      }],
    });
    setIsFormOpen(true);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    if(!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  }

  const formatDateTime = (data: string | undefined, hora: string) => {
    if (!data || !hora) return "";
    return `${formatDate(data)} ${hora}`;
  }

  const isFormValid = 
    formState.individuos.some(i => i.nome.trim() !== "") &&
    formState.prefixo.trim() !== "" && 
    formState.vigilante.trim() !== "" &&
    formState.data.trim() !== "" && 
    formState.hora.trim() !== "";

    const saveButtonDisabled = isSaving || !isFormValid || (!isOnline && !!selectedRefeicao);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <TooltipProvider>
    <div className="space-y-4 md:space-y-6">
      {/* ... (código do header e stats inalterado) ... */}
       <div className="grid gap-4 sm:grid-cols-2">
        {(["pm", "civil"] as const).map(cat => {
          const { label, icon: Icon, color, bg } = categoriaConfig[cat]
          const count = cat === "pm" ? totalPM : totalCivil
          return (
            <Card key={cat}><CardContent className="flex items-center gap-4 p-4"><div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bg)}><Icon className={cn("h-6 w-6", color)} /></div><div><p className="text-2xl font-bold">{count}</p><p className="text-sm text-muted-foreground">Total {label}</p></div></CardContent></Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                <div className="lg:col-span-1 grid gap-2">
                    <Label htmlFor="search">Busca</Label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="search" placeholder="Buscar por nome, prefixo..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dataInicio">Data Início</Label>
                    <Input id="dataInicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="dataFim">Data Fim</Label>
                    <Input id="dataFim" type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                </div>
                <div className="flex gap-2 md:col-span-3 lg:col-span-2">
                      <Button variant="outline" onClick={() => { setDataInicio(""); setDataFim(""); }} className="w-1/2"><XCircle className="mr-2 h-4 w-4"/>Limpar</Button>
                    <Button onClick={handleAddNew} className="w-1/2"><Plus className="mr-2 h-4 w-4" />Registrar Refeição</Button>
                </div>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) setFormState(initialFormState); setIsFormOpen(isOpen); }}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">              
              {selectedRefeicao ? "Editar Refeição" : "Registrar Refeição"}
              {!isOnline && <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"><WifiOff className="h-3 w-3"/>Offline</span>}
            </DialogTitle>
          </DialogHeader>
           <div className="max-h-[80vh] overflow-y-auto p-1">
                <div className="grid gap-5 py-4">
                    {/* ... (conteúdo do formulário inalterado) ... */}
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
                        <div className="grid gap-2"><Label htmlFor="data">Data Entrada</Label><Input id="data" type="date" value={formState.data} onChange={handleInputChange} /></div>
                        <div className="grid gap-2"><Label htmlFor="hora">Hora Entrada</Label><Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} /></div>
                        <div className="grid gap-3 sm:col-span-2"><Label>Categoria</Label><div className="grid grid-cols-2 gap-3"><div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-pm" checked={formState.categoria === "pm"} onCheckedChange={() => handleCategoryChange("pm")} /><Label htmlFor="cat-pm" className="flex cursor-pointer items-center gap-2 font-normal"><Shield className="h-4 w-4 text-blue-400" />PM</Label></div><div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"><Checkbox id="cat-civil" checked={formState.categoria === "civil"} onCheckedChange={() => handleCategoryChange("civil")} /><Label htmlFor="cat-civil" className="flex cursor-pointer items-center gap-2 font-normal"><Users className="h-4 w-4 text-amber-400" />Civil</Label></div></div></div>
                    </div>
                    
                    {selectedRefeicao && (
                         <div className="rounded-lg border bg-secondary/30 p-4 mt-2">
                            <Label className="mb-3 block">Controle de Saída dos Policiais</Label>
                            <div className="space-y-4">
                            {formState.individuos.map((ind, index) => (
                                <div key={ind.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                                <div className="sm:col-span-1">
                                    <Label htmlFor={`nome-saida-${index}`} className="text-xs text-muted-foreground">Nome</Label>
                                    <Input id={`nome-saida-${index}`} value={ind.nome} disabled />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`data-saida-${index}`} className="text-xs text-muted-foreground">Data Saída</Label>
                                    <Input id={`data-saida-${index}`} type="date" value={ind.dataSaida || ""} onChange={e => handleIndividuoChange(index, 'dataSaida', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`hora-saida-${index}`} className="text-xs text-muted-foreground">Hora Saída</Label>
                                    <Input id={`hora-saida-${index}`} type="time" value={ind.horaSaida || ""} onChange={e => handleIndividuoChange(index, 'horaSaida', e.target.value)} />
                                </div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
           </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div style={{ display: 'inline-block' }}>
                      <Button onClick={handleSave} disabled={saveButtonDisabled}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {selectedRefeicao ? "Salvar Alterações" : "Registrar"}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {saveButtonDisabled && !isFormValid && <TooltipContent>Preencha todos os campos obrigatórios.</TooltipContent>}
                  {saveButtonDisabled && !isOnline && selectedRefeicao && <TooltipContent>A edição está desabilitada em modo offline.</TooltipContent>}
                </Tooltip>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza de que deseja excluir este registro? Todos os policiais associados serão removidos. Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving || !isOnline}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Histórico de Refeições</CardTitle></CardHeader>
        <CardContent>
          {/* ... (tabela e layout de cartões inalterados) ... */}
           <div className="grid grid-cols-1 md:col-span-2 gap-4 lg:hidden">
                 {filteredRefeicoes.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum registro encontrado para os filtros aplicados.</p>
                ) : (
                    filteredRefeicoes.map((refeicao, index) => (
                         <div key={`${refeicao.id}-${index}`} className="rounded-lg border bg-card p-4 space-y-3 flex flex-col">
                           <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{refeicao.prefixo} <span className={cn("font-normal", refeicao.categoria === 'pm' ? categoriaConfig.pm.color : categoriaConfig.civil.color)}>({refeicao.categoria.toUpperCase()})</span></p>
                                    <p className="text-sm text-muted-foreground">Por: {refeicao.vigilante}</p>
                                </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <p className="text-sm text-muted-foreground">{formatDateTime(refeicao.data, refeicao.hora)}</p>
                                    {(refeicao as any).isOffline && <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 animate-pulse"><WifiOff className="mr-1 h-3 w-3" /> Sincronizando...</span>}
                                </div>
                            </div>

                             <div className="border-t pt-3 space-y-3 flex-grow">
                                {refeicao.individuos?.map((individuo, i) => (
                                    <div key={`${individuo.id}-${i}`} className="border-b pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <p>{individuo.nome}</p>
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{individuo.status === "presente" ? "Presente" : "Saiu"}</span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            {individuo.status === "presente" ? (
                                                <Button size="sm" variant="outline" onClick={() => handleSaida(refeicao.id, individuo.id)}>Sair</Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleReEntry(refeicao, individuo)}>Nova Entrada</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-3 flex items-center justify-end">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(refeicao)} disabled={!isOnline}>Editar Grupo</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(refeicao)} className="text-destructive" disabled={!isOnline}>Excluir Grupo</DropdownMenuItem>
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
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</td></tr>
                        ) : (
                        filteredRefeicoes.flatMap((refeicao, refeicaoIndex) =>
                            refeicao.individuos?.map((individuo, individuoIndex) => (
                            <tr key={`${refeicao.id}-${individuo.id}-${refeicaoIndex}-${individuoIndex}`} className="hover:bg-muted/50">
                                <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                        {individuo.nome}
                                        {(refeicao as any).isOffline && <Tooltip><TooltipTrigger><WifiOff className="h-3 w-3 text-amber-500 animate-pulse" /></TooltipTrigger><TooltipContent>Aguardando conexão para sincronizar grupo</TooltipContent></Tooltip>}
                                    </div>
                                </td>
                                <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")}>{individuo.status === "presente" ? "Presente" : "Saiu"}</span></td>
                                <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatDateTime(refeicao.data, refeicao.hora)}</td>
                                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                    {individuo.status === 'presente' ? (
                                        <Button size="sm" variant="outline" onClick={() => handleSaida(refeicao.id, individuo.id)}>Sair</Button>
                                    ) : individuo.horaSaida ? (
                                        <div className="flex items-center gap-2">
                                        <span>{formatDateTime(individuo.dataSaida || refeicao.data, individuo.horaSaida)}</span>
                                        <Button size="sm" variant="outline" onClick={() => handleReEntry(refeicao, individuo)}><LogIn className="h-3 w-3 mr-1" />Nova Entrada</Button>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{refeicao.prefixo}</td>
                                <td className="px-4 py-3"><span className={cn("font-semibold", refeicao.categoria === 'pm' ? categoriaConfig.pm.color : categoriaConfig.civil.color)}>{refeicao.categoria.toUpperCase()}</span></td>
                                <td className="px-4 py-3 text-muted-foreground">{refeicao.vigilante}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isOnline}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(refeicao)}><FilePenLine className="mr-2 h-4 w-4" />Editar Grupo</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(refeicao)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Excluir Grupo</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </td>
                            </tr>
                            )) ?? []
                        )
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
