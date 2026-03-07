import type { TransportMode } from "./shipment"

export interface Carrier {
  id: string
  name: string
  logoUrl?: string
  modes: TransportMode[]
  tempCapabilities: Array<"ultra_cold" | "frozen" | "refrigerated">
  reliabilityScore: number
  coverageRegions: string[]
  totalCapacity: number
  availableCapacity: number
  contactEmail: string
  headquarters: string
}

export interface CarrierCapacity {
  carrierId: string
  date: string
  totalSlots: number
  bookedSlots: number
  maintenanceSlots: number
  assignedShipmentIds: string[]
}

export interface CarrierPerformance {
  carrierId: string
  onTimeDeliveryPercent: number
  tempExcursionCount: number
  avgTransitDays: number
  satisfactionScore: number
  monthlyTrend: Array<{ month: string; onTime: number; excursions: number }>
}
