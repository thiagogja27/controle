'use client'

import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Utensils, CreditCard, Package, BarChart, Settings, Map, ShieldCheck } from "lucide-react"

interface NavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const sections = [
  {
    id: "dashboard",
    label: "Painel de Controle",
    description: "Visão geral do sistema",
    icon: LayoutDashboard,
  },
  {
    id: "visitantes",
    label: "Controle de Visitantes",
    description: "Gerenciar entrada e saída",
    icon: Users,
  },
  {
    id: "compliance",
    label: "Compliance",
    description: "Registro de ocorrências",
    icon: ShieldCheck,
  },
  {
    id: "tpas",
    label: "Controle TPAs",
    description: "Terminais de pagamento",
    icon: CreditCard,
  },
  {
    id: "mapa",
    label: "Mapa do Terminal",
    description: "Visualização em tempo real",
    icon: Map,
  },
  {
    id: "refeicoes",
    label: "Refeições Policiais",
    description: "Controle de refeições",
    icon: Utensils,
  },
  {
    id: "consumo",
    label: "Consumo de Bordo",
    description: "Gestão de estoque",
    icon: Package,
  },
  {
    id: "reports",
    label: "Relatórios",
    description: "Geração e exportação de relatórios",
    icon: BarChart,
  },
    {
    id: "settings",
    label: "Configurações",
    description: "Ajustes e personalizações do sistema",
    icon: Settings,
  }
]

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="flex flex-wrap items-center justify-start sm:justify-center gap-4">
      {sections.map((section) => {
        const Icon = section.icon
        const isActive = activeSection === section.id
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg p-3 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary",
              isActive && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
            )}
          >
            <Icon className="h-7 w-7" />
            <div className="flex flex-col items-start">
              <p className="text-sm font-medium">{section.label}</p>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
