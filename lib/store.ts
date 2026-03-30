"""import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Tipos principais do domínio da aplicação
export interface Individuo {
  id: string
  nome: string
  documento: string // CPF
  status: 'presente' | 'saiu'
  dataSaida?: string // ISO date string (YYYY-MM-DD)
  horaSaida?: string // HH:MM
  credencial?: 'azul' | 'vermelho' | 'verde'
  diversos?: boolean
  rg?: string
  cnh?: string
  dataNascimento?: string // ISO date string
  validadeRg?: string // ISO date string
  validadeCnh?: string // ISO date string
  telefone?: string
  categoriaCnh?: string
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
  terminal: 'teg' | 'teag'
  empresa: string
  vigilante: string
  data: string // ISO date string (YYYY-MM-DD)
  hora: string // HH:MM
}

export interface Visitante {
  id: string;
  nome: string;
  documento: string; // CPF
  empresa: string;
  dataEntrada: string; // ISO date-time string
  dataSaida?: string; // ISO date-time string
  status: 'presente' | 'saiu';
  terminal: 'teg' | 'teag';
  credencial?: 'sif' | 'mog' | 'mof';
  observacao?: string;
  vigilanteEntrada: string;
  vigilanteSaida?: string;
}

export interface Tpa {
    id: string;
    documento: string; // CPF
    nome: string;
    empresa: string;
    funcao: string;
    tipo: 'isps' | 'nao_isps';
    dataValidade: string; // ISO Date String
    dataEmissao: string; // ISO Date String
    observacao?: string;
    status: 'ativo' | 'inativo';
}

export interface OcorrenciaCompliance {
  id: string;
  documentoIndividuo: string; // CPF do indivíduo
  nomeIndividuo: string;
  dataOcorrencia: string; // ISO date string
  motivo: string;
  isCritical: boolean; // Flag para determinar se o bloqueio é mandatório
  registradoPor: string; // Email do usuário que registrou
}


// --- Zustand Store para UI State ---
interface AppState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (isOpen: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
}))

// --- Zustand Store para Outbox (Offline Data) ---
export interface OutboxItem {
  id: string; // UUID para o item da outbox
  tableName: 'consumos' | 'visitantes' | 'tpa' | 'compliance';
  action: 'create' | 'update' | 'delete';
  data: any;
  originalId?: string; // ID original do documento para 'update' e 'delete'
  timestamp: number;
}

interface OutboxState {
  outbox: OutboxItem[];
  addToOutbox: (item: Omit<OutboxItem, 'id' | 'timestamp'>) => void;
  removeFromOutbox: (id: string) => void;
  clearOutbox: () => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      outbox: [],
      addToOutbox: (item) => {
        const newItem: OutboxItem = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          ...item,
        };
        set((state) => ({ outbox: [...state.outbox, newItem] }));
      },
      removeFromOutbox: (id) =>
        set((state) => ({ outbox: state.outbox.filter((item) => item.id !== id) })),
      clearOutbox: () => set({ outbox: [] }),
    }),
    {
      name: 'outbox-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
""