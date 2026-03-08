"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, Package, Thermometer, Map, FileText,
    ArrowRight, Plane, Ship, Train, Truck,
    CheckCircle2, Clock, AlertCircle, MapPin, User,
} from "lucide-react"
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    Tooltip, ReferenceLine, CartesianGrid,
} from "recharts"
import { format, parseISO } from "date-fns"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { formatEta, formatDate, formatDatetime } from "@/lib/utils/format"
import { RiskScore } from "@/components/shared/risk-score"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { Sparkline } from "@/components/shared/sparkline"
import type { Shipment } from "@/lib/types/shipment"

const TABS = [
    { id: "overview", label: "Overview", icon: Package },
    { id: "temperature", label: "Temperature", icon: Thermometer },
    { id: "route", label: "Route Legs", icon: Map },
    { id: "documents", label: "Documents", icon: FileText },
]

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS: Record<string, string> = {
    air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B",
}

function TempTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
    if (!active || !payload?.length) return null
    return (
        <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
            style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
            <p>{label}</p>
            <p style={{ color: "var(--ao-accent)" }}>{payload[0]?.value?.toFixed(1)}°C</p>
        </div>
    )
}

interface ShipmentDetailModalProps {
    shipment: Shipment
    onClose: () => void
}

export function ShipmentDetailModal({ shipment, onClose }: ShipmentDetailModalProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const tempHistory = useTemperatureStore((s) => s.getHistory(shipment.id, 24))

    const latestTemp = tempHistory.at(-1)
    const statusCfg = SHIPMENT_STATUSES[shipment.status]

    const chartData = tempHistory.slice(-72).map((r) => ({
        time: format(parseISO(r.timestamp), "HH:mm"),
        temp: r.temperature,
    }))

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-6"
                style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
                onClick={onClose}
            >
                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.93, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", damping: 22, stiffness: 300 } }}
                    exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.18 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
                    style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)" }}
                >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
                        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.7)" }}>
                        <div className="flex items-center gap-4 min-w-0">
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold" style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-accent)" }}>
                                        {shipment.id}
                                    </h2>
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                                        style={{ color: statusCfg.color, backgroundColor: statusCfg.bgColor, fontFamily: "var(--ao-font-body)" }}>
                                        {statusCfg.label}
                                    </span>
                                </div>
                                <p className="text-sm mt-0.5 flex items-center gap-1.5"
                                    style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                                    <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-accent)" }} />
                                    {shipment.clientName}
                                    <span style={{ color: "var(--ao-text-muted)" }}>·</span>
                                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                                    {shipment.origin} → {shipment.destination}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                            <RiskScore score={shipment.riskScore} size="md" />
                            <div className="text-center">
                                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Cold Chain</p>
                                <p className="text-lg font-bold" style={{
                                    color: shipment.coldChainConfidence >= 90 ? "#2ED573" : shipment.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757",
                                    fontFamily: "var(--ao-font-mono)",
                                }}>
                                    {shipment.coldChainConfidence}%
                                </p>
                            </div>
                            <button onClick={onClose}
                                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.07)] transition-colors ml-2">
                                <X className="w-5 h-5" style={{ color: "var(--ao-text-muted)" }} />
                            </button>
                        </div>
                    </div>

                    {/* ── Tab bar ── */}
                    <div className="flex border-b shrink-0"
                        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(13,24,41,0.6)" }}>
                        {TABS.map(({ id: tabId, label, icon: Icon }) => (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                className="flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-colors border-b-2"
                                style={{
                                    borderColor: activeTab === tabId ? "var(--ao-accent)" : "transparent",
                                    color: activeTab === tabId ? "var(--ao-accent)" : "var(--ao-text-muted)",
                                    fontFamily: "var(--ao-font-body)",
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Tab content ── */}
                    <div className="flex-1 overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
                                exit={{ opacity: 0, y: -8, transition: { duration: 0.12 } }}
                            >
                                {/* OVERVIEW */}
                                {activeTab === "overview" && (
                                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {/* Summary card */}
                                        <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                                            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Summary</h3>
                                            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                                                {[
                                                    { label: "Materials", value: shipment.materials.map((m) => `${m.name} ×${m.quantity}`).join(", ") },
                                                    { label: "Carrier", value: shipment.carrierName },
                                                    { label: "Temp Zone", value: shipment.temperatureZone.replace("_", "-") },
                                                    { label: "Required Range", value: `${shipment.requiredTempMin}°C – ${shipment.requiredTempMax}°C` },
                                                    { label: "Departure", value: formatDate(shipment.departureDate) },
                                                    { label: "ETA", value: formatEta(shipment.eta) },
                                                ].map(({ label, value }) => (
                                                    <div key={label}>
                                                        <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
                                                        <dd className="mt-0.5" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{value}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>

                                        {/* Live temp */}
                                        <div className="rounded-xl border p-5 flex flex-col items-center gap-3" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                                            <h3 className="text-sm font-semibold self-start" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Live Temperature</h3>
                                            {latestTemp ? (
                                                <>
                                                    <TemperatureBadge
                                                        temperature={latestTemp.temperature}
                                                        zone={shipment.temperatureZone}
                                                        requiredMin={shipment.requiredTempMin}
                                                        requiredMax={shipment.requiredTempMax}
                                                        size="lg"
                                                    />
                                                    <p className="text-xs" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                                                        Required: {shipment.requiredTempMin}°C – {shipment.requiredTempMax}°C
                                                    </p>
                                                    {tempHistory.length > 2 && (
                                                        <Sparkline data={tempHistory.slice(-48).map((r) => r.temperature)} width={200} height={40} color="var(--ao-accent)" />
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No readings yet</p>
                                            )}
                                        </div>

                                        {/* Checkpoints timeline */}
                                        <div className="rounded-xl border p-5 lg:col-span-2" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                                            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Checkpoints</h3>
                                            <div className="relative flex flex-col gap-0">
                                                {shipment.checkpoints.map((cp, i) => {
                                                    const isLast = i === shipment.checkpoints.length - 1
                                                    return (
                                                        <motion.div
                                                            key={cp.id}
                                                            initial={{ opacity: 0, x: -12 }}
                                                            animate={{ opacity: 1, x: 0, transition: { delay: i * 0.06, duration: 0.25 } }}
                                                            className="flex items-start gap-3"
                                                        >
                                                            {/* Timeline line + dot */}
                                                            <div className="flex flex-col items-center shrink-0">
                                                                <div className="w-3 h-3 rounded-full mt-0.5"
                                                                    style={{
                                                                        backgroundColor: cp.status === "passed" ? "#2ED573" : cp.status === "current" ? "var(--ao-accent)" : "var(--ao-border)",
                                                                        boxShadow: cp.status === "current" ? "0 0 0 3px rgba(0,200,168,0.2)" : undefined,
                                                                    }} />
                                                                {!isLast && <div className="w-0.5 h-8 mt-1" style={{ backgroundColor: "var(--ao-border)" }} />}
                                                            </div>
                                                            <div className="flex-1 pb-4">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{cp.name}</span>
                                                                    {cp.status === "passed" && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#2ED573" }} />}
                                                                    {cp.status === "current" && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,200,168,0.12)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {cp.actualArrival && (
                                                                    <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                                                                        Arrived: {formatDatetime(cp.actualArrival)}
                                                                    </p>
                                                                )}
                                                                {!cp.actualArrival && (
                                                                    <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                                                                        ETA: {formatDatetime(cp.estimatedArrival)}
                                                                    </p>
                                                                )}
                                                                {cp.delayReason && (
                                                                    <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>
                                                                        <AlertCircle className="w-3 h-3 shrink-0" />
                                                                        {cp.delayReason}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TEMPERATURE */}
                                {activeTab === "temperature" && (
                                    <div className="p-6">
                                        <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                                            <div className="flex items-center justify-between mb-5">
                                                <h3 className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                                    Temperature Timeline (last 24h)
                                                </h3>
                                                {latestTemp && (
                                                    <TemperatureBadge
                                                        temperature={latestTemp.temperature}
                                                        zone={shipment.temperatureZone}
                                                        requiredMin={shipment.requiredTempMin}
                                                        requiredMax={shipment.requiredTempMax}
                                                        size="md"
                                                    />
                                                )}
                                            </div>
                                            {chartData.length > 2 ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scaleY: 0.7 }}
                                                    animate={{ opacity: 1, scaleY: 1, transition: { duration: 0.5, ease: "easeOut" } }}
                                                    style={{ transformOrigin: "bottom" }}
                                                >
                                                    <ResponsiveContainer width="100%" height={260}>
                                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                                                            <defs>
                                                                <linearGradient id="tempGradModal" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="var(--ao-accent)" stopOpacity={0.35} />
                                                                    <stop offset="95%" stopColor="var(--ao-accent)" stopOpacity={0.02} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                                            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} interval={11} />
                                                            <YAxis tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} domain={["auto", "auto"]} />
                                                            <Tooltip content={<TempTooltip />} />
                                                            <ReferenceLine y={shipment.requiredTempMax} stroke="#FFA502" strokeDasharray="4 3"
                                                                label={{ value: "Max", position: "right", fontSize: 10, fill: "#FFA502", fontFamily: "var(--ao-font-mono)" }} />
                                                            <ReferenceLine y={shipment.requiredTempMin} stroke="#3B82F6" strokeDasharray="4 3"
                                                                label={{ value: "Min", position: "right", fontSize: 10, fill: "#3B82F6", fontFamily: "var(--ao-font-mono)" }} />
                                                            <Area type="monotone" dataKey="temp" stroke="var(--ao-accent)" strokeWidth={2}
                                                                fill="url(#tempGradModal)" dot={false}
                                                                activeDot={{ r: 4, fill: "var(--ao-accent)", stroke: "rgba(255,255,255,0.2)", strokeWidth: 2 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </motion.div>
                                            ) : (
                                                <div className="flex items-center justify-center h-40 text-sm"
                                                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                                                    Temperature data is initializing…
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ROUTE LEGS */}
                                {activeTab === "route" && (
                                    <div className="p-6">
                                        <div className="flex flex-col gap-3">
                                            {shipment.legs.length === 0 ? (
                                                <p className="text-sm text-center py-8" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                                                    Route legs not yet assigned for this shipment.
                                                </p>
                                            ) : (
                                                shipment.legs.map((leg, i) => {
                                                    const Icon = MODE_ICONS[leg.mode as keyof typeof MODE_ICONS] ?? Truck
                                                    const color = MODE_COLORS[leg.mode] ?? "#64748B"
                                                    return (
                                                        <motion.div
                                                            key={leg.id}
                                                            initial={{ opacity: 0, y: 12 }}
                                                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.22 } }}
                                                            className="flex items-start gap-4 p-4 rounded-xl"
                                                            style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}
                                                        >
                                                            <div className="p-2.5 rounded-lg shrink-0"
                                                                style={{ backgroundColor: `${color}18`, border: `1px solid ${color}40` }}>
                                                                <Icon className="w-4 h-4" style={{ color }} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                    <span className="text-[11px] font-bold uppercase px-1.5 py-0.5 rounded"
                                                                        style={{ backgroundColor: `${color}15`, color, fontFamily: "var(--ao-font-mono)" }}>
                                                                        {leg.mode}
                                                                    </span>
                                                                    <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                                                        {leg.origin}
                                                                    </span>
                                                                    <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                                                                    <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                                                        {leg.destination}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                                                                    {leg.departureTime ? formatDatetime(leg.departureTime) : "TBD"} → {leg.arrivalTime ? formatDatetime(leg.arrivalTime) : "TBD"} · {leg.distanceKm.toLocaleString()} km
                                                                </p>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* DOCUMENTS */}
                                {activeTab === "documents" && (
                                    <div className="p-6">
                                        {shipment.complianceDocIds.length === 0 ? (
                                            <p className="text-sm text-center py-8" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                                                No compliance documents linked yet.
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                {shipment.complianceDocIds.map((docId, i) => (
                                                    <motion.div
                                                        key={docId}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                                                        className="flex items-center justify-between p-3 rounded-lg"
                                                        style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="w-4 h-4" style={{ color: "var(--ao-accent)" }} />
                                                            <span className="text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{docId}</span>
                                                        </div>
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full"
                                                            style={{ backgroundColor: "rgba(46,213,115,0.12)", color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>
                                                            On file
                                                        </span>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
