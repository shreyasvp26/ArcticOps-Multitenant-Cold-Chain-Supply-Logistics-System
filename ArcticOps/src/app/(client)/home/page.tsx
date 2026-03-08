"use client"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import { Package, Clock, CheckCircle, ClipboardList, MapPin, Plane, Ship, Train, Truck, ArrowRight } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { KpiCard } from "@/components/shared/kpi-card"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { formatEta } from "@/lib/utils/format"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"

const LiveTrackingMap = dynamic(
  () => import("@/components/client/live-tracking-map").then((m) => ({ default: m.LiveTrackingMap })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(12,22,42,0.6)", borderRadius: 16,
          border: "1px solid rgba(30,48,80,0.7)", gap: 10, flexDirection: "column",
        }}
      >
        <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid rgba(0,200,168,0.3)", borderTopColor: "#00C8A8", animation: "spin 0.9s linear infinite" }} />
        <p style={{ color: "#64748B", fontSize: 11, fontFamily: "var(--ao-font-body)" }}>Loading live map…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    ),
  }
)

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
  const startLiveTracking = useShipmentStore((s) => s.startLiveTracking)
  const getLatest = useTemperatureStore((s) => s.getLatest)

  // Measure how tall the top section is so map can fill the rest
  const topRef = useRef<HTMLDivElement>(null)
  const [topH, setTopH] = useState(0)
  const [winH, setWinH] = useState(0)

  useEffect(() => {
    const measure = () => {
      setWinH(window.innerHeight)
      if (topRef.current) setTopH(topRef.current.getBoundingClientRect().height)
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (topRef.current) ro.observe(topRef.current)
    window.addEventListener("resize", measure)
    return () => { ro.disconnect(); window.removeEventListener("resize", measure) }
  }, [])

  const shipments = allShipments.filter((s) => s.tenantId === user?.tenantId)
  const active = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")
  const delivered = shipments.filter((s) => s.status === "delivered")
  const pending = shipments.filter((s) => s.status === "requested" || s.status === "preparing")

  useEffect(() => {
    startLiveTracking()
  }, [startLiveTracking])

  // Header = 60px, padding top+bottom = 20+20 = 40, gap between sections = 16
  const HEADER_H = 60
  const PADDING = 40
  const GAP = 16
  // Map height = remaining viewport after header + padding + top section + gap
  const mapH = winH > 0 && topH > 0
    ? Math.max(320, winH - HEADER_H - PADDING - topH - GAP - 20)
    : 420

  return (
    <div className="p-5 flex flex-col" style={{ gap: GAP, minHeight: 0 }}>

      {/* ── Top section: welcome + KPIs + active orders (compact) ── */}
      <div ref={topRef} className="flex flex-col gap-3">

        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
          className="rounded-2xl px-5 py-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,200,168,0.08) 0%, rgba(59,130,246,0.05) 50%, rgba(7,12,25,0.95) 100%)",
            border: "1px solid rgba(0,200,168,0.15)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          }}
        >
          <div aria-hidden="true" className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(0,200,168,0.06) 0%, transparent 70%)", filter: "blur(20px)" }} />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>
                Welcome back
              </p>
              <h2 className="text-[18px] font-bold leading-tight" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.02em" }}>
                {user?.name ?? "User"}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                {user?.tenantName ?? "Your Organization"}
              </p>
            </div>
            <button
              onClick={() => router.push("/procurement/order")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all hover:brightness-110"
              style={{ background: "linear-gradient(135deg, #00C8A8 0%, #00BFA3 100%)", color: "#060D1B", boxShadow: "0 4px 16px rgba(0,200,168,0.2)", fontFamily: "var(--ao-font-body)" }}
            >
              New Order <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        {/* KPIs + active orders in one row on large screens */}
        <div className="flex gap-3 items-start">

          {/* KPI grid */}
          <motion.div variants={staggerContainer} initial="initial" animate="animate"
            className="grid grid-cols-2 gap-2 shrink-0" style={{ width: 280 }}>
            {[
              { label: "Total Orders", value: shipments.length, icon: Package, sentiment: "neutral" as const },
              { label: "In Transit", value: active.length, icon: MapPin, sentiment: "positive" as const },
              { label: "Delivered", value: delivered.length, icon: CheckCircle, sentiment: "positive" as const },
              { label: "Pending", value: pending.length, icon: ClipboardList, sentiment: pending.length > 0 ? "warning" as const : "positive" as const },
            ].map(({ label, value, icon, sentiment }) => (
              <motion.div key={label} variants={staggerChild}>
                <KpiCard label={label} value={value} icon={icon} sentiment={sentiment} />
              </motion.div>
            ))}
          </motion.div>

          {/* Active orders — horizontal scroll */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} aria-hidden="true" />
              <h2 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                Active Orders
              </h2>
              {active.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ backgroundColor: "rgba(0,200,168,0.1)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                  {active.length}
                </span>
              )}
            </div>

            {active.length === 0 ? (
              <div className="flex items-center gap-3 py-4 px-4 rounded-2xl border"
                style={{ borderColor: "rgba(30,48,80,0.6)", backgroundColor: "rgba(12,22,42,0.4)" }}>
                <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: "rgba(0,200,168,0.06)", border: "1px solid rgba(0,200,168,0.1)" }}>
                  <Package className="w-5 h-5" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>No active shipments</p>
                  <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Ready to move? Browse the catalog.</p>
                </div>
                <button
                  onClick={() => router.push("/procurement")}
                  className="ml-auto px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:brightness-110"
                  style={{ backgroundColor: "rgba(0,200,168,0.1)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.2)", fontFamily: "var(--ao-font-body)" }}
                >
                  Browse
                </button>
              </div>
            ) : (
              <motion.div variants={staggerContainer} initial="initial" animate="animate"
                className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {active.map((sh) => {
                  const latest = getLatest(sh.id)
                  const firstLeg = sh.legs[0]
                  const ModeIcon = firstLeg ? (MODE_ICONS[firstLeg.mode] ?? Truck) : Truck
                  const isAtRisk = sh.status === "at_customs"
                  return (
                    <motion.div key={sh.id} variants={staggerChild}
                      onClick={() => router.push(`/tracker/${sh.id}`)}
                      className="rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] shrink-0"
                      style={{
                        width: 200,
                        background: "linear-gradient(135deg, rgba(13,22,41,0.95) 0%, rgba(7,12,25,0.95) 100%)",
                        borderColor: isAtRisk ? "rgba(255,165,2,0.25)" : "rgba(30,48,80,0.7)",
                        boxShadow: isAtRisk ? "0 4px 20px rgba(255,165,2,0.06)" : "0 4px 16px rgba(0,0,0,0.15)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <div className="w-0.5 h-8 rounded-full" style={{ backgroundColor: isAtRisk ? "#FFA502" : "var(--ao-accent)" }} aria-hidden="true" />
                          <div>
                            <span className="text-[10px] font-bold block" style={{ color: isAtRisk ? "#FFA502" : "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
                            <p className="text-[12px] font-semibold leading-tight" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                              {sh.materials[0]?.name ?? "Order"}
                              {sh.materials.length > 1 && <span className="text-[10px] ml-1 font-normal" style={{ color: "var(--ao-text-muted)" }}>+{sh.materials.length - 1}</span>}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={isAtRisk ? "delayed" : "in_transit"} />
                      </div>
                      <p className="text-[11px] mb-2 pl-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
                      </p>
                      <div className="flex items-center justify-between pl-2 pt-2 border-t" style={{ borderColor: "rgba(30,48,80,0.5)" }}>
                        {latest && (
                          <TemperatureBadge temperature={latest.temperature} zone={sh.temperatureZone}
                            requiredMin={sh.requiredTempMin} requiredMax={sh.requiredTempMax} size="sm" />
                        )}
                        <div className="flex items-center gap-1.5 ml-auto">
                          <ModeIcon className="w-3 h-3" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                          <div className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                            <span className="text-[10px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
                              <EtaCountdown eta={sh.eta} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fleet Position Map — fills remaining page height ── */}
      {active.length > 0 && (
        <div style={{ flex: "none" }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} aria-hidden="true" />
            <h2 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              Fleet Position
            </h2>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3B82F6", fontFamily: "var(--ao-font-mono)" }}>
              Live
            </span>
          </div>
          <LiveTrackingMap shipments={active} height={mapH} />
        </div>
      )}
    </div>
  )
}
