"use client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { RiskScore } from "@/components/shared/risk-score"
import { EmptyState } from "@/components/shared/empty-state"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { formatEta } from "@/lib/utils/format"
import { isClientRole } from "@/lib/utils/permissions"
import { Package } from "lucide-react"
import type { Shipment, ShipmentStatus } from "@/lib/types/shipment"
import { cn } from "@/lib/utils/cn"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"

const KANBAN_COLUMNS: { status: ShipmentStatus; label: string }[] = [
  { status: "requested", label: "Requested" },
  { status: "preparing", label: "Preparing" },
  { status: "in_transit", label: "In Transit" },
  { status: "at_customs", label: "At Customs" },
  { status: "delivered", label: "Delivered" },
]

function ShipmentCard({ shipment }: { shipment: Shipment }) {
  const router = useRouter()
  const cfg = SHIPMENT_STATUSES[shipment.status]

  return (
    <motion.div
      variants={staggerChild}
      onClick={() => router.push(`/shipments/${shipment.id}`)}
      className="rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.01] hover:border-[var(--ao-border-hover)]"
      style={{
        backgroundColor: "var(--ao-surface)",
        borderColor: "var(--ao-border)",
        borderLeftWidth: "3px",
        borderLeftColor: cfg.color,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
          {shipment.id}
        </span>
        <RiskScore score={shipment.riskScore} size="sm" showLabel={false} />
      </div>
      <p className="text-[12px] font-medium mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
        {shipment.clientName}
      </p>
      <p className="text-[11px] mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
        {shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          {shipment.materials[0]?.name ?? "No materials"}
          {shipment.materials.length > 1 && ` +${shipment.materials.length - 1}`}
        </span>
        <span className="text-[11px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
          ETA {formatEta(shipment.eta)}
        </span>
      </div>
    </motion.div>
  )
}

export function ShipmentKanban() {
  const { shipments, updateStatus } = useShipmentStore()
  const { user } = useAuthStore()
  const tenantId = isClientRole(user?.role ?? "driver") ? user?.tenantId : null

  const filtered = shipments.filter((s) => !tenantId || s.tenantId === tenantId)

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 min-h-[500px]">
      {KANBAN_COLUMNS.map(({ status, label }) => {
        const cards = filtered.filter((s) => s.status === status)
        const cfg = SHIPMENT_STATUSES[status]
        return (
          <div
            key={status}
            className="flex flex-col gap-2 min-w-[240px] max-w-[260px] flex-shrink-0"
          >
            {/* Column header */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ backgroundColor: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
            >
              <span className="text-[12px] font-semibold" style={{ color: cfg.color, fontFamily: "var(--ao-font-body)" }}>
                {label}
              </span>
              <span
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: `${cfg.color}20`, color: cfg.color, fontFamily: "var(--ao-font-mono)" }}
              >
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            {cards.length === 0 ? (
              <div
                className="flex-1 flex items-center justify-center rounded-xl border-2 border-dashed py-8"
                style={{ borderColor: "var(--ao-border)" }}
              >
                <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Empty
                </span>
              </div>
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="flex flex-col gap-2"
              >
                {cards.map((sh) => <ShipmentCard key={sh.id} shipment={sh} />)}
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
