"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Power, Wind, DoorOpen, AlertTriangle, Send } from "lucide-react"
import { useDriverStore } from "@/lib/store/driver-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { Sparkline } from "@/components/shared/sparkline"
import { formatTemp } from "@/lib/utils/format"

export default function MonitorPage() {
  const { currentAssignment } = useDriverStore()
  const getLatest = useTemperatureStore((s) => s.getLatest)
  const getHistory = useTemperatureStore((s) => s.getHistory)
  const { addNotification } = useNotificationStore()
  const [reportOpen, setReportOpen] = useState(false)
  const [reportText, setReportText] = useState("")

  const shipment = currentAssignment ?? MOCK_SHIPMENTS.find((s) => s.status === "in_transit")
  if (!shipment) return <div className="flex items-center justify-center h-full text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No active assignment</div>

  const latest = getLatest(shipment.id)
  const history = getHistory(shipment.id, 6).map((r) => r.temperature)
  const temp = latest?.temperature ?? (shipment.requiredTempMin + shipment.requiredTempMax) / 2

  const isExcursion = temp > shipment.requiredTempMax || temp < shipment.requiredTempMin
  const isApproaching = !isExcursion && (temp > shipment.requiredTempMax - 0.5 || temp < shipment.requiredTempMin + 0.5)
  const statusColor = isExcursion ? "#FF4757" : isApproaching ? "#FFA502" : "#2ED573"

  const submitReport = () => {
    addNotification({
      id: `driver-report-${Date.now()}`,
      tenantId: null,
      severity: "warning",
      title: `Driver Anomaly Report — ${shipment.id}`,
      message: reportText,
      actions: [],
      relatedEntityType: "shipment",
      relatedEntityId: shipment.id,
      read: false,
      createdAt: new Date().toISOString(),
    })
    setReportText("")
    setReportOpen(false)
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-auto">
      {/* Main temp display */}
      <div className="rounded-2xl border p-5 flex flex-col items-center gap-2"
        style={{
          backgroundColor: isExcursion ? "rgba(255,71,87,0.06)" : "var(--ao-surface)",
          borderColor: isExcursion ? "#FF4757" : isApproaching ? "#FFA502" : "var(--ao-border)",
          boxShadow: isExcursion ? "0 0 20px rgba(255,71,87,0.15)" : "none",
        }}>
        <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Compartment 1 — {shipment.temperatureZone.replace("_", " ")}
        </p>
        <p className="text-5xl font-bold" style={{ color: statusColor, fontFamily: "var(--ao-font-mono)" }}>
          {formatTemp(temp)}
        </p>
        <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Required: {shipment.requiredTempMin}°C – {shipment.requiredTempMax}°C
        </p>
        <p className="text-[12px] font-medium" style={{ color: statusColor, fontFamily: "var(--ao-font-body)" }}>
          {isExcursion ? "⚠ EXCURSION — Contact ops immediately" : isApproaching ? "⚠ Approaching limit" : "✓ Within range"}
        </p>
        {history.length > 2 && (
          <div className="w-full mt-2">
            <p className="text-[10px] mb-1 text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Last 6 hours</p>
            <Sparkline data={history} color={statusColor} width={280} height={48} />
          </div>
        )}
      </div>

      {/* Refrigeration unit */}
      <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Refrigeration Unit
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1">
            <Power className="w-5 h-5" style={{ color: "#2ED573" }} />
            <span className="text-[10px]" style={{ color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>Power ON</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Wind className="w-5 h-5" style={{ color: "#3B82F6" }} />
            <span className="text-[10px]" style={{ color: "#3B82F6", fontFamily: "var(--ao-font-body)" }}>Comp. 85%</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <DoorOpen className="w-5 h-5" style={{ color: "#2ED573" }} />
            <span className="text-[10px]" style={{ color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>Sealed</span>
          </div>
        </div>
      </div>

      {/* Report anomaly */}
      {!reportOpen ? (
        <button onClick={() => setReportOpen(true)}
          className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          style={{ backgroundColor: "rgba(255,165,2,0.10)", color: "#FFA502", border: "1px solid rgba(255,165,2,0.3)", fontFamily: "var(--ao-font-body)" }}>
          <AlertTriangle className="w-4 h-4" /> Report Anomaly
        </button>
      ) : (
        <div className="rounded-xl border p-4" style={{ backgroundColor: "rgba(255,165,2,0.06)", borderColor: "rgba(255,165,2,0.3)" }}>
          <p className="text-sm font-semibold mb-2" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>Report to Ops Team</p>
          <textarea
            value={reportText} onChange={(e) => setReportText(e.target.value)}
            placeholder="Describe the anomaly (temp issue, equipment problem, etc.)…"
            rows={3}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
          />
          <div className="flex gap-2 mt-2">
            <button onClick={submitReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#FFA502", color: "#0A1628", fontFamily: "var(--ao-font-body)" }}>
              <Send className="w-3.5 h-3.5" /> Send Report
            </button>
            <button onClick={() => setReportOpen(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
