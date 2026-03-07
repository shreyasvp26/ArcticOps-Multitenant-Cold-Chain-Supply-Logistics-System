export interface DelayPrediction {
  shipmentId: string
  shipmentLabel: string
  clientName: string
  currentStatus: string
  predictedDelayHours: number
  confidencePercent: number
  primaryRiskFactor: "weather" | "customs" | "carrier" | "route" | "compliance"
  riskDetails: string
}

export interface ExcursionHeatmapData {
  routeSegment: string
  month: string
  excursionCount: number
  carrierId?: string
  zone?: string
}

export interface CostReport {
  shipmentId: string
  clientName: string
  estimatedCostUsd: number
  actualCostUsd: number
  variance: number
  variancePercent: number
  primaryMode: string
}

export interface ClientHealthScore {
  tenantId: string
  tenantName: string
  score: number
  orderFrequencyTrend: "up" | "stable" | "down"
  issueCount: number
  satisfactionScore: number
  trend: Array<{ month: string; score: number }>
}

export interface SustainabilityData {
  shipmentId: string
  co2EmissionsKg: number
  ecoRouteSavingsKg: number
  primaryMode: string
  month: string
}
