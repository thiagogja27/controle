
'use client'

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSettingsStore } from "@/lib/settings-store"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"

export function SettingsSection() {
  const { toast } = useToast()
  const {
    maxPermanenceHours,
    voiceAlerts,
    voiceAlertsRefeicoes,
    voiceAlertsTPAs,
    voiceAlertsConsumo,
    setMaxPermanenceHours,
    setVoiceAlerts,
    setVoiceAlertsRefeicoes,
    setVoiceAlertsTPAs,
    setVoiceAlertsConsumo,
  } = useSettingsStore()

  const [localMaxHours, setLocalMaxHours] = useState(maxPermanenceHours.toString())
  const [localVoiceAlerts, setLocalVoiceAlerts] = useState(voiceAlerts)
  const [localVoiceAlertsRefeicoes, setLocalVoiceAlertsRefeicoes] = useState(voiceAlertsRefeicoes)
  const [localVoiceAlertsTPAs, setLocalVoiceAlertsTPAs] = useState(voiceAlertsTPAs)
  const [localVoiceAlertsConsumo, setLocalVoiceAlertsConsumo] = useState(voiceAlertsConsumo)
  const [hasMounted, setHasMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // Update local state when the store changes (e.g., after initial load from localStorage)
  useEffect(() => {
    setLocalMaxHours(maxPermanenceHours.toString())
    setLocalVoiceAlerts(voiceAlerts)
    setLocalVoiceAlertsRefeicoes(voiceAlertsRefeicoes)
    setLocalVoiceAlertsTPAs(voiceAlertsTPAs)
    setLocalVoiceAlertsConsumo(voiceAlertsConsumo)
  }, [hasMounted, maxPermanenceHours, voiceAlerts, voiceAlertsRefeicoes, voiceAlertsTPAs, voiceAlertsConsumo])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      let settingsChanged = false
      
      // --- Save Max Permanence Hours ---
      const hours = parseInt(localMaxHours, 10)
      if (!isNaN(hours) && hours > 0) {
        if (hours !== maxPermanenceHours) {
          setMaxPermanenceHours(hours)
          settingsChanged = true
        }
      } else {
        toast({
          title: "Valor inválido para Permanência",
          description: "Por favor, insira um número de horas válido e maior que zero.",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      // --- Save Voice Alert Settings ---
      if (localVoiceAlerts !== voiceAlerts) {
        setVoiceAlerts(localVoiceAlerts)
        settingsChanged = true
      }
      if (localVoiceAlertsRefeicoes !== voiceAlertsRefeicoes) {
        setVoiceAlertsRefeicoes(localVoiceAlertsRefeicoes)
        settingsChanged = true
      }
      if (localVoiceAlertsTPAs !== voiceAlertsTPAs) {
        setVoiceAlertsTPAs(localVoiceAlertsTPAs)
        settingsChanged = true
      }
      if (localVoiceAlertsConsumo !== voiceAlertsConsumo) {
        setVoiceAlertsConsumo(localVoiceAlertsConsumo)
        settingsChanged = true
      }

      // --- Provide Feedback ---
      if (settingsChanged) {
        toast({
          title: "Configurações salvas!",
          description: "Suas alterações foram aplicadas com sucesso.",
        })
      } else {
        toast({
          title: "Nenhuma alteração",
          description: "Nenhuma configuração foi modificada.",
          variant: "default",
        })
      }
      
      setIsSaving(false)
    }, 500) // Simulate network delay for better UX
  }

  // Prevents hydration errors by showing a loading state until the component has mounted
  if (!hasMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros e Alertas</CardTitle>
          <CardDescription>Ajuste as regras de negócio e os alertas do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full animate-pulse rounded-md bg-muted/50"></div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Carregando...
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros e Alertas</CardTitle>
          <CardDescription>
            Ajuste as regras de negócio e os alertas do sistema. Clique em "Salvar Alterações" no final para aplicar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8">
          {/* --- General Parameters --- */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="max-permanence" className="flex flex-col space-y-1">
              <span>Tempo Máximo de Permanência (horas)</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">
                Define o limite para o alerta de permanência excedida de visitantes.
              </span>
            </Label>
            <Input
              id="max-permanence"
              type="number"
              className="w-24"
              value={localMaxHours}
              onChange={(e) => setLocalMaxHours(e.target.value)}
              placeholder="Ex: 8"
              disabled={isSaving}
            />
          </div>

          <Separator />

          {/* --- Voice Alerts --- */}
          <div>
             <h3 className="text-lg font-medium">Alertas de Voz</h3>
             <p className="text-sm text-muted-foreground mt-1">
                Ative ou desative a narração por voz para eventos importantes.
             </p>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="voice-alerts-visitantes" className="flex flex-col space-y-1">
              <span>Novos Visitantes</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">Anuncia a entrada de um novo visitante.</span>
            </Label>
            <Switch id="voice-alerts-visitantes" checked={localVoiceAlerts} onCheckedChange={setLocalVoiceAlerts} disabled={isSaving} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="voice-alerts-refeicoes" className="flex flex-col space-y-1">
              <span>Novas Refeições</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">Anuncia o registro de uma nova refeição de policial.</span>
            </Label>
            <Switch id="voice-alerts-refeicoes" checked={localVoiceAlertsRefeicoes} onCheckedChange={setLocalVoiceAlertsRefeicoes} disabled={isSaving} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="voice-alerts-tpas" className="flex flex-col space-y-1">
              <span>Novos TPAs</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">Anuncia a entrada de um novo TPA.</span>
            </Label>
            <Switch id="voice-alerts-tpas" checked={localVoiceAlertsTPAs} onCheckedChange={setLocalVoiceAlertsTPAs} disabled={isSaving} />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="voice-alerts-consumo" className="flex flex-col space-y-1">
              <span>Novo Consumo de Bordo</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">Anuncia um novo registro de consumo de bordo.</span>
            </Label>
            <Switch id="voice-alerts-consumo" checked={localVoiceAlertsConsumo} onCheckedChange={setLocalVoiceAlertsConsumo} disabled={isSaving} />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
