export function calculateRiskScore(params: {
  tempExcursions: number
  delayedLegs: number
  criticalAlerts: number
  overdueDocuments: number
  carrierReliability: number
}): number {
  const { tempExcursions, delayedLegs, criticalAlerts, overdueDocuments, carrierReliability } = params
  const excursionScore = Math.min(tempExcursions * 20, 40)
  const delayScore = Math.min(delayedLegs * 15, 30)
  const alertScore = Math.min(criticalAlerts * 10, 20)
  const docScore = Math.min(overdueDocuments * 5, 10)
  const reliabilityScore = Math.max(0, (100 - carrierReliability) / 10)
  return Math.min(Math.round(excursionScore + delayScore + alertScore + docScore + reliabilityScore), 100)
}

export function calculateStressLevel(params: {
  tempExcursions: number
  delayedShipments: number
  criticalAlerts: number
  overdueDocuments: number
  capacityIssues: number
}): number {
  const { tempExcursions, delayedShipments, criticalAlerts, overdueDocuments, capacityIssues } = params
  const weighted =
    tempExcursions * 30 +
    delayedShipments * 25 +
    criticalAlerts * 25 +
    overdueDocuments * 10 +
    capacityIssues * 10
  return Math.min(weighted, 100)
}

export function getStressLevel(score: number): "serene" | "attentive" | "urgent" | "emergency" {
  if (score <= 20) return "serene"
  if (score <= 50) return "attentive"
  if (score <= 80) return "urgent"
  return "emergency"
}

export function getRiskColor(score: number): string {
  if (score <= 25) return "#2ED573"
  if (score <= 50) return "#FFA502"
  if (score <= 75) return "#FF6B35"
  return "#FF4757"
}

export function getRiskLabel(score: number): string {
  if (score <= 25) return "Low Risk"
  if (score <= 50) return "Medium Risk"
  if (score <= 75) return "High Risk"
  return "Critical Risk"
}
