export type MaterialGrade = "API" | "USP" | "EP" | "BP" | "JP" | "FCC" | "ACS"

export interface Material {
  id: string
  name: string
  casNumber?: string
  grade: MaterialGrade
  certifications: string[]
  temperatureZone: "ultra_cold" | "frozen" | "refrigerated"
  requiredTempMin: number
  requiredTempMax: number
  unitPrice: number
  unit: string
  description?: string
  supplier?: string
}

export interface StockLevel {
  materialId: string
  current: number
  allocated: number
  available: number
  minimum: number
  restockEta?: string
  status: "healthy" | "low" | "critical"
}

export type ProcurementStatus = "pending" | "approved" | "allocated" | "dispatched" | "rejected"

export interface ProcurementRequest {
  id: string
  tenantId: string
  clientName: string
  materialId: string
  materialName: string
  quantity: number
  unit: string
  temperatureZone: "ultra_cold" | "frozen" | "refrigerated"
  status: ProcurementStatus
  priority: "standard" | "express" | "emergency"
  submittedAt: string
  approvedAt?: string
  notes?: string
  estimatedSourceDays?: number
}
