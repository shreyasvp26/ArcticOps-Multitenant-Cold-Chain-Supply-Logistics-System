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

// Internal per-shipment tracking progress: 0–1 along the full route
const trackingProgress: Map<string, number> = new Map()
let trackingTimer: ReturnType<typeof setInterval> | null = null
let trackingSubscribers = 0

// Interpolate along a great circle between two [lng, lat] points
function gcInterp(a: [number, number], b: [number, number], t: number): [number, number] {
  const toRad = (x: number) => (x * Math.PI) / 180
  const toDeg = (x: number) => (x * 180) / Math.PI
  const [lng1, lat1] = a.map(toRad)
  const [lng2, lat2] = b.map(toRad)
  const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
  const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
  const d = Math.acos(Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2)))
  if (d < 1e-9) return a
  const f = Math.sin((1 - t) * d) / Math.sin(d), g = Math.sin(t * d) / Math.sin(d)
  const x = f * x1 + g * x2, y = f * y1 + g * y2, z = f * z1 + g * z2
  return [toDeg(Math.atan2(y, x)), toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)))]
}

// Get the current [lng, lat] position for a shipment at progress t (0–1) along its full route
function positionAlongRoute(sh: Shipment, t: number): [number, number] {
  // Build ordered waypoints: origin → checkpoints (in order) → destination
  const waypoints: [number, number][] = [
    sh.originCoordinates,
    ...sh.checkpoints.map((cp) => cp.coordinates),
    sh.destinationCoordinates,
  ]
  // Remove consecutive duplicates
  const pts = waypoints.filter((p, i) => i === 0 || p[0] !== waypoints[i - 1]![0] || p[1] !== waypoints[i - 1]![1])
  if (pts.length < 2) return sh.currentCoordinates
  const legCount = pts.length - 1
  const legSize = 1 / legCount
  const legIndex = Math.min(Math.floor(t / legSize), legCount - 1)
  const legT = (t - legIndex * legSize) / legSize
  return gcInterp(pts[legIndex]!, pts[legIndex + 1]!, legT)
}

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
  addShipment: (shipment: Shipment) => void
  getFilteredShipments: (tenantId?: string | null) => Shipment[]
  startLiveTracking: () => () => void
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

  addShipment: (shipment) =>
    set((s) => ({ shipments: [shipment, ...s.shipments] })),

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

  // Start live tracking simulation — returns cleanup fn. Ref-counted so multiple callers are safe.
  startLiveTracking: () => {
    trackingSubscribers++
    const { shipments } = get()

    // Seed initial progress for in-transit shipments so they start mid-route
    shipments.forEach((sh) => {
      if ((sh.status === "in_transit") && !trackingProgress.has(sh.id)) {
        // Estimate current progress based on passed checkpoints
        const total = sh.checkpoints.length
        const passed = sh.checkpoints.filter((cp) => cp.status === "passed" || cp.status === "current").length
        const seed = total > 0 ? (passed / (total + 1)) + 0.05 : 0.3
        trackingProgress.set(sh.id, Math.min(seed, 0.85))
      }
    })

    if (!trackingTimer) {
      // Advance each in-transit shipment ~0.3% of total route every 3 seconds (slow, realistic)
      trackingTimer = setInterval(() => {
        const { shipments: current } = get()
        const updates: Array<{ id: string; coords: [number, number] }> = []

        current.forEach((sh) => {
          if (sh.status !== "in_transit") return
          const prev = trackingProgress.get(sh.id) ?? 0.3
          const next = Math.min(prev + 0.003 + Math.random() * 0.001, 0.97)
          trackingProgress.set(sh.id, next)
          updates.push({ id: sh.id, coords: positionAlongRoute(sh, next) })
        })

        if (updates.length > 0) {
          set((s) => ({
            shipments: s.shipments.map((sh) => {
              const upd = updates.find((u) => u.id === sh.id)
              return upd ? { ...sh, currentCoordinates: upd.coords } : sh
            }),
          }))
        }
      }, 3000)
    }

    return () => {
      trackingSubscribers = Math.max(0, trackingSubscribers - 1)
      if (trackingSubscribers === 0 && trackingTimer) {
        clearInterval(trackingTimer)
        trackingTimer = null
      }
    }
  },
}))
