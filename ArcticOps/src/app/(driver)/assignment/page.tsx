"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronDown, ChevronUp, Play, Clock, Package, Phone, AlertTriangle } from "lucide-react"
import { useDriverStore } from "@/lib/store/driver-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { MOCK_CREWS } from "@/lib/mock-data/crews"
import { formatEta, formatDatetime } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"

const PAST_DELIVERIES = [
  { id: "SHP-0002", origin: "Amsterdam", destination: "Frankfurt", status: "delivered", date: "Jan 22" },
  { id: "SHP-0007", origin: "Singapore", destination: "Dubai", status: "delivered", date: "Jan 15" },
  { id: "SHP-0010", origin: "Tokyo", destination: "Seoul", status: "delivered", date: "Jan 8" },
]

export default function AssignmentPage() {
  const { user } = useAuthStore()
  const { currentAssignment } = useDriverStore()
  const [expanded, setExpanded] = useState(false)

  const assignment = currentAssignment ?? MOCK_SHIPMENTS.find((s) => s.status === "in_transit")
  const crew = MOCK_CREWS.find((c) => c.id === user?.id || c.status === "on_duty")

  if (!assignment) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <Package className="w-12 h-12" style={{ color: "var(--ao-text-muted)" }} />
      <p className="text-sm text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
        No active assignment. Awaiting dispatch.
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Current assignment card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-accent)", boxShadow: "0 0 20px rgba(0,212,170,0.10)" }}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Current Assignment</p>
              <p className="text-lg font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{assignment.id}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: "rgba(0,212,170,0.12)", color: "var(--ao-accent)", border: "1px solid rgba(0,212,170,0.3)", fontFamily: "var(--ao-font-body)" }}>
              In Transit
            </span>
          </div>

          <p className="font-semibold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
            {assignment.materials[0]?.name ?? "Cargo"}
            {assignment.materials.length > 1 && <span className="text-[12px] ml-1" style={{ color: "var(--ao-text-muted)" }}>+{assignment.materials.length - 1}</span>}
          </p>
          <p className="text-[13px] mb-3" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {assignment.origin.split(",")[0]} → {assignment.destination.split(",")[0]}
          </p>

          <div className="flex items-center gap-4 text-[12px] mb-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{
                backgroundColor: "var(--ao-accent)",
                animation: "checkpoint-pulse 2s ease-in-out infinite",
              }} />
              <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                {assignment.requiredTempMin}°C – {assignment.requiredTempMax}°C
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
              <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                ETA {formatEta(assignment.eta)}
              </span>
            </div>
          </div>

          <button onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
            {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> View full manifest</>}
          </button>
        </div>

        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} className="overflow-hidden border-t"
            style={{ borderColor: "var(--ao-border)" }}>
            <div className="p-4 flex flex-col gap-3">
              {/* Materials */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Cargo Manifest</p>
                {assignment.materials.map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px] mb-1">
                    <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{m.name}</span>
                    <span style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>×{m.quantity} {m.unit}</span>
                  </div>
                ))}
              </div>
              {/* Client */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Client</p>
                <p className="text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{assignment.clientName}</p>
              </div>
              {/* Emergency */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Emergency Contact</p>
                <div className="flex items-center gap-2 text-[12px]">
                  <Phone className="w-3.5 h-3.5" style={{ color: "#FF4757" }} />
                  <span style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>+1-800-ARC-OPS1</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Past deliveries */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Recent Deliveries
        </p>
        <div className="flex flex-col gap-2">
          {PAST_DELIVERIES.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
              style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2ED573" }} />
              <span className="text-[11px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{d.id}</span>
              <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{d.origin} → {d.destination}</span>
              <span className="ml-auto text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{d.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
