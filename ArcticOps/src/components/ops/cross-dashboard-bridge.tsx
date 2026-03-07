"use client"
/**
 * CrossDashboardBridge — runs inside OpsDashboard layout.
 * Watches inventory procurement changes and fires toast notifications
 * for ops users when new requests arrive.
 * Also auto-collapses the sidebar at emergency stress level.
 */
import { useEffect, useRef } from "react"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useUIStore } from "@/lib/store/ui-store"

function genId() {
  return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function CrossDashboardBridge() {
  const procurementRequests = useInventoryStore((s) => s.procurementRequests)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const shipments = useShipmentStore((s) => s.shipments)
  const stressLevel = useUIStore((s) => s.stressLevel)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  // Track previously known request IDs
  const knownIdsRef = useRef<Set<string>>(new Set(procurementRequests.map((r) => r.id)))
  const prevStressRef = useRef(stressLevel)

  // New procurement request → fire ops notification
  useEffect(() => {
    const newPending = procurementRequests.filter(
      (r) => r.status === "pending" && !knownIdsRef.current.has(r.id)
    )
    newPending.forEach((r) => {
      knownIdsRef.current.add(r.id)
      addNotification({
        id: genId(),
        tenantId: null,
        severity: r.priority === "emergency" ? "critical" : r.priority === "express" ? "warning" : "info",
        title: "New Procurement Request",
        message: `${r.clientName} ordered ${r.quantity} ${r.unit} of ${r.materialName}`,
        actions: [{ label: "Review", href: "/inventory" }],
        relatedEntityType: "material",
        relatedEntityId: r.materialId,
        read: false,
        createdAt: new Date().toISOString(),
        autoExpires: r.priority === "standard",
      })
    })
  }, [procurementRequests, addNotification])

  // Stress level → auto-collapse sidebar at emergency
  useEffect(() => {
    const prev = prevStressRef.current
    prevStressRef.current = stressLevel

    if (stressLevel === "emergency" && prev !== "emergency") {
      setSidebarOpen(false)
    } else if (prev === "emergency" && stressLevel !== "emergency") {
      setSidebarOpen(true)
    }
  }, [stressLevel, setSidebarOpen])

  // Update stress level based on current shipment data
  const updateStressLevel = useUIStore((s) => s.updateStressLevel)
  const notifications = useNotificationStore((s) => s.notifications)

  useEffect(() => {
    const tempExcursions = notifications.filter((n) => !n.read && n.severity === "critical").length
    const delayedShipments = shipments.filter((s) => s.status === "at_customs").length
    const criticalAlerts = notifications.filter((n) => !n.read && n.severity === "emergency").length
    const overdueDocuments = 0 // would come from document store
    const capacityIssues = 0

    updateStressLevel({ tempExcursions, delayedShipments, criticalAlerts, overdueDocuments, capacityIssues })
  }, [shipments, notifications, updateStressLevel])

  return null
}
