"use client"
import { useEffect, useRef } from "react"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { createTemperatureSimulator } from "@/lib/mock-data/temperature"
import { createGPSSimulator } from "@/lib/mock-data/gps"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { calculateStressLevel } from "@/lib/utils/risk"

const TEMP_INTERVAL_MS = 5000
const GPS_INTERVAL_MS = 8000
const STRESS_INTERVAL_MS = 10000

export function RealtimeLoop() {
  const { initialize: initTemp, addReading, getActiveExcursions } = useTemperatureStore()
  const { addNotification } = useNotificationStore()
  const { updateStressLevel } = useUIStore()
  const { shipments, updateCoordinates } = useShipmentStore()
  const simulatorsRef = useRef<Map<string, () => import("@/lib/types/temperature").TempReading>>(new Map())
  const gpsSimulatorsRef = useRef<Map<string, () => [number, number]>>(new Map())
  const excursionAlertedRef = useRef<Set<string>>(new Set())

  // Initialize temperature history once
  useEffect(() => {
    initTemp()
  }, [initTemp])

  // Build simulators for active shipments
  useEffect(() => {
    const activeShipments = MOCK_SHIPMENTS.filter((s) => s.status === "in_transit" || s.status === "at_customs")
    activeShipments.forEach((sh) => {
      if (!simulatorsRef.current.has(sh.id)) {
        simulatorsRef.current.set(sh.id, createTemperatureSimulator(sh.id, sh.temperatureZone))
      }
      if (!gpsSimulatorsRef.current.has(sh.id) && sh.checkpoints.length >= 2) {
        const coords = sh.checkpoints.map((cp) => cp.coordinates)
        gpsSimulatorsRef.current.set(sh.id, createGPSSimulator(coords))
      }
    })
  }, [])

  // Temperature loop — every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      simulatorsRef.current.forEach((simulate, shipmentId) => {
        const reading = simulate()
        addReading(reading)

        // Fire excursion notification once per session
        if (reading.isExcursion && !excursionAlertedRef.current.has(shipmentId)) {
          excursionAlertedRef.current.add(shipmentId)
          addNotification({
            id: `exc_notif_${shipmentId}_${Date.now()}`,
            tenantId: null,
            severity: "critical",
            title: `Temperature excursion — ${shipmentId}`,
            message: `Shipment ${shipmentId} temperature reached ${reading.temperature.toFixed(1)}°C — outside safe range. Immediate attention required.`,
            actions: [{ label: "View shipment", href: `/shipments/${shipmentId}` }],
            relatedEntityType: "shipment",
            relatedEntityId: shipmentId,
            read: false,
            createdAt: new Date().toISOString(),
          })
        }
      })
    }, TEMP_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [addReading, addNotification])

  // GPS loop — every 8s
  useEffect(() => {
    const interval = setInterval(() => {
      gpsSimulatorsRef.current.forEach((simulate, shipmentId) => {
        const coords = simulate()
        updateCoordinates(shipmentId, coords)
      })
    }, GPS_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [updateCoordinates])

  // Stress level recalculation — every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      const activeExcursions = getActiveExcursions()
      const delayedShipments = shipments.filter((s) => s.status === "at_customs").length
      const criticalAlerts = useNotificationStore.getState().notifications.filter(
        (n) => (n.severity === "critical" || n.severity === "emergency") && !n.read
      ).length
      const overdueDocuments = 2 // simplified

      updateStressLevel({
        tempExcursions: activeExcursions.length,
        delayedShipments,
        criticalAlerts,
        overdueDocuments,
        capacityIssues: 0,
      })
    }, STRESS_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [shipments, getActiveExcursions, updateStressLevel])

  return null
}
