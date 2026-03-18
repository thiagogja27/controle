'use client'

import { useState, useEffect, forwardRef, useMemo } from "react"
import { Plus, Search, UserCheck, UserX, Clock, Building2, Loader2, FilePenLine, Trash2, LogIn, MoreVertical, ShieldCheck, ShieldAlert, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { type Visitante, type OcorrenciaCompliance } from "@/lib/store"
import { useVisitantes } from "@/hooks/use-firebase"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
import { cn } from "@/lib/utils"
import { IMaskInput } from 'react-imask';


const ForwardedInput = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { as, inputRef, ...rest } = props;
    return <Input ref={inputRef || ref} {...rest} />;
});
ForwardedInput.displayName = 'ForwardedInput';

const initialFormState: Omit<Visitante, "id" | "status"> = {
  nome: "",
  documento: "",
  empresa: "",
  motivo: "",
  destino: "",
  dataEntrada: "",
  horaEntrada: "",
  dataSaida: "",
  horaSaida: "",
  credencial: "azul",
  notaFiscal: "",
  placa: "",
  observacoes: "",
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

const cnhCategorias = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"];

const credencialConfig = {
    verde: { text: "Permissão de acesso ao navio", icon: ShieldCheck, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    azul: { text: "Acesso restrito à área administrativa", icon: null, className: "" },
};

type FormErrors = Partial<Record<keyof Omit<Visitante, 'id' | 'status'> | 'outroDestino', string>>;

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

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

export function VisitantesSection() {
  const { data: visitantes, loading, addItem, updateItem, deleteItem } = useVisitantes()
  const { data: ocorrencias } = useOcorrenciasCompliance();
  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null)
  const [formState, setFormState] = useState<Omit<Visitante, "id" | "status">>(initialFormState)
  const [outroDestino, setOutroDestino] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [complianceAlert, setComplianceAlert] = useState<OcorrenciaCompliance | null>(null);

  const checkCompliance = (documento: string) => {
    const unmaskedDoc = documento.replace(/\D/g, '');
    if (unmaskedDoc.length > 0) {
        const foundOcorrencia = ocorrencias.find(o => o.documentoIndividuo.replace(/\D/g, '') === unmaskedDoc);
        setComplianceAlert(foundOcorrencia || null);
    } else {
        setComplianceAlert(null);
    }
  }

  const handleReEntry = (visitante: Visitante) => {
    setSelectedVisitante(null);
    setFormErrors({});
    setComplianceAlert(null);
    const now = new Date();

    const { id, status, ...restOfVisitante } = visitante;
    
    const newFormState: Omit<Visitante, "id" | "status"> = {
      ...restOfVisitante,
      dataEntrada: toBrDate(now.toISOString().split("T")[0]),
      horaEntrada: now.toTimeString().slice(0, 5),
      dataSaida: "",
      horaSaida: "",
      credencial: visitante.credencial || "azul",
      dataNascimento: toBrDate(visitante.dataNascimento),
      validadeRg: toBrDate(visitante.validadeRg),
      validadeCnh: toBrDate(visitante.validadeCnh),
    };

    if (!destinos.includes(visitante.destino)) {
      setOutroDestino(visitante.destino);
      newFormState.destino = "Outros"; 
    } else {
      setOutroDestino("");
    }
    
    checkCompliance(visitante.documento);
    
    setFormState(newFormState);
    setIsFormOpen(true);
  };

  useEffect(() => {
    if (isFormOpen && selectedVisitante) {
      const isOutro = !destinos.includes(selectedVisitante.destino);
      setFormState({
        ...selectedVisitante,
        destino: isOutro ? "Outros" : selectedVisitante.destino,
        credencial: selectedVisitante.credencial || "azul",
        notaFiscal: selectedVisitante.notaFiscal || "",
        placa: selectedVisitante.placa || "",
        observacoes: selectedVisitante.observacoes || "",
        diversos: selectedVisitante.diversos || false,
        rg: selectedVisitante.rg || "",
        cnh: selectedVisitante.cnh || "",
        dataNascimento: toBrDate(selectedVisitante.dataNascimento),
        validadeRg: toBrDate(selectedVisitante.validadeRg),
        validadeCnh: toBrDate(selectedVisitante.validadeCnh),
        telefone: selectedVisitante.telefone || "",
        categoriaCnh: selectedVisitante.categoriaCnh || "",
        dataEntrada: toBrDate(selectedVisitante.dataEntrada),
        horaEntrada: selectedVisitante.horaEntrada || "",
        dataSaida: toBrDate(selectedVisitante.dataSaida),
        horaSaida: selectedVisitante.horaSaida || "",
      });
      setOutroDestino(isOutro ? selectedVisitante.destino : "");
    } else if (!isFormOpen) {
      setFormErrors({});
    }
  }, [isFormOpen, selectedVisitante]);

  const presentes = visitantes.filter(v => v.status === "presente").length
  const sairam = visitantes.filter(v => v.status === "saiu").length

  const filteredVisitantes = useMemo(() => visitantes.filter(v => {
      const searchLower = search.toLowerCase().trim();
      const textMatch = !searchLower || (
          v.nome.toLowerCase().includes(searchLower) ||
          v.empresa.toLowerCase().includes(searchLower) ||
          v.documento.includes(search)
      );

      if (!dataInicio && !dataFim) {
          const today = new Date().toISOString().split('T')[0];
          return v.dataEntrada === today && textMatch;
      }

      const entrada = v.dataEntrada;
      const afterStart = dataInicio ? entrada >= dataInicio : true;
      const beforeEnd = dataFim ? entrada <= dataFim : true;
      return afterStart && beforeEnd && textMatch;
  }), [visitantes, search, dataInicio, dataFim]);

  const clearError = (field: string) => {
    if (formErrors[field as keyof FormErrors]) {
        setFormErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[field as keyof FormErrors];
            return newErrors;
        });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
    clearError(id);
  }
  
  const handleMaskedInputChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    clearError(id);
    if (id === 'documento') {
      checkCompliance(value);
    }
  };
  
  const handleSelectChange = (id: string, value: string) => {
    setFormState(prev => ({ ...prev, [id]: value }));
    if (id === 'destino' && value !== 'Outros') {
      setOutroDestino("");
      clearError('outroDestino');
    }
    clearError(id);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormState(prev => ({ ...prev, [id]: checked }))
    if (id === 'diversos' && !checked) {
      // Clear errors for all fields inside 'diversos' when it's unchecked
      const diverseFields = ['rg', 'validadeRg', 'cnh', 'validadeCnh', 'categoriaCnh', 'dataNascimento', 'telefone'];
      const newErrors = { ...formErrors };
      diverseFields.forEach(field => delete newErrors[field as keyof FormErrors]);
      setFormErrors(newErrors);
    }
  }

  const handleAddNew = () => {
    setSelectedVisitante(null);
    setFormErrors({});
    setComplianceAlert(null);
    const now = new Date();
    setFormState({
      ...initialFormState,
      dataEntrada: toBrDate(now.toISOString().split("T")[0]),
      horaEntrada: now.toTimeString().slice(0, 5),
    });
    setOutroDestino("");
    setIsFormOpen(true);
  }

  const handleEdit = (visitante: Visitante) => {
    setSelectedVisitante(visitante)
    setFormErrors({});
    checkCompliance(visitante.documento);
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

  const validateForm = () => {
    const errors: FormErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formState.nome.trim()) errors.nome = "Nome completo é obrigatório.";
    if (!formState.documento.trim() || formState.documento.length < 14) errors.documento = "Documento (CPF) é obrigatório.";
    if (!formState.empresa.trim()) errors.empresa = "Empresa é obrigatória.";
    if (!formState.motivo.trim()) errors.motivo = "Motivo da visita é obrigatório.";
    if (!formState.destino.trim()) errors.destino = "Destino é obrigatório.";
    if (formState.placa && formState.placa.trim().length > 0 && formState.placa.trim().length < 7) errors.placa = "Placa inválida.";

    if (formState.destino === "Outros" && !outroDestino.trim()) {
        errors.outroDestino = "Especifique o destino se 'Outros'.";
    }

    const dateFields: Array<keyof Omit<Visitante, "id" | "status">> = ['dataEntrada', 'dataSaida', 'validadeRg', 'validadeCnh', 'dataNascimento'];
    dateFields.forEach(field => {
        const brDateValue = formState[field] as string;
        if (brDateValue) {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(brDateValue)) {
                errors[field as keyof FormErrors] = "Formato de data inválido (DD/MM/AAAA).";
            } else {
                const isoDate = toIsoDate(brDateValue);
                const date = new Date(isoDate + "T00:00:00"); // Avoid timezone issues
                if (isNaN(date.getTime())) {
                    errors[field as keyof FormErrors] = "Data inválida.";
                    return;
                }

                if (field === 'validadeRg' || field === 'validadeCnh') {
                    if (date < today) {
                        errors[field as keyof FormErrors] = "Documento vencido.";
                    }
                }
                if (field === 'dataNascimento') {
                    if (date >= today) {
                        errors[field as keyof FormErrors] = "Data de nascimento deve ser no passado.";
                    }
                }
            }
        }
    });

    if (formState.diversos) {
        const requiredFields: Partial<Record<keyof Visitante, string>> = {
            rg: "RG é obrigatório.",
            validadeRg: "Validade do RG é obrigatória.",
            cnh: "CNH é obrigatória.",
            validadeCnh: "Validade da CNH é obrigatória.",
            categoriaCnh: "Categoria da CNH é obrigatória.",
            dataNascimento: "Data de nascimento é obrigatória.",
            telefone: "Telefone é obrigatório."
        };
        for (const [field, message] of Object.entries(requiredFields)) {
            if (!formState[field as keyof typeof formState]) {
                errors[field as keyof FormErrors] = message;
            }
        }
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
        const finalDestino = formState.destino === "Outros" ? outroDestino : formState.destino;
        
        const dataToSave: Omit<Visitante, "id"> = { 
            ...formState,
            dataEntrada: toIsoDate(formState.dataEntrada),
            dataSaida: toIsoDate(formState.dataSaida),
            validadeRg: toIsoDate(formState.validadeRg),
            validadeCnh: toIsoDate(formState.validadeCnh),
            dataNascimento: toIsoDate(formState.dataNascimento),
            destino: finalDestino, 
            status: (formState.horaSaida && formState.dataSaida) ? "saiu" : "presente" 
        };

        if (dataToSave.status === "presente") {
          dataToSave.horaSaida = "";
          dataToSave.dataSaida = "";
        }

        if (selectedVisitante) {
            await updateItem(selectedVisitante.id, dataToSave);
        } else {
            await addItem(dataToSave);
        }

        setIsFormOpen(false);
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
      const now = new Date();
      await updateItem(id, {
        status: "saiu",
        dataSaida: now.toISOString().split("T")[0],
        horaSaida: now.toTimeString().slice(0, 5),
      })
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
    }
  }

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
    <div className="space-y-4 md:space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">Presentes</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><UserX className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{sairam}</p><p className="text-sm text-muted-foreground">Saíram Hoje</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Clock className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{visitantes.length}</p><p className="text-sm text-muted-foreground">Total de Registros</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Building2 className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{new Set(visitantes.map(v => v.empresa)).size}</p><p className="text-sm text-muted-foreground">Empresas</p></div></CardContent></Card>
      </div>

      {/* Search and Actions */}
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <div className="lg:col-span-1 grid gap-2">
                        <Label htmlFor="search">Busca</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input id="search" placeholder="Buscar visitante..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-8" />
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
                        <Button onClick={handleAddNew} className="w-1/2"><Plus className="mr-2 h-4 w-4" />Registrar Entrada</Button>
                    </div>
                </div>
            </CardContent>
        </Card>


      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setComplianceAlert(null); }}>
        <DialogContent className="max-w-lg w-full mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle>{selectedVisitante ? "Editar Visitante" : "Registrar Novo Visitante"}</DialogTitle></DialogHeader>
          
          {complianceAlert && (
            <Alert variant="destructive" className="mt-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Alerta de Compliance</AlertTitle>
              <AlertDescription>
                <p>Indivíduo com ocorrência registrada. Por favor, consulte a seção de Compliance para mais detalhes antes de prosseguir com o registro.</p>
              </AlertDescription>
            </Alert>
          )}

          <div className="max-h-[70vh] overflow-y-auto p-1 mt-4">
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={formState.nome} onChange={handleInputChange} className={cn(formErrors.nome && "border-red-500")} />{formErrors.nome && <p className="text-red-500 text-xs">{formErrors.nome}</p>}</div>
              <div className="grid gap-2">
                <Label htmlFor="documento">Documento (CPF)</Label>
                <IMaskInput
                  mask="000.000.000-00"
                  id="documento"
                  value={formState.documento}
                  onAccept={(value) => handleMaskedInputChange('documento', value as string)}
                  as={ForwardedInput}
                  className={cn(formErrors.documento && "border-red-500")}
                />
                {formErrors.documento && <p className="text-red-500 text-xs">{formErrors.documento}</p>}
              </div>
              <div className="grid gap-2"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" value={formState.empresa} onChange={handleInputChange} className={cn(formErrors.empresa && "border-red-500")} />{formErrors.empresa && <p className="text-red-500 text-xs">{formErrors.empresa}</p>}</div>
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="motivo">Motivo da Visita</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} className={cn(formErrors.motivo && "border-red-500")} />{formErrors.motivo && <p className="text-red-500 text-xs">{formErrors.motivo}</p>}</div>
              
               <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="credencial">Credencial de Acesso</Label>
                <Select value={formState.credencial || 'azul'} onValueChange={(value) => handleSelectChange("credencial", value)}>
                  <SelectTrigger className={cn(formErrors.credencial && "border-red-500")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="azul">Azul (Administrativo)</SelectItem>
                    <SelectItem value="vermelho">Vermelho (Pier)</SelectItem>
                    <SelectItem value="verde">Verde (Navio)</SelectItem>
                  </SelectContent>
                </Select>
                 {formErrors.credencial && <p className="text-red-500 text-xs">{formErrors.credencial}</p>}
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="destino">Destino</Label>
                <Select value={formState.destino} onValueChange={(value) => handleSelectChange("destino", value)}>
                  <SelectTrigger className={cn(formErrors.destino && "border-red-500")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {destinos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
                {formErrors.destino && <p className="text-red-500 text-xs">{formErrors.destino}</p>}
              </div>
              {formState.destino === "Outros" && (
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="outroDestino">Especifique o Destino</Label>
                  <Input id="outroDestino" value={outroDestino} onChange={(e) => { setOutroDestino(e.target.value); clearError('outroDestino'); }} className={cn(formErrors.outroDestino && "border-red-500")} />
                  {formErrors.outroDestino && <p className="text-red-500 text-xs">{formErrors.outroDestino}</p>}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="dataEntrada">Data Entrada</Label>
                <IMaskInput
                    mask="00/00/0000"
                    id="dataEntrada"
                    placeholder="DD/MM/AAAA"
                    value={formState.dataEntrada}
                    onAccept={(value) => handleMaskedInputChange('dataEntrada', value as string)}
                    as={ForwardedInput}
                    className={cn(formErrors.dataEntrada && "border-red-500")}
                />
                {formErrors.dataEntrada && <p className="text-red-500 text-xs">{formErrors.dataEntrada}</p>}
              </div>
              <div className="grid gap-2"><Label htmlFor="horaEntrada">Hora Entrada</Label><Input id="horaEntrada" type="time" value={formState.horaEntrada} onChange={handleInputChange} /></div>

              <div className="grid gap-2">
                <Label htmlFor="dataSaida">Data Saída</Label>
                <IMaskInput
                    mask="00/00/0000"
                    id="dataSaida"
                    placeholder="DD/MM/AAAA"
                    value={formState.dataSaida || ""}
                    onAccept={(value) => handleMaskedInputChange('dataSaida', value as string)}
                    as={ForwardedInput}
                    className={cn(formErrors.dataSaida && "border-red-500")}
                />
                {formErrors.dataSaida && <p className="text-red-500 text-xs">{formErrors.dataSaida}</p>}
              </div>
              <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida || ""} onChange={handleInputChange} /></div>

              <div className="grid gap-2"><Label htmlFor="notaFiscal">Nota Fiscal</Label><Input id="notaFiscal" value={formState.notaFiscal || ""} onChange={handleInputChange} /></div>
              <div className="grid gap-2">
                <Label htmlFor="placa">Placa</Label>
                <IMaskInput
                    mask={[{ mask: 'aaa-0000' }, { mask: 'aaa0a00' }]}
                    id="placa"
                    placeholder="N/A se não houver"
                    value={formState.placa || ""}
                    onAccept={(value) => handleMaskedInputChange("placa", value as string)}
                    prepare={(str) => str.toUpperCase()}
                    as={ForwardedInput}
                    className={cn(formErrors.placa && "border-red-500")}
                />
                {formErrors.placa && <p className="text-red-500 text-xs">{formErrors.placa}</p>}
              </div>
              
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" value={formState.observacoes || ""} onChange={handleInputChange} /></div>
              <div className="flex items-center space-x-2 sm:col-span-2"><Checkbox id="diversos" checked={formState.diversos} onCheckedChange={(checked) => handleCheckboxChange("diversos", checked as boolean)} /><Label htmlFor="diversos">Diversos</Label></div>
              
              {formState.diversos && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="rg">RG</Label>
                    <IMaskInput
                      mask="00.000.000-0"
                      id="rg"
                      value={formState.rg || ""}
                      onAccept={(value) => handleMaskedInputChange('rg', value as string)}
                      as={ForwardedInput}
                      className={cn(formErrors.rg && "border-red-500")}
                    />
                    {formErrors.rg && <p className="text-red-500 text-xs">{formErrors.rg}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="validadeRg">Validade RG</Label>
                    <IMaskInput
                        mask="00/00/0000"
                        id="validadeRg"
                        placeholder="DD/MM/AAAA"
                        value={formState.validadeRg || ""}
                        onAccept={(value) => handleMaskedInputChange('validadeRg', value as string)}
                        as={ForwardedInput}
                        className={cn(formErrors.validadeRg && "border-red-500")}
                    />
                    {formErrors.validadeRg && <p className="text-red-500 text-xs">{formErrors.validadeRg}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="cnh">CNH</Label>
                    <IMaskInput
                      mask="00000000000"
                      id="cnh"
                      value={formState.cnh || ""}
                      onAccept={(value) => handleMaskedInputChange('cnh', value as string)}
                      as={ForwardedInput}
                      className={cn(formErrors.cnh && "border-red-500")}
                    />
                     {formErrors.cnh && <p className="text-red-500 text-xs">{formErrors.cnh}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="validadeCnh">Validade CNH</Label>
                    <IMaskInput
                        mask="00/00/0000"
                        id="validadeCnh"
                        placeholder="DD/MM/AAAA"
                        value={formState.validadeCnh || ""}
                        onAccept={(value) => handleMaskedInputChange('validadeCnh', value as string)}
                        as={ForwardedInput}
                        className={cn(formErrors.validadeCnh && "border-red-500")}
                    />
                    {formErrors.validadeCnh && <p className="text-red-500 text-xs">{formErrors.validadeCnh}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="categoriaCnh">Categoria CNH</Label>
                    <Select value={formState.categoriaCnh || ""} onValueChange={(value) => handleSelectChange("categoriaCnh", value)}>
                      <SelectTrigger id="categoriaCnh" className={cn(formErrors.categoriaCnh && "border-red-500")}>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {cnhCategorias.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {formErrors.categoriaCnh && <p className="text-red-500 text-xs">{formErrors.categoriaCnh}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                    <IMaskInput
                        mask="00/00/0000"
                        id="dataNascimento"
                        placeholder="DD/MM/AAAA"
                        value={formState.dataNascimento || ""}
                        onAccept={(value) => handleMaskedInputChange('dataNascimento', value as string)}
                        as={ForwardedInput}
                        className={cn(formErrors.dataNascimento && "border-red-500")}
                    />
                    {formErrors.dataNascimento && <p className="text-red-500 text-xs">{formErrors.dataNascimento}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      id="telefone"
                      value={formState.telefone || ""}
                      onAccept={(value) => handleMaskedInputChange('telefone', value as string)}
                      as={ForwardedInput}
                      className={cn(formErrors.telefone && "border-red-500")}
                    />
                    {formErrors.telefone && <p className="text-red-500 text-xs">{formErrors.telefone}</p>}
                  </div>
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
        <CardHeader><CardTitle>Histórico de Visitantes</CardTitle></CardHeader>
        <CardContent>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                {filteredVisitantes.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground col-span-full">Nenhum visitante encontrado para os filtros aplicados.</p>
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
                            <CredencialBadge credencial={v.credencial} />
                             <div className="border-t pt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-grow">
                                <div className="flex flex-col"><span className="text-muted-foreground">Credencial</span><span className="font-semibold" style={{ color: v.credencial === 'verde' ? '#22c55e' : v.credencial === 'vermelho' ? '#ef4444' : '#3b82f6' }}>{v.credencial ? v.credencial.charAt(0).toUpperCase() + v.credencial.slice(1) : 'N/A'}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Documento</span><span>{v.documento}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Motivo</span><span>{v.motivo}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Destino</span><span>{v.destino}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Entrada</span><span>{`${formatDate(v.dataEntrada)} ${v.horaEntrada}`}</span></div>
                                <div className="flex flex-col"><span className="text-muted-foreground">Saída</span><span>{v.horaSaida ? `${formatDate(v.dataSaida || v.dataEntrada)} ${v.horaSaida}` : '-'}</span></div>
                                {v.placa && <div className="flex flex-col"><span className="text-muted-foreground">Placa</span><span>{v.placa}</span></div>}
                                {v.notaFiscal && <div className="flex flex-col"><span className="text-muted-foreground">Nota Fiscal</span><span>{v.notaFiscal}</span></div>}
                                {v.diversos && <div className="flex flex-col"><span className="text-muted-foreground">Diversos</span><span>Sim</span></div>}
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
                  <th className="px-4 py-3 font-medium">Credencial</th>
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
                  <tr><td colSpan={13} className="py-8 text-center text-muted-foreground">Nenhum visitante encontrado para os filtros aplicados.</td></tr>
                ) : (
                  filteredVisitantes.map(v => (
                    <tr key={v.id} className={cn(v.credencial && credencialConfig[v.credencial]?.className.replace(/text-\S+/, '').replace(/dark:text-\S+/, ''))}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{v.nome}</div>
                      </td>
                      <td className="px-4 py-3">
                        <CredencialBadge credencial={v.credencial} />
                      </td>
                      <td className="px-4 py-3">{v.documento}</td>
                      <td className="px-4 py-3">{v.empresa}</td>
                      <td className="px-4 py-3">{v.motivo}</td>
                      <td className="px-4 py-3">{v.destino}</td>
                      <td className="px-4 py-3">{v.placa || '-'}</td>
                      <td className="px-4 py-3">{v.notaFiscal || '-'}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={v.observacoes}>{v.observacoes || '-'}</td>
                      <td className="px-4 py-3">{v.diversos ? 'Sim' : 'Não'}</td>
                      <td className="px-4 py-3">
                        <div><span className="font-medium">Ent:</span> {formatDate(v.dataEntrada)} {v.horaEntrada}</div>
                        <div><span className="font-medium">Saí:</span> {v.horaSaida ? `${formatDate(v.dataSaida || v.dataEntrada)} ${v.horaSaida}` : "-"}</div>
                      </td>
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
