"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Thermometer, Power, Wind, DoorOpen, ArrowLeft, Zap, Bell } from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { Sparkline } from "@/components/shared/sparkline"
import { formatTemp } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"
import { motion } from "framer-motion"

function getTempStatus(temp: number, min: number, max: number): "below" | "in_range" | "approaching" | "excursion" {
  if (temp < min) return "below"
  if (temp > max) return "excursion"
  if (temp > max - 1 || temp < min + 1) return "approaching"
  return "in_range"
}

const STATUS_STYLES = {
  below: { color: "#3B82F6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", label: "Below Range" },
  in_range: { color: "#2ED573", bg: "rgba(46,213,115,0.06)", border: "rgba(46,213,115,0.2)", label: "In Range" },
  approaching: { color: "#FFA502", bg: "rgba(255,165,2,0.06)", border: "rgba(255,165,2,0.2)", label: "Approaching Limit" },
  excursion: { color: "#FF4757", bg: "rgba(255,71,87,0.08)", border: "rgba(255,71,87,0.3)", label: "EXCURSION" },
}

export default function SystemHealthPage() {
  const router = useRouter()
  const shipments = useShipmentStore((s) => s.shipments)
  const getLatest = useTemperatureStore((s) => s.getLatest)
  const getHistory = useTemperatureStore((s) => s.getHistory)
  const notifications = useNotificationStore((s) => s.notifications)

  const activeShipments = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")
  const activeAlerts = notifications.filter((n) =>
    (n.severity === "critical" || n.severity === "emergency") && !n.read
  )

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.6)" }}>
        <button onClick={() => router.push("/transport")}
          className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ao-text-muted)" }} />
        </button>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>System Health</h2>
        {activeAlerts.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold"
            style={{ backgroundColor: "rgba(255,71,87,0.10)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.3)", fontFamily: "var(--ao-font-body)" }}>
            <Bell className="w-3.5 h-3.5" /> {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="p-6">
        {activeShipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Thermometer className="w-12 h-12" style={{ color: "var(--ao-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No active shipments to monitor</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeShipments.map((sh) => {
              const latest = getLatest(sh.id)
              const history = getHistory(sh.id, 6).map((r) => r.temperature)
              const status = latest
                ? getTempStatus(latest.temperature, sh.requiredTempMin, sh.requiredTempMax)
                : "in_range"
              const style = STATUS_STYLES[status]

              return (
                <motion.div
                  key={sh.id}
                  variants={staggerChild}
                  className="rounded-xl border p-4 flex flex-col gap-3"
                  style={{
                    backgroundColor: style.bg,
                    borderColor: status === "excursion" ? "#FF4757" : "var(--ao-border)",
                    boxShadow: status === "excursion" ? "0 0 12px rgba(255,71,87,0.2)" : "none",
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</p>
                      <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sh.materials[0]?.name}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${style.color}14`, color: style.color, fontFamily: "var(--ao-font-body)" }}>
                      {style.label}
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="flex items-end gap-3">
                    <div>
                      <p className="text-3xl font-bold leading-none" style={{ color: style.color, fontFamily: "var(--ao-font-mono)" }}>
                        {latest ? formatTemp(latest.temperature) : "—"}
                      </p>
                      <p className="text-[10px] mt-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        Range: {sh.requiredTempMin}°C – {sh.requiredTempMax}°C
                      </p>
                      {latest && (
                        <p className="text-[10px]" style={{ color: style.color, fontFamily: "var(--ao-font-body)" }}>
                          Δ {(latest.temperature - ((sh.requiredTempMin + sh.requiredTempMax) / 2)).toFixed(1)}°C from midpoint
                        </p>
                      )}
                    </div>
                    {history.length > 2 && (
                      <Sparkline data={history} color={style.color} width={80} height={36} />
                    )}
                  </div>

                  {/* Refrigeration unit status */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--ao-border)" }}>
                    <div className="flex items-center gap-1">
                      <Power className="w-3 h-3" style={{ color: "#2ED573" }} />
                      <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Power ON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Wind className="w-3 h-3" style={{ color: "#3B82F6" }} />
                      <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Comp 85%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DoorOpen className="w-3 h-3" style={{ color: "#2ED573" }} />
                      <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Sealed</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
