import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data/notifications"
import type { Notification } from "@/lib/types/notification"

function resetAllStores() {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  useShipmentStore.setState({ shipments: MOCK_SHIPMENTS, filters: {}, selectedShipmentId: null, viewMode: "table" })
  useNotificationStore.setState({
    notifications: MOCK_NOTIFICATIONS,
    unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
  })
}

describe("data isolation — tenant scoping", () => {
  beforeEach(() => {
    resetAllStores()
  })

  describe("shipment isolation", () => {
    it("client_admin sees only their tenant's shipments", () => {
      useAuthStore.getState().loginAs("client_admin")
      const user = useAuthStore.getState().user!
      const shipments = useShipmentStore.getState().getFilteredShipments(user.tenantId)

      expect(shipments.length).toBeGreaterThan(0)
      expect(shipments.every((s) => s.tenantId === user.tenantId)).toBe(true)
    })

    it("ops_manager sees all shipments (no tenant filter)", () => {
      useAuthStore.getState().loginAs("ops_manager")
      const user = useAuthStore.getState().user!
      const shipments = useShipmentStore.getState().getFilteredShipments(user.tenantId)

      expect(shipments.length).toBe(MOCK_SHIPMENTS.length)
    })

    it("different clients see different subsets", () => {
      const pharmaShipments = useShipmentStore.getState().getFilteredShipments("tenant_pharma_alpha")
      const bioverdeShipments = useShipmentStore.getState().getFilteredShipments("tenant_bioverde")

      const pharmaIds = pharmaShipments.map((s) => s.id)
      const bioverdeIds = bioverdeShipments.map((s) => s.id)

      const overlap = pharmaIds.filter((id) => bioverdeIds.includes(id))
      expect(overlap.length).toBe(0)
    })
  })

  describe("notification isolation", () => {
    it("ops sees all notifications", () => {
      const all = useNotificationStore.getState().getForTenant(null)
      expect(all.length).toBe(MOCK_NOTIFICATIONS.length)
    })

    it("client sees only global + own tenant notifications", () => {
      const tenantNotif: Notification = {
        id: "test_tenant_notif",
        tenantId: "tenant_pharma_alpha",
        severity: "warning",
        title: "Test",
        message: "Test message",
        actions: [],
        read: false,
        createdAt: new Date().toISOString(),
      }
      const globalNotif: Notification = {
        id: "test_global_notif",
        tenantId: null,
        severity: "info",
        title: "Global",
        message: "Global message",
        actions: [],
        read: false,
        createdAt: new Date().toISOString(),
      }
      const otherNotif: Notification = {
        id: "test_other_notif",
        tenantId: "tenant_bioverde",
        severity: "info",
        title: "Other",
        message: "Other tenant message",
        actions: [],
        read: false,
        createdAt: new Date().toISOString(),
      }

      useNotificationStore.setState({
        notifications: [tenantNotif, globalNotif, otherNotif],
        unreadCount: 3,
      })

      const visible = useNotificationStore.getState().getForTenant("tenant_pharma_alpha")
      expect(visible.length).toBe(2)
      expect(visible.some((n) => n.tenantId === "tenant_bioverde")).toBe(false)
    })
  })
})

describe("cross-store interactions", () => {
  beforeEach(() => {
    resetAllStores()
  })

  it("auth login sets user that scopes subsequent store queries", () => {
    useAuthStore.getState().loginAs("client_admin")
    const tenantId = useAuthStore.getState().user!.tenantId

    const shipments = useShipmentStore.getState().getFilteredShipments(tenantId)
    const notifications = useNotificationStore.getState().getForTenant(tenantId)

    expect(shipments.every((s) => s.tenantId === tenantId)).toBe(true)
    expect(notifications.every((n) => n.tenantId === null || n.tenantId === tenantId)).toBe(true)
  })

  it("logout does not clear shipment or notification data (stores are independent)", () => {
    useAuthStore.getState().loginAs("ops_manager")
    useAuthStore.getState().logout()

    expect(useShipmentStore.getState().shipments.length).toBe(MOCK_SHIPMENTS.length)
    expect(useNotificationStore.getState().notifications.length).toBe(MOCK_NOTIFICATIONS.length)
  })

  it("shipment filter and tenant filter stack correctly", () => {
    const tenantId = "tenant_pharma_alpha"
    useShipmentStore.getState().setFilter({ status: "in_transit" })
    const filtered = useShipmentStore.getState().getFilteredShipments(tenantId)

    expect(
      filtered.every((s) => s.tenantId === tenantId && s.status === "in_transit")
    ).toBe(true)
  })
})
