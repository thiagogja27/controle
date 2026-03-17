'use client'

import { useState, useEffect, forwardRef, useMemo } from "react"
import { LogIn, LogOut, Plus, Search, Ship, Truck, Users, X, Loader2, FilePenLine, Trash2, MoreVertical, XCircle, ShieldCheck, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { type ConsumoBordo, type Individuo, type OcorrenciaCompliance } from "@/lib/store"
import { useConsumos } from "@/hooks/use-firebase"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
import { cn } from "@/lib/utils"
import { IMaskInput } from 'react-imask';

const ForwardedInput = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { as, ...rest } = props;
    return <Input ref={ref} {...rest} />;
});
ForwardedInput.displayName = 'ForwardedInput';

const initialFormState: Omit<ConsumoBordo, "id"> = {
  individuos: [{ id: `new-${Date.now()}`, nome: "", documento: "", status: "presente", dataSaida: "", horaSaida: "", credencial: "azul" }],
  veiculo: "",
  placa: "",
  produto: "",
  notaFiscal: "",
  tipoServico: "",
  navio: "",
  terminal: "teg",
  empresa: "",
  vigilante: "",
  data: "",
  hora: "",
}

const credencialConfig = {
    verde: { text: "Permissão de acesso ao navio", icon: ShieldCheck, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    azul: { text: "Acesso restrito à área administrativa", icon: null, className: "" },
};

type FormErrors = Record<string, string>;

export function ConsumoSection() {
  const { data: consumos, loading, addItem, updateItem, deleteItem } = useConsumos()
  const { data: ocorrencias } = useOcorrenciasCompliance();
  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedConsumo, setSelectedConsumo] = useState<ConsumoBordo | null>(null)
  const [formState, setFormState] = useState(initialFormState)
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [complianceAlerts, setComplianceAlerts] = useState<Record<number, OcorrenciaCompliance | null>>({});

    const clearError = (field: string) => {
        if (formErrors[field]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

  const checkCompliance = (documento: string, index: number) => {
    const unmaskedDoc = documento.replace(/\D/g, '');
    if (unmaskedDoc.length > 0) {
        const foundOcorrencia = ocorrencias.find(o => o.documentoIndividuo.replace(/\D/g, '') === unmaskedDoc);
        setComplianceAlerts(prev => ({ ...prev, [index]: foundOcorrencia || null }));
    } else {
        setComplianceAlerts(prev => ({ ...prev, [index]: null }));
    }
  }

  const handleReEntry = (consumo: ConsumoBordo, individuo: Individuo) => {
    setSelectedConsumo(null);
    setFormErrors({});
    const now = new Date();
    
    const { id, individuos, ...restOfConsumo } = consumo;

    setFormState({
        ...restOfConsumo, 
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        individuos: [{
            id: `new-${Date.now()}`,
            nome: individuo.nome, 
            documento: individuo.documento,
            status: "presente",
            dataSaida: "",
            horaSaida: "",
            credencial: individuo.credencial || "azul",
        }],
    });
    checkCompliance(individuo.documento, 0);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && selectedConsumo) {
        setFormState({
          ...selectedConsumo,
          tipoServico: selectedConsumo.tipoServico || "",
          individuos: selectedConsumo.individuos.map(ind => ({ ...ind, documento: ind.documento || "", credencial: ind.credencial || "azul", dataSaida: ind.dataSaida || "", horaSaida: ind.horaSaida || "" })),
        })
        selectedConsumo.individuos.forEach((ind, index) => checkCompliance(ind.documento || "", index));
    } else if (!isFormOpen) {
        setFormErrors({});
    }
  }, [isFormOpen, selectedConsumo])

  const filteredConsumos = useMemo(() => consumos.filter(consumo => {
    const searchLower = search.toLowerCase().trim();
    const textMatch = !searchLower || (
      consumo.veiculo.toLowerCase().includes(searchLower) ||
      consumo.placa.toLowerCase().includes(searchLower) ||
      consumo.produto.toLowerCase().includes(searchLower) ||
      consumo.notaFiscal.toLowerCase().includes(searchLower) ||
      (consumo.tipoServico && consumo.tipoServico.toLowerCase().includes(searchLower)) ||
      consumo.navio.toLowerCase().includes(searchLower) ||
      consumo.empresa.toLowerCase().includes(searchLower) ||
      consumo.individuos.some(individuo =>
        individuo.nome.toLowerCase().includes(searchLower) || (individuo.documento && individuo.documento.includes(searchLower))
      )
    );

    const dateMatch = (() => {
        if (!dataInicio && !dataFim) {
            if (searchLower) {
                return true;
            }
            const today = new Date().toISOString().split('T')[0];
            return consumo.data === today;
        }
        const entrada = consumo.data;
        const afterStart = dataInicio ? entrada >= dataInicio : true;
        const beforeEnd = dataFim ? entrada <= dataFim : true;
        return afterStart && beforeEnd;
    })();

    return textMatch && dateMatch;
  }), [consumos, search, dataInicio, dataFim]);

  const { totalRegistros, presentes, totalIndividuos, totalTeg, totalTeag } = useMemo(() => {
    const allIndividuos = consumos.flatMap(c => c.individuos || []);
    return {
        totalRegistros: consumos.length,
        presentes: allIndividuos.filter(i => i.status === "presente").length,
        totalIndividuos: allIndividuos.length,
        totalTeg: consumos.filter(c => c.terminal === "teg").length,
        totalTeag: consumos.filter(c => c.terminal === "teag").length
    };
  }, [consumos]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
    clearError(id);
  }

  const handleMaskedInputChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    clearError(id);
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }))
    clearError(id);
  }

  const handleIndividuoChange = (index: number, field: keyof Omit<Individuo, 'id'>, value: string) => {
    const newIndividuos = [...formState.individuos];
    (newIndividuos[index] as any)[field] = value;
    setFormState(prev => ({ ...prev, individuos: newIndividuos }));
    clearError(`individuo-${index}-${field}`);
     if (field === 'documento') {
      checkCompliance(value, index);
    }
  }

  const addIndividuo = () => {
    setFormState(prev => ({
      ...prev,
      individuos: [...prev.individuos, { id: `new-${Date.now()}`, nome: "", documento: "", status: "presente", dataSaida: "", horaSaida: "", credencial: "azul" }],
    }))
  }

  const removeIndividuo = (index: number) => {
    if (formState.individuos.length > 1) {
      setFormState(prev => ({ ...prev, individuos: prev.individuos.filter((_, i) => i !== index) }))
      setComplianceAlerts(prev => {
        const newAlerts = {...prev};
        delete newAlerts[index];
        return newAlerts;
      });
    }
  }

  const handleAddNew = () => {
    setSelectedConsumo(null);
    setComplianceAlerts({});
    const now = new Date();
    setFormState({ 
        ...initialFormState,
        data: now.toISOString().split("T")[0],
        hora: now.toTimeString().slice(0, 5),
        individuos: [{ id: `new-${Date.now()}`, nome: "", documento: "", status: "presente", dataSaida: "", horaSaida: "", credencial: "azul" }],
    }); 
    setIsFormOpen(true)
  }

  const handleEdit = (consumoId: string) => {
    const consumoToEdit = consumos.find(c => c.id === consumoId)
    if (consumoToEdit) {
      setSelectedConsumo(consumoToEdit)
      setIsFormOpen(true)
    }
  }

  const handleDelete = (consumoId: string) => {
    const consumoToDelete = consumos.find(c => c.id === consumoId)
    if (consumoToDelete) {
      setSelectedConsumo(consumoToDelete)
      setIsDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedConsumo) return
    setIsSaving(true)
    try {
      await deleteItem(selectedConsumo.id)
      setIsDeleteConfirmOpen(false)
      setSelectedConsumo(null)
    } catch (error) {
      console.error("Erro ao excluir consumo:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!formState.data) errors.data = "Data é obrigatória.";
    if (!formState.hora) errors.hora = "Hora é obrigatória.";
    if (!formState.veiculo.trim()) errors.veiculo = "Veículo é obrigatório.";
    if (!formState.placa.trim()) errors.placa = "Placa é obrigatória.";
    if (!formState.produto.trim()) errors.produto = "Produto é obrigatório.";
    if (!formState.notaFiscal.trim()) errors.notaFiscal = "Nota Fiscal é obrigatória.";
    if (!formState.navio.trim()) errors.navio = "Navio é obrigatório.";
    if (!formState.empresa.trim()) errors.empresa = "Empresa é obrigatória.";
    if (!formState.vigilante.trim()) errors.vigilante = "Vigilante é obrigatório.";

    formState.individuos.forEach((ind, index) => {
        if (!ind.nome.trim()) {
            errors[`individuo-${index}-nome`] = "Nome do indivíduo é obrigatório.";
        }
        if (!ind.documento.trim() || ind.documento.length < 14) { // CPF mask
            errors[`individuo-${index}-documento`] = "Documento (CPF) é obrigatório.";
        }
    });

    if (formState.individuos.length === 0 || !formState.individuos[0].nome.trim()) {
        errors.individuos = "Pelo menos um indivíduo deve ser registrado.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

 const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
        const individuosToSave: Individuo[] = formState.individuos
            .filter(ind => ind.nome.trim() !== "")
            .map((ind): Individuo => {
                const status: "presente" | "saiu" = (ind.horaSaida && ind.dataSaida) ? 'saiu' : 'presente';
                if (status === "presente") {
                    return {
                        ...ind,
                        status: "presente",
                        horaSaida: "",
                        dataSaida: ""
                    };
                } else {
                    return {
                        ...ind,
                        status: "saiu"
                    };
                }
            });

        if (individuosToSave.length === 0) {
            setIsSaving(false);
            return;
        }

        const dataToSave = { ...formState, individuos: individuosToSave };

        if (selectedConsumo) {
            await updateItem(selectedConsumo.id, dataToSave);
        } else {
            const entry: Omit<ConsumoBordo, "id"> = {
                ...dataToSave,
                individuos: dataToSave.individuos.map(ind => ({
                    ...ind,
                    id: ind.id.startsWith('new-') ? `ind-${new Date().getTime()}-${Math.random().toString(36).substring(2, 9)}` : ind.id
                })),
            };
            await addItem(entry);
        }
        setIsFormOpen(false);
    } catch (error) {
        console.error("Erro ao salvar consumo:", error);
    } finally {
        setIsSaving(false);
    }
  }

  const handleSaida = async (consumoId: string, individuoId: string) => {
    const consumo = consumos.find(c => c.id === consumoId)
    if (!consumo) return

    const now = new Date()
    const updatedIndividuos = consumo.individuos.map((ind): Individuo =>
      ind.id === individuoId
        ? { ...ind, status: "saiu", dataSaida: now.toISOString().split('T')[0], horaSaida: now.toTimeString().slice(0, 5) }
        : ind
    )

    try {
      await updateItem(consumoId, { individuos: updatedIndividuos })
    } catch (error) {
      console.error("Erro ao registrar saída do indivíduo:", error)
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split('-');
    if(!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  }

  const formatDateTime = (data: string, hora: string) => {
    if(!data || !hora) return "-";
    return `${formatDate(data)} ${hora}`;
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  const CredencialBadge = ({ credencial }: { credencial?: "azul" | "vermelho" | "verde" }) => {
    if (!credencial || !["verde", "vermelho"].includes(credencial)) return null;

    const config = credencialConfig[credencial];
    const Icon = config.icon

    return (
      <div className={cn("mt-1 flex items-center gap-2 rounded-md p-1.5 text-xs font-semibold", config.className)}>
        {Icon && <Icon className="h-3 w-3 flex-shrink-0" />}
        <span className="text-xs">{config.text}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><Truck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{totalRegistros}</p><p className="text-sm text-muted-foreground">Total de Registros</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/10"><Ship className="h-6 w-6 text-blue-400" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">A Bordo</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-400/10"><Users className="h-6 w-6 text-purple-400" /></div><div><p className="text-2xl font-bold">{totalIndividuos}</p><p className="text-sm text-muted-foreground">Total Indivíduos</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEG</span></div><div><p className="text-2xl font-bold">{totalTeg}</p><p className="text-sm text-muted-foreground">Pier TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary"><span className="text-xs font-bold text-muted-foreground">TEAG</span></div><div><p className="text-2xl font-bold">{totalTeag}</p><p className="text-sm text-muted-foreground">Pier TEAG</p></div></CardContent></Card>
      </div>

        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-1 grid gap-2">
                        <Label htmlFor="search">Busca</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="search" placeholder="Buscar por placa, navio, pessoa..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dataInicio">Data Início</Label>
                        <IMaskInput
                            mask="0000-00-00"
                            id="dataInicio"
                            placeholder="AAAA-MM-DD"
                            value={dataInicio}
                            onAccept={(value) => setDataInicio(value as string)}
                            as={ForwardedInput}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="dataFim">Data Fim</Label>
                        <IMaskInput
                            mask="0000-00-00"
                            id="dataFim"
                            placeholder="AAAA-MM-DD"
                            value={dataFim}
                            onAccept={(value) => setDataFim(value as string)}
                            as={ForwardedInput}
                        />
                    </div>
                    <div className="flex gap-2 md:col-span-3 lg:col-span-2">
                         <Button variant="outline" onClick={() => { setDataInicio(""); setDataFim(""); }} className="w-1/2"><XCircle className="mr-2 h-4 w-4"/>Limpar</Button>
                        <Button onClick={handleAddNew} className="w-1/2"><Plus className="mr-2 h-4 w-4" />Novo Registro</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if(!isOpen) { setFormState(initialFormState); setComplianceAlerts({}) }; setIsFormOpen(isOpen); }}>
        <DialogContent className="max-w-2xl w-full mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>{selectedConsumo ? "Editar Registro" : "Registrar Consumo de Bordo"}</DialogTitle></DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto p-1">
            <div className="grid gap-4 py-4">
              <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
                 <div className="flex items-center justify-between">
                    <Label className={cn(formErrors.individuos && "text-destructive")}>Indivíduos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addIndividuo}><Plus className="mr-1 h-3 w-3" />Adicionar</Button>
                </div>
                {formErrors.individuos && <p className="text-red-500 text-xs mt-2">{formErrors.individuos}</p>}
                <div className="space-y-4">
                  {formState.individuos.map((ind, index) => (
                    <div key={ind.id || index} className="grid grid-cols-[1fr_auto] gap-3 items-start border-t pt-4 first:border-t-0 first:pt-0">
                      <div className="space-y-3">
                        {complianceAlerts[index] && (
                            <Alert variant="destructive">
                                <ShieldAlert className="h-4 w-4" />
                                <AlertTitle>Alerta de Compliance</AlertTitle>
                                <AlertDescription>
                                <p>Indivíduo com ocorrência. Consulte a seção de Compliance.</p>
                                </AlertDescription>
                            </Alert>
                        )}
                         <Input placeholder={`Nome do indivíduo ${index + 1}`} value={ind.nome} onChange={e => handleIndividuoChange(index, "nome", e.target.value)} className={cn(formErrors[`individuo-${index}-nome`] && "border-red-500")} />
                         {formErrors[`individuo-${index}-nome`] && <p className="text-red-500 text-xs">{formErrors[`individuo-${index}-nome`]}</p>}

                        <IMaskInput
                            mask="000.000.000-00"
                            placeholder="Documento (CPF)"
                            value={ind.documento}
                            onAccept={(value) => handleIndividuoChange(index, 'documento', value as string)}
                            as={ForwardedInput}
                            className={cn(formErrors[`individuo-${index}-documento`] && "border-red-500")}
                        />
                        {formErrors[`individuo-${index}-documento`] && <p className="text-red-500 text-xs">{formErrors[`individuo-${index}-documento`]}</p>}

                         <Select value={ind.credencial || 'azul'} onValueChange={(value) => handleIndividuoChange(index, "credencial", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="azul">Azul (Administrativo)</SelectItem>
                            <SelectItem value="vermelho">Vermelho (Pier)</SelectItem>
                            <SelectItem value="verde">Verde (Navio)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formState.individuos.length > 1 && 
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeIndividuo(index)} className="shrink-0 text-destructive hover:text-destructive mt-2"><X className="h-4 w-4" /></Button>}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="data">Data de Entrada</Label>
                    <IMaskInput
                        mask="0000-00-00"
                        id="data"
                        placeholder="AAAA-MM-DD"
                        value={formState.data}
                        onAccept={(value) => handleMaskedInputChange('data', value as string)}
                        as={ForwardedInput}
                        className={cn(formErrors.data && "border-red-500")}
                    />
                    {formErrors.data && <p className="text-red-500 text-xs">{formErrors.data}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="hora">Hora de Entrada</Label>
                    <Input id="hora" type="time" value={formState.hora} onChange={handleInputChange} className={cn(formErrors.hora && "border-red-500")} />
                    {formErrors.hora && <p className="text-red-500 text-xs">{formErrors.hora}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="veiculo">Veículo</Label>
                    <Input id="veiculo" placeholder="Ex: Caminhão Baú" value={formState.veiculo} onChange={handleInputChange} className={cn(formErrors.veiculo && "border-red-500")} />
                    {formErrors.veiculo && <p className="text-red-500 text-xs">{formErrors.veiculo}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="placa">Placa</Label>
                    <Input id="placa" placeholder="Ex: ABC-1234" value={formState.placa} onChange={handleInputChange} className={cn(formErrors.placa && "border-red-500")} />
                    {formErrors.placa && <p className="text-red-500 text-xs">{formErrors.placa}</p>}
                </div>
               </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="produto">Produto</Label>
                    <Input id="produto" placeholder="Ex: Água Mineral" value={formState.produto} onChange={handleInputChange} className={cn(formErrors.produto && "border-red-500")} />
                    {formErrors.produto && <p className="text-red-500 text-xs">{formErrors.produto}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="tipoServico">Tipo de Serviço</Label>
                    <Input id="tipoServico" placeholder="Ex: Manutenção" value={formState.tipoServico || ''} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="notaFiscal">Nota Fiscal</Label>
                    <Input id="notaFiscal" placeholder="Ex: NF-001234" value={formState.notaFiscal} onChange={handleInputChange} className={cn(formErrors.notaFiscal && "border-red-500")} />
                    {formErrors.notaFiscal && <p className="text-red-500 text-xs">{formErrors.notaFiscal}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="navio">Navio</Label>
                    <Input id="navio" placeholder="Nome do navio" value={formState.navio} onChange={handleInputChange} className={cn(formErrors.navio && "border-red-500")} />
                    {formErrors.navio && <p className="text-red-500 text-xs">{formErrors.navio}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="terminal">Terminal</Label>
                    <Select value={formState.terminal} onValueChange={v => handleSelectChange("terminal", v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="teg">TEG</SelectItem><SelectItem value="teag">TEAG</SelectItem></SelectContent></Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="empresa">Empresa</Label>
                    <Input id="empresa" placeholder="Nome da empresa" value={formState.empresa} onChange={handleInputChange} className={cn(formErrors.empresa && "border-red-500")} />
                    {formErrors.empresa && <p className="text-red-500 text-xs">{formErrors.empresa}</p>}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vigilante">Vigilante</Label>
                <Input id="vigilante" placeholder="Nome do vigilante" value={formState.vigilante} onChange={handleInputChange} className={cn(formErrors.vigilante && "border-red-500")} />
                {formErrors.vigilante && <p className="text-red-500 text-xs">{formErrors.vigilante}</p>}
              </div>
              
              {selectedConsumo && (
                <div className="rounded-lg border bg-secondary/30 p-4 mt-4">
                  <Label className="mb-3 block">Controle de Saída dos Indivíduos</Label>
                  <div className="space-y-4">
                  {formState.individuos.map((ind, index) => (
                    <div key={ind.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-1">
                        <Label htmlFor={`nome-saida-${index}`} className="text-xs text-muted-foreground">Nome</Label>
                        <Input id={`nome-saida-${index}`} value={ind.nome} disabled />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`data-saida-${index}`} className="text-xs text-muted-foreground">Data Saída</Label>
                        <IMaskInput
                            mask="0000-00-00"
                            id={`data-saida-${index}`}
                            placeholder="AAAA-MM-DD"
                            value={ind.dataSaida || ""}
                            onAccept={(value) => handleIndividuoChange(index, 'dataSaida', value as string)}
                            as={ForwardedInput}
                        />
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
                <Button onClick={handleSave} disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedConsumo ? "Salvar" : "Registrar"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>Tem certeza de que deseja excluir o registro de consumo para "{selectedConsumo?.navio}"? Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader><CardTitle>Histórico de Consumo de Bordo</CardTitle></CardHeader>
        <CardContent>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {filteredConsumos.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum registro encontrado para os filtros aplicados.</p>
                ) : (
                    filteredConsumos.map(consumo => (
                        <div key={consumo.id} className="rounded-lg border bg-card p-4 space-y-4 flex flex-col">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">{consumo.navio} <span className="font-normal text-muted-foreground">({consumo.empresa})</span></p>
                                    <p className="text-sm text-muted-foreground">{consumo.veiculo} - {consumo.placa}</p>
                                </div>
                                 <span className={cn("font-semibold text-xs", consumo.terminal === 'teg' ? "text-primary" : "text-info")}>{consumo.terminal.toUpperCase()}</span>
                            </div>

                            <div className="space-y-3 flex-grow">
                                {consumo.individuos.map(individuo => (
                                    <div key={individuo.id} className="border-t pt-3 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p>{individuo.nome}</p>
                                                <p className="text-sm text-muted-foreground">{individuo.documento}</p>
                                                <CredencialBadge credencial={individuo.credencial} />
                                            </div>
                                            <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}>{individuo.status === "presente" ? "A Bordo" : "Saiu"}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 text-sm">
                                            <div className="flex flex-col"><span className="text-muted-foreground">Entrada</span><span>{formatDateTime(consumo.data, consumo.hora)}</span></div>
                                            <div className="flex flex-col"><span className="text-muted-foreground">Saída</span><span>{individuo.horaSaida ? formatDateTime(individuo.dataSaida || consumo.data, individuo.horaSaida) : '-'}</span></div>
                                        </div>
                                         <div className="flex items-center justify-end gap-2 pt-2">
                                            {individuo.status === 'presente' ? (
                                                <Button size="sm" variant="outline" onClick={() => handleSaida(consumo.id, individuo.id)}>Registrar Saída</Button>
                                            ) : (
                                                <Button size="sm" variant="outline" onClick={() => handleReEntry(consumo, individuo)}>Nova Entrada</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                             <div className="border-t pt-3 text-sm space-y-2">
                                <div className="flex justify-between"><span className="text-muted-foreground">Produto:</span><span>{consumo.produto}</span></div>
                                {consumo.tipoServico && <div className="flex justify-between"><span className="text-muted-foreground">Serviço:</span><span>{consumo.tipoServico}</span></div>}
                                <div className="flex justify-between"><span className="text-muted-foreground">Nota Fiscal:</span><span>{consumo.notaFiscal}</span></div>
                                <div className="flex justify-between"><span className="text-muted-foreground">Vigilante:</span><span>{ consumo.vigilante}</span></div>
                            </div>

                            <div className="border-t pt-3 flex items-center justify-end">
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(consumo.id)}>Editar Grupo</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(consumo.id)} className="text-destructive">Excluir Grupo</DropdownMenuItem>
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
                            <th className="px-4 py-3 font-medium">Documento</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Entrada</th>
                            <th className="px-4 py-3 font-medium">Saída</th>
                            <th className="px-4 py-3 font-medium">Empresa</th>
                            <th className="px-4 py-3 font-medium">Navio</th>
                            <th className="px-4 py-3 font-medium">Terminal</th>
                            <th className="px-4 py-3 font-medium">Produto</th>
                            <th className="px-4 py-3 font-medium">Tipo de Serviço</th>
                            <th className="px-4 py-3 font-medium">Nota Fiscal</th>
                            <th className="px-4 py-3 font-medium">Veículo</th>
                            <th className="px-4 py-3 font-medium">Placa</th>
                            <th className="px-4 py-3 font-medium">Vigilante</th>
                            <th className="px-4 py-3 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {filteredConsumos.length === 0 ? (
                            <tr><td colSpan={15} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado para os filtros aplicados.</td></tr>
                        ) : (
                            filteredConsumos.map(consumo => (
                                consumo.individuos.map((individuo, individuoIndex) => (
                                <tr key={individuo.id} className={cn("hover:bg-muted/50", individuo.credencial && credencialConfig[individuo.credencial]?.className.replace(/text-\S+/, '').replace(/dark:text-\S+/, ''))}>
                                    <td className="px-4 py-3 font-medium">
                                        <div>{individuo.nome}</div>
                                        <CredencialBadge credencial={individuo.credencial} />
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{individuo.documento}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", individuo.status === "presente" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300")}>
                                            {individuo.status === "presente" ? "A Bordo" : "Saiu"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{individuoIndex === 0 ? formatDateTime(consumo.data, consumo.hora) : ''}</td>
                                    <td className="px-4 py-3">
                                        {individuo.status === 'presente' ? (
                                            <Button size="xs" variant="outline" onClick={() => handleSaida(consumo.id, individuo.id)}><LogOut className="mr-1 h-3 w-3" /> Sair</Button>
                                        ) : individuo.horaSaida ? (
                                            <div className="flex items-center gap-2">
                                                <span>{formatDateTime(individuo.dataSaida || consumo.data, individuo.horaSaida)}</span>
                                                <Button size="xs" variant="outline" onClick={() => handleReEntry(consumo, individuo)}><LogIn className="mr-1 h-3 w-3" /> Nova Entrada</Button>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                     {individuoIndex === 0 ? (
                                        <>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.empresa}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.navio}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top"><div className={`text-xs font-semibold ${consumo.terminal === "teg" ? "text-primary" : "text-info"}`}>{consumo.terminal.toUpperCase()}</div></td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.produto}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.tipoServico || '-'}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.notaFiscal}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.veiculo}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.placa}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top">{consumo.vigilante}</td>
                                            <td rowSpan={consumo.individuos.length} className="px-4 py-3 align-top text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleEdit(consumo.id)}>Editar Grupo</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDelete(consumo.id)} className="text-destructive">Excluir Grupo</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </>
                                    ) : null}
                                </tr>
                                ))
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
