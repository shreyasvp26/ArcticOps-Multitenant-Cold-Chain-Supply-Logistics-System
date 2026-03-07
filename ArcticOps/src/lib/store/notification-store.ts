"use client"
import { create } from "zustand"
import type { Notification, AlertSeverity } from "@/lib/types/notification"
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data/notifications"

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  clearAll: () => void
  getByPriority: (severity: AlertSeverity) => Notification[]
  getForTenant: (tenantId: string | null) => Notification[]
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: MOCK_NOTIFICATIONS,
  unreadCount: MOCK_NOTIFICATIONS.filter((n) => !n.read).length,

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + (n.read ? 0 : 1),
    })),

  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount: Math.max(0, s.unreadCount - (s.notifications.find((n) => n.id === id && !n.read) ? 1 : 0)),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),

  getByPriority: (severity) => get().notifications.filter((n) => n.severity === severity),

  getForTenant: (tenantId) => {
    const all = get().notifications
    if (!tenantId) return all // ops sees all
    return all.filter((n) => n.tenantId === null || n.tenantId === tenantId)
  },
}))
