'use client'

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { Navigation } from "@/components/dashboard/navigation"
import { PainelSection } from "@/components/dashboard/painel-section"
import { VisitantesSection } from "@/components/dashboard/visitantes-section"
import { RefeicoesSection } from "@/components/dashboard/refeicoes-section"
import { TPAsSection } from "@/components/dashboard/tpas-section"
import { ConsumoSection } from "@/components/dashboard/consumo-section"
import { ReportsSection } from "@/components/dashboard/reports-section"

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("dashboard")

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
  }

  const sectionComponents: { [key: string]: React.ComponentType } = useMemo(() => ({
    dashboard: PainelSection,
    visitantes: VisitantesSection,
    refeicoes: RefeicoesSection,
    tpas: TPAsSection,
    consumo: ConsumoSection,
    reports: ReportsSection,
  }), []);

  const ActiveComponent = sectionComponents[activeSection] || PainelSection;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Navigation activeSection={activeSection} onSectionChange={handleSectionChange} />
        <div className="grid flex-1 items-start gap-4">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
    </div>
  )
}
