"use client"
import { create } from "zustand"
import type { TempReading, TempExcursion } from "@/lib/types/temperature"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { generateTempHistory } from "@/lib/mock-data/temperature"

interface TemperatureState {
  readings: Map<string, TempReading[]>
  excursions: TempExcursion[]
  initialized: boolean
  initialize: () => void
  addReading: (reading: TempReading) => void
  getLatest: (shipmentId: string) => TempReading | null
  getHistory: (shipmentId: string, hours?: number) => TempReading[]
  getActiveExcursions: () => TempExcursion[]
}

export const useTemperatureStore = create<TemperatureState>()((set, get) => ({
  readings: new Map(),
  excursions: [],
  initialized: false,

  initialize: () => {
    if (get().initialized) return
    const readings = new Map<string, TempReading[]>()
    MOCK_SHIPMENTS.filter((s) => s.status === "in_transit" || s.status === "at_customs").forEach((s) => {
      const history = generateTempHistory(s.id, s.temperatureZone, 24)
      readings.set(s.id, history)
    })
    set({ readings, initialized: true })
  },

  addReading: (reading) =>
    set((s) => {
      const existing = s.readings.get(reading.shipmentId) ?? []
      const updated = new Map(s.readings)
      updated.set(reading.shipmentId, [...existing.slice(-288), reading]) // keep 24h at 5min intervals
      const excursions = reading.isExcursion
        ? [...s.excursions, {
            id: `exc_${Date.now()}`,
            shipmentId: reading.shipmentId,
            startTime: reading.timestamp,
            peakTemperature: reading.temperature,
            requiredMin: -999,
            requiredMax: 999,
            resolved: false,
          }]
        : s.excursions
      return { readings: updated, excursions }
    }),

  getLatest: (shipmentId) => {
    const history = get().readings.get(shipmentId)
    return history ? history[history.length - 1] ?? null : null
  },

  getHistory: (shipmentId, hours = 24) => {
    const history = get().readings.get(shipmentId) ?? []
    if (!hours) return history
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).getTime()
    return history.filter((r) => new Date(r.timestamp).getTime() >= cutoff)
  },

  getActiveExcursions: () => get().excursions.filter((e) => !e.resolved),
}))
