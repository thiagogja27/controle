'use client'

import { useState, useEffect, useMemo, forwardRef } from "react"
import { LogIn, LogOut, Plus, Search, Ship, Users, Loader2, FilePenLine, Trash2, MoreVertical, XCircle, ShieldCheck, ShieldAlert, WifiOff, AlertTriangle } from "lucide-react"
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
import { type TPA, type OcorrenciaCompliance } from "@/lib/store"
import { useTPAs } from "@/hooks/use-firebase"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
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

const initialFormState: Omit<TPA, "id" | "status"> = {
  nome: "",
  funcao: "",
  documento: "",
  placa: "",
  destino: "",
  navio: "",
  pier: "teg",
  observacao: "",
  vigilante: "",
  data: "",
  hora: "",
  dataSaida: "",
  horaSaida: "",
  credencial: "azul",
  numeroCip: "",
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
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:red-green-200" },
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
  const { data: ocorrencias } = useOcorrenciasCompliance();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [activeShift, setActiveShift] = useState<Shift>("todos");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedTPA, setSelectedTPA] = useState<TPA | null>(null)
  const [formState, setFormState] = useState(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [complianceAlert, setComplianceAlert] = useState<OcorrenciaCompliance | null>(null);
  const [isCriticalAlertOpen, setIsCriticalAlertOpen] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formState.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formState.funcao.trim()) newErrors.funcao = "Função é obrigatória";
    if (!formState.destino.trim()) newErrors.destino = "Destino é obrigatório";
    if (!formState.navio.trim()) newErrors.navio = "Navio é obrigatório";
    if (!formState.pier.trim()) newErrors.pier = "Píer é obrigatório";
    if (!formState.vigilante.trim()) newErrors.vigilante = "Vigilante é obrigatório";
    if (!formState.data.trim()) newErrors.data = "Data de entrada é obrigatória";
    if (!formState.hora.trim()) newErrors.hora = "Hora de entrada é obrigatória";
    if (!formState.numeroCip.trim()) newErrors.numeroCip = "Número CIP é obrigatório";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkCompliance = (documento: string) => {
    const unmaskedDoc = documento.replace(/\D/g, '');
    if (unmaskedDoc.length > 0) {
        const foundOcorrencia = ocorrencias.find(o => o.documentoIndividuo.replace(/\D/g, '') === unmaskedDoc);
        setComplianceAlert(foundOcorrencia || null);
        if (foundOcorrencia?.statusAlerta === 'Crítico') {
            setIsCriticalAlertOpen(true);
        }
    } else {
        setComplianceAlert(null);
    }
  }

  const handleReEntry = (tpa: TPA) => {
    setSelectedTPA(null);
    setErrors({});
    const now = new Date();

    const { id, status, ...restOfTPA } = tpa;

    setFormState({
        ...restOfTPA,
        placa: tpa.placa || '',
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        dataSaida: "",
        horaSaida: "",
        credencial: tpa.credencial || "azul",
        numeroCip: tpa.numeroCip || "",
    });
    checkCompliance(tpa.documento);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && selectedTPA) {
        setFormState({
          ...selectedTPA,
          placa: selectedTPA.placa || '',
          credencial: selectedTPA.credencial || "azul",
          dataSaida: selectedTPA.dataSaida || "",
          horaSaida: selectedTPA.horaSaida || "",
          numeroCip: selectedTPA.numeroCip || "",
        })
    }
  }, [selectedTPA, isFormOpen])

  const filtered = useMemo(() => registros.filter(r => {
    if (!r) return false; // Defensively filter out null/undefined records

    const searchLower = search.toLowerCase().trim();
    const textMatch = !searchLower || (
      (r.nome || '').toLowerCase().includes(searchLower) ||
      (r.documento || '').toLowerCase().includes(searchLower) ||
      (r.placa || '').toLowerCase().includes(searchLower) ||
      (r.navio || '').toLowerCase().includes(searchLower)
    );

    const dateMatch = (() => {
      if (!dataInicio && !dataFim) {
        if (searchLower) {
          return true;
        }
        const today = new Date().toISOString().split('T')[0];
        return r.data === today;
      }
      if (!r.data) {
        return false;
      }
      const afterStart = dataInicio ? r.data >= dataInicio : true;
      const beforeEnd = dataFim ? r.data <= dataFim : true;
      return afterStart && beforeEnd;
    })();

    const shiftMatch = (() => {
      if (activeShift === "todos") {
        return true;
      }
      if (!r.horaSaida) {
        return false;
      }
      const hora = r.horaSaida;
      switch (activeShift) {
        case "07-13":
          return hora >= "07:00" && hora < "13:00";
        case "13-19":
          return hora >= "13:00" && hora < "19:00";
        case "19-01":
          return hora >= "19:00" || hora < "01:00";
        case "01-07":
            return hora >= "01:00" && hora < "07:00";
        default:
          return true;
      }
    })();

    return textMatch && dateMatch && shiftMatch;
  }), [registros, search, dataInicio, dataFim, activeShift]);

  const totalPresentes = registros.filter(r => r && r.status === "presente").length
  const totalTeg = registros.filter(r => r && r.pier === "teg").length
  const totalTeag = registros.filter(r => r && r.pier === "teag").length
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
      checkCompliance(value);
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
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5) 
    });
    setIsFormOpen(true)
  }

  const handleEdit = (tpa: TPA) => {
    if (!isOnline) {
        toast.error("A edição está desabilitada em modo offline.");
        return;
    }
    setSelectedTPA(tpa)
    setErrors({});
    checkCompliance(tpa.documento);
    setIsFormOpen(true)
  }

  const handleDelete = (tpa: TPA) => {
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
    if (isCriticalAlertOpen) {
      toast.error("Não é possível salvar enquanto um alerta de compliance crítico estiver ativo.");
      return;
    }
    if (!validateForm()) {
        toast.warning("Por favor, preencha todos os campos obrigatórios marcados em vermelho.");
        return;
    };

    setIsSaving(true)

    const status = (formState.horaSaida && formState.dataSaida) ? "saiu" : "presente"
    let dataToSave: Omit<TPA, "id"> = { ...formState, status };

    if (status === "presente") {
      dataToSave.horaSaida = "";
      dataToSave.dataSaida = "";
    }

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
                tableName: 'tpas', 
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

  const handleSaida = async (id: string) => {
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
          tableName: 'tpas', 
          action: 'update',
          originalId: id,
          data: saidaData 
        });

        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
        }
        toast.success("Saída salva com sucesso no navegador! Será sincronizada quando a conexão for restaurada.");
        return;
      }

      await updateItem(id, saidaData);
      toast.success("Saída registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar saída:", error);
      toast.error("Erro ao registrar a saída.");
    }
  }

  const formatDateTime = (data: string | undefined, hora: string) => {
    if (!data || !hora) return ""
    return `${formatDate(data)} ${hora}`
  }

  const saveButtonDisabled = isSaving || (!isOnline && !!selectedTPA) || isCriticalAlertOpen;

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
        <Dialog open={isCriticalAlertOpen} onOpenChange={setIsCriticalAlertOpen}>
            <DialogContent className="sm:max-w-md bg-red-50 border-red-200">
                <DialogHeader className="flex-col items-center text-center">
                    <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                    <DialogTitle className="text-2xl font-bold text-red-800">ALERTA DE COMPLIANCE CRÍTICO</DialogTitle>
                </DialogHeader>
                <div className="my-4 text-center">
                    <p className="font-semibold text-lg text-gray-800">{complianceAlert?.nomeIndividuo}</p>
                    <p className="text-sm text-gray-600">CPF: {complianceAlert?.documentoIndividuo}</p>
                </div>
                <Alert variant="destructive" className="bg-white">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="font-bold">Motivo: {complianceAlert?.motivo}</AlertTitle>
                    <AlertDescription>
                       Ocorrência registrada em {formatDate(complianceAlert?.dataOcorrencia)}. 
                       <span className="font-bold">É crucial revisar a seção de Compliance antes de qualquer ação.</span>
                    </AlertDescription>
                </Alert>
                 <DialogFooter className="mt-6 sm:justify-center">
                    <Button variant="destructive" onClick={() => setIsCriticalAlertOpen(false)}>Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{totalRegistros}</p><p className="text-sm text-muted-foreground">Total de Registros</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10"><Ship className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold text-primary">{totalPresentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEG</span></div><div><p className="text-2xl font-bold">{totalTeg}</p><p className="text-sm text-muted-foreground">Pier TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEAG</span></div><div><p className="text-2xl font-bold">{totalTeag}</p><p className="text-sm text-muted-foreground">Pier TEAG</p></div></CardContent></Card>
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
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setFormState(initialFormState); setErrors({}); setComplianceAlert(null); } setIsFormOpen(isOpen); }}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                {selectedTPA ? "Editar Registro TPA" : "Registrar Entrada TPA"}
                {!isOnline && <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"><WifiOff className="h-3 w-3"/>Offline</span>}
                </DialogTitle>
            </DialogHeader>
          
          {complianceAlert && complianceAlert.statusAlerta !== 'Crítico' && (
            <Alert variant="destructive" className="mt-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Alerta de Compliance</AlertTitle>
              <AlertDescription>
                <p>Indivíduo com ocorrência registrada. Por favor, consulte a seção de Compliance para mais detalhes antes de prosseguir com o registro.</p>
              </AlertDescription>
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
                <Label htmlFor="placa">Placa do Veículo</Label>
                <IMaskInput
                  mask={[{ mask: 'aaa-0000' }, { mask: 'aaa0a00' }]}
                  id="placa"
                  value={formState.placa || ''}
                  onAccept={(value) => handleMaskedInputChange('placa', value as string)}
                  prepare={(str) => str.toUpperCase()}
                  as={ForwardedInput}
                  placeholder="ABC-1234 ou ABC1D23"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="credencial">Credencial de Acesso</Label>
                <Select value={formState.credencial || 'azul'} onValueChange={(value) => handleSelectChange("credencial", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azul">Azul (Administrativo)</SelectItem>
                    <SelectItem value="vermelho">Vermelho (Pier)</SelectItem>
                    <SelectItem value="verde">Verde (Navio)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="numeroCip">Número CIP</Label>
                <Input id="numeroCip" placeholder="Número CIP" value={formState.numeroCip} onChange={handleInputChange} className={cn({ 'border-red-500': errors.numeroCip })} />
                {errors.numeroCip && <p className="text-xs text-red-500">{errors.numeroCip}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="destino">Destino</Label>
                <Input id="destino" placeholder="Ex: Convés Principal" value={formState.destino} onChange={handleInputChange} className={cn({ 'border-red-500': errors.destino })} />
                {errors.destino && <p className="text-xs text-red-500">{errors.destino}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="navio">Navio</Label>
                <Input id="navio" placeholder="Nome do navio" value={formState.navio} onChange={handleInputChange} className={cn({ 'border-red-500': errors.navio })} />
                {errors.navio && <p className="text-xs text-red-500">{errors.navio}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pier">Pier</Label>
                <Select value={formState.pier} onValueChange={v => handleSelectChange("pier", v)}>
                    <SelectTrigger id="pier" className={cn({ 'border-red-500': errors.pier })}><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent>
                </Select>
                 {errors.pier && <p className="text-xs text-red-500">{errors.pier}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="data">Data Entrada</Label>
                <Input id="data" type="date" value={formState.data} onChange={handleInputChange} className={cn({ 'border-red-500': errors.data })} />
                {errors.data && <p className="text-xs text-red-500">{errors.data}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hora">Hora Entrada</Label>
                <Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} className={cn({ 'border-red-500': errors.hora })} />
                {errors.hora && <p className="text-xs text-red-500">{errors.hora}</p>}
              </div>
              <div className="grid gap-2"><Label htmlFor="dataSaida">Data Saída</Label><Input id="dataSaida" type="date" value={formState.dataSaida || ""} onChange={handleInputChange} /></div>
              <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida || ""} onChange={handleInputChange} /></div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="vigilante">Vigilante</Label>
                <Input id="vigilante" placeholder="Nome do vigilante responsável" value={formState.vigilante} onChange={handleInputChange} className={cn({ 'border-red-500': errors.vigilante })} />
                {errors.vigilante && <p className="text-xs text-red-500">{errors.vigilante}</p>}
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
                                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", r.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{r.status}</span>
                                    {(r as any).isOffline && <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-medium text-amber-800 animate-pulse"><WifiOff className="mr-1 h-3 w-3" /> Sincronizando...</span>}
                                 </div>
                            </div>
                            <CredencialBadge credencial={r.credencial} />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                                <div className="flex flex-col"><span className="text-muted-foreground">Documento</span><span>{r.documento}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Placa</span><span>{r.placa || '-'}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Navio</span><span>{r.navio}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Entrada</span><span>{formatDateTime(r.data, r.hora)}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Saída</span><span>{r.horaSaida ? formatDateTime(r.dataSaida || r.data, r.horaSaida) : '-'}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">CIP</span><span>{r.numeroCip || '-'}</span></div>
                            </div>
                             <div className="border-t pt-3 flex items-center justify-end gap-2">
                                {r.status === "presente" ? (
                                    <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)}>Registrar Saída</Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleReEntry(r)}>Nova Entrada</Button>
                                )}
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
                            <th className="px-4 py-3 font-medium">Entrada</th>
                            <th className="px-4 py-3 font-medium">Saída</th>
                            <th className="px-4 py-3 font-medium">Nome</th>
                            <th className="px-4 py-3 font-medium">Função</th>
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">CIP</th>
                            <th className="px-4 py-3 font-medium">Placa</th>
                            <th className="px-4 py-3 font-medium">Navio</th>
                            <th className="px-4 py-3 font-medium">Destino</th>
                            <th className="px-4 py-3 font-medium">Pier</th>
                            <th className="px-4 py-3 font-medium">Vigilante</th>
                            <th className="px-4 py-3 font-medium">Observações</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</td></tr>
                        ) : (
                            filtered.map(r => (
                                <tr key={r.id} className={cn("hover:bg-muted/50", r.credencial && credencialConfig[r.credencial]?.className.replace(/text-\S+/, '').replace(/dark:text-\S+/, ''))}>
                                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">{formatDateTime(r.data, r.hora)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap tabular-nums text-muted-foreground">{r.horaSaida ? formatDateTime(r.dataSaida || r.data, r.horaSaida) : "-"}</td>
                                    <td className="px-4 py-3 font-medium whitespace-nowrap text-foreground">
                                        <div className="flex items-center gap-2">
                                            {r.nome}
                                            {(r as any).isOffline && <Tooltip><TooltipTrigger><WifiOff className="h-3 w-3 text-amber-500 animate-pulse" /></TooltipTrigger><TooltipContent>Aguardando conexão para sincronizar</TooltipContent></Tooltip>}
                                        </div>
                                        <CredencialBadge credencial={r.credencial} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.funcao}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.documento}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.numeroCip || '-'}</td>
                                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{r.placa || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{r.navio}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{r.destino}</td>
                                    <td className="px-4 py-3"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${r.pier === "teg" ? "bg-primary/10 text-primary" : "bg-info/10 text-info"}`}>{r.pier.toUpperCase()}</span></td>
                                    <td className="px-4 py-3 whitespace-nowrap text-foreground">{r.vigilante}</td>
                                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{r.observacao}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            {r.status === "presente" ? (
                                                <Button size="sm" variant="outline" onClick={() => handleSaida(r.id)}><LogOut className="mr-2 h-3 w-3" />Registrar Saída</Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleReEntry(r)}><LogIn className="mr-2 h-3 w-3" />Nova Entrada</Button>
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
