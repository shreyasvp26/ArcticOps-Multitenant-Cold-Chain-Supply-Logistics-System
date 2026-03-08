import { describe, it, expect, beforeEach } from "vitest"
import { useShipmentStore } from "../shipment-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

function resetStore() {
  useShipmentStore.setState({
    shipments: MOCK_SHIPMENTS,
    selectedShipmentId: null,
    filters: {},
    viewMode: "table",
  })
}

describe("shipment-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state", () => {
    it("loads mock shipments", () => {
      expect(useShipmentStore.getState().shipments.length).toBe(MOCK_SHIPMENTS.length)
    })

    it("starts with no selection", () => {
      expect(useShipmentStore.getState().selectedShipmentId).toBeNull()
    })

    it("starts in table view", () => {
      expect(useShipmentStore.getState().viewMode).toBe("table")
    })

    it("starts with empty filters", () => {
      expect(useShipmentStore.getState().filters).toEqual({})
    })
  })

  describe("selectShipment", () => {
    it("selects a shipment by id", () => {
      useShipmentStore.getState().selectShipment("SH-2847")
      expect(useShipmentStore.getState().selectedShipmentId).toBe("SH-2847")
    })

    it("clears selection with null", () => {
      useShipmentStore.getState().selectShipment("SH-2847")
      useShipmentStore.getState().selectShipment(null)
      expect(useShipmentStore.getState().selectedShipmentId).toBeNull()
    })
  })

  describe("updateStatus", () => {
    it("updates shipment status", () => {
      const id = MOCK_SHIPMENTS[0].id
      useShipmentStore.getState().updateStatus(id, "delivered")
      const updated = useShipmentStore.getState().shipments.find((s) => s.id === id)
      expect(updated?.status).toBe("delivered")
    })

    it("does not affect other shipments", () => {
      const id = MOCK_SHIPMENTS[0].id
      const otherId = MOCK_SHIPMENTS[1].id
      const originalStatus = MOCK_SHIPMENTS[1].status
      useShipmentStore.getState().updateStatus(id, "delivered")
      const other = useShipmentStore.getState().shipments.find((s) => s.id === otherId)
      expect(other?.status).toBe(originalStatus)
    })
  })

  describe("updateCoordinates", () => {
    it("updates shipment coordinates", () => {
      const id = MOCK_SHIPMENTS[0].id
      useShipmentStore.getState().updateCoordinates(id, [48.8566, 2.3522])
      const updated = useShipmentStore.getState().shipments.find((s) => s.id === id)
      expect(updated?.currentCoordinates).toEqual([48.8566, 2.3522])
    })
  })

  describe("setViewMode", () => {
    it("switches to kanban view", () => {
      useShipmentStore.getState().setViewMode("kanban")
      expect(useShipmentStore.getState().viewMode).toBe("kanban")
    })

    it("switches back to table view", () => {
      useShipmentStore.getState().setViewMode("kanban")
      useShipmentStore.getState().setViewMode("table")
      expect(useShipmentStore.getState().viewMode).toBe("table")
    })
  })

  describe("filters", () => {
    it("sets a single filter", () => {
      useShipmentStore.getState().setFilter({ status: "in_transit" })
      expect(useShipmentStore.getState().filters.status).toBe("in_transit")
    })

    it("merges multiple filters", () => {
      useShipmentStore.getState().setFilter({ status: "in_transit" })
      useShipmentStore.getState().setFilter({ temperatureZone: "refrigerated" })
      const filters = useShipmentStore.getState().filters
      expect(filters.status).toBe("in_transit")
      expect(filters.temperatureZone).toBe("refrigerated")
    })

    it("clears all filters", () => {
      useShipmentStore.getState().setFilter({ status: "in_transit", temperatureZone: "frozen" })
      useShipmentStore.getState().clearFilters()
      expect(useShipmentStore.getState().filters).toEqual({})
    })
  })

  describe("getFilteredShipments", () => {
    it("returns all shipments with no filters and no tenant", () => {
      const result = useShipmentStore.getState().getFilteredShipments()
      expect(result.length).toBe(MOCK_SHIPMENTS.length)
    })

    it("filters by tenant ID", () => {
      const tenantId = MOCK_SHIPMENTS[0].tenantId
      const result = useShipmentStore.getState().getFilteredShipments(tenantId)
      expect(result.every((s) => s.tenantId === tenantId)).toBe(true)
    })

    it("filters by status", () => {
      useShipmentStore.getState().setFilter({ status: "in_transit" })
      const result = useShipmentStore.getState().getFilteredShipments()
      expect(result.every((s) => s.status === "in_transit")).toBe(true)
    })

    it("filters by search query (case-insensitive)", () => {
      const firstShipment = MOCK_SHIPMENTS[0]
      useShipmentStore.getState().setFilter({ searchQuery: firstShipment.id.toLowerCase() })
      const result = useShipmentStore.getState().getFilteredShipments()
      expect(result.some((s) => s.id === firstShipment.id)).toBe(true)
    })

    it("returns empty array for non-matching tenant", () => {
      const result = useShipmentStore.getState().getFilteredShipments("nonexistent_tenant")
      expect(result.length).toBe(0)
    })

    it("combines tenant and status filters", () => {
      const tenantId = MOCK_SHIPMENTS[0].tenantId
      useShipmentStore.getState().setFilter({ status: "delivered" })
      const result = useShipmentStore.getState().getFilteredShipments(tenantId)
      expect(result.every((s) => s.tenantId === tenantId && s.status === "delivered")).toBe(true)
    })
  })
})
