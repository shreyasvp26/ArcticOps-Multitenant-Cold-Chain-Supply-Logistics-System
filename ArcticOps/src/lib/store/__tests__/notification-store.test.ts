import { describe, it, expect, beforeEach } from "vitest"
import { useNotificationStore } from "../notification-store"
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data/notifications"
import type { Notification } from "@/lib/types/notification"

function resetStore() {
  useNotificationStore.setState({
    notifications: MOCK_NOTIFICATIONS,
    unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,
  })
}

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: `test_${Date.now()}_${Math.random()}`,
    tenantId: null,
    severity: "info",
    title: "Test Notification",
    message: "This is a test notification",
    actions: [],
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

describe("notification-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state", () => {
    it("loads mock notifications", () => {
      expect(useNotificationStore.getState().notifications.length).toBe(MOCK_NOTIFICATIONS.length)
    })

    it("calculates correct unread count", () => {
      const expected = MOCK_NOTIFICATIONS.filter((n) => !n.read).length
      expect(useNotificationStore.getState().unreadCount).toBe(expected)
    })
  })

  describe("addNotification", () => {
    it("prepends new notification to list", () => {
      const n = createNotification()
      useNotificationStore.getState().addNotification(n)
      const state = useNotificationStore.getState()
      expect(state.notifications[0].id).toBe(n.id)
      expect(state.notifications.length).toBe(MOCK_NOTIFICATIONS.length + 1)
    })

    it("increments unread count for unread notification", () => {
      const before = useNotificationStore.getState().unreadCount
      useNotificationStore.getState().addNotification(createNotification({ read: false }))
      expect(useNotificationStore.getState().unreadCount).toBe(before + 1)
    })

    it("does not increment unread count for pre-read notification", () => {
      const before = useNotificationStore.getState().unreadCount
      useNotificationStore.getState().addNotification(createNotification({ read: true }))
      expect(useNotificationStore.getState().unreadCount).toBe(before)
    })
  })

  describe("markRead", () => {
    it("marks a notification as read", () => {
      const unread = useNotificationStore.getState().notifications.find((n) => !n.read)
      if (!unread) return

      useNotificationStore.getState().markRead(unread.id)
      const updated = useNotificationStore.getState().notifications.find((n) => n.id === unread.id)
      expect(updated?.read).toBe(true)
    })

    it("decrements unread count", () => {
      const unread = useNotificationStore.getState().notifications.find((n) => !n.read)
      if (!unread) return

      const before = useNotificationStore.getState().unreadCount
      useNotificationStore.getState().markRead(unread.id)
      expect(useNotificationStore.getState().unreadCount).toBe(before - 1)
    })

    it("does not decrement if already read", () => {
      const readNotif = useNotificationStore.getState().notifications.find((n) => n.read)
      if (!readNotif) return

      const before = useNotificationStore.getState().unreadCount
      useNotificationStore.getState().markRead(readNotif.id)
      expect(useNotificationStore.getState().unreadCount).toBe(before)
    })

    it("does not go below zero", () => {
      useNotificationStore.getState().markAllRead()
      useNotificationStore.getState().markRead("nonexistent")
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("markAllRead", () => {
    it("marks all notifications as read", () => {
      useNotificationStore.getState().markAllRead()
      const state = useNotificationStore.getState()
      expect(state.notifications.every((n) => n.read)).toBe(true)
      expect(state.unreadCount).toBe(0)
    })
  })

  describe("clearAll", () => {
    it("removes all notifications", () => {
      useNotificationStore.getState().clearAll()
      expect(useNotificationStore.getState().notifications.length).toBe(0)
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("getByPriority", () => {
    it("filters by severity level", () => {
      const criticals = useNotificationStore.getState().getByPriority("critical")
      expect(criticals.every((n) => n.severity === "critical")).toBe(true)
    })

    it("returns empty array for severity with no matches", () => {
      useNotificationStore.setState({ notifications: [] })
      expect(useNotificationStore.getState().getByPriority("emergency").length).toBe(0)
    })
  })

  describe("getForTenant", () => {
    it("returns all notifications for ops (null tenantId)", () => {
      const all = useNotificationStore.getState().getForTenant(null)
      expect(all.length).toBe(MOCK_NOTIFICATIONS.length)
    })

    it("returns global + tenant-specific for a client tenant", () => {
      const tenantNotif = createNotification({ tenantId: "tenant_pharma_alpha" })
      const globalNotif = createNotification({ tenantId: null })
      const otherNotif = createNotification({ tenantId: "tenant_bioverde" })

      useNotificationStore.setState({
        notifications: [tenantNotif, globalNotif, otherNotif],
        unreadCount: 3,
      })

      const result = useNotificationStore.getState().getForTenant("tenant_pharma_alpha")
      expect(result.length).toBe(2) // own tenant + global
      expect(result.some((n) => n.tenantId === "tenant_bioverde")).toBe(false)
    })

    it("excludes other tenants' notifications", () => {
      const n1 = createNotification({ tenantId: "tenant_pharma_alpha" })
      const n2 = createNotification({ tenantId: "tenant_bioverde" })
      useNotificationStore.setState({ notifications: [n1, n2], unreadCount: 2 })

      const result = useNotificationStore.getState().getForTenant("tenant_pharma_alpha")
      expect(result.length).toBe(1)
      expect(result[0].tenantId).toBe("tenant_pharma_alpha")
    })
  })
})
