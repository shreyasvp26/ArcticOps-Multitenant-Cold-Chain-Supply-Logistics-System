"use client"
import { create } from "zustand"
import type { Material, StockLevel, ProcurementRequest, ProcurementStatus } from "@/lib/types/inventory"
import { MOCK_MATERIALS, MOCK_STOCK_LEVELS } from "@/lib/mock-data/materials"

const INITIAL_REQUESTS: ProcurementRequest[] = [
  { id: "pr_001", tenantId: "tenant_pharma_alpha", clientName: "PharmaAlpha Inc.", materialId: "mat_001", materialName: "Insulin Glargine", quantity: 500, unit: "vial", temperatureZone: "refrigerated", status: "pending", priority: "express", submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "pr_002", tenantId: "tenant_bioverde", clientName: "BioVerde Labs", materialId: "mat_006", materialName: "Human Albumin 20%", quantity: 200, unit: "vial", temperatureZone: "refrigerated", status: "approved", priority: "standard", submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), approvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: "pr_003", tenantId: "tenant_cryomed", clientName: "CryoMed Solutions", materialId: "mat_002", materialName: "mRNA-1273 Lipid Nanoparticles", quantity: 50, unit: "dose-kit", temperatureZone: "ultra_cold", status: "allocated", priority: "emergency", submittedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), approvedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() },
  { id: "pr_004", tenantId: "tenant_pharma_alpha", clientName: "PharmaAlpha Inc.", materialId: "mat_017", materialName: "Adalimumab 40mg/0.8mL", quantity: 200, unit: "syringe", temperatureZone: "refrigerated", status: "pending", priority: "express", submittedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
]

interface InventoryState {
  materials: Material[]
  stockLevels: StockLevel[]
  procurementRequests: ProcurementRequest[]
  updateStock: (materialId: string, delta: number) => void
  approveProcurement: (id: string) => void
  rejectProcurement: (id: string) => void
  updateProcurementStatus: (id: string, status: ProcurementStatus) => void
  addProcurementRequest: (req: ProcurementRequest) => void
  getStockForMaterial: (materialId: string) => StockLevel | null
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  materials: MOCK_MATERIALS,
  stockLevels: MOCK_STOCK_LEVELS,
  procurementRequests: INITIAL_REQUESTS,

  updateStock: (materialId, delta) =>
    set((s) => ({
      stockLevels: s.stockLevels.map((sl) =>
        sl.materialId === materialId
          ? { ...sl, current: sl.current + delta, available: sl.available + delta }
          : sl
      ),
    })),

  approveProcurement: (id) =>
    set((s) => ({
      procurementRequests: s.procurementRequests.map((r) =>
        r.id === id ? { ...r, status: "approved" as ProcurementStatus, approvedAt: new Date().toISOString() } : r
      ),
    })),

  rejectProcurement: (id) =>
    set((s) => ({
      procurementRequests: s.procurementRequests.map((r) =>
        r.id === id ? { ...r, status: "rejected" as ProcurementStatus } : r
      ),
    })),

  updateProcurementStatus: (id, status) =>
    set((s) => ({
      procurementRequests: s.procurementRequests.map((r) => (r.id === id ? { ...r, status } : r)),
    })),

  addProcurementRequest: (req) =>
    set((s) => ({ procurementRequests: [req, ...s.procurementRequests] })),

  getStockForMaterial: (materialId) =>
    get().stockLevels.find((sl) => sl.materialId === materialId) ?? null,
}))
