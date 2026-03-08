import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/lib/store/auth-store"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useDriverStore } from "@/lib/store/driver-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { MOCK_MATERIALS, MOCK_STOCK_LEVELS } from "@/lib/mock-data/materials"

function resetAllStores() {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  useInventoryStore.setState({
    materials: MOCK_MATERIALS,
    stockLevels: MOCK_STOCK_LEVELS,
    procurementRequests: [],
  })
  useShipmentStore.setState({ shipments: MOCK_SHIPMENTS, filters: {}, selectedShipmentId: null, viewMode: "table" })
  useDriverStore.setState({
    currentAssignment: null,
    deliveryProgress: { arrivalConfirmed: false, photoUploaded: false, signatureCaptured: false, submitted: false },
    uploadedDocIds: [],
  })
}

describe("order-to-delivery workflow", () => {
  beforeEach(() => {
    resetAllStores()
  })

  it("simulates: client places order → ops approves → driver delivers", () => {
    // Step 1: Client logs in and places procurement request
    useAuthStore.getState().loginAs("client_admin")
    const clientUser = useAuthStore.getState().user!
    expect(clientUser.role).toBe("client_admin")
    expect(clientUser.tenantId).toBe("tenant_pharma_alpha")

    const materialId = MOCK_MATERIALS[0].id
    useInventoryStore.getState().addProcurementRequest({
      id: "pr_workflow_test",
      tenantId: clientUser.tenantId!,
      clientName: clientUser.tenantName!,
      materialId,
      materialName: MOCK_MATERIALS[0].name,
      quantity: 100,
      unit: "vial",
      temperatureZone: "refrigerated",
      status: "pending",
      priority: "express",
      submittedAt: new Date().toISOString(),
    })

    const requests = useInventoryStore.getState().procurementRequests
    expect(requests[0].id).toBe("pr_workflow_test")
    expect(requests[0].status).toBe("pending")

    // Step 2: Ops logs in and approves the request
    useAuthStore.getState().loginAs("ops_manager")
    expect(useAuthStore.getState().user!.role).toBe("ops_manager")

    useInventoryStore.getState().approveProcurement("pr_workflow_test")
    const approved = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_workflow_test")
    expect(approved?.status).toBe("approved")
    expect(approved?.approvedAt).toBeTruthy()

    // Step 3: Ops allocates the request
    useInventoryStore.getState().updateProcurementStatus("pr_workflow_test", "allocated")
    const allocated = useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_workflow_test")
    expect(allocated?.status).toBe("allocated")

    // Step 4: Driver receives assignment and completes delivery
    useAuthStore.getState().loginAs("driver")
    expect(useAuthStore.getState().user!.role).toBe("driver")

    const existingShipment = MOCK_SHIPMENTS.find((s) => s.status === "in_transit")
    if (existingShipment) {
      useDriverStore.getState().setAssignment(existingShipment.id)
      expect(useDriverStore.getState().currentAssignment?.id).toBe(existingShipment.id)

      // Complete delivery flow
      useDriverStore.getState().confirmArrival()
      useDriverStore.getState().setPhotoUploaded()
      useDriverStore.getState().setSignatureCaptured()
      useDriverStore.getState().setTempLogSnapshot(4.5)
      useDriverStore.getState().setConditionNotes("All good")
      useDriverStore.getState().submitDelivery()

      expect(useDriverStore.getState().deliveryProgress.submitted).toBe(true)

      // Update shipment status
      useShipmentStore.getState().updateStatus(existingShipment.id, "delivered")
      const updated = useShipmentStore.getState().shipments.find((s) => s.id === existingShipment.id)
      expect(updated?.status).toBe("delivered")
    }
  })

  it("procurement status pipeline follows correct sequence", () => {
    useInventoryStore.getState().addProcurementRequest({
      id: "pr_pipeline",
      tenantId: "tenant_pharma_alpha",
      clientName: "PharmaAlpha Inc.",
      materialId: "mat_001",
      materialName: "Test Material",
      quantity: 50,
      unit: "vial",
      temperatureZone: "refrigerated",
      status: "pending",
      priority: "standard",
      submittedAt: new Date().toISOString(),
    })

    const getStatus = () =>
      useInventoryStore.getState().procurementRequests.find((r) => r.id === "pr_pipeline")?.status

    expect(getStatus()).toBe("pending")

    useInventoryStore.getState().approveProcurement("pr_pipeline")
    expect(getStatus()).toBe("approved")

    useInventoryStore.getState().updateProcurementStatus("pr_pipeline", "allocated")
    expect(getStatus()).toBe("allocated")

    useInventoryStore.getState().updateProcurementStatus("pr_pipeline", "dispatched")
    expect(getStatus()).toBe("dispatched")
  })
})
