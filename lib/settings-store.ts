'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SettingsState {
  maxPermanenceHours: number
  voiceAlerts: boolean
  setMaxPermanenceHours: (hours: number) => void
  setVoiceAlerts: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      maxPermanenceHours: 8, // Default value
      voiceAlerts: false, // Default value
      setMaxPermanenceHours: (hours) => set({ maxPermanenceHours: hours }),
      setVoiceAlerts: (enabled) => set({ voiceAlerts: enabled }),
    }),
    {
      name: 'settings-storage', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
)
