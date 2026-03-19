// Types for the control system
export interface Visitante {
  id: string
  nome: string
  documento: string
  empresa: string
  motivo: string
  destino: string
  dataEntrada: string
  horaEntrada: string
  dataSaida?: string
  horaSaida?: string
  status: "presente" | "saiu"
  credencial?: "azul" | "vermelho" | "verde" // Added for ISPS Code compliance
  foto?: string
  notaFiscal?: string
  placa?: string
  observacoes?: string
  diversos?: boolean
  rg?: string
  cnh?: string
  dataNascimento?: string
  validadeRg?: string
  validadeCnh?: string
  telefone?: string
  categoriaCnh?: string
}

export interface OcorrenciaCompliance {
  id: string;
  nomeIndividuo: string;
  documentoIndividuo: string; // CPF
  dataOcorrencia: string;
  motivo: string;
  descricao: string;
  autor: string; // Quem registrou
  statusAlerta: "Nenhum" | "Crítico";
}

export interface IndividuoRefeicao {
  id: string
  nome: string
  status: "presente" | "saiu"
  dataSaida?: string // Added
  horaSaida?: string
}

export interface RefeicaoPolicial {
  id: string
  data: string
  hora: string
  setor: "Tático" | "Viaturas" | "Equipe" // Setor da polícia
  individuos: IndividuoRefeicao[]
  observacao?: string
  total: number // Total de refeições
}

export interface TPA {
  id: string
  nome: string
  funcao: string
  documento: string
  placa?: string
  destino: string
  navio: string
  pier: "teg" | "teag"
  observacao?: string
  vigilante: string
  data: string
  hora: string
  dataSaida?: string
  horaSaida?: string
  status: "presente" | "saiu"
  credencial?: "azul" | "vermelho" | "verde"
  numeroCip: string
}

// Used by ConsumoBordo
export interface Individuo {
  id: string
  nome: string
  documento: string // This is the new field
  status: "presente" | "saiu"
  dataSaida?: string
  horaSaida?: string
  credencial?: "azul" | "vermelho" | "verde"
}

export interface ConsumoBordo {
  id: string
  individuos: Individuo[]
  veiculo: string
  placa: string
  produto: string
  notaFiscal: string
  tipoServico?: string
  navio: string
  terminal: "teg" | "teag"
  empresa: string
  vigilante: string
  data: string
  hora: string
}

export interface Navio {
  id: "teg" | "teag";
  nome: string;
  dataAtracacao?: string;
  horaAtracacao?: string;
  dataDesatracacao?: string;
  horaDesatracacao?: string;
}
