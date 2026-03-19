'use client'

import { useState, useEffect, forwardRef, useMemo } from "react"
import { Plus, Search, UserCheck, UserX, Clock, Building2, Loader2, FilePenLine, Trash2, LogIn, MoreVertical, ShieldCheck, ShieldAlert, XCircle, WifiOff, AlertTriangle, Ship, UserPlus, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type Visitante, type OcorrenciaCompliance } from "@/lib/store"
import { useVisitantes, useNavios } from "@/hooks/use-firebase"
import { useOcorrenciasCompliance } from "@/hooks/use-compliance"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { addToOutbox } from "@/utils/db"
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { IMaskInput } from "react-imask";

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
  "Cozinha",
  "Projeto netuno",
  "RH",
  "Outros",
];

const cnhCategorias = ["A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"];

const credencialConfig = {
    verde: { text: "Permissão de acesso ao navio", icon: ShieldCheck, className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    vermelho: { text: "Permissão de acesso ao pier", icon: ShieldAlert, className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
    azul: { text: "Acesso restrito à área administrativa", icon: null, className: "" },
};

type Person = {
  tempId: string;
  nome: string;
  documento: string;
  diversos: boolean;
  rg: string;
  cnh: string;
  dataNascimento: string;
  validadeRg: string;
  validadeCnh: string;
  telefone: string;
  categoriaCnh: string;
};

const initialPersonState: Omit<Person, 'tempId'> = {
  nome: "",
  documento: "",
  diversos: false,
  rg: "",
  cnh: "",
  dataNascimento: "",
  validadeRg: "",
  validadeCnh: "",
  telefone: "",
  categoriaCnh: "",
};

type FormErrors = Partial<Record<keyof Omit<Visitante, 'id' | 'status'> | 'outroDestino', string>>;
type PersonFormErrors = Partial<Record<keyof Omit<Person, 'tempId'>, string>>;

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
  const { data: navios, loading: loadingNavios } = useNavios();
  const isOnline = useOnlineStatus();

  const [search, setSearch] = useState("")
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [selectedVisitante, setSelectedVisitante] = useState<Visitante | null>(null)
  
  const [formState, setFormState] = useState<Omit<Visitante, "id" | "status">>(initialFormState)
  const [persons, setPersons] = useState<Person[]>([]);
  const [outroDestino, setOutroDestino] = useState("");

  const [formErrors, setFormErrors] = useState<{ common: FormErrors; persons: PersonFormErrors[] }>({ common: {}, persons: [] });
  
  const [complianceAlert, setComplianceAlert] = useState<OcorrenciaCompliance | null>(null);
  const [personComplianceAlerts, setPersonComplianceAlerts] = useState<(OcorrenciaCompliance | null)[]>([]);
  const [isCriticalAlertOpen, setIsCriticalAlertOpen] = useState(false);

  const checkCompliance = (documento: string, personIndex?: number) => {
    const unmaskedDoc = documento.replace(/\D/g, '');
    if (unmaskedDoc.length > 0) {
        const foundOcorrencia = ocorrencias.find(o => o.documentoIndividuo.replace(/\D/g, '') === unmaskedDoc);
        
        if (selectedVisitante || typeof personIndex !== 'number') {
            setComplianceAlert(foundOcorrencia || null);
        } else {
            setPersonComplianceAlerts(prev => {
                const newAlerts = [...prev];
                newAlerts[personIndex] = foundOcorrencia || null;
                return newAlerts;
            });
        }

        if (foundOcorrencia?.statusAlerta === 'Crítico') {
            setIsCriticalAlertOpen(true);
        }
    } else {
        if (selectedVisitante || typeof personIndex !== 'number') {
            setComplianceAlert(null);
        } else {
            setPersonComplianceAlerts(prev => {
                const newAlerts = [...prev];
                newAlerts[personIndex] = null;
                return newAlerts;
            });
        }
    }
  }

  const handleReEntry = (visitante: Visitante) => {
    setSelectedVisitante(null); // Keep as "add new" mode
    setFormErrors({ common: {}, persons: [] });
    setPersonComplianceAlerts([]);
    setComplianceAlert(null);
    const now = new Date();

    const {
        id,
        status,
        nome,
        documento,
        diversos,
        rg,
        cnh,
        dataNascimento,
        validadeRg,
        validadeCnh,
        telefone,
        categoriaCnh,
        ...commonData
    } = visitante;

    // Populate common fields in formState
    const newFormState: Omit<Visitante, "id" | "status"> = {
        ...initialFormState, // Start with initial state to clear any previous data
        ...commonData,
        dataEntrada: toBrDate(now.toISOString().split("T")[0]),
        horaEntrada: now.toTimeString().slice(0, 5),
        dataSaida: "",
        horaSaida: "",
    };
    
    if (!destinos.includes(visitante.destino)) {
        setOutroDestino(visitante.destino);
        newFormState.destino = "Outros";
    } else {
        setOutroDestino("");
    }
    setFormState(newFormState);

    // Populate person-specific fields in 'persons' state
    const person: Person = {
        tempId: uuidv4(),
        nome: nome,
        documento: documento,
        diversos: diversos || false,
        rg: rg || "",
        cnh: cnh || "",
        dataNascimento: toBrDate(dataNascimento),
        validadeRg: toBrDate(validadeRg),
        validadeCnh: toBrDate(validadeCnh),
        telefone: telefone || "",
        categoriaCnh: categoriaCnh || "",
    };
    setPersons([person]);

    checkCompliance(documento, 0); // Check compliance for the first (and only) person

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
      setFormErrors({ common: {}, persons: [] });
      setComplianceAlert(null);
      setPersonComplianceAlerts([]);
    }
  }, [isFormOpen, selectedVisitante]);

  const presentes = visitantes.filter(v => v.status === "presente").length
  const sairam = visitantes.filter(v => v.status === "saiu").length
  const navioTeg = navios.find(n => n.id === 'teg');
  const navioTeag = navios.find(n => n.id === 'teag');

  const filteredVisitantes = useMemo(() => visitantes.filter(v => {
      const searchLower = search.toLowerCase().trim();
      const textMatch = !searchLower || (
          v.nome.toLowerCase().includes(searchLower) ||
          v.empresa.toLowerCase().includes(searchLower) ||
          v.documento.includes(searchLower) ||
          (v.placa && v.placa.toLowerCase().includes(searchLower))
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

  const clearError = (field: string, personIndex?: number) => {
    if (typeof personIndex === 'number') {
        setFormErrors(prev => {
            const newPersonErrors = [...(prev.persons || [])];
            if (newPersonErrors[personIndex]) {
                delete newPersonErrors[personIndex][field as keyof PersonFormErrors];
            }
            return { ...prev, persons: newPersonErrors };
        });
    } else {
        setFormErrors(prev => {
            const newCommonErrors = { ...prev.common };
            delete newCommonErrors[field as keyof FormErrors];
            return { ...prev, common: newCommonErrors };
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
      const newErrors = { ...formErrors.common };
      diverseFields.forEach(field => delete newErrors[field as keyof FormErrors]);
      setFormErrors(prev => ({...prev, common: newErrors}));
    }
  }

  const handlePersonInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPersons(prev => prev.map((p, i) => i === index ? { ...p, [id]: value } : p));
    clearError(id, index);
  }
  
  const handlePersonMaskedInputChange = (index: number, id: string, value: string) => {
    setPersons(prev => prev.map((p, i) => i === index ? { ...p, [id]: value } : p));
    clearError(id, index);
    if (id === 'documento') {
      checkCompliance(value, index);
    }
  };

  const handlePersonSelectChange = (index: number, id: string, value: string) => {
    setPersons(prev => prev.map((p, i) => i === index ? { ...p, [id]: value } : p));
    clearError(id, index);
  };
  
  const handlePersonCheckboxChange = (index: number, id: string, checked: boolean) => {
    setPersons(prev => prev.map((p, i) => i === index ? { ...p, [id]: checked } : p));
     if (id === 'diversos' && !checked) {
        setFormErrors(prev => {
            const newPersonErrors = [...prev.persons];
            if (newPersonErrors[index]) {
                delete newPersonErrors[index].rg;
                delete newPersonErrors[index].validadeRg;
                delete newPersonErrors[index].cnh;
                delete newPersonErrors[index].validadeCnh;
                delete newPersonErrors[index].categoriaCnh;
                delete newPersonErrors[index].dataNascimento;
                delete newPersonErrors[index].telefone;
            }
            return { ...prev, persons: newPersonErrors };
        });
    }
  };

  const addPerson = () => {
    setPersons(prev => [...prev, { ...initialPersonState, tempId: uuidv4() }]);
  };

  const removePerson = (index: number) => {
    if (persons.length <= 1) {
        toast.info("Deve haver pelo menos uma pessoa no registro.");
        return;
    }
    setPersons(prev => prev.filter((_, i) => i !== index));
    setPersonComplianceAlerts(prev => prev.filter((_, i) => i !== index));
    setFormErrors(prev => ({ ...prev, persons: prev.persons.filter((_, i) => i !== index) }));
  };


  const handleAddNew = () => {
    setSelectedVisitante(null);
    setComplianceAlert(null);
    setPersonComplianceAlerts([]);
    const now = new Date();
    setFormState({
      ...initialFormState,
      dataEntrada: toBrDate(now.toISOString().split("T")[0]),
      horaEntrada: now.toTimeString().slice(0, 5),
    });
    setPersons([{...initialPersonState, tempId: uuidv4()}]);
    setOutroDestino("");
    setFormErrors({ common: {}, persons: [] });
    setIsFormOpen(true);
  }

  const handleEdit = (visitante: Visitante) => {
    if (!isOnline) {
        toast.error("A edição está desabilitada em modo offline.");
        return;
    }
    setSelectedVisitante(visitante)
    setPersons([]);
    setFormErrors({ common: {}, persons: [] });
    checkCompliance(visitante.documento);
    setIsFormOpen(true)
  }

  const handleDelete = (visitante: Visitante) => {
    if (!isOnline) {
        toast.error("A exclusão está desabilitada em modo offline.");
        return;
    }
    setSelectedVisitante(visitante)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedVisitante || !isOnline) return
    setIsSaving(true)
    try {
      await deleteItem(selectedVisitante.id)
      toast.success("Visitante excluído com sucesso!");
      setIsDeleteConfirmOpen(false)
      setSelectedVisitante(null)
    } catch (error) {
      console.error("Erro ao excluir visitante:", error)
      toast.error("Erro ao excluir o visitante.")
    } finally {
      setIsSaving(false)
    }
  }

  const validateForm = () => {
    const commonErrors: FormErrors = {};
    const personsErrors: PersonFormErrors[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate common fields
    if (!formState.empresa.trim()) commonErrors.empresa = "Empresa é obrigatória.";
    if (!formState.motivo.trim()) commonErrors.motivo = "Motivo da visita é obrigatório.";
    if (!formState.destino.trim()) commonErrors.destino = "Destino é obrigatório.";
    if (formState.destino === "Outros" && !outroDestino.trim()) {
        commonErrors.outroDestino = "Especifique o destino se 'Outros'.";
    }

    const isDiversos = selectedVisitante ? formState.diversos : persons.some(p => p.diversos);

    if (isDiversos && !formState.placa.trim()) {
      commonErrors.placa = "Placa é obrigatória pois 'Diversos' foi selecionado.";
    } else if (formState.placa && formState.placa.trim().length > 0 && formState.placa.trim().length < 7) {
      commonErrors.placa = "Placa inválida.";
    }

    const commonDateFields: Array<keyof Omit<Visitante, "id" | "status">> = ['dataEntrada', 'dataSaida'];
    commonDateFields.forEach(field => {
        const brDateValue = formState[field] as string;
        if (brDateValue) {
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(brDateValue)) {
                commonErrors[field as keyof FormErrors] = "Formato de data inválido (DD/MM/AAAA).";
            } else {
                const date = new Date(toIsoDate(brDateValue) + "T00:00:00");
                if (isNaN(date.getTime())) commonErrors[field as keyof FormErrors] = "Data inválida.";
            }
        }
    });
    
    // Multi-add mode validation
    if (!selectedVisitante) {
      persons.forEach((person, index) => {
          const personErrors: PersonFormErrors = {};
          if (!person.nome.trim()) personErrors.nome = "Nome completo é obrigatório.";
          if (!person.documento.trim() || person.documento.length < 14) personErrors.documento = "Documento (CPF) é obrigatório.";

          if (person.diversos) {
              const requiredFields: Partial<Record<keyof Person, string>> = {
                  rg: "RG é obrigatório.",
                  validadeRg: "Validade do RG é obrigatória.",
                  cnh: "CNH é obrigatória.",
                  validadeCnh: "Validade da CNH é obrigatória.",
                  categoriaCnh: "Categoria da CNH é obrigatória.",
                  dataNascimento: "Data de nascimento é obrigatória.",
                  telefone: "Telefone é obrigatório."
              };
              for (const [field, message] of Object.entries(requiredFields)) {
                  if (!person[field as keyof typeof person]) {
                      personErrors[field as keyof PersonFormErrors] = message;
                  }
              }
          }

          const personDateFields: Array<keyof Person> = ['validadeRg', 'validadeCnh', 'dataNascimento'];
          personDateFields.forEach(field => {
              const brDateValue = person[field] as string;
              if (brDateValue) {
                  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(brDateValue)) {
                      personErrors[field as keyof PersonFormErrors] = "Formato de data inválido (DD/MM/AAAA).";
                  } else {
                      const isoDate = toIsoDate(brDateValue);
                      const date = new Date(isoDate + "T00:00:00");
                      if (isNaN(date.getTime())) {
                          personErrors[field as keyof PersonFormErrors] = "Data inválida.";
                          return;
                      }

                      if (field === 'validadeRg' || field === 'validadeCnh') {
                          if (date < today) personErrors[field as keyof PersonFormErrors] = "Documento vencido.";
                      }
                      if (field === 'dataNascimento') {
                          if (date >= today) personErrors[field as keyof PersonFormErrors] = "Data de nascimento deve ser no passado.";
                      }
                  }
              }
          });

          personsErrors[index] = personErrors;
      });
    } else { // Single edit mode validation
        if (!formState.nome.trim()) commonErrors.nome = "Nome completo é obrigatório.";
        if (!formState.documento.trim() || formState.documento.length < 14) commonErrors.documento = "Documento (CPF) é obrigatório.";
        
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
                    commonErrors[field as keyof FormErrors] = message;
                }
            }
        }
        
        const allDateFields: Array<keyof Omit<Visitante, "id" | "status">> = ['validadeRg', 'validadeCnh', 'dataNascimento'];
        allDateFields.forEach(field => {
            const brDateValue = formState[field] as string;
            if (brDateValue) {
                if (!/^\d{2}\/\d{2}\/\d{4}$/.test(brDateValue)) {
                    commonErrors[field as keyof FormErrors] = "Formato de data inválido (DD/MM/AAAA).";
                } else {
                    const isoDate = toIsoDate(brDateValue);
                    const date = new Date(isoDate + "T00:00:00");
                    if (isNaN(date.getTime())) {
                        commonErrors[field as keyof FormErrors] = "Data inválida.";
                        return;
                    }

                    if (field === 'validadeRg' || field === 'validadeCnh') {
                        if (date < today) commonErrors[field as keyof FormErrors] = "Documento vencido.";
                    }
                    if (field === 'dataNascimento') {
                        if (date >= today) commonErrors[field as keyof FormErrors] = "Data de nascimento deve ser no passado.";
                    }
                }
            }
        });
    }

    setFormErrors({ common: commonErrors, persons: personsErrors });
    return Object.keys(commonErrors).length === 0 && personsErrors.every(p => Object.keys(p).length === 0);
  };

  const handleSave = async () => {
    if (isCriticalAlertOpen) {
      toast.error("Não é possível salvar enquanto um alerta de compliance crítico estiver ativo.");
      return;
    }
    if (!validateForm()) {
        toast.warning("Por favor, verifique os erros no formulário.");
        return;
    }

    setIsSaving(true);
    const finalDestino = formState.destino === "Outros" ? outroDestino : formState.destino;
    
    // Handle update (edit mode)
    if (selectedVisitante) {
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
        
        try {
            if (!isOnline) {
                toast.error("Não é possível editar registros existentes offline.");
                setIsSaving(false);
                return;
            }
            await updateItem(selectedVisitante.id, dataToSave);
            toast.success("Visitante atualizado com sucesso!");
            setIsFormOpen(false);
            setSelectedVisitante(null);
        } catch (error) {
            console.error("Erro ao salvar visitante:", error);
            toast.error("Ocorreu um erro ao salvar o visitante.");
        } finally {
            setIsSaving(false);
        }

    } else { // Handle create new (multi-person mode)
        const commonData = {
            ...formState,
            destino: finalDestino,
            dataEntrada: toIsoDate(formState.dataEntrada),
            dataSaida: "",
            horaSaida: "",
            status: "presente" as const,
        };
        
        const promises = persons.map(person => {
            const visitorData: Omit<Visitante, "id"> = {
                ...commonData,
                nome: person.nome,
                documento: person.documento,
                diversos: person.diversos,
                rg: person.rg,
                validadeRg: toIsoDate(person.validadeRg),
                cnh: person.cnh,
                validadeCnh: toIsoDate(person.validadeCnh),
                categoriaCnh: person.categoriaCnh,
                dataNascimento: toIsoDate(person.dataNascimento),
                telefone: person.telefone,
            };

            if (!isOnline) {
                const tempId = uuidv4();
                return addToOutbox({ id: tempId, tableName: 'visitantes', data: visitorData });
            }
            return addItem(visitorData);
        });

        try {
            await Promise.all(promises);
            if (!isOnline) {
                if ('serviceWorker' in navigator && 'SyncManager' in window) {
                    navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-new-items'));
                }
                toast.info("Registros salvos localmente. Serão sincronizados quando a conexão for restaurada.");
            } else {
                toast.success(`${persons.length} visitante(s) registrado(s) com sucesso!`);
            }
            setIsFormOpen(false);
            setPersons([]);
            setOutroDestino("");
        } catch (error) {
            console.error("Erro ao salvar visitante(s):", error);
            toast.error("Ocorreu um erro ao salvar o(s) visitante(s).");
        } finally {
            setIsSaving(false);
        }
    }
  };

  const handleRegistrarSaida = async (id: string) => {
    if (!isOnline) {
        toast.error("Funcionalidade desabilitada em modo offline.");
        return;
    }
    try {
      const now = new Date();
      await updateItem(id, {
        status: "saiu",
        dataSaida: now.toISOString().split("T")[0],
        horaSaida: now.toTimeString().slice(0, 5),
      })
      toast.success("Saída registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar saída:", error)
      toast.error("Erro ao registrar a saída.");
    }
  }

  const saveButtonDisabled = isSaving || (!isOnline && !!selectedVisitante) || isCriticalAlertOpen;

  const isLoading = loading || loadingNavios;

  if (isLoading) {
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
                    <p className="font-semibold text-lg text-gray-800">{complianceAlert?.nomeIndividuo || personComplianceAlerts.find(p=>p)?.nomeIndividuo}</p>
                    <p className="text-sm text-gray-600">CPF: {complianceAlert?.documentoIndividuo || personComplianceAlerts.find(p=>p)?.documentoIndividuo}</p>
                </div>
                <Alert variant="destructive" className="bg-white">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="font-bold">Motivo: {complianceAlert?.motivo || personComplianceAlerts.find(p=>p)?.motivo}</AlertTitle>
                    <AlertDescription>
                       Ocorrência registrada em {formatDate(complianceAlert?.dataOcorrencia || personComplianceAlerts.find(p=>p)?.dataOcorrencia || "")}. 
                       <span className="font-bold">É crucial revisar a seção de Compliance antes de qualquer ação.</span>
                    </AlertDescription>
                </Alert>
                 <DialogFooter className="mt-6 sm:justify-center">
                    <Button variant="destructive" onClick={() => setIsCriticalAlertOpen(false)}>Entendido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><UserCheck className="h-6 w-6 text-primary" /></div><div><p className="text-2xl font-bold">{presentes}</p><p className="text-sm text-muted-foreground">Presentes</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><UserX className="h-6 w-6 text-muted-foreground" /></div><div><p className="text-2xl font-bold">{sairam}</p><p className="text-sm text-muted-foreground">Saíram Hoje</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900"><Ship className="h-6 w-6 text-teal-600 dark:text-teal-400" /></div><div><p className="text-lg font-bold truncate">{navioTeg?.nome || 'Sem navio'}</p><p className="text-sm text-muted-foreground">Navio no TEG</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900"><Ship className="h-6 w-6 text-sky-600 dark:text-sky-400" /></div><div><p className="text-lg font-bold truncate">{navioTeag?.nome || 'Sem navio'}</p><p className="text-sm text-muted-foreground">Navio no TEAG</p></div></CardContent></Card>
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
      <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) { setComplianceAlert(null); setPersonComplianceAlerts([]); setSelectedVisitante(null); } }}>
        <DialogContent className="max-w-4xl w-full mx-4 sm:mx-auto">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                {selectedVisitante ? "Editar Visitante" : "Registrar Novo(s) Visitante(s)"}
                {!isOnline && <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"><WifiOff className="h-3 w-3"/>Offline</span>}
                </DialogTitle>
            </DialogHeader>
          
          <div className="max-h-[70vh] overflow-y-auto p-1 -mx-1">
          {selectedVisitante ? (
            <>
            {/* EDIT MODE FORM (Single person) */}
            {complianceAlert && complianceAlert.statusAlerta !== 'Crítico' && (
                <Alert variant="destructive" className="mt-4"><ShieldAlert className="h-4 w-4" /><AlertTitle>Alerta de Compliance</AlertTitle><AlertDescription><p>Indivíduo com ocorrência registrada. Por favor, consulte a seção de Compliance para mais detalhes antes de prosseguir com o registro.</p></AlertDescription></Alert>
            )}
            <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
              <div className="grid gap-2 sm:col-span-2"><Label htmlFor="nome">Nome Completo</Label><Input id="nome" value={formState.nome} onChange={handleInputChange} className={cn(formErrors.common.nome && "border-red-500")} />{formErrors.common.nome && <p className="text-red-500 text-xs">{formErrors.common.nome}</p>}</div>
              <div className="grid gap-2"><Label htmlFor="documento">Documento (CPF)</Label><IMaskInput mask="000.000.000-00" id="documento" value={formState.documento} onAccept={(value) => handleMaskedInputChange('documento', value as string)} as={ForwardedInput} className={cn(formErrors.common.documento && "border-red-500")} />{formErrors.common.documento && <p className="text-red-500 text-xs">{formErrors.common.documento}</p>}</div>
              <div className="grid gap-2"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" value={formState.empresa} onChange={handleInputChange} className={cn(formErrors.common.empresa && "border-red-500")} />{formErrors.common.empresa && <p className="text-red-500 text-xs">{formErrors.common.empresa}</p>}</div>
              <div className="grid gap-2 sm:col-span-2">
                  <div className="flex items-center space-x-2">
                      <Checkbox id="diversos" checked={formState.diversos} onCheckedChange={(checked) => handleCheckboxChange("diversos", checked as boolean)} />
                      <Label htmlFor="diversos" className="text-amber-500 font-semibold">Informações Adicionais (RG, CNH, etc.)</Label>
                  </div>
              </div>
              {formState.diversos && (
                  <>
                      <div className="grid gap-2">
                          <Label htmlFor="rg">RG</Label>
                          <IMaskInput mask="00.000.000-0" id="rg" value={formState.rg} onAccept={(value) => handleMaskedInputChange('rg', value as string)} as={ForwardedInput} className={cn(formErrors.common.rg && "border-red-500")} />
                          {formErrors.common.rg && <p className="text-red-500 text-xs">{formErrors.common.rg}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="validadeRg">Validade RG</Label>
                          <IMaskInput mask="00/00/0000" id="validadeRg" placeholder="DD/MM/AAAA" value={formState.validadeRg} onAccept={(value) => handleMaskedInputChange('validadeRg', value as string)} as={ForwardedInput} className={cn(formErrors.common.validadeRg && "border-red-500")} />
                          {formErrors.common.validadeRg && <p className="text-red-500 text-xs">{formErrors.common.validadeRg}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="cnh">CNH</Label>
                          <IMaskInput mask="00000000000" id="cnh" value={formState.cnh} onAccept={(value) => handleMaskedInputChange('cnh', value as string)} as={ForwardedInput} className={cn(formErrors.common.cnh && "border-red-500")} />
                          {formErrors.common.cnh && <p className="text-red-500 text-xs">{formErrors.common.cnh}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="validadeCnh">Validade CNH</Label>
                          <IMaskInput mask="00/00/0000" id="validadeCnh" placeholder="DD/MM/AAAA" value={formState.validadeCnh} onAccept={(value) => handleMaskedInputChange('validadeCnh', value as string)} as={ForwardedInput} className={cn(formErrors.common.validadeCnh && "border-red-500")} />
                          {formErrors.common.validadeCnh && <p className="text-red-500 text-xs">{formErrors.common.validadeCnh}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="categoriaCnh">Categoria CNH</Label>
                          <Select value={formState.categoriaCnh} onValueChange={(value) => handleSelectChange("categoriaCnh", value)}>
                              <SelectTrigger className={cn(formErrors.common.categoriaCnh && "border-red-500")}>
                                  <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                  {cnhCategorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                          </Select>
                          {formErrors.common.categoriaCnh && <p className="text-red-500 text-xs">{formErrors.common.categoriaCnh}</p>}
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                          <IMaskInput mask="00/00/0000" id="dataNascimento" placeholder="DD/MM/AAAA" value={formState.dataNascimento} onAccept={(value) => handleMaskedInputChange('dataNascimento', value as string)} as={ForwardedInput} className={cn(formErrors.common.dataNascimento && "border-red-500")} />
                          {formErrors.common.dataNascimento && <p className="text-red-500 text-xs">{formErrors.common.dataNascimento}</p>}
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                          <Label htmlFor="telefone">Telefone</Label>
                          <IMaskInput mask={['(00) 0000-0000', '(00) 00000-0000']} id="telefone" value={formState.telefone} onAccept={(value) => handleMaskedInputChange('telefone', value as string)} as={ForwardedInput} className={cn(formErrors.common.telefone && "border-red-500")} />
                          {formErrors.common.telefone && <p className="text-red-500 text-xs">{formErrors.common.telefone}</p>}
                      </div>
                  </>
              )}
               <div className="grid gap-2 sm:col-span-2"><Label htmlFor="motivo">Motivo da Visita</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} className={cn(formErrors.common.motivo && "border-red-500")} />{formErrors.common.motivo && <p className="text-red-500 text-xs">{formErrors.common.motivo}</p>}</div>
               <div className="grid gap-2"><Label htmlFor="credencial">Credencial</Label><Select value={formState.credencial || 'azul'} onValueChange={(value) => handleSelectChange("credencial", value)}><SelectTrigger className={cn(formErrors.common.credencial && "border-red-500")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="azul">Azul</SelectItem><SelectItem value="vermelho">Vermelho</SelectItem><SelectItem value="verde">Verde</SelectItem></SelectContent></Select>{formErrors.common.credencial && <p className="text-red-500 text-xs">{formErrors.common.credencial}</p>}</div>
               <div className="grid gap-2"><Label htmlFor="destino">Destino</Label><Select value={formState.destino} onValueChange={(value) => handleSelectChange("destino", value)}><SelectTrigger className={cn(formErrors.common.destino && "border-red-500")}><SelectValue /></SelectTrigger><SelectContent>{destinos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>{formErrors.common.destino && <p className="text-red-500 text-xs">{formErrors.common.destino}</p>}</div>
               {formState.destino === "Outros" && (<div className="grid gap-2 sm:col-span-2"><Label htmlFor="outroDestino">Especifique o Destino</Label><Input id="outroDestino" value={outroDestino} onChange={(e) => { setOutroDestino(e.target.value); clearError('outroDestino'); }} className={cn(formErrors.common.outroDestino && "border-red-500")} />{formErrors.common.outroDestino && <p className="text-red-500 text-xs">{formErrors.common.outroDestino}</p>}</div>)}
               <div className="grid gap-2"><Label htmlFor="dataEntrada">Data Entrada</Label><IMaskInput mask="00/00/0000" id="dataEntrada" value={formState.dataEntrada} onAccept={(value) => handleMaskedInputChange('dataEntrada', value as string)} as={ForwardedInput} className={cn(formErrors.common.dataEntrada && "border-red-500")} />{formErrors.common.dataEntrada && <p className="text-red-500 text-xs">{formErrors.common.dataEntrada}</p>}</div>
               <div className="grid gap-2"><Label htmlFor="horaEntrada">Hora Entrada</Label><Input id="horaEntrada" type="time" value={formState.horaEntrada} onChange={handleInputChange} /></div>
               <div className="grid gap-2"><Label htmlFor="dataSaida">Data Saída</Label><IMaskInput mask="00/00/0000" id="dataSaida" value={formState.dataSaida} onAccept={(value) => handleMaskedInputChange('dataSaida', value as string)} as={ForwardedInput} className={cn(formErrors.common.dataSaida && "border-red-500")} />{formErrors.common.dataSaida && <p className="text-red-500 text-xs">{formErrors.common.dataSaida}</p>}</div>
               <div className="grid gap-2"><Label htmlFor="horaSaida">Hora Saída</Label><Input id="horaSaida" type="time" value={formState.horaSaida} onChange={handleInputChange} /></div>
               <div className="grid gap-2"><Label htmlFor="notaFiscal">Nota Fiscal</Label><Input id="notaFiscal" value={formState.notaFiscal} onChange={handleInputChange} /></div>
               <div className="grid gap-2"><Label htmlFor="placa">Placa</Label><IMaskInput mask={[{ mask: 'aaa-0000' }, { mask: 'aaa0a00' }]} id="placa" value={formState.placa} onAccept={(value) => handleMaskedInputChange("placa", value as string)} prepare={(str) => str.toUpperCase()} as={ForwardedInput} className={cn(formErrors.common.placa && "border-red-500")} />{formErrors.common.placa && <p className="text-red-500 text-xs">{formErrors.common.placa}</p>}</div>
               <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" value={formState.observacoes} onChange={handleInputChange} /></div>
            </div>
            </>
          ) : (
            <>
            {/* ADD NEW MODE FORM (Multi person) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 p-1">
                <div className="grid gap-2"><Label htmlFor="empresa">Empresa</Label><Input id="empresa" value={formState.empresa} onChange={handleInputChange} className={cn(formErrors.common.empresa && "border-red-500")} />{formErrors.common.empresa && <p className="text-red-500 text-xs">{formErrors.common.empresa}</p>}</div>
                <div className="grid gap-2"><Label htmlFor="motivo">Motivo da Visita</Label><Input id="motivo" value={formState.motivo} onChange={handleInputChange} className={cn(formErrors.common.motivo && "border-red-500")} />{formErrors.common.motivo && <p className="text-red-500 text-xs">{formErrors.common.motivo}</p>}</div>
                <div className="grid gap-2"><Label htmlFor="credencial">Credencial de Acesso</Label><Select value={formState.credencial || 'azul'} onValueChange={(value) => handleSelectChange("credencial", value)}><SelectTrigger className={cn(formErrors.common.credencial && "border-red-500")}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="azul">Azul (Administrativo)</SelectItem><SelectItem value="vermelho">Vermelho (Pier)</SelectItem><SelectItem value="verde">Verde (Navio)</SelectItem></SelectContent></Select>{formErrors.common.credencial && <p className="text-red-500 text-xs">{formErrors.common.credencial}</p>}</div>
                <div className="grid gap-2"><Label htmlFor="destino">Destino</Label><Select value={formState.destino} onValueChange={(value) => handleSelectChange("destino", value)}><SelectTrigger className={cn(formErrors.common.destino && "border-red-500")}><SelectValue /></SelectTrigger><SelectContent>{destinos.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>{formErrors.common.destino && <p className="text-red-500 text-xs">{formErrors.common.destino}</p>}</div>
                {formState.destino === "Outros" && (<div className="grid gap-2 sm:col-span-2"><Label htmlFor="outroDestino">Especifique o Destino</Label><Input id="outroDestino" value={outroDestino} onChange={(e) => { setOutroDestino(e.target.value); clearError('outroDestino'); }} className={cn(formErrors.common.outroDestino && "border-red-500")} />{formErrors.common.outroDestino && <p className="text-red-500 text-xs">{formErrors.common.outroDestino}</p>}</div>)}
                <div className="grid gap-2"><Label htmlFor="dataEntrada">Data Entrada</Label><IMaskInput mask="00/00/0000" id="dataEntrada" placeholder="DD/MM/AAAA" value={formState.dataEntrada} onAccept={(value) => handleMaskedInputChange('dataEntrada', value as string)} as={ForwardedInput} className={cn(formErrors.common.dataEntrada && "border-red-500")} />{formErrors.common.dataEntrada && <p className="text-red-500 text-xs">{formErrors.common.dataEntrada}</p>}</div>
                <div className="grid gap-2"><Label htmlFor="horaEntrada">Hora Entrada</Label><Input id="horaEntrada" type="time" value={formState.horaEntrada} onChange={handleInputChange} /></div>
                <div className="grid gap-2"><Label htmlFor="notaFiscal">Nota Fiscal</Label><Input id="notaFiscal" value={formState.notaFiscal || ""} onChange={handleInputChange} /></div>
                <div className="grid gap-2"><Label htmlFor="placa">Placa</Label><IMaskInput mask={[{ mask: 'aaa-0000' }, { mask: 'aaa0a00' }]} id="placa" placeholder="N/A se não houver" value={formState.placa || ""} onAccept={(value) => handleMaskedInputChange("placa", value as string)} prepare={(str) => str.toUpperCase()} as={ForwardedInput} className={cn(formErrors.common.placa && "border-red-500")} />{formErrors.common.placa && <p className="text-red-500 text-xs">{formErrors.common.placa}</p>}</div>
                <div className="grid gap-2 sm:col-span-2"><Label htmlFor="observacoes">Observações</Label><Textarea id="observacoes" value={formState.observacoes || ""} onChange={handleInputChange} /></div>
            </div>
            
            <div className="mt-6">
                <h3 className="text-lg font-medium mb-2 border-b pb-2">Pessoas</h3>
                {persons.map((person, index) => (
                    <div key={person.tempId} className="border rounded-lg p-4 mb-4 relative">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid gap-2 sm:col-span-2"><Label htmlFor={`nome-${index}`}>Nome Completo</Label><Input id="nome" value={person.nome} onChange={(e) => handlePersonInputChange(index, e)} className={cn(formErrors.persons[index]?.nome && "border-red-500")} />{formErrors.persons[index]?.nome && <p className="text-red-500 text-xs">{formErrors.persons[index]?.nome}</p>}</div>
                            <div className="grid gap-2"><Label htmlFor={`documento-${index}`}>Documento (CPF)</Label><IMaskInput mask="000.000.000-00" id="documento" value={person.documento} onAccept={(value) => handlePersonMaskedInputChange(index, 'documento', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.documento && "border-red-500")} />{formErrors.persons[index]?.documento && <p className="text-red-500 text-xs">{formErrors.persons[index]?.documento}</p>}</div>
                            <div className="flex items-center space-x-2 sm:col-span-2"><Checkbox id="diversos" checked={person.diversos} onCheckedChange={(checked) => handlePersonCheckboxChange(index, "diversos", checked as boolean)} /><Label htmlFor="diversos" className="text-amber-500 font-semibold">Diversos</Label></div>
                            
                            {person.diversos && (
                                <>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`rg-${index}`}>RG</Label>
                                      <IMaskInput mask="00.000.000-0" id="rg" value={person.rg} onAccept={(value) => handlePersonMaskedInputChange(index, 'rg', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.rg && "border-red-500")} />
                                      {formErrors.persons[index]?.rg && <p className="text-red-500 text-xs">{formErrors.persons[index]?.rg}</p>}
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`validadeRg-${index}`}>Validade RG</Label>
                                      <IMaskInput mask="00/00/0000" id="validadeRg" placeholder="DD/MM/AAAA" value={person.validadeRg} onAccept={(value) => handlePersonMaskedInputChange(index, 'validadeRg', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.validadeRg && "border-red-500")} />
                                      {formErrors.persons[index]?.validadeRg && <p className="text-red-500 text-xs">{formErrors.persons[index]?.validadeRg}</p>}
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`cnh-${index}`}>CNH</Label>
                                      <IMaskInput mask="00000000000" id="cnh" value={person.cnh} onAccept={(value) => handlePersonMaskedInputChange(index, 'cnh', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.cnh && "border-red-500")} />
                                      {formErrors.persons[index]?.cnh && <p className="text-red-500 text-xs">{formErrors.persons[index]?.cnh}</p>}
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`validadeCnh-${index}`}>Validade CNH</Label>
                                      <IMaskInput mask="00/00/0000" id="validadeCnh" placeholder="DD/MM/AAAA" value={person.validadeCnh} onAccept={(value) => handlePersonMaskedInputChange(index, 'validadeCnh', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.validadeCnh && "border-red-500")} />
                                      {formErrors.persons[index]?.validadeCnh && <p className="text-red-500 text-xs">{formErrors.persons[index]?.validadeCnh}</p>}
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`categoriaCnh-${index}`}>Categoria CNH</Label>
                                      <Select value={person.categoriaCnh} onValueChange={(value) => handlePersonSelectChange(index, "categoriaCnh", value)}>
                                          <SelectTrigger className={cn(formErrors.persons[index]?.categoriaCnh && "border-red-500")}>
                                              <SelectValue placeholder="Selecione" />
                                          </SelectTrigger>
                                          <SelectContent>
                                              {cnhCategorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                          </SelectContent>
                                      </Select>
                                      {formErrors.persons[index]?.categoriaCnh && <p className="text-red-500 text-xs">{formErrors.persons[index]?.categoriaCnh}</p>}
                                  </div>
                                  <div className="grid gap-2">
                                      <Label htmlFor={`dataNascimento-${index}`}>Data de Nascimento</Label>
                                      <IMaskInput mask="00/00/0000" id="dataNascimento" placeholder="DD/MM/AAAA" value={person.dataNascimento} onAccept={(value) => handlePersonMaskedInputChange(index, 'dataNascimento', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.dataNascimento && "border-red-500")} />
                                      {formErrors.persons[index]?.dataNascimento && <p className="text-red-500 text-xs">{formErrors.persons[index]?.dataNascimento}</p>}
                                  </div>
                                  <div className="grid gap-2 sm:col-span-2">
                                      <Label htmlFor={`telefone-${index}`}>Telefone</Label>
                                      <IMaskInput mask={['(00) 0000-0000', '(00) 00000-0000']} id="telefone" value={person.telefone} onAccept={(value) => handlePersonMaskedInputChange(index, 'telefone', value as string)} as={ForwardedInput} className={cn(formErrors.persons[index]?.telefone && "border-red-500")} />
                                      {formErrors.persons[index]?.telefone && <p className="text-red-500 text-xs">{formErrors.persons[index]?.telefone}</p>}
                                  </div>
                                </> 
                            )}
                        </div>
                         {personComplianceAlerts[index] && personComplianceAlerts[index]?.statusAlerta !== 'Crítico' && (
                            <Alert variant="destructive" className="mt-4"><ShieldAlert className="h-4 w-4" /><AlertTitle>Alerta de Compliance</AlertTitle><AlertDescription><p>Indivíduo com ocorrência registrada.</p></AlertDescription></Alert>
                        )}
                        <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removePerson(index)}><UserMinus className="h-4 w-4"/></Button>
                    </div>
                ))}
                 <Button variant="outline" onClick={addPerson} className="mt-2"><UserPlus className="mr-2 h-4 w-4"/>Adicionar Pessoa</Button>
            </div>
            </>
          )}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div style={{ display: 'inline-block' }}> 
                        <Button onClick={handleSave} disabled={saveButtonDisabled}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {selectedVisitante ? "Salvar Alterações" : `Registrar ${persons.length} Pessoa(s)`}
                        </Button>
                    </div>
                </TooltipTrigger>
                {saveButtonDisabled && !isOnline && selectedVisitante && <TooltipContent>A edição está desabilitada em modo offline.</TooltipContent>}
            </Tooltip>
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
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isSaving || !isOnline}>
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
                                    <Button size="sm" variant="outline" onClick={() => handleRegistrarSaida(v.id)} disabled={!isOnline}>Sair</Button>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleReEntry(v)}>Nova Entrada</Button>
                                )}
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={!isOnline}><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
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
                            <Button size="sm" variant="outline" onClick={() => handleRegistrarSaida(v.id)} disabled={!isOnline} className="flex items-center gap-2"><Clock className="h-4 w-4" /><span>Sair</span></Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleReEntry(v)} className="flex items-center gap-2"><LogIn className="h-4 w-4" /><span>Nova Entrada</span></Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(v)} disabled={!isOnline}><FilePenLine className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(v)} className="text-destructive hover:text-destructive/90" disabled={!isOnline}><Trash2 className="h-4 w-4" /></Button>
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
