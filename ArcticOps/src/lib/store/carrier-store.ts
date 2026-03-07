"use client"
import { create } from "zustand"
import type { Carrier } from "@/lib/types/carrier"
import { MOCK_CARRIERS } from "@/lib/mock-data/carriers"

interface CarrierState {
  carriers: Carrier[]
  getAvailableCarriers: (mode?: string, tempZone?: string) => Carrier[]
  getCarrierById: (id: string) => Carrier | null
}

export const useCarrierStore = create<CarrierState>()((set, get) => ({
  carriers: MOCK_CARRIERS,

  getAvailableCarriers: (mode, tempZone) => {
    return get().carriers.filter((c) => {
      if (mode && !c.modes.includes(mode as "air" | "sea" | "rail" | "road")) return false
      if (tempZone && !c.tempCapabilities.includes(tempZone as "ultra_cold" | "frozen" | "refrigerated")) return false
      return c.availableCapacity > 0
    })
  },

  getCarrierById: (id) => get().carriers.find((c) => c.id === id) ?? null,
}))
