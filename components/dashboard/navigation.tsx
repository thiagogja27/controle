'use client'

import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Utensils, CreditCard, Package } from "lucide-react"

interface NavigationProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const sections = [
  {
    id: "dashboard",
    label: "Painel de Controle",
    icon: LayoutDashboard,
    description: "Visão geral do sistema"
  },
  {
    id: "visitantes",
    label: "Controle de Visitantes",
    icon: Users,
    description: "Gerenciar entrada e saída"
  },
  {
    id: "refeicoes",
    label: "Refeições Policiais",
    icon: Utensils,
    description: "Controle de refeições"
  },
  {
    id: "tpas",
    label: "Controle TPAs",
    icon: CreditCard,
    description: "Terminais de pagamento"
  },
  {
    id: "consumo",
    label: "Consumo de Bordo",
    icon: Package,
    description: "Gestão de estoque"
  }
]

export function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  return (
    <nav className="flex flex-wrap gap-2 border-b border-border bg-card px-6 py-3">
      {sections.map((section) => {
        const Icon = section.icon
        const isActive = activeSection === section.id
        
        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-left transition-all",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
            <div>
              <p className={cn("text-sm font-medium", isActive && "text-primary")}>
                {section.label}
              </p>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
