'use client'

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Header } from "@/components/dashboard/header"
import { Navigation } from "@/components/dashboard/navigation"
import { VisitantesSection } from "@/components/dashboard/visitantes-section"
import { RefeicoesSection } from "@/components/dashboard/refeicoes-section"
import { TPAsSection } from "@/components/dashboard/tpas-section"
import { ConsumoSection } from "@/components/dashboard/consumo-section"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [activeSection, setActiveSection] = useState("visitantes")

  const renderSection = () => {
    switch (activeSection) {
      case "visitantes":
        return <VisitantesSection />
      case "refeicoes":
        return <RefeicoesSection />
      case "tpas":
        return <TPAsSection />
      case "consumo":
        return <ConsumoSection />
      default:
        return <VisitantesSection />
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Or a message, but the AuthProvider should redirect
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-6">
        {renderSection()}
      </main>
      <footer className="border-t border-border bg-card px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <p>Sistema de Controle - Gestão Operacional</p>
          <p>Versão 1.0.0</p>
        </div>
      </footer>
    </div>
  )
}
