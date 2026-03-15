'use client'

import { useState, useEffect, useTransition } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSettingsStore } from "@/lib/settings-store"
import { Switch } from "@/components/ui/switch"

export function SettingsSection() {
  const { toast } = useToast()
  const {
    maxPermanenceHours,
    voiceAlerts,
    setMaxPermanenceHours,
    setVoiceAlerts,
  } = useSettingsStore()

  const [localMaxHours, setLocalMaxHours] = useState(maxPermanenceHours.toString())
  const [localVoiceAlerts, setLocalVoiceAlerts] = useState(voiceAlerts)
  const [hasMounted, setHasMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    setLocalMaxHours(maxPermanenceHours.toString())
    setLocalVoiceAlerts(voiceAlerts)
  }, [maxPermanenceHours, voiceAlerts])

  const handleSave = () => {
    setIsSaving(true)

    // Simulate a short delay for better user feedback
    setTimeout(() => {
        const hours = parseInt(localMaxHours, 10)
        let settingsChanged = false

        if (!isNaN(hours) && hours > 0) {
        if (hours !== maxPermanenceHours) {
            setMaxPermanenceHours(hours)
            settingsChanged = true
        }
        } else {
        toast({
            title: "Valor inválido",
            description: "Por favor, insira um número de horas válido.",
            variant: "destructive",
        })
        setIsSaving(false)
        return
        }

        if (localVoiceAlerts !== voiceAlerts) {
        setVoiceAlerts(localVoiceAlerts)
        settingsChanged = true
        }

        if (settingsChanged) {
        toast({
            title: "Configurações salvas!",
            description: "Suas alterações foram salvas com sucesso.",
        })
        } else {
        toast({
            title: "Nenhuma alteração",
            description: "Nenhuma configuração foi modificada.",
        })
        }
        setIsSaving(false)
    }, 500) // 500ms delay
  }

  if (!hasMounted) {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Parâmetros Gerais e Alertas</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Ajuste as regras de negócio e os alertas do sistema.
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="h-24 w-full animate-pulse rounded-md bg-muted/50"></div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Button disabled>Salvar Alterações</Button>
                </CardFooter>
            </Card>
        </div>
    )
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Parâmetros Gerais e Alertas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ajuste as regras de negócio e os alertas do sistema.
          </p>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="max-permanence" className="flex flex-col space-y-1">
              <span>Tempo Máximo de Permanência (horas)</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">
                Define o limite de tempo para acionar o alerta de permanência excedida.
              </span>
            </Label>
            <Input
              id="max-permanence"
              type="number"
              className="max-w-xs"
              value={localMaxHours}
              onChange={(e) => setLocalMaxHours(e.target.value)}
              placeholder="Ex: 8"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="voice-alerts" className="flex flex-col space-y-1">
              <span>Alertas de Voz</span>
              <span className="text-xs font-normal leading-snug text-muted-foreground">
                Ativa a narração por voz para eventos importantes (ex: nova entrada).
              </span>
            </Label>
            <Switch
              id="voice-alerts"
              checked={localVoiceAlerts}
              onCheckedChange={setLocalVoiceAlerts}
              disabled={isSaving}
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
