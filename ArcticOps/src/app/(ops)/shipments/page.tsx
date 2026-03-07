"use client"
import { useState } from "react"
import { LayoutGrid, List } from "lucide-react"
import { ShipmentTable } from "@/components/ops/shipment-table"
import { ShipmentKanban } from "@/components/ops/shipment-kanban"
import { motion, AnimatePresence } from "framer-motion"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"

export default function ShipmentsPage() {
  const [view, setView] = useState<"table" | "kanban">("table")

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
            Monitor and manage all cold-chain shipments
          </p>
        </div>
        <div
          className="flex items-center p-1 rounded-lg"
          style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)" }}
          role="group"
          aria-label="View mode"
        >
          <button
            onClick={() => setView("table")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all")}
            style={
              view === "table"
                ? { backgroundColor: "var(--ao-accent)", color: "#0A1628" }
                : { color: "var(--ao-text-muted)" }
            }
            aria-pressed={view === "table"}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all")}
            style={
              view === "kanban"
                ? { backgroundColor: "var(--ao-accent)", color: "#0A1628" }
                : { color: "var(--ao-text-muted)" }
            }
            aria-pressed={view === "kanban"}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
          </button>
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
