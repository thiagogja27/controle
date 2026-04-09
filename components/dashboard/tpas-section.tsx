'use client'

import { useState, useEffect, useMemo, forwardRef } from "react"
import { Plus, Search, Ship, Users, Loader2, FilePenLine, Trash2, MoreVertical, XCircle, ShieldCheck, ShieldAlert, WifiOff, LandPlot, Waves, Clock, UserCheck, UserX } from "lucide-react"
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
import { useTPAs, useNavios } from "@/hooks/use-firebase"
import { useComplianceCheck } from "@/hooks/use-compliance-check"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { addToOutbox } from "@/utils/db"
import { v4 as uuidv4 } from 'uuid'
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { IMaskInput } from 'react-imask';

const ForwardedInput: any = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { as, ...rest } = props;
    return <Input ref={ref} {...rest} />;
});
ForwardedInput.displayName = 'ForwardedInput';

// Helper functions to convert date formats
const toBrDate = (isoDate: string = ''): string => {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

const toIsoDate = (brDate: string = ''): string => {
    if (!brDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(brDate)) return '';
    const [day, month, year] = brDate.split('/');
    return `${year}-${month}-${day}`;
};

const initialFormState: Omit<Tpa, "id" | "status"> = {
  nome: "",
  empresa: "",
  funcao: "",
  documento: "",
  numeroCip: "",
  placa: "",
  navio: "",
  vigilante: "",
  pier: "teg",
  meioDeAcesso: "terra",
  credencial: "azul",
  destino: "",
  dataEntrada: "",
  horaEntrada: "",
  dataSaida: "",
  horaSaida: "",
  observacao: "",
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

const destinos = [
  "Recepção",
  "Supervisão",
  "Segurança",
  "Classificação",
  "Almoxarifado",
  "Pier TEG",
  "Pier TEAG",
  "Central de Resíduos",
  "Cozinha",
  "Projeto netuno",
  "RH",
  "Outros",
];

const credencialConfig = {
    verde: { text: "Permissão de acesso ao navio", icon: ShieldCheck, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    azul: { text: "Acesso restrito à área administrativa", icon: null, className: "" },
};

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split('-');
  if(!year || !month || !day) return "N/A";
  return `${day}/${month}/${year}`;
}

export function TPAsSection() {
  const { data: registros, loading, addItem, updateItem, deleteItem } = useTPAs()
  const { data: navios, loading: loadingNavios } = useNavios();
  const { checkCompliance } = useComplianceCheck();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedTPA, setSelectedTPA] = useState<Tpa | null>(null)
  const [isReEntryMode, setIsReEntryMode] = useState(false);
  const [formState, setFormState] = useState<Omit<Tpa, "id" | "status">>(initialFormState)
  const [outroDestino, setOutroDestino] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Tpa, "id" | "status"> | 'outroDestino', string>>>({});

  const [complianceAlert, setComplianceAlert] = useState<OcorrenciaCompliance | null>(null);

  const activeTpaDocuments = useMemo(() => {
    const activeDocs = new Set<string>();
    registros.forEach(r => {
        if (r && r.status === "presente" && r.documento) {
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

  const handleReEntry = (tpa: Tpa) => {
    setSelectedTPA(null);
    setErrors({});
    setComplianceAlert(null);
    const now = new Date();

    const { id, status, dataEntrada, horaEntrada, dataSaida, horaSaida, ...restOfTPA } = tpa;

    const newFormState: Omit<Tpa, "id" | "status"> = {
        ...initialFormState, // Ensure all fields are reset
        ...restOfTPA,
        dataEntrada: toBrDate(now.toISOString().split("T")[0]),
        horaEntrada: now.toTimeString().slice(0, 5),
        dataSaida: "",
        horaSaida: "",
    };
    
    if (!destinos.includes(tpa.destino || "")) {
        setOutroDestino(tpa.destino || "");
        newFormState.destino = "Outros";
    } else {
        setOutroDestino("");
    }

    setFormState(newFormState);
    handleComplianceCheck(tpa.documento);
    setIsReEntryMode(true);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && selectedTPA) {
        setIsReEntryMode(false);
        const isOutro = !destinos.includes(selectedTPA.destino || "");
        setFormState({
          ...selectedTPA,
          dataEntrada: toBrDate(selectedTPA.dataEntrada),
          dataSaida: toBrDate(selectedTPA.dataSaida),
          credencial: selectedTPA.credencial || "azul",
          destino: isOutro ? "Outros" : selectedTPA.destino,
        });
        setOutroDestino(isOutro ? selectedTPA.destino || "" : "");
        handleComplianceCheck(selectedTPA.documento);
    }
  }, [selectedTPA, isFormOpen])

  const clearError = (field: string) => {
    setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof errors];
        return newErrors;
    });
  }

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Omit<Tpa, "id" | "status">, string>> = {};
    if (!formState.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formState.funcao.trim()) newErrors.funcao = "Função é obrigatória";
    if (!formState.empresa.trim()) newErrors.empresa = "Empresa é obrigatória";
    if (!formState.dataEntrada.trim()) newErrors.dataEntrada = "Data de entrada é obrigatória";
    if (!formState.horaEntrada.trim()) newErrors.horaEntrada = "Hora de entrada é obrigatória";
    if (formState.destino === "Outros" && !outroDestino.trim()) {
        (newErrors as any).outroDestino = "Especifique o destino se 'Outros'.";
    }

    const unmaskedDoc = formState.documento.replace(/\D/g, '');
    const complianceResult = checkCompliance(formState.documento);

    if (complianceResult.isCritical) {
        newErrors.documento = `REGISTRO BLOQUEADO: ${complianceResult.ocorrencia?.motivo}`;
    } else if (!formState.documento.trim()) {
        newErrors.documento = "Documento (CPF) é obrigatório.";
    } else if (unmaskedDoc.length < 11) {
        newErrors.documento = "Documento (CPF) deve ter 11 dígitos.";
    } else if (selectedTPA) { // Editing
        const originalDoc = (selectedTPA.documento || '').replace(/\D/g, '');
        if (unmaskedDoc !== originalDoc && activeTpaDocuments.has(unmaskedDoc)) {
            newErrors.documento = "Já existe um registro de entrada ativo para este CPF.";
        }
    } else { // Adding
          if (activeTpaDocuments.has(unmaskedDoc)) {
              newErrors.documento = "Já existe um registro de entrada ativo para este CPF.";
          } else if (!isReEntryMode && allTpaDocuments.has(unmaskedDoc)) {
            newErrors.documento = "CPF já cadastrado. Para registrar nova entrada, use a função 'Nova Entrada'.";
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const filtered = useMemo(() => registros.filter(r => {
    if (!r) return false;

    const searchLower = search.toLowerCase().trim();
    const searchNumbers = search.replace(/\D/g, '');

    const textMatch = !searchLower || (
      (r.nome || '').toLowerCase().includes(searchLower) ||
      (r.documento || '').replace(/\D/g, '').includes(searchNumbers) ||
      (r.funcao || '').toLowerCase().includes(searchLower) ||
      (r.empresa || '').toLowerCase().includes(searchLower) ||
      (r.placa || '').toLowerCase().includes(searchLower)
    );

    const dateMatch = (() => {
      if (searchLower) return true; // if searching, don't filter by date
      if (!dataInicio && !dataFim) {
        const today = new Date().toISOString().split('T')[0];
        const isPresent = r.status === 'presente';
        const exitedToday = r.dataSaida === today;
        return isPresent || exitedToday;
      }
      if (!r.dataEntrada) return false;
      const entrada = r.dataEntrada;
      const afterStart = dataInicio ? entrada >= dataInicio : true;
      const beforeEnd = dataFim ? entrada <= dataFim : true;
      return afterStart && beforeEnd;
    })();

    return textMatch && dateMatch;
  }), [registros, search, dataInicio, dataFim]);

  const presentes = registros.filter(r => r && r.status === "presente").length
  const sairamHoje = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return registros.filter(v => v.status === "saiu" && v.dataSaida === today).length;
  }, [registros]);
  const navioTeg = navios.find(n => n.id === 'teg');
  const navioTeag = navios.find(n => n.id === 'teag');


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
    clearError(id);
  }

  const handleMaskedInputChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    if (id === 'documento') {
      handleComplianceCheck(value);
    }
    clearError(id);
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }))
    if (id === 'destino' && value !== 'Outros') {
      setOutroDestino("");
      clearError('outroDestino');
    }
    clearError(id);
  }

  const handleAddNew = () => {
    setSelectedTPA(null)
    setComplianceAlert(null);
    setErrors({});
    const now = new Date();
    setFormState({ 
        ...initialFormState,
        dataEntrada: toBrDate(now.toISOString().split("T")[0]),
        horaEntrada: now.toTimeString().slice(0, 5),
    });
    setOutroDestino("");
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
    setIsReEntryMode(false);
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
      toast.warning("Por favor, verifique os erros no formulário.");
      return;
    }

    setIsSaving(true);
    const finalDestino = formState.destino === "Outros" ? outroDestino : formState.destino;

    const dataToSave: Omit<Tpa, "id"> = {
        ...formState,
        dataEntrada: toIsoDate(formState.dataEntrada),
        dataSaida: toIsoDate(formState.dataSaida),
        destino: finalDestino,
        status: (formState.horaSaida && formState.dataSaida) ? "saiu" : "presente",
    };

    if (dataToSave.status === "presente") {
        dataToSave.horaSaida = "";
        dataToSave.dataSaida = "";
    }

    if (!isOnline) {
        const action = selectedTPA ? 'update' : 'create';
        if (action === 'update' && !selectedTPA) { // Should not happen
             setIsSaving(false);
             return;
        }
         try {
            const id = selectedTPA ? selectedTPA.id : uuidv4();
            await addToOutbox({
              id: id,
              tableName: 'tpa',
              data: dataToSave,
              action: action,
              originalId: selectedTPA?.id
            });
            toast.success(`Registro salvo no navegador! Será sincronizado quando houver conexão.`)
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
              navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
            }
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
        await updateItem(selectedTPA.id, dataToSave);
        toast.success("Registro de TPA atualizado com sucesso!");
      } else {
        await addItem(dataToSave);
        toast.success("TPA registrado com sucesso!");
      }
      setIsFormOpen(false);
      setSelectedTPA(null);
      setOutroDestino("");
    } catch (error) {
      console.error("Erro ao salvar TPA:", error);
      toast.error("Ocorreu um erro ao salvar o registro.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleRegistrarSaida = async (tpaId: string) => {
    const now = new Date();
    const saidaData = {
        status: "saiu" as const,
        dataSaida: now.toISOString().split("T")[0],
        horaSaida: now.toTimeString().slice(0, 5),
    };

    try {
        if (!isOnline) {
          await addToOutbox({
            id: uuidv4(),
            tableName: 'tpa',
            action: 'update',
            originalId: tpaId,
            data: saidaData
          });

          if ('serviceWorker' in navigator && 'SyncManager' in window) {
              navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
          }
          toast.success("Saída salva no navegador! Será sincronizada quando a conexão for restaurada.");
          return;
        }

        await updateItem(tpaId, saidaData);
        toast.success("Saída registrada com sucesso!");
    } catch (error) {
        console.error("Erro ao registrar saída:", error);
        toast.error("Erro ao registrar a saída.");
    }
  };


  const isLoading = loading || loadingNavios;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const CredencialBadge = ({ credencial }: { credencial?: Tpa['credencial'] }) => {
    if (!credencial || !["verde", "vermelho"].includes(credencial)) return null;

    const config = credencialConfig[credencial as keyof typeof credencialConfig];
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">Presentes</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><UserX className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{sairamHoje}</p><p className="text-sm text-muted-foreground">Saíram Hoje</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900"><Ship className="h-6 w-6 text-teal-600 dark:text-teal-400" /></div><div><p className="text-lg font-bold truncate">{navioTeg?.nome || 'Sem navio'}</p><p className="text-sm text-muted-foreground">Navio no TEG</p></div></CardContent></Card>
            <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900"><Ship className="h-6 w-6 text-sky-600 dark:text-sky-400" /></div><div><p className="text-lg font-bold truncate">{navioTeag?.nome || 'Sem navio'}</p><p className="text-sm text-muted-foreground">Navio no TEAG</p></div></CardContent></Card>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-2 grid gap-2">
                        <Label htmlFor="search">Busca</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="search" placeholder="Buscar por nome, doc, função..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
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
                    <div className="flex gap-2 lg:col-span-2">
                         <Button variant="outline" onClick={() => { setSearch(""); setDataInicio(""); setDataFim(""); }} className="w-1/2"><XCircle className="mr-2 h-4 w-4"/>Limpar</Button>
                        <Button onClick={handleAddNew} className="w-1/2"><Plus className="mr-2 h-4 w-4" />Registrar</Button>
                    </div>
                </div>
            </CardContent>
        </Card>


      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setSelectedTPA(null); setErrors({}); setComplianceAlert(null); setIsReEntryMode(false); setOutroDestino(""); } setIsFormOpen(isOpen); }}>
        <DialogContent className="max-w-4xl w-full mx-4 sm:mx-auto">
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

            <div className="max-h-[80vh] overflow-y-auto p-1 mt-4">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-5 py-4 items-start">
                    {/* Row 1: Data, Hora, Nome */}
                    <div className="grid gap-1.5 md:col-span-1">
                        <Label htmlFor="dataEntrada">Data</Label>
                        <IMaskInput mask="00/00/0000" id="dataEntrada" value={formState.dataEntrada} onAccept={(v) => handleMaskedInputChange('dataEntrada', v as string)} as={ForwardedInput} className={cn({ 'border-red-500': errors.dataEntrada })} />
                        {errors.dataEntrada && <p className="text-xs text-red-500">{errors.dataEntrada}</p>}
                    </div>
                    <div className="grid gap-1.5 md:col-span-1">
                        <Label htmlFor="horaEntrada">Hora</Label>
                        <Input id="horaEntrada" type="time" value={formState.horaEntrada} onChange={handleInputChange} className={cn({ 'border-red-500': errors.horaEntrada })}/>
                        {errors.horaEntrada && <p className="text-xs text-red-500">{errors.horaEntrada}</p>}
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input id="nome" value={formState.nome} onChange={handleInputChange} className={cn({ 'border-red-500': errors.nome })} />
                        {errors.nome && <p className="text-xs text-red-500">{errors.nome}</p>}
                    </div>

                    {/* Row 2: Documento and Empresa */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="documento">Documento (CPF)</Label>
                        <IMaskInput mask="000.000.000-00" id="documento" value={formState.documento} onAccept={(value) => handleMaskedInputChange('documento', value as string)} as={ForwardedInput} className={cn({ 'border-red-500': errors.documento })}/>
                        {errors.documento && <p className="text-xs text-red-500">{errors.documento}</p>}
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="empresa">Empresa</Label>
                        <Input id="empresa" value={formState.empresa} onChange={handleInputChange} className={cn({ 'border-red-500': errors.empresa })} />
                        {errors.empresa && <p className="text-xs text-red-500">{errors.empresa}</p>}
                    </div>

                    {/* Row 3: Função and Numero Cip */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="funcao">Função</Label>
                        <Select value={formState.funcao} onValueChange={v => handleSelectChange("funcao", v)}>
                            <SelectTrigger id="funcao" className={cn({ 'border-red-500': errors.funcao })}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>{funcoes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                        </Select>
                        {errors.funcao && <p className="text-xs text-red-500">{errors.funcao}</p>}
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="numeroCip">Número CIP</Label>
                        <Input id="numeroCip" value={formState.numeroCip} onChange={handleInputChange}/>
                    </div>

                    {/* Row 4: Meio de Acesso and Placa */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="meioDeAcesso">Meio de Acesso</Label>
                        <Select value={formState.meioDeAcesso} onValueChange={v => handleSelectChange("meioDeAcesso", v)}>
                            <SelectTrigger id="meioDeAcesso"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="terra">Terra</SelectItem><SelectItem value="mar">Mar</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="placa">Placa</Label>
                        <IMaskInput mask={[{ mask: 'aaa-0000' }, { mask: 'aaa0a00' }]} id="placa" value={formState.placa} onAccept={(value) => handleMaskedInputChange("placa", value as string)} prepare={(str: string) => str.toUpperCase()} as={ForwardedInput} />
                    </div>

                    {/* Row 5: Pier and Navio */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="pier">Pier</Label>
                        <Select value={formState.pier} onValueChange={v => handleSelectChange("pier", v)}>
                            <SelectTrigger id="pier"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="navio">Navio</Label>
                        <Input id="navio" value={formState.navio} onChange={handleInputChange}/>
                    </div>

                    {/* Row 6: Destino and Vigilante */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="destino">Destino</Label>
                        <Select value={formState.destino} onValueChange={(value) => handleSelectChange("destino", value)}>
                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{destinos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="vigilante">Vigilante</Label>
                        <Input id="vigilante" value={formState.vigilante} onChange={handleInputChange} />
                    </div>

                    {/* Row 7: Credencial and Data Saída */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="credencial">Credencial</Label>
                        <Select value={formState.credencial} onValueChange={v => handleSelectChange("credencial", v)}>
                            <SelectTrigger id="credencial"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="azul">Azul</SelectItem><SelectItem value="vermelho">Vermelho</SelectItem><SelectItem value="verde">Verde</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="dataSaida">Data Saída</Label>
                        <IMaskInput mask="00/00/0000" id="dataSaida" value={formState.dataSaida} onAccept={(v) => handleMaskedInputChange('dataSaida', v as string)} as={ForwardedInput} />
                    </div>

                    {/* Row 8: Hora Saída */}
                    <div className="grid gap-1.5 md:col-span-2">
                        <Label htmlFor="horaSaida">Hora Saída</Label>
                        <Input id="horaSaida" type="time" value={formState.horaSaida} onChange={handleInputChange} />
                    </div>
                    
                    {/* Empty cell to balance the grid if needed */}
                    <div className="md:col-span-2"></div>

                    {/* Full Width Rows: Outro Destino and Observação */}
                    {formState.destino === "Outros" && (
                        <div className="grid gap-1.5 md:col-span-4">
                            <Label htmlFor="outroDestino">Especifique o Destino</Label>
                            <Input id="outroDestino" value={outroDestino} onChange={(e) => { setOutroDestino(e.target.value); clearError('outroDestino'); }} className={cn({ 'border-red-500': (errors as any).outroDestino })} />
                            {(errors as any).outroDestino && <p className="text-xs text-red-500">{(errors as any).outroDestino}</p>}
                        </div>
                    )}
                    <div className="grid gap-1.5 md:col-span-4">
                        <Label htmlFor="observacao">Observação</Label>
                        <Textarea id="observacao" value={formState.observacao} onChange={handleInputChange} rows={3} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleSave} disabled={isSaving || (!isOnline && selectedTPA)}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selectedTPA ? "Salvar Alterações" : "Registrar"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>


      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar Exclusão</DialogTitle><DialogDescription>Tem certeza de que deseja excluir o registro de "{selectedTPA?.nome}"? Esta ação não pode ser desfeita.</DialogDescription></DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end"><Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button><Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving || !isOnline}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Histórico de Acessos de TPAs</CardTitle></CardHeader>
        <CardContent>
             <div className="hidden lg:block overflow-x-auto">
                 <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                            <th className="px-4 py-3 font-medium">Nome</th>
                            <th className="px-4 py-3 font-medium">Credencial</th>
                            <th className="px-4 py-3 font-medium">Data Entrada</th>
                            <th className="px-4 py-3 font-medium">Data Saída</th>
                            <th className="px-4 py-3 font-medium">Destino</th>
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">Empresa</th>
                            <th className="px-4 py-3 font-medium">Função</th>
                            <th className="px-4 py-3 font-medium">Hora Entrada</th>
                            <th className="px-4 py-3 font-medium">Hora Saída</th>
                            <th className="px-4 py-3 font-medium">Meio de Acesso</th>
                            <th className="px-4 py-3 font-medium">Navio</th>
                            <th className="px-4 py-3 font-medium">Número CIP</th>
                            <th className="px-4 py-3 font-medium">Observação</th>
                            <th className="px-4 py-3 font-medium">Pier</th>
                            <th className="px-4 py-3 font-medium">Placa</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Vigilante</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={19} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className={cn("hover:bg-muted/50")}>
                                    <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                                        <div className="flex items-center gap-2">
                                            {r.nome}
                                            {(r as any).isOffline && <Tooltip><TooltipTrigger><WifiOff className="h-3 w-3 text-amber-500 animate-pulse" /></TooltipTrigger><TooltipContent>Aguardando sincronização</TooltipContent></Tooltip>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.credencial}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatDate(r.dataEntrada)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.dataSaida ? formatDate(r.dataSaida) : "-"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.destino}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.documento}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.empresa}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.funcao}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.horaEntrada}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.horaSaida || "-"}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.meioDeAcesso}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.navio}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.numeroCip}</td>
                                    <td className="px-4 py-3 text-muted-foreground truncate max-w-xs">{r.observacao}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.pier}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.placa}</td>
                                    <td className="px-4 py-3"><span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", r.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{r.status}</span></td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.vigilante}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {r.status === "presente" ? (
                                               <Button size="sm" variant="outline" onClick={() => handleRegistrarSaida(r.id)}><Clock className="h-4 w-4 mr-2"/>Sair</Button>
                                            ) : (
                                               <Button size="sm" variant="outline" onClick={() => handleReEntry(r)} disabled={activeTpaDocuments.has((r.documento || '').replace(/\D/g, ''))}>Nova Entrada</Button>
                                            )}
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
