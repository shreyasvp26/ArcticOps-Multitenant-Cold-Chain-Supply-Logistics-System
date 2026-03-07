"use client"
import { create } from "zustand"
import { calculateStressLevel, getStressLevel } from "@/lib/utils/risk"

type StressLevelName = "serene" | "attentive" | "urgent" | "emergency"

interface UIState {
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  stressScore: number
  stressLevel: StressLevelName
  theme: "dark"
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  updateStressLevel: (params: { tempExcursions: number; delayedShipments: number; criticalAlerts: number; overdueDocuments: number; capacityIssues: number }) => void
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  stressScore: 0,
  stressLevel: "serene",
  theme: "dark",

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  updateStressLevel: (params) => {
    const score = calculateStressLevel(params)
    const level = getStressLevel(score)
    set({ stressScore: score, stressLevel: level })
  },
}))
