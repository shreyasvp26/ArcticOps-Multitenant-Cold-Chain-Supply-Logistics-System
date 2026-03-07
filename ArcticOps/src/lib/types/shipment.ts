export type ShipmentStatus =
  | "requested"
  | "preparing"
  | "in_transit"
  | "at_customs"
  | "delivered"
  | "cancelled"

export type TransportMode = "air" | "sea" | "rail" | "road"

export interface Checkpoint {
  id: string
  name: string
  city: string
  country: string
  coordinates: [number, number]
  estimatedArrival: string
  actualArrival?: string
  status: "passed" | "current" | "upcoming" | "delayed"
  delayReason?: string
  dwellTimeMinutes?: number
}

export interface ShipmentLeg {
  id: string
  mode: TransportMode
  origin: string
  destination: string
  carrierId: string
  departureTime: string
  arrivalTime: string
  distanceKm: number
}

export interface Shipment {
  id: string
  tenantId: string
  clientName: string
  materials: Array<{ materialId: string; name: string; quantity: number; unit: string }>
  origin: string
  destination: string
  originCoordinates: [number, number]
  destinationCoordinates: [number, number]
  currentCoordinates: [number, number]
  status: ShipmentStatus
  temperatureZone: "ultra_cold" | "frozen" | "refrigerated"
  requiredTempMin: number
  requiredTempMax: number
  carrierId: string
  carrierName: string
  assignedCrewIds: string[]
  legs: ShipmentLeg[]
  checkpoints: Checkpoint[]
  riskScore: number
  coldChainConfidence: number
  eta: string
  departureDate: string
  complianceDocIds: string[]
  createdAt: string
}
