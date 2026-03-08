import type { TransportMode } from "./shipment"

export interface RouteLeg {
  id: string
  mode: TransportMode
  origin: string
  destination: string
  originCoords: [number, number]
  destinationCoords: [number, number]
  etaHours: number
  distanceKm: number
  carrierId?: string
  notes?: string
}

export interface RouteOption {
  id: string
  name: string
  legs: RouteLeg[]
  totalEtaHours: number
  totalCostUsd: number
  riskScore: number
  co2EstimateKg: number
  tempMaintenanceConfidence: number
  isRecommended: boolean
  capacityVials: number
  notes?: string
}

export interface RouteComparison {
  id: string
  origin: string
  destination: string
  options: RouteOption[]
  generatedAt: string
}

export interface Scenario {
  portStrike: boolean
  severeWeather: boolean
  carrierUnavailable: boolean
  customsDelay: boolean
}
