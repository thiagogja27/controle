'use client'

import { useState, useEffect, useMemo, forwardRef, useCallback } from "react"
import { LogIn, LogOut, Plus, Search, Ship, Users, Loader2, FilePenLine, Trash2, MoreVertical, XCircle, ShieldCheck, ShieldAlert, WifiOff, AlertTriangle, LandPlot, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type Tpa, type OcorrenciaCompliance } from "@/lib/store"
import { useTPAs } from "@/hooks/use-firebase"
import { useComplianceCheck } from "@/hooks/use-compliance-check"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { addToOutbox } from "@/utils/db"
import { v4 as uuidv4 } from 'uuid'
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { IMaskInput } from 'react-imask';

const ForwardedInput: any = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { as, ...rest } = props;
    return <Input ref={ref} {...rest} />;
});
ForwardedInput.displayName = 'ForwardedInput';

const initialFormState: Omit<Tpa, "id" | "status"> = {
  nome: "",
  funcao: "",
  documento: "",
  observacao: "",
  dataEmissao: "",
  dataValidade: "",
  tipo: "isps",
}

const funcoes = [
  "Rechego",
  "Contramestre geral",
  "Contramestre de porão",
  "Contramestre do rechego",
  "Operador de grabe",
  "Tripper",
  "Operador de shiploader",
  "Vigia"
];

const credencialConfig = {
    verde: { text: "Permissão de acesso ao navio", icon: ShieldCheck, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    azul: { text: "Acesso restrito à área administrativa", icon: null, className: "" },
};

type Shift = "todos" | "07-13" | "13-19" | "19-01" | "01-07";

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  if(!year || !month || !day) return "";
  return `${day}/${month}/${year}`;
}

export function TPAsSection() {
  const { data: registros, loading, addItem, updateItem, deleteItem } = useTPAs()
  const { checkCompliance } = useComplianceCheck();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [activeShift, setActiveShift] = useState<Shift>("todos");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedTPA, setSelectedTPA] = useState<Tpa | null>(null)
  const [isReEntryMode, setIsReEntryMode] = useState(false);
  const [formState, setFormState] = useState(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [complianceAlert, setComplianceAlert] = useState<OcorrenciaCompliance | null>(null);

  const activeTpaDocuments = useMemo(() => {
    const activeDocs = new Set<string>();
    registros.forEach(r => {
        if (r && r.status === "ativo" && r.documento) {
            activeDocs.add(r.documento.replace(/\D/g, ''));
        }
    });
    return activeDocs;
  }, [registros]);

  const allTpaDocuments = useMemo(() => {
      const docs = new Set<string>();
      registros.forEach(r => {
          if (r && r.documento) {
              docs.add(r.documento.replace(/\D/g, ''));
          }
      });
      return docs;
  }, [registros]);

  const handleComplianceCheck = (documento: string) => {
      const result = checkCompliance(documento);
      setComplianceAlert(result.ocorrencia || null);
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formState.funcao.trim()) newErrors.funcao = "Função é obrigatória";
    if (!formState.dataEmissao.trim()) newErrors.dataEmissao = "Data de emissão é obrigatória";
    if (!formState.dataValidade.trim()) newErrors.dataValidade = "Data de validade é obrigatória";
    if (!formState.tipo.trim()) newErrors.tipo = "Tipo é obrigatório";
    

    const unmaskedDoc = formState.documento.replace(/\D/g, '');
    const complianceResult = checkCompliance(formState.documento);

    if (complianceResult.isCritical) {
        newErrors.documento = `REGISTRO BLOQUEADO: ${complianceResult.ocorrencia?.motivo}`;
    } else if (!formState.documento.trim()) {
        newErrors.documento = "Documento (CPF) é obrigatório.";
    } else if (unmaskedDoc.length < 11) {
        newErrors.documento = "Documento (CPF) deve ter 11 dígitos.";
    } else if (selectedTPA) { // Editing an existing record
        const originalDoc = (selectedTPA.documento || '').replace(/\D/g, '');
        if (unmaskedDoc !== originalDoc && activeTpaDocuments.has(unmaskedDoc)) {
              newErrors.documento = "Já existe um registro de entrada ativo para este CPF.";
        }
    } else { // Adding a new record (brand new or re-entry)
          if (activeTpaDocuments.has(unmaskedDoc)) {
              newErrors.documento = "Já existe um registro de entrada ativo para este CPF.";
          } else if (!isReEntryMode && allTpaDocuments.has(unmaskedDoc)) {
            newErrors.documento = "CPF já cadastrado. Para registrar nova entrada, use a função 'Nova Entrada'.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReEntry = (tpa: Tpa) => {
    setSelectedTPA(null);
    setErrors({});
    const now = new Date();

    const { id, status, ...restOfTPA } = tpa;

    setFormState({
        ...restOfTPA,
        dataEmissao: now.toISOString().split("T")[0],
        dataValidade: "",
        credencial: tpa.credencial || "azul",
    });
    handleComplianceCheck(tpa.documento);
    setIsReEntryMode(true);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && selectedTPA) {
        setFormState({
          ...selectedTPA,
          credencial: selectedTPA.credencial || "azul",
        });
        handleComplianceCheck(selectedTPA.documento);
    }
  }, [selectedTPA, isFormOpen])

  const filtered = useMemo(() => registros.filter(r => {
    if (!r) return false; // Defensively filter out null/undefined records

    const searchLower = search.toLowerCase().trim();
    const textMatch = !searchLower || (
      (r.nome || '').toLowerCase().includes(searchLower) ||
      (r.documento || '').toLowerCase().includes(searchLower) ||
      (r.funcao || '').toLowerCase().includes(searchLower)
    );

    const dateMatch = (() => {
      if (!dataInicio && !dataFim) {
        if (searchLower) {
          return true;
        }
        const today = new Date().toISOString().split('T')[0];
        return r.dataEmissao === today;
      }
      if (!r.dataEmissao) {
        return false;
      }
      const afterStart = dataInicio ? r.dataEmissao >= dataInicio : true;
      const beforeEnd = dataFim ? r.dataEmissao <= dataFim : true;
      return afterStart && beforeEnd;
    })();

    return textMatch && dateMatch;
  }), [registros, search, dataInicio, dataFim, activeShift]);

  const totalPresentes = registros.filter(r => r && r.status === "ativo").length
  const totalRegistros = registros.filter(r => !!r).length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
    if (errors[id]) {
        setErrors(prev => ({ ...prev, [id]: '' }));
    }
  }

  const handleMaskedInputChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    if (id === 'documento') {
      handleComplianceCheck(value);
    }
    if (errors[id]) {
        setErrors(prev => ({ ...prev, [id]: '' }));
    }
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }))
    if (errors[id]) {
        setErrors(prev => ({ ...prev, [id]: '' }));
    }
  }

  const handleAddNew = () => {
    setSelectedTPA(null)
    setComplianceAlert(null);
    setErrors({});
    const now = new Date();
    setFormState({ 
        ...initialFormState,
        dataEmissao: now.toISOString().split("T")[0],
    });
    setIsReEntryMode(false);
    setIsFormOpen(true)
  }

  const handleEdit = (tpa: Tpa) => {
    if (!isOnline) {
        toast.error("A edição está desabilitada em modo offline.");
        return;
    }
    setSelectedTPA(tpa)
    setErrors({});
    handleComplianceCheck(tpa.documento);
    setIsFormOpen(true)
  }

  const handleDelete = (tpa: Tpa) => {
    if (!isOnline) {
        toast.error("A exclusão está desabilitada em modo offline.");
        return;
    }
    setSelectedTPA(tpa)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedTPA || !isOnline) return
    setIsSaving(true)
    try {
      await deleteItem(selectedTPA.id)
      toast.success("Registro de TPA excluído com sucesso!");
      setIsDeleteConfirmOpen(false)
      setSelectedTPA(null)
    } catch (error) {
      console.error("Erro ao excluir TPA:", error)
      toast.error("Erro ao excluir registro de TPA.");
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (!validateForm()) {
        toast.warning("Por favor, preencha todos os campos obrigatórios marcados em vermelho.");
        return;
    };

    setIsSaving(true)

    let dataToSave: Omit<Tpa, "id" | "status"> & { status: string } = { ...formState, status: "ativo" };


    if (!isOnline) {
        if (selectedTPA) {
            toast.error("Não é possível editar registros existentes offline.");
            setIsSaving(false);
            return;
        }
        try {
            const tempId = uuidv4();
            await addToOutbox({ 
                id: tempId, 
                tableName: 'tpa', 
                data: dataToSave,
                action: 'create'
            });

            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
            }

            toast.success("Salvo com sucesso no navegador! O registro será sincronizado assim que a conexão for restaurada.");
            setIsFormOpen(false);
        } catch (error) {
            console.error("Erro ao salvar TPA offline:", error);
            toast.error("Falha ao salvar o registro localmente.");
        } finally {
            setIsSaving(false);
        }
        return;
    }

    try {
      if (selectedTPA) {
        await updateItem(selectedTPA.id, dataToSave)
        toast.success("Registro de TPA atualizado com sucesso!")
      } else {
        await addItem(dataToSave)
        toast.success("TPA registrado com sucesso!")
      }
      setIsFormOpen(false)
    } catch (error) {
      console.error("Erro ao salvar TPA:", error)
      toast.error("Ocorreu um erro ao salvar o registro.")
    } finally {
      setIsSaving(false)
    }
  }

  const saveButtonDisabled = isSaving || (!isOnline && !!selectedTPA);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const CredencialBadge = ({ credencial }: { credencial?: "azul" | "vermelho" | "verde" }) => {
    if (!credencial || !["verde", "vermelho"].includes(credencial)) return null;

    const config = credencialConfig[credencial];
    const Icon = config.icon

    return (
      <div className={cn("mt-2 flex items-center gap-2 rounded-md p-2 text-xs font-semibold", config.className)}>
        {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
        <span>{config.text}</span>
      </div>
    );
  };

  return (
    <TooltipProvider>
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{totalRegistros}</p><p className="text-sm text-muted-foreground">Total de Registros</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Ship className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-primary">{totalPresentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
      </div>

        <Card>
            <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
                    <div className="grid gap-2">
                        <Label htmlFor="search">Busca</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="search" placeholder="Buscar por nome, doc, placa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
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
                    <Button variant="outline" onClick={() => { setDataInicio(""); setDataFim(""); }} className="w-full"><XCircle className="mr-2 h-4 w-4"/>Limpar</Button>
                    <Button onClick={handleAddNew} className="w-full"><Plus className="mr-2 h-4 w-4" />Registrar TPA</Button>
                </div>
                 <div className="flex flex-col gap-2">
                    <Label>Filtrar por Turno de Saída</Label>
                    <ToggleGroup
                        type="single"
                        value={activeShift}
                        onValueChange={(value) => setActiveShift(value as Shift || "todos")}
                        className="justify-start"
                    >
                        <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
                        <ToggleGroupItem value="07-13">07-13</ToggleGroupItem>
                        <ToggleGroupItem value="13-19">13-19</ToggleGroupItem>
                        <ToggleGroupItem value="19-01">19-01</ToggleGroupItem>
                        <ToggleGroupItem value="01-07">01-07</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </CardContent>
        </Card>


      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setFormState(initialFormState); setErrors({}); setComplianceAlert(null); setIsReEntryMode(false); } setIsFormOpen(isOpen); }}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                {selectedTPA ? "Editar Registro TPA" : isReEntryMode ? "Nova Entrada para TPA" : "Registrar Entrada TPA"}
                {!isOnline && <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"><WifiOff className="h-3 w-3"/>Offline</span>}
                </DialogTitle>
            </DialogHeader>
          
          {complianceAlert && (
            <Alert variant={complianceAlert.isCritical ? "destructive" : "destructive"} className="mt-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{complianceAlert.isCritical ? "Registro Bloqueado" : "Alerta de Compliance"}</AlertTitle>
              <AlertDescription>{complianceAlert.motivo}</AlertDescription>
            </Alert>
          )}

          <div className="max-h-[70vh] overflow-y-auto p-1 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" placeholder="Nome completo" value={formState.nome} onChange={handleInputChange} className={cn({ 'border-red-500': errors.nome })} />
                {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="funcao">Função</Label>
                <Select value={formState.funcao} onValueChange={v => handleSelectChange("funcao", v)}>
                  <SelectTrigger id="funcao" className={cn({ 'border-red-500': errors.funcao })}>
                    <SelectValue placeholder="Selecione a função..." />
                  </SelectTrigger>
                  <SelectContent>
                    {funcoes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.funcao && <p className="text-xs text-red-500">{errors.funcao}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="documento">Documento (CPF)</Label>
                <IMaskInput
                  mask="000.000.000-00"
                  id="documento"
                  value={formState.documento}
                  onAccept={(value) => handleMaskedInputChange('documento', value as string)}
                  as={ForwardedInput}
                  className={cn({ 'border-red-500': errors.documento })}
                />
                {errors.documento && <p className="text-xs text-red-500">{errors.documento}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataEmissao">Data Emissão</Label>
                <Input id="dataEmissao" type="date" value={formState.dataEmissao} onChange={handleInputChange} className={cn({ 'border-red-500': errors.dataEmissao })} />
                {errors.dataEmissao && <p className="text-xs text-red-500">{errors.dataEmissao}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dataValidade">Data Validade</Label>
                <Input id="dataValidade" type="date" value={formState.dataValidade} onChange={handleInputChange} className={cn({ 'border-red-500': errors.dataValidade })} />
                {errors.dataValidade && <p className="text-xs text-red-500">{errors.dataValidade}</p>}
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formState.tipo} onValueChange={v => handleSelectChange("tipo", v)}>
                    <SelectTrigger id="tipo" className={cn({ 'border-red-500': errors.tipo })}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="isps">ISPS</SelectItem><SelectItem value="nao_isps">Não ISPS</SelectItem></SelectContent>
                </Select>
                 {errors.tipo && <p className="text-xs text-red-500">{errors.tipo}</p>}
              </div>
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacao">Observação</Label><Textarea id="observacao" placeholder="Observações adicionais (opcional)" value={formState.observacao} onChange={handleInputChange} rows={3} /></div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Button onClick={handleSave} disabled={saveButtonDisabled}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedTPA ? "Salvar Alterações" : "Registrar"}
            </Button>
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
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving || !isOnline}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* List */}
      <Card>
        <CardHeader><CardTitle>Histórico de TPAs</CardTitle></CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {filtered.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum registro encontrado para os filtros aplicados.</p>
                ) : (
                    filtered.map(r => (
                        <div key={r.id} className="rounded-lg border bg-card p-4 space-y-3 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{r.nome}</p>
                                    <p className="text-sm text-muted-foreground">{r.funcao}</p>
                                </div>
                                 <div className="flex flex-col items-end gap-1">
                                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", r.status === "ativo" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{r.status}</span>
                                    {(r as any).isOffline && <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium text-amber-800 animate-pulse"><WifiOff className="mr-1 h-3 w-3" /> Sincronizando...</span>}
                                 </div>
                            </div>
                            <CredencialBadge credencial={r.credencial} />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                                <div className="flex flex-col"><span className="text-muted-foreground">Documento</span><span>{r.documento}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Emissão</span><span>{formatDate(r.dataEmissao)}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Validade</span><span>{formatDate(r.dataValidade)}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Tipo</span><span className="capitalize">{r.tipo}</span></div>
                            </div>
                             <div className="border-t pt-3 flex items-center justify-end gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isOnline}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
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
                            <th className="px-4 py-3 font-medium">Nome</th>
                            <th className="px-4 py-3 font-medium">Função</th>
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">Emissão</th>
                            <th className="px-4 py-3 font-medium">Validade</th>
                            <th className="px-4 py-3 font-medium">Tipo</th>
                            <th className="px-4 py-3 font-medium">Observações</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={14} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</td></tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className={cn("hover:bg-muted/50", r.credencial && (r.credencial in credencialConfig) && credencialConfig[r.credencial as keyof typeof credencialConfig]?.className.replace(/text-\S+/, '').replace(/dark:text-\S+/, ''))}>
                                    <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                                        <div className="flex items-center gap-2">
                                            {r.nome}
                                            {(r as any).isOffline && <Tooltip><TooltipTrigger><WifiOff className="h-3 w-3 text-amber-500 animate-pulse" /></TooltipTrigger><TooltipContent>Aguardando conexão para sincronizar</TooltipContent></Tooltip>}
                                        </div>
                                        <CredencialBadge credencial={r.credencial} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.funcao}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.documento}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.dataEmissao)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.dataValidade)}</td>
                                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${r.tipo === "isps" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>{r.tipo.toUpperCase()}</span></td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.observacao}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleEdit(r)} disabled={!isOnline}><FilePenLine className="h-4 w-4" /></Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(r)} className="text-destructive hover:text-destructive/90" disabled={!isOnline}><Trash2 className="h-4 w-4" /></Button>
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

const IconeAcesso = ({ meio }: { meio: 'terra' | 'mar' }) => {
    if (meio === 'terra') {
        return <LandPlot className="h-4 w-4 text-gray-500" />;
    }
    return <Waves className="h-4 w-4 text-blue-500" />;
};