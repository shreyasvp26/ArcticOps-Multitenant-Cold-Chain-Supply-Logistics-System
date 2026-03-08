"use client"
import { useState } from "react"
import { LayoutGrid, List, Plus, Download } from "lucide-react"
import { ShipmentTable } from "@/components/ops/shipment-table"
import { ShipmentKanban } from "@/components/ops/shipment-kanban"
import { motion, AnimatePresence } from "framer-motion"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import { useShipmentStore } from "@/lib/store/shipment-store"

export default function ShipmentsPage() {
  const [view, setView] = useState<"table" | "kanban">("table")
  const shipments = useShipmentStore((s) => s.shipments)
  const activeCount = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs").length
  const criticalCount = shipments.filter((s) => s.riskScore > 70).length

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Quick stat pills */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(46,213,115,0.08)", border: "1px solid rgba(46,213,115,0.2)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22E574", animation: "checkpoint-pulse 2s ease-in-out infinite" }} aria-hidden="true" />
            <span className="text-[12px] font-medium" style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}>
              {activeCount} active
            </span>
          </div>
          {criticalCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)" }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF4757" }} aria-hidden="true" />
              <span className="text-[12px] font-medium" style={{ color: "#FF4757", fontFamily: "var(--ao-font-mono)" }}>
                {criticalCount} at risk
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div
            className="flex items-center p-1 rounded-xl"
            style={{ backgroundColor: "rgba(12,22,42,0.8)", border: "1px solid rgba(30,48,80,0.8)" }}
            role="group"
            aria-label="View mode"
          >
            <button
              onClick={() => setView("table")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all")}
              style={
                view === "table"
                  ? { background: "linear-gradient(135deg, rgba(0,200,168,0.15) 0%, rgba(0,200,168,0.08) 100%)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.2)" }
                  : { color: "var(--ao-text-muted)", border: "1px solid transparent" }
              }
              aria-pressed={view === "table"}
            >
              <List className="w-3.5 h-3.5" aria-hidden="true" /> Table
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all")}
              style={
                view === "kanban"
                  ? { background: "linear-gradient(135deg, rgba(0,200,168,0.15) 0%, rgba(0,200,168,0.08) 100%)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.2)" }
                  : { color: "var(--ao-text-muted)", border: "1px solid transparent" }
              }
              aria-pressed={view === "kanban"}
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" /> Kanban
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          variants={fadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {view === "table" ? <ShipmentTable /> : <ShipmentKanban />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

