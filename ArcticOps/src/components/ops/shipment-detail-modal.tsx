"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Thermometer, MapPin, User, Plane, Ship, Train, Truck,
  CheckCircle2, AlertCircle, Clock, ShieldCheck, Activity,
  ArrowRight, Zap, Package,
} from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, YAxis, ReferenceLine, Tooltip } from "recharts"
import { format, parseISO } from "date-fns"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { formatEta, formatDate, formatDatetime } from "@/lib/utils/format"
import { getRiskColor, getRiskLabel } from "@/lib/utils/risk"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import type { Shipment } from "@/lib/types/shipment"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS: Record<string, string> = {
  air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B",
}

// ---------- helpers ----------
function getRiskFactors(shipment: Shipment, excursionCount: number, alertCount: number) {
  return [
    {
      label: "Temp Excursions",
      value: Math.min(excursionCount * 20, 40),
      max: 40,
      color: "#FF4757",
      justification: excursionCount > 0
        ? `${excursionCount} excursion${excursionCount > 1 ? "s" : ""} detected in last 24 h — cold chain integrity at risk`
        : "No temperature excursions detected",
      icon: Thermometer,
    },
    {
      label: "Customs / Delay",
      value: shipment.status === "at_customs" ? 15 : 0,
      max: 30,
      color: "#FFA502",
      justification: shipment.status === "at_customs"
        ? "Shipment held at customs — potential spoilage window"
        : "No active delays detected",
      icon: Clock,
    },
    {
      label: "Active Alerts",
      value: Math.min(alertCount * 10, 20),
      max: 20,
      color: "#FF6B35",
      justification: alertCount > 0
        ? `${alertCount} unresolved critical alert${alertCount > 1 ? "s" : ""} for this shipment`
        : "No unresolved critical alerts",
      icon: AlertCircle,
    },
    {
      label: "Carrier Reliability",
      value: shipment.riskScore > 50 ? 5 : 0,
      max: 10,
      color: "#818CF8",
      justification: shipment.riskScore > 50
        ? "Carrier reliability score below threshold for this route"
        : "Carrier reliability within acceptable range",
      icon: ShieldCheck,
    },
  ]
}

// ---------- Animated risk arc ----------
function RiskArc({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    let cancelled = false
    const start = Date.now()
    const duration = 900
    const tick = () => {
      if (cancelled) return
      const t = Math.min((Date.now() - start) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      setDisplayed(Math.round(score * ease))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
    return () => { cancelled = true }
  }, [score])

  const radius = 52
  const circ = 2 * Math.PI * radius
  const arc = circ * 0.75
  const filled = arc * (score / 100)

  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" style={{ transform: "rotate(135deg)" }}>
        {/* Track */}
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(30,48,80,0.6)" strokeWidth="10"
          strokeDasharray={`${arc} ${circ}`} strokeLinecap="round" />
        {/* Fill */}
        <motion.circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${filled} ${circ}` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[28px] font-bold leading-none" style={{ fontFamily: "var(--ao-font-mono)", color }}>{displayed}</span>
        <span className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>risk</span>
      </div>
    </div>
  )
}

// ---------- Animated bar ----------
function FactorBar({ value, max, color, delay }: { value: number; max: number; color: string; delay: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(30,48,80,0.5)" }}>
      <motion.div className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}66` }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

// ---------- Cold chain bar ----------
function ColdChainBar({ value }: { value: number }) {
  const color = value >= 90 ? "#2ED573" : value >= 70 ? "#FFA502" : "#FF4757"
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(30,48,80,0.5)" }}>
      <motion.div className="h-full rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}55` }}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}

// ---------- Temp chart tooltip ----------
function TempTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-2.5 py-1.5 rounded-lg text-xs shadow-xl"
      style={{ backgroundColor: "rgba(8,16,34,0.98)", border: "1px solid rgba(30,48,80,0.8)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
      <span style={{ color: "var(--ao-accent)" }}>{payload[0]?.value?.toFixed(1)}°C</span>
    </div>
  )
}

// ---------- Main modal ----------
interface ShipmentDetailModalProps {
  shipment: Shipment
  onClose: () => void
}

export function ShipmentDetailModal({ shipment, onClose }: ShipmentDetailModalProps) {
  const tempHistory = useTemperatureStore((s) => s.getHistory(shipment.id, 24))
  const notifications = useNotificationStore((s) => s.notifications)

  const excursionCount = tempHistory.filter((r) => r.isExcursion).length
  const alertCount = notifications.filter((n) => n.relatedEntityId === shipment.id && !n.read && (n.severity === "critical" || n.severity === "emergency")).length
  const latestTemp = tempHistory.at(-1)
  const statusCfg = SHIPMENT_STATUSES[shipment.status]
  const riskColor = getRiskColor(shipment.riskScore)
  const riskLabel = getRiskLabel(shipment.riskScore)
  const factors = getRiskFactors(shipment, excursionCount, alertCount)

  const chartData = tempHistory.slice(-48).map((r, i) => ({
    i,
    temp: r.temperature,
    time: format(parseISO(r.timestamp), "HH:mm"),
  }))

  const zoneColor = shipment.temperatureZone === "ultra_cold" ? "#7C3AED"
    : shipment.temperatureZone === "frozen" ? "#3B82F6" : "#06B6D4"

  // Escape key close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {/* ── Backdrop ── */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-6"
        style={{ backgroundColor: "rgba(2,6,18,0.75)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
        onClick={onClose}
      >
        {/* ── Panel ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 24, stiffness: 280, mass: 0.8 } }}
          exit={{ opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.16 } }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(10,20,42,0.98) 0%, rgba(6,13,27,0.99) 100%)",
            border: "1px solid rgba(30,48,80,0.8)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-start justify-between px-5 pt-5 pb-4 shrink-0"
            style={{ borderBottom: "1px solid rgba(30,48,80,0.6)" }}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl shrink-0"
                style={{ background: "rgba(0,200,168,0.1)", border: "1px solid rgba(0,200,168,0.2)" }}>
                <Package className="w-4 h-4" style={{ color: "var(--ao-accent)" }} />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-[18px] font-bold" style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-accent)", letterSpacing: "-0.01em" }}>
                    {shipment.id}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: statusCfg.color, backgroundColor: statusCfg.bgColor, border: `1px solid ${statusCfg.color}30`, fontFamily: "var(--ao-font-body)" }}>
                    {statusCfg.label}
                  </span>
                </div>
                <p className="text-[12px] mt-1 flex items-center gap-1.5"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                  <User className="w-3 h-3 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                  {shipment.clientName}
                  <span style={{ color: "rgba(30,48,80,1)" }}>·</span>
                  <MapPin className="w-3 h-3 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                  {shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.07)] shrink-0 mt-0.5">
              <X className="w-4.5 h-4.5" style={{ color: "var(--ao-text-muted)" }} />
            </button>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(30,48,80,0.8) transparent" }}>
            <div className="p-5 flex flex-col gap-4">

              {/* ── Row 1: Risk arc + factors ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.05, duration: 0.3 } }}
                className="flex gap-4 rounded-xl p-4"
                style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}
              >
                {/* Arc gauge */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <RiskArc score={shipment.riskScore} color={riskColor} />
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ color: riskColor, backgroundColor: `${riskColor}14`, border: `1px solid ${riskColor}30`, fontFamily: "var(--ao-font-body)" }}>
                    {riskLabel}
                  </span>
                </div>

                {/* Factor breakdown */}
                <div className="flex-1 flex flex-col justify-center gap-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    Risk Factor Breakdown
                  </p>
                  {factors.map((f, i) => {
                    const Icon = f.icon
                    const hasRisk = f.value > 0
                    return (
                      <div key={f.label} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Icon className="w-3 h-3 shrink-0" style={{ color: hasRisk ? f.color : "var(--ao-text-muted)" }} />
                            <span className="text-[11px]" style={{ color: hasRisk ? "var(--ao-text-primary)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                              {f.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold" style={{ color: hasRisk ? f.color : "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>
                            {f.value}/{f.max}
                          </span>
                        </div>
                        <FactorBar value={f.value} max={f.max} color={f.color} delay={0.12 + i * 0.07} />
                        <p className="text-[10px] leading-snug" style={{ color: hasRisk ? "rgba(203,213,225,0.6)" : "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-body)" }}>
                          {f.justification}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* ── Row 2: Key stats ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1, duration: 0.3 } }}
                className="grid grid-cols-3 gap-3"
              >
                {/* Cold chain confidence */}
                <div className="rounded-xl p-3.5 flex flex-col gap-2"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Cold Chain</span>
                    <ShieldCheck className="w-3 h-3" style={{ color: shipment.coldChainConfidence >= 90 ? "#2ED573" : shipment.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757" }} />
                  </div>
                  <span className="text-[22px] font-bold leading-none"
                    style={{ color: shipment.coldChainConfidence >= 90 ? "#2ED573" : shipment.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757", fontFamily: "var(--ao-font-mono)" }}>
                    {shipment.coldChainConfidence}%
                  </span>
                  <ColdChainBar value={shipment.coldChainConfidence} />
                </div>

                {/* ETA */}
                <div className="rounded-xl p-3.5 flex flex-col gap-1.5"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>ETA</span>
                  <span className="text-[13px] font-bold leading-snug"
                    style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                    {formatEta(shipment.eta)}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    Depart: {formatDate(shipment.departureDate)}
                  </span>
                </div>

                {/* Temp zone */}
                <div className="rounded-xl p-3.5 flex flex-col gap-1.5"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Temp Zone</span>
                    <Thermometer className="w-3 h-3" style={{ color: zoneColor }} />
                  </div>
                  <span className="text-[13px] font-bold capitalize"
                    style={{ color: zoneColor, fontFamily: "var(--ao-font-mono)" }}>
                    {shipment.temperatureZone.replace("_", " ")}
                  </span>
                  <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                    {shipment.requiredTempMin}°C – {shipment.requiredTempMax}°C
                  </span>
                  {latestTemp && (
                    <TemperatureBadge temperature={latestTemp.temperature} zone={shipment.temperatureZone}
                      requiredMin={shipment.requiredTempMin} requiredMax={shipment.requiredTempMax} size="sm" />
                  )}
                </div>
              </motion.div>

              {/* ── Row 3: Temperature chart ── */}
              {chartData.length > 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.3 } }}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" style={{ color: zoneColor }} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                        Temperature (24 h)
                      </span>
                    </div>
                    {excursionCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(255,71,87,0.1)", color: "#FF4757", border: "1px solid rgba(255,71,87,0.25)", fontFamily: "var(--ao-font-body)" }}>
                        {excursionCount} excursion{excursionCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0.6 }}
                    animate={{ opacity: 1, scaleY: 1, transition: { duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                    style={{ transformOrigin: "bottom" }}
                  >
                    <ResponsiveContainer width="100%" height={90}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                        <defs>
                          <linearGradient id="sdmTempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={zoneColor} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={zoneColor} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <YAxis tick={{ fontSize: 9, fill: "rgba(100,116,139,0.6)", fontFamily: "var(--ao-font-mono)" }} domain={["auto", "auto"]} />
                        <ReferenceLine y={shipment.requiredTempMax} stroke="#FF4757" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <ReferenceLine y={shipment.requiredTempMin} stroke="#3B82F6" strokeDasharray="3 3" strokeOpacity={0.6} />
                        <Tooltip content={<TempTooltip />} />
                        <Area type="monotone" dataKey="temp" stroke={zoneColor} strokeWidth={1.5}
                          fill="url(#sdmTempGrad)" dot={false}
                          activeDot={{ r: 3, fill: zoneColor, stroke: "rgba(255,255,255,0.2)", strokeWidth: 1.5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                </motion.div>
              )}

              {/* ── Row 4: Checkpoints timeline ── */}
              {shipment.checkpoints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <MapPin className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      Checkpoints
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {shipment.checkpoints.map((cp, i) => {
                      const isLast = i === shipment.checkpoints.length - 1
                      const dotColor = cp.status === "passed" ? "#2ED573"
                        : cp.status === "current" ? "var(--ao-accent)"
                        : cp.status === "delayed" ? "#FF4757" : "rgba(30,48,80,0.8)"
                      return (
                        <motion.div
                          key={cp.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: 0.25 + i * 0.06, duration: 0.22 } }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                              style={{
                                backgroundColor: dotColor,
                                boxShadow: cp.status === "current" ? `0 0 0 3px ${dotColor}30` : undefined,
                              }} />
                            {!isLast && <div className="w-px flex-1 min-h-[28px]" style={{ backgroundColor: "rgba(30,48,80,0.6)", marginTop: "2px" }} />}
                          </div>
                          <div className="flex-1 pb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[12px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                {cp.name}
                              </span>
                              {cp.status === "passed" && <CheckCircle2 className="w-3 h-3" style={{ color: "#2ED573" }} />}
                              {cp.status === "current" && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                                  style={{ background: "rgba(0,200,168,0.12)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
                                  Live
                                </span>
                              )}
                              {cp.status === "delayed" && <AlertCircle className="w-3 h-3" style={{ color: "#FF4757" }} />}
                            </div>
                            <p className="text-[10px] mt-0.5"
                              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                              {cp.actualArrival
                                ? `Arrived ${formatDatetime(cp.actualArrival)}`
                                : `ETA ${formatDatetime(cp.estimatedArrival)}`}
                            </p>
                            {cp.delayReason && (
                              <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>
                                <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                {cp.delayReason}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Row 5: Transport legs summary ── */}
              {shipment.legs.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.3 } }}
                  className="rounded-xl p-4"
                  style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}
                >
                  <div className="flex items-center gap-1.5 mb-3">
                    <Zap className="w-3.5 h-3.5" style={{ color: "#FFA502" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      Transport Legs
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {shipment.legs.map((leg, i) => {
                      const Icon = MODE_ICONS[leg.mode as keyof typeof MODE_ICONS] ?? Truck
                      const color = MODE_COLORS[leg.mode] ?? "#64748B"
                      return (
                        <motion.div
                          key={leg.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.06, duration: 0.2 } }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                          style={{ background: "rgba(6,13,27,0.7)", border: "1px solid rgba(30,48,80,0.5)" }}
                        >
                          <div className="p-1.5 rounded-lg shrink-0"
                            style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}>
                            <Icon className="w-3.5 h-3.5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                              <span className="truncate">{leg.origin}</span>
                              <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                              <span className="truncate">{leg.destination}</span>
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                              {leg.distanceKm.toLocaleString()} km
                            </p>
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: `${color}18`, color, fontFamily: "var(--ao-font-mono)" }}>
                            {leg.mode}
                          </span>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* ── Row 6: Materials ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.3 } }}
                className="rounded-xl px-4 py-3.5 flex flex-wrap gap-x-6 gap-y-2"
                style={{ background: "rgba(12,20,36,0.7)", border: "1px solid rgba(30,48,80,0.7)" }}
              >
                <p className="w-full text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Materials
                </p>
                {shipment.materials.map((m) => (
                  <div key={m.materialId} className="flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} />
                    <span className="text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{m.name}</span>
                    <span className="text-[11px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                      ×{m.quantity} {m.unit}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Carrier:</span>
                  <span className="text-[11px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{shipment.carrierName}</span>
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
