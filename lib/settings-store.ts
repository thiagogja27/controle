
'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsState {
  maxPermanenceHours: number
  voiceAlerts: boolean
  voiceAlertsRefeicoes: boolean
  voiceAlertsTPAs: boolean
  voiceAlertsConsumo: boolean
  setMaxPermanenceHours: (hours: number) => void
  setVoiceAlerts: (enabled: boolean) => void
  setVoiceAlertsRefeicoes: (enabled: boolean) => void
  setVoiceAlertsTPAs: (enabled: boolean) => void
  setVoiceAlertsConsumo: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      maxPermanenceHours: 8, // Default value
      voiceAlerts: false, // Default value for Visitantes
      voiceAlertsRefeicoes: false,
      voiceAlertsTPAs: false,
      voiceAlertsConsumo: false,
      setMaxPermanenceHours: (hours) => set({ maxPermanenceHours: hours }),
      setVoiceAlerts: (enabled) => set({ voiceAlerts: enabled }),
      setVoiceAlertsRefeicoes: (enabled) => set({ voiceAlertsRefeicoes: enabled }),
      setVoiceAlertsTPAs: (enabled) => set({ voiceAlertsTPAs: enabled }),
      setVoiceAlertsConsumo: (enabled) => set({ voiceAlertsConsumo: enabled }),
    }),
    {
      name: 'settings-storage', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
)
