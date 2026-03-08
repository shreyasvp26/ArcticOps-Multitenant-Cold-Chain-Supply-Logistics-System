"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Package, Clock, CheckCircle, ClipboardList, MapPin, Thermometer, Plane, Ship, Train, Truck } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { KpiCard } from "@/components/shared/kpi-card"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { formatEta, formatTimestamp } from "@/lib/utils/format"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"
import { GlobeMap } from "@/components/ops/globe-map"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }

function EtaCountdown({ eta }: { eta: string }) {
  const [display, setDisplay] = useState(formatEta(eta))
  useEffect(() => {
    const id = setInterval(() => setDisplay(formatEta(eta)), 60_000)
    return () => clearInterval(id)
  }, [eta])
  return <span style={{ fontFamily: "var(--ao-font-mono)" }}>{display}</span>
}

export default function ClientHomePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const allShipments = useShipmentStore((s) => s.shipments)
  const notifications = useNotificationStore((s) => s.notifications)
  const getLatest = useTemperatureStore((s) => s.getLatest)

  const shipments = allShipments.filter((s) => s.tenantId === user?.tenantId)
  const active = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")
  
  const delivered = shipments.filter((s) => s.status === "delivered")
  const pending = shipments.filter((s) => s.status === "requested" || s.status === "preparing")
  const tenantNotifications = notifications.filter((n) => n.tenantId === user?.tenantId || n.tenantId === null).slice(0, 10)

  return (
<<<<<<< Updated upstream
    <div className="p-6 flex flex-col gap-5">
=======
    <div className="p-5 flex flex-col gap-5">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(0,200,168,0.08) 0%, rgba(59,130,246,0.05) 50%, rgba(7,12,25,0.95) 100%)",
          border: "1px solid rgba(0,200,168,0.15)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(0,200,168,0.06) 0%, transparent 70%)", filter: "blur(20px)" }}
        />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>
              Welcome back
            </p>
            <h2 className="text-[20px] font-bold" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.02em" }}>
              {user?.name ?? "User"}
            </h2>
            <p className="text-[13px] mt-0.5" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {user?.tenantName ?? "Your Organization"}
            </p>
          </div>
          <button
            onClick={() => router.push("/procurement/order")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all hover:brightness-110"
            style={{
              background: "linear-gradient(135deg, #00C8A8 0%, #00BFA3 100%)",
              color: "#060D1B",
              boxShadow: "0 4px 16px rgba(0,200,168,0.2)",
              fontFamily: "var(--ao-font-body)",
            }}
          >
            New Order
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </motion.div>

>>>>>>> Stashed changes
      {/* Quick stats */}
      <motion.div variants={staggerContainer} initial="initial" animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: shipments.length, icon: Package, sentiment: "neutral" as const },
          { label: "In Transit", value: active.length, icon: MapPin, sentiment: "positive" as const },
          { label: "Delivered (Month)", value: delivered.length, icon: CheckCircle, sentiment: "positive" as const },
          { label: "Pending Approval", value: pending.length, icon: ClipboardList, sentiment: pending.length > 0 ? "warning" as const : "positive" as const },
        ].map(({ label, value, icon, sentiment }) => (
          <motion.div key={label} variants={staggerChild}>
            <KpiCard label={label} value={value} icon={icon} sentiment={sentiment} />
          </motion.div>
        ))}
      </motion.div>

      {/* Active orders */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>Active Orders</h2>
        {active.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 rounded-xl border"
            style={{ borderColor: "var(--ao-border)", backgroundColor: "var(--ao-surface)" }}>
            <Package className="w-8 h-8" style={{ color: "var(--ao-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No active shipments</p>
          </div>
        ) : (
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {active.map((sh) => {
              const latest = getLatest(sh.id)
              const firstLeg = sh.legs[0]
              const ModeIcon = firstLeg ? (MODE_ICONS[firstLeg.mode] ?? Truck) : Truck
              return (
                <motion.div key={sh.id} variants={staggerChild}
                  onClick={() => router.push(`/tracker/${sh.id}`)}
                  className="rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01] hover:border-[var(--ao-border-hover)]"
                  style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
                    <StatusBadge status={sh.status === "at_customs" ? "delayed" : "in_transit"} />
                  </div>
                  <p className="text-[13px] font-medium mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                    {sh.materials[0]?.name ?? "Order"}
                    {sh.materials.length > 1 && <span className="text-[11px] ml-1" style={{ color: "var(--ao-text-muted)" }}>+{sh.materials.length - 1}</span>}
                  </p>
                  <p className="text-[11px] mb-3" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
                  </p>
                  <div className="flex items-center justify-between">
                    {latest && (
                      <TemperatureBadge temperature={latest.temperature} zone={sh.temperatureZone}
                        requiredMin={sh.requiredTempMin} requiredMax={sh.requiredTempMax} size="sm" />
                    )}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <ModeIcon className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
                      <Clock className="w-3 h-3" style={{ color: "var(--ao-text-muted)" }} />
                      <EtaCountdown eta={sh.eta} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Live Tracking SH-2847 */}
      <div>
<<<<<<< Updated upstream
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>Recent Shipment Updates</h2>
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)", backgroundColor: "var(--ao-surface)" }}>
          {notifications
            .filter((n) => n.tenantId === user?.tenantId && n.relatedEntityType === "shipment")
            .slice(0, 8)
            .map((n, i) => (
              <div key={n.id} className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t" : ""}`}
                style={{ borderColor: "var(--ao-border)" }}>
                <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                  style={{ backgroundColor: n.severity === "critical" ? "#FF4757" : n.severity === "warning" ? "#FFA502" : "#2ED573" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{n.relatedEntityId}</p>
                    <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{formatTimestamp(n.createdAt)}</p>
                  </div>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{n.title}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{n.message}</p>
                </div>
              </div>
            ))}
          {notifications.filter((n) => n.tenantId === user?.tenantId && n.relatedEntityType === "shipment").length === 0 && (
            <p className="px-4 py-8 text-sm text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No recent shipment updates</p>
          )}
=======
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "#3B82F6" }} aria-hidden="true" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              Live Tracking: SH-2847
            </h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: "rgba(0,200,168,0.3)", backgroundColor: "rgba(0,200,168,0.05)" }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "var(--ao-accent)" }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>Live Signal</span>
          </div>
        </div>
        <div className="h-[400px] rounded-2xl border overflow-hidden relative" style={{ borderColor: "rgba(30,48,80,0.7)", background: "rgba(12,22,42,0.4)" }}>
          <GlobeMap
            shipments={allShipments.filter(s => s.id === "SH-2847")}
            focusedShipmentId="SH-2847"
          />
          {/* Overlay info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-4 rounded-xl border backdrop-blur-md"
            style={{ backgroundColor: "rgba(8,14,28,0.8)", borderColor: "rgba(59,130,246,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Current Location</span>
                <span className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>Dubai Hub (DXB)</span>
              </div>
              <div className="w-px h-8 bg-[rgba(255,255,255,0.1)]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Destination</span>
                <span className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>Frankfurt, DE</span>
              </div>
            </div>
            <button
              onClick={() => router.push("/tracker/SH-2847")}
              className="px-4 py-2 rounded-lg text-[12px] font-bold transition-all hover:brightness-110"
              style={{ backgroundColor: "#3B82F6", color: "white", fontFamily: "var(--ao-font-body)" }}
            >
              Full Details
            </button>
          </div>
>>>>>>> Stashed changes
        </div>
      </div>
    </div>
  )
}
