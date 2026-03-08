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
}

export interface RefeicaoPolicial {
  id: string
  nome: string
  prefixo: string
  categoria: "pm" | "civil"
  vigilante: string
  data: string
  hora: string
  horaSaida?: string
  status: "presente" | "saiu"
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
}

export interface ConsumoBordo {
  id: string
  individuos: Individuo[]
  veiculo: string
  placa: string
  produto: string
  notaFiscal: string
  navio: string
  terminal: "teg" | "teag"
  empresa: string
  vigilante: string
  data: string
  hora: string
  horaSaida?: string
  status: "presente" | "saiu"
}

// Firebase Realtime Database Structure:
//
// /visitantes
//   /{id}
//     - nome: string
//     - documento: string
//     - empresa: string
//     - motivo: string
//     - destino: string
//     - dataEntrada: string (YYYY-MM-DD)
//     - horaEntrada: string (HH:mm)
//     - horaSaida?: string (HH:mm)
//     - status: "presente" | "saiu"
//     - foto?: string
//     - notaFiscal?: string
//     - placa?: string
//     - observacoes?: string
//
// /refeicoes
//   /{id}
//     - nome: string
//     - prefixo: string
//     - categoria: "pm" | "civil"
//     - vigilante: string
//     - data: string (YYYY-MM-DD)
//     - hora: string (HH:mm)
//     - horaSaida?: string (HH:mm)
//     - status: "presente" | "saiu"
//
// /tpas
//   /{id}
//     - nome: string
//     - funcao: string
//     - documento: string
//     - destino: string
//     - navio: string
//     - pier: "teg" | "teag"
//     - observacao: string
//     - vigilante: string
//     - data: string (YYYY-MM-DD)
//     - hora: string (HH:mm)
//     - horaSaida?: string (HH:mm)
//     - status: "presente" | "saiu"
//
// /consumos
//   /{id}
//     - individuos: Array<{id: string, nome: string}>
//     - veiculo: string
//     - placa: string
//     - produto: string
//     - notaFiscal: string
//     - navio: string
//     - terminal: "teg" | "teag"
//     - empresa: string
//     - vigilante: string
//     - data: string (YYYY-MM-DD)
//     - hora: string (HH:mm)
//     - horaSaida?: string (HH:mm)
//     - status: "presente" | "saiu"
