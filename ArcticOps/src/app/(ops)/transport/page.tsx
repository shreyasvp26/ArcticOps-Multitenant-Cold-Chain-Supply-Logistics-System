"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Users, UserCheck, FileWarning, Activity,
  Plane, Ship, Train, Truck, Check, AlertTriangle, XCircle,
  ChevronRight
} from "lucide-react"
import { KpiCard } from "@/components/shared/kpi-card"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { MOCK_CREWS } from "@/lib/mock-data/crews"
import { Sparkline } from "@/components/shared/sparkline"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import { differenceInDays, parseISO, isFuture } from "date-fns"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS = { air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B" }

const STATUS_CONFIG = {
  available: { color: "#2ED573", label: "Available" },
  "on_duty": { color: "#00D4AA", label: "On Duty" },
  "off_duty": { color: "#64748B", label: "Off Duty" },
}

function getDocCompliance(crew: (typeof MOCK_CREWS)[0]): "ok" | "warning" | "danger" {
  for (const doc of crew.documents) {
    if (doc.status === "expired") return "danger"
    if (doc.status === "pending") return "warning"
    if (doc.expiryDate) {
      const days = differenceInDays(parseISO(doc.expiryDate), new Date())
      if (days < 0) return "danger"
      if (days < 30) return "warning"
    }
  }
  return "ok"
}

export default function TransportPage() {
  const router = useRouter()
  const shipments = useShipmentStore((s) => s.shipments)
  const activeShipments = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")

  const onDuty = MOCK_CREWS.filter((c) => c.status === "on_duty").length
  const docAlerts = MOCK_CREWS.filter((c) => {
    return c.documents.some((d) => d.status === "expired" || d.status === "pending")
  }).length
  const dangerDocs = MOCK_CREWS.filter((c) => c.documents.some((d) => d.status === "expired")).length

  return (
    <div className="p-6 flex flex-col gap-5">
      {/* KPI row */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Crew", value: MOCK_CREWS.length, icon: Users, sentiment: "neutral" as const },
          { label: "On Duty", value: onDuty, icon: UserCheck, sentiment: "positive" as const },
          { label: "Doc Alerts", value: docAlerts, icon: FileWarning, sentiment: docAlerts > 0 ? "warning" as const : "positive" as const },
          { label: "Active Assignments", value: activeShipments.length, icon: Activity, sentiment: "positive" as const },
        ].map(({ label, value, icon, sentiment }) => (
          <motion.div key={label} variants={staggerChild}>
            <KpiCard label={label} value={value} icon={icon} sentiment={sentiment} />
          </motion.div>
        ))}
      </motion.div>

      {/* Crew list */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
        <div className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.7)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Crew Members</p>
          <button onClick={() => router.push("/transport/system-health")}
            className="flex items-center gap-1 text-[12px] transition-opacity hover:opacity-80"
            style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>
            System Health <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <table className="w-full" aria-label="Crew list">
          <thead>
            <tr style={{ backgroundColor: "rgba(12,22,42,0.5)", borderBottom: "1px solid var(--ao-border)" }}>
              {["Name", "Mode", "Assignment", "Status", "Doc Compliance", "Score"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_CREWS.map((crew) => {
              const ModeIcon = MODE_ICONS[crew.transportMode] ?? Truck
              const modeColor = MODE_COLORS[crew.transportMode] ?? "#64748B"
              const statusCfg = STATUS_CONFIG[crew.status as keyof typeof STATUS_CONFIG] ?? { color: "#64748B", label: crew.status }
              const compliance = getDocCompliance(crew)

              return (
                <tr key={crew.id} onClick={() => router.push(`/transport/crew/${crew.id}`)}
                  className="border-t cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  style={{ borderColor: "var(--ao-border)" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                        style={{ backgroundColor: `${modeColor}14`, color: modeColor, fontFamily: "var(--ao-font-mono)" }}>
                        {crew.name.charAt(0)}
                      </div>
                      <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                        {crew.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <ModeIcon className="w-4 h-4" style={{ color: modeColor }} />
                      <span className="text-[12px] capitalize" style={{ color: modeColor, fontFamily: "var(--ao-font-body)" }}>{crew.transportMode}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px]" style={{ color: crew.currentAssignmentId ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                      {crew.currentAssignmentId ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium" style={{ color: statusCfg.color, fontFamily: "var(--ao-font-body)" }}>{statusCfg.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    {compliance === "ok" ? <Check className="w-4 h-4" style={{ color: "#2ED573" }} /> :
                     compliance === "warning" ? <AlertTriangle className="w-4 h-4" style={{ color: "#FFA502" }} /> :
                     <XCircle className="w-4 h-4" style={{ color: "#FF4757" }} />}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-bold" style={{ color: crew.performanceScore >= 90 ? "#2ED573" : crew.performanceScore >= 75 ? "#FFA502" : "#FF4757", fontFamily: "var(--ao-font-mono)" }}>
                      {crew.performanceScore}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
