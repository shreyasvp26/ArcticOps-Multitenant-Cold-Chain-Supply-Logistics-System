"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, Plane, Ship, Train, Truck, ArrowRight, MapPin,
    User, Thermometer, Zap, Clock, DollarSign, CheckCircle2,
    Shield, SkipForward, ChevronRight,
} from "lucide-react"
import type { RouteOption } from "@/lib/types/route"
import type { Tenant } from "@/lib/types/auth"
import { formatCurrency } from "@/lib/utils/format"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS: Record<string, string> = {
    air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B",
}
const MODE_LABELS: Record<string, string> = {
    air: "Air Freight", sea: "Sea Freight", rail: "Rail Freight", road: "Road Freight",
}
const ZONE_LABELS: Record<string, string> = {
    ultra_cold: "Ultra-Cold (−70°C)",
    frozen: "Frozen (−20°C)",
    refrigerated: "Refrigerated (2–8°C)",
}
const URGENCY_LABELS: Record<string, string> = {
    standard: "Standard · 7–14 days",
    express: "Express · 3–5 days",
    emergency: "Emergency · 1–2 days",
}

interface RouteConfirmModalProps {
    route: RouteOption
    origin: string
    destination: string
    zone: string
    urgency: string
    client: Tenant | null
    backupRoutes: RouteOption[]         // other available routes (excluding primary)
    onConfirm: (backupRoute: RouteOption | null) => void
    onCancel: () => void
}

const URGENCY_DAYS: Record<string, { min: number; max: number }> = {
  standard: { min: 7, max: 14 },
  express: { min: 3, max: 5 },
  emergency: { min: 1, max: 2 },
}

function formatExpectedDelivery(urgency: string): string {
  const { min, max } = URGENCY_DAYS[urgency] ?? { min: 7, max: 14 }
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  const from = new Date(); from.setDate(from.getDate() + min)
  const to = new Date(); to.setDate(to.getDate() + max)
  return `${fmt(from)} – ${fmt(to)}`
}

// ── Backup Route Step ──────────────────────────────────────────────────────
function BackupRouteStep({
    primaryRoute,
    backupRoutes,
    onSelect,
    onSkip,
}: {
    primaryRoute: RouteOption
    backupRoutes: RouteOption[]
    onSelect: (r: RouteOption) => void
    onSkip: () => void
}) {
    const [hovered, setHovered] = useState<string | null>(null)

    return (
        <motion.div
            key="backup-step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--ao-border)", background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(6,13,27,0.5) 100%)" }}>
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg" style={{ background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.25)" }}>
                        <Shield className="w-4 h-4" style={{ color: "#3B82F6" }} />
                    </div>
                    <div>
                        <p className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                            Add a Backup Route?
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            Protect against disruption — optional
                        </p>
                    </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{ background: "rgba(59,130,246,0.12)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.25)", fontFamily: "var(--ao-font-body)" }}>
                    Step 1 of 2
                </span>
            </div>

            <div className="p-5 flex flex-col gap-4">
                {/* Primary route summary pill */}
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(0,200,168,0.06)", border: "1px solid rgba(0,200,168,0.18)" }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-accent)" }} />
                    <span className="text-[12px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                        Primary: <span style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{primaryRoute.name}</span>
                        <span style={{ color: "var(--ao-text-muted)" }}> · {Math.floor(primaryRoute.totalEtaHours / 24)}d {primaryRoute.totalEtaHours % 24}h · {formatCurrency(primaryRoute.totalCostUsd)}</span>
                    </span>
                </div>

                {/* Backup options */}
                {backupRoutes.length === 0 ? (
                    <div className="text-center py-6 rounded-xl" style={{ background: "rgba(30,48,80,0.3)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[13px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            No alternative routes available to use as backup.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            Available backup routes
                        </p>
                        {backupRoutes.map((r) => {
                            const isHov = hovered === r.id
                            const riskColor = r.riskScore <= 30 ? "#2ED573" : r.riskScore <= 60 ? "#FFA502" : "#FF4757"
                            const confColor = r.tempMaintenanceConfidence >= 90 ? "#2ED573" : r.tempMaintenanceConfidence >= 70 ? "#FFA502" : "#FF4757"
                            const legModes = [...new Set(r.legs.map((l) => l.mode))]
                            return (
                                <motion.button
                                    key={r.id}
                                    onHoverStart={() => setHovered(r.id)}
                                    onHoverEnd={() => setHovered(null)}
                                    onClick={() => onSelect(r)}
                                    whileHover={{ scale: 1.012, transition: { type: "spring", stiffness: 400, damping: 26 } }}
                                    whileTap={{ scale: 0.99 }}
                                    className="w-full text-left rounded-xl p-3.5"
                                    style={{
                                        background: isHov
                                            ? "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(8,16,34,0.97) 100%)"
                                            : "linear-gradient(135deg, rgba(13,22,41,0.8) 0%, rgba(6,13,27,0.95) 100%)",
                                        border: `1px solid ${isHov ? "rgba(59,130,246,0.4)" : "rgba(30,48,80,0.6)"}`,
                                        borderLeft: `3px solid ${isHov ? "#3B82F6" : "rgba(30,48,80,0.6)"}`,
                                        transition: "background 0.15s, border-color 0.15s",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <p className="text-[13px] font-bold truncate"
                                                    style={{ color: isHov ? "#3B82F6" : "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                                                    {r.name}
                                                </p>
                                                <div className="flex gap-1 shrink-0">
                                                    {legModes.map((m) => {
                                                        const Icon = MODE_ICONS[m as keyof typeof MODE_ICONS] ?? Truck
                                                        return <Icon key={m} className="w-3 h-3" style={{ color: MODE_COLORS[m] ?? "#64748B" }} />
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                                                    ⏱ {Math.floor(r.totalEtaHours / 24)}d {r.totalEtaHours % 24}h
                                                </span>
                                                <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                                                    💰 {formatCurrency(r.totalCostUsd)}
                                                </span>
                                                <span className="text-[11px]" style={{ color: riskColor, fontFamily: "var(--ao-font-mono)" }}>
                                                    ⚠ Risk {r.riskScore}
                                                </span>
                                                <span className="text-[11px]" style={{ color: confColor, fontFamily: "var(--ao-font-mono)" }}>
                                                    ❄ {r.tempMaintenanceConfidence}% cold-chain
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 shrink-0 mt-1"
                                            style={{ color: isHov ? "#3B82F6" : "var(--ao-text-muted)" }} />
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>
                )}

                <p className="text-[11px] text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    A backup route is activated only if your primary route is disrupted.
                </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-5 pb-5">
                <button
                    onClick={onSkip}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[rgba(255,255,255,0.04)]"
                    style={{ border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                >
                    <SkipForward className="w-3.5 h-3.5" />
                    Skip — no backup
                </button>
            </div>
        </motion.div>
    )
}

// ── Confirm Step ───────────────────────────────────────────────────────────
function ConfirmStep({
    route,
    origin,
    destination,
    zone,
    urgency,
    client,
    backupRoute,
    onConfirm,
    onBack,
    onCancel,
}: {
    route: RouteOption
    origin: string
    destination: string
    zone: string
    urgency: string
    client: Tenant | null
    backupRoute: RouteOption | null
    onConfirm: () => void
    onBack: () => void
    onCancel: () => void
}) {
    const etaDays = Math.floor(route.totalEtaHours / 24)
    const etaHours = route.totalEtaHours % 24
    const modeMix = route.legs.map((l) => MODE_LABELS[l.mode] ?? l.mode).join(" → ")

    return (
        <motion.div
            key="confirm-step"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
            exit={{ opacity: 0, x: -30, transition: { duration: 0.18 } }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b"
                style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(0,200,168,0.05)" }}>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" style={{ color: "var(--ao-accent)" }} />
                    <span className="text-sm font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                        Confirm Route Selection
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                        style={{ background: "rgba(0,200,168,0.1)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
                        Step 2 of 2
                    </span>
                    <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.07)] transition-colors">
                        <X className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col gap-4">
                {/* Route name + mode mix */}
                <div>
                    <p className="text-base font-bold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                        {route.name}
                    </p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "#818CF8", border: "1px solid rgba(99,102,241,0.2)", fontFamily: "var(--ao-font-mono)" }}>
                        {modeMix}
                    </span>
                </div>

                {/* Leg icons visual */}
                <div className="flex items-center gap-2 flex-wrap">
                    {route.legs.map((leg, i) => {
                        const Icon = MODE_ICONS[leg.mode as keyof typeof MODE_ICONS] ?? Truck
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                                    style={{ backgroundColor: `${MODE_COLORS[leg.mode]}18`, border: `1px solid ${MODE_COLORS[leg.mode]}40` }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: MODE_COLORS[leg.mode] }} />
                                    <span className="text-[11px] font-medium" style={{ color: MODE_COLORS[leg.mode], fontFamily: "var(--ao-font-body)" }}>
                                        {leg.origin} → {leg.destination}
                                    </span>
                                </div>
                                {i < route.legs.length - 1 && (
                                    <ArrowRight className="w-3 h-3 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Origin → Destination */}
                    <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg"
                        style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--ao-accent)" }} />
                        <span className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{origin}</span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                        <span className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{destination}</span>
                    </div>

                    {/* Client */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Client</p>
                        <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} />
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{client?.name ?? "—"}</p>
                        </div>
                    </div>

                    {/* Temperature Zone */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Temp Zone</p>
                        <div className="flex items-center gap-1.5">
                            <Thermometer className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{ZONE_LABELS[zone] ?? zone}</p>
                        </div>
                    </div>

                    {/* ETA */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>ETA</p>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" style={{ color: "#FFA502" }} />
                            <p className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                                {etaDays > 0 ? `${etaDays}d ` : ""}{etaHours}h
                            </p>
                        </div>
                    </div>

                    {/* Cost */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Est. Cost</p>
                        <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" style={{ color: "#2ED573" }} />
                            <p className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(route.totalCostUsd)}</p>
                        </div>
                    </div>

                    {/* Urgency */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Urgency</p>
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" style={{ color: "#FF4757" }} />
                            <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{URGENCY_LABELS[urgency] ?? urgency}</p>
                        </div>
                    </div>

                    {/* Expected Delivery */}
                    <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Expected Delivery</p>
                        <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                            {formatExpectedDelivery(urgency)}
                        </p>
                    </div>
                </div>

                {/* Backup route banner */}
                {backupRoute ? (
                    <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.25 } }}
                        className="flex items-start gap-2.5 p-3 rounded-xl"
                        style={{ background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.25)" }}
                    >
                        <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#3B82F6" }} />
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5"
                                style={{ color: "#3B82F6", fontFamily: "var(--ao-font-body)" }}>Backup Route Set</p>
                            <p className="text-[12px] truncate" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
                                {backupRoute.name} · {Math.floor(backupRoute.totalEtaHours / 24)}d {backupRoute.totalEtaHours % 24}h · {formatCurrency(backupRoute.totalCostUsd)}
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl"
                        style={{ background: "rgba(30,48,80,0.3)", border: "1px solid rgba(30,48,80,0.5)" }}>
                        <SkipForward className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                        <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            No backup route — shipment will continue on primary only.
                        </p>
                    </div>
                )}

                {/* Confirmation note */}
                <p className="text-[12px] text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    This will create a new shipment record with status <strong style={{ color: "var(--ao-text-secondary)" }}>Requested</strong> under Shipments.
                </p>
            </div>

            {/* Footer actions */}
            <div className="flex gap-3 px-5 pb-5">
                <button
                    onClick={onBack}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium transition-all hover:bg-[rgba(255,255,255,0.05)]"
                    style={{ border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                >
                    ← Back
                </button>
                <button
                    onClick={onConfirm}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm &amp; Create Shipment
                </button>
            </div>
        </motion.div>
    )
}

// ── Main modal shell ───────────────────────────────────────────────────────
export function RouteConfirmModal({
    route, origin, destination, zone, urgency, client,
    backupRoutes,
    onConfirm, onCancel,
}: RouteConfirmModalProps) {
    const [step, setStep] = useState<"backup" | "confirm">("backup")
    const [backupRoute, setBackupRoute] = useState<RouteOption | null>(null)

    const handleSelectBackup = (r: RouteOption) => {
        setBackupRoute(r)
        setStep("confirm")
    }
    const handleSkipBackup = () => {
        setBackupRoute(null)
        setStep("confirm")
    }

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4"
                style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                onClick={onCancel}
            >
                {/* Modal card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } }}
                    exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                    style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", maxHeight: "90vh", overflowY: "auto" }}
                >
                    <AnimatePresence mode="wait">
                        {step === "backup" ? (
                            <BackupRouteStep
                                key="backup"
                                primaryRoute={route}
                                backupRoutes={backupRoutes}
                                onSelect={handleSelectBackup}
                                onSkip={handleSkipBackup}
                            />
                        ) : (
                            <ConfirmStep
                                key="confirm"
                                route={route}
                                origin={origin}
                                destination={destination}
                                zone={zone}
                                urgency={urgency}
                                client={client}
                                backupRoute={backupRoute}
                                onConfirm={() => onConfirm(backupRoute)}
                                onBack={() => setStep("backup")}
                                onCancel={onCancel}
                            />
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

