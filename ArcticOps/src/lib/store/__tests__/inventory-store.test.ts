import { describe, it, expect, beforeEach } from "vitest"
import { useInventoryStore } from "../inventory-store"
import { MOCK_MATERIALS, MOCK_STOCK_LEVELS } from "@/lib/mock-data/materials"

function resetStore() {
  useInventoryStore.setState({
    materials: MOCK_MATERIALS,
    stockLevels: MOCK_STOCK_LEVELS,
    procurementRequests: [
      {
        id: "pr_001",
        tenantId: "tenant_pharma_alpha",
        clientName: "PharmaAlpha Inc.",
        materialId: "mat_001",
        materialName: "Insulin Glargine",
        quantity: 500,
        unit: "vial",
        temperatureZone: "refrigerated",
        status: "pending",
        priority: "express",
        submittedAt: new Date().toISOString(),
      },
      {
        id: "pr_002",
        tenantId: "tenant_bioverde",
        clientName: "BioVerde Labs",
        materialId: "mat_006",
        materialName: "Human Albumin 20%",
        quantity: 200,
        unit: "vial",
        temperatureZone: "refrigerated",
        status: "approved",
        priority: "standard",
        submittedAt: new Date().toISOString(),
        approvedAt: new Date().toISOString(),
      },
    ],
  })
}

describe("inventory-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state", () => {
    it("loads mock materials", () => {
      expect(useInventoryStore.getState().materials.length).toBe(MOCK_MATERIALS.length)
    })

    it("loads stock levels", () => {
      expect(useInventoryStore.getState().stockLevels.length).toBe(MOCK_STOCK_LEVELS.length)
    })
  })

  describe("updateStock", () => {
    it("increases stock level", () => {
      const materialId = MOCK_STOCK_LEVELS[0].materialId
      const before = useInventoryStore.getState().getStockForMaterial(materialId)!
      useInventoryStore.getState().updateStock(materialId, 100)
      const after = useInventoryStore.getState().getStockForMaterial(materialId)!
      expect(after.current).toBe(before.current + 100)
      expect(after.available).toBe(before.available + 100)
    })

    it("decreases stock level", () => {
      const materialId = MOCK_STOCK_LEVELS[0].materialId
      const before = useInventoryStore.getState().getStockForMaterial(materialId)!
      useInventoryStore.getState().updateStock(materialId, -50)
      const after = useInventoryStore.getState().getStockForMaterial(materialId)!
      expect(after.current).toBe(before.current - 50)
    })

    it("does not affect other materials", () => {
      const id1 = MOCK_STOCK_LEVELS[0].materialId
      const id2 = MOCK_STOCK_LEVELS[1]?.materialId
      if (!id2) return

      const before2 = useInventoryStore.getState().getStockForMaterial(id2)!
      useInventoryStore.getState().updateStock(id1, 100)
      const after2 = useInventoryStore.getState().getStockForMaterial(id2)!
      expect(after2.current).toBe(before2.current)
    })
  })

  describe("approveProcurement", () => {
    it("changes status to approved", () => {
      useInventoryStore.getState().approveProcurement("pr_001")
      const req = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_001")
      expect(req?.status).toBe("approved")
    })

    it("sets approvedAt timestamp", () => {
      useInventoryStore.getState().approveProcurement("pr_001")
      const req = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_001")
      expect(req?.approvedAt).toBeTruthy()
    })
  })

  describe("rejectProcurement", () => {
    it("changes status to rejected", () => {
      useInventoryStore.getState().rejectProcurement("pr_001")
      const req = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_001")
      expect(req?.status).toBe("rejected")
    })
  })

  describe("updateProcurementStatus", () => {
    it("updates to any valid status", () => {
      useInventoryStore.getState().updateProcurementStatus("pr_001", "allocated")
      const req = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_001")
      expect(req?.status).toBe("allocated")
    })
  })

  describe("addProcurementRequest", () => {
    it("prepends new request", () => {
      const newReq = {
        id: "pr_new",
        tenantId: "tenant_cryomed",
        clientName: "CryoMed Solutions",
        materialId: "mat_005",
        materialName: "Test Material",
        quantity: 100,
        unit: "vial",
        temperatureZone: "frozen" as const,
        status: "pending" as const,
        priority: "standard" as const,
        submittedAt: new Date().toISOString(),
      }
      const before = useInventoryStore.getState().procurementRequests.length
      useInventoryStore.getState().addProcurementRequest(newReq)
      const after = useInventoryStore.getState().procurementRequests
      expect(after.length).toBe(before + 1)
      expect(after[0].id).toBe("pr_new")
    })
  })

  describe("getStockForMaterial", () => {
    it("returns stock level for existing material", () => {
      const materialId = MOCK_STOCK_LEVELS[0].materialId
      const stock = useInventoryStore.getState().getStockForMaterial(materialId)
      expect(stock).not.toBeNull()
      expect(stock?.materialId).toBe(materialId)
    })

    it("returns null for non-existent material", () => {
      const stock = useInventoryStore.getState().getStockForMaterial("nonexistent")
      expect(stock).toBeNull()
    })
  })
})
