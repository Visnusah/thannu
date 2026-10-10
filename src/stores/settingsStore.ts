import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type SettingsState = {
  hapticsEnabled: boolean
  remindersEnabled: boolean
  newSaveReminders: boolean
  priorityNudges: boolean
  digestTime: string // HH:mm
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

type SettingsActions = {
  setHapticsEnabled: (v: boolean) => void
  setRemindersEnabled: (v: boolean) => void
  setNewSaveReminders: (v: boolean) => void
  setPriorityNudges: (v: boolean) => void
  setDigestTime: (v: string) => void
  setQuietHoursStart: (v: string | null) => void
  setQuietHoursEnd: (v: string | null) => void
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      hapticsEnabled: true,
      remindersEnabled: true,
      newSaveReminders: true,
      priorityNudges: true,
      digestTime: '09:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',

      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      setNewSaveReminders: (newSaveReminders) => set({ newSaveReminders }),
      setPriorityNudges: (priorityNudges) => set({ priorityNudges }),
      setDigestTime: (digestTime) => set({ digestTime }),
      setQuietHoursStart: (quietHoursStart) => set({ quietHoursStart }),
      setQuietHoursEnd: (quietHoursEnd) => set({ quietHoursEnd }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
