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
  horaSaida?: string
  status: "presente" | "saiu"
  foto?: string
  notaFiscal?: string
  placa?: string
  observacoes?: string
  diversos?: boolean
}

export interface IndividuoRefeicao {
  id: string
  nome: string
  status: "presente" | "saiu"
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
  horaSaida?: string
  status: "presente" | "saiu"
}

export interface Individuo {
  id: string
  nome: string
  status: "presente" | "saiu"
  horaSaida?: string
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
