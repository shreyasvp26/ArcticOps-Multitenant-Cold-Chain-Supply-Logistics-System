"use client"
import { create } from "zustand"
import type { Shipment, ShipmentStatus } from "@/lib/types/shipment"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

interface ShipmentFilters {
  status?: ShipmentStatus
  tenantId?: string
  carrierId?: string
  temperatureZone?: string
  searchQuery?: string
}

type ViewMode = "table" | "kanban"

interface ShipmentState {
  shipments: Shipment[]
  selectedShipmentId: string | null
  filters: ShipmentFilters
  viewMode: ViewMode
  setFilter: (filters: Partial<ShipmentFilters>) => void
  clearFilters: () => void
  selectShipment: (id: string | null) => void
  updateStatus: (id: string, status: ShipmentStatus) => void
  updateCoordinates: (id: string, coords: [number, number]) => void
  setViewMode: (mode: ViewMode) => void
  getFilteredShipments: (tenantId?: string | null) => Shipment[]
}

export const useShipmentStore = create<ShipmentState>()((set, get) => ({
  shipments: MOCK_SHIPMENTS,
  selectedShipmentId: null,
  filters: {},
  viewMode: "table",

  setFilter: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
  clearFilters: () => set({ filters: {} }),
  selectShipment: (id) => set({ selectedShipmentId: id }),

  updateStatus: (id, status) =>
    set((s) => ({
      shipments: s.shipments.map((sh) => (sh.id === id ? { ...sh, status } : sh)),
    })),

  updateCoordinates: (id, coords) =>
    set((s) => ({
      shipments: s.shipments.map((sh) => (sh.id === id ? { ...sh, currentCoordinates: coords } : sh)),
    })),

  setViewMode: (mode) => set({ viewMode: mode }),

  getFilteredShipments: (tenantId) => {
    const { shipments, filters } = get()
    return shipments.filter((sh) => {
      if (tenantId && sh.tenantId !== tenantId) return false
      if (filters.status && sh.status !== filters.status) return false
      if (filters.carrierId && sh.carrierId !== filters.carrierId) return false
      if (filters.temperatureZone && sh.temperatureZone !== filters.temperatureZone) return false
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        if (!sh.id.toLowerCase().includes(q) && !sh.clientName.toLowerCase().includes(q) && !sh.origin.toLowerCase().includes(q) && !sh.destination.toLowerCase().includes(q)) return false
      }
      return true
    })
  },
}))
