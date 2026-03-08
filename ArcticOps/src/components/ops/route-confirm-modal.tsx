"use client"
import { motion, AnimatePresence } from "framer-motion"
import {
    X, Plane, Ship, Train, Truck, ArrowRight, MapPin,
    User, Thermometer, Zap, Clock, DollarSign, CheckCircle2,
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
    deadline: string
    client: Tenant | null
    onConfirm: () => void
    onCancel: () => void
}

export function RouteConfirmModal({
    route, origin, destination, zone, urgency, deadline, client,
    onConfirm, onCancel,
}: RouteConfirmModalProps) {
    const etaDays = Math.floor(route.totalEtaHours / 24)
    const etaHours = route.totalEtaHours % 24
    const modeMix = route.legs.map((l) => MODE_LABELS[l.mode] ?? l.mode).join(" → ")

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
                {/* Modal card — stop propagation so clicking inside doesn't close */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.2 } }}
                    exit={{ opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.15 } }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                    style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b"
                        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(0,212,170,0.05)" }}>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" style={{ color: "var(--ao-accent)" }} />
                            <span className="text-sm font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                                Confirm Route Selection
                            </span>
                        </div>
                        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.07)] transition-colors">
                            <X className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                        </button>
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
                                <span className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                    {origin}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                                <span className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                    {destination}
                                </span>
                            </div>

                            {/* Client */}
                            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Client</p>
                                <div className="flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} />
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                        {client?.name ?? "—"}
                                    </p>
                                </div>
                            </div>

                            {/* Temperature Zone */}
                            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Temp Zone</p>
                                <div className="flex items-center gap-1.5">
                                    <Thermometer className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                        {ZONE_LABELS[zone] ?? zone}
                                    </p>
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
                                    <p className="text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                                        {formatCurrency(route.totalCostUsd)}
                                    </p>
                                </div>
                            </div>

                            {/* Urgency */}
                            <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Urgency</p>
                                <div className="flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" style={{ color: "#FF4757" }} />
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                                        {URGENCY_LABELS[urgency] ?? urgency}
                                    </p>
                                </div>
                            </div>

                            {/* Deadline */}
                            {deadline && (
                                <div className="p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}>
                                    <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Deadline</p>
                                    <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                                        {deadline}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirmation note */}
                        <p className="text-[12px] text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            This will create a new shipment record with status <strong style={{ color: "var(--ao-text-secondary)" }}>Requested</strong> under Shipments.
                        </p>
                    </div>

                    {/* Footer actions */}
                    <div className="flex gap-3 px-5 pb-5">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[rgba(255,255,255,0.05)]"
                            style={{ border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
                            style={{ backgroundColor: "var(--ao-accent)", color: "#0A1628", fontFamily: "var(--ao-font-body)" }}
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Confirm &amp; Create Shipment
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
