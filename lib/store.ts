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

export interface IndividuoRefeicao {
  id: string
  nome: string
  status: "presente" | "saiu"
  dataSaida?: string // Added
  horaSaida?: string
}

export interface RefeicaoPolicial {
  id: string
  individuos: IndividuoRefeicao[]
  prefixo: string
  categoria: "pm" | "civil"
  vigilante: string
  data: string
  hora: string
}

export interface TPA {
  id: string
  nome: string
  funcao: string
  documento: string
  destino: string
  navio: string
  pier: "teg" | "teag"
  observacao: string
  vigilante: string
  data: string
  hora: string
  dataSaida?: string // Added
  horaSaida?: string
  status: "presente" | "saiu"
  credencial?: "azul" | "vermelho" | "verde"
}

export interface Individuo {
  id: string
  nome: string
  status: "presente" | "saiu"
  dataSaida?: string // Added
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
  tipoServico: string // Added service type
  navio: string
  terminal: "teg" | "teag"
  empresa: string
  vigilante: string
  data: string
  hora: string
}
