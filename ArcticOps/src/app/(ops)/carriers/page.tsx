"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plane, Ship, Train, Truck, Search, X,
  Star, MapPin, Thermometer, BarChart3, ChevronRight
} from "lucide-react"
import { useCarrierStore } from "@/lib/store/carrier-store"
import { Sparkline } from "@/components/shared/sparkline"
import { EmptyState } from "@/components/shared/empty-state"
import { RiskScore } from "@/components/shared/risk-score"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { staggerContainer, staggerChild, fadeVariants } from "@/lib/utils/motion"
import type { Carrier } from "@/lib/types/carrier"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, Cell
} from "recharts"
import { addDays, format, startOfToday } from "date-fns"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS = { air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B" }

function ReliabilityBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#2ED573" : score >= 75 ? "#FFA502" : "#FF4757"
  return (
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ao-surface-elevated)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{score}</span>
    </div>
  )
}

function CarrierCard({ carrier, onSelect, selected }: { carrier: Carrier; onSelect: () => void; selected: boolean }) {
  return (
    <motion.div
      variants={staggerChild}
      onClick={onSelect}
      className={cn("rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01]", selected ? "ring-1 ring-[var(--ao-accent)]" : "")}
      style={{
        backgroundColor: selected ? "rgba(0,212,170,0.04)" : "var(--ao-surface)",
        borderColor: selected ? "var(--ao-accent)" : "var(--ao-border)",
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
            style={{ backgroundColor: "rgba(0,212,170,0.10)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
            {carrier.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{carrier.name}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{carrier.headquarters}</p>
          </div>
        </div>
        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",)}
          style={{
            backgroundColor: carrier.availableCapacity > 30 ? "rgba(46,213,115,0.10)" : carrier.availableCapacity > 10 ? "rgba(255,165,2,0.10)" : "rgba(255,71,87,0.10)",
            color: carrier.availableCapacity > 30 ? "#2ED573" : carrier.availableCapacity > 10 ? "#FFA502" : "#FF4757",
            fontFamily: "var(--ao-font-body)",
          }}>
          {carrier.availableCapacity}/{carrier.totalCapacity} avail.
        </span>
      </div>

      {/* Transport modes */}
      <div className="flex items-center gap-2 mb-3">
        {carrier.modes.map((mode) => {
          const Icon = MODE_ICONS[mode] ?? Truck
          return (
            <div key={mode} className="flex items-center gap-1 px-2 py-0.5 rounded"
              style={{ backgroundColor: `${MODE_COLORS[mode] ?? "#64748B"}14`, border: `1px solid ${MODE_COLORS[mode] ?? "#64748B"}30` }}>
              <Icon className="w-3 h-3" style={{ color: MODE_COLORS[mode] ?? "#64748B" }} />
              <span className="text-[10px]" style={{ color: MODE_COLORS[mode] ?? "#64748B", fontFamily: "var(--ao-font-body)" }}>{mode}</span>
            </div>
          )
        })}
      </div>

      {/* Temp range */}
      <div className="flex items-center gap-1.5 mb-3">
        <Thermometer className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
        <span className="text-[11px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
          {carrier.tempCapabilities.join(", ")}
        </span>
      </div>

      {/* Reliability */}
      <div>
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Reliability</p>
        <ReliabilityBadge score={carrier.reliabilityScore} />
      </div>
    </motion.div>
  )
}

// Capacity calendar (Gantt-style)
function CapacityCalendar({ carriers }: { carriers: Carrier[] }) {
  const today = startOfToday()
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i))
  const [hovered, setHovered] = useState<{ text: string; x: number; y: number } | null>(null)

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: "800px" }}>
        {/* Day headers */}
        <div className="flex mb-2 pl-[160px]">
          {days.map((d, i) => (
            <div key={i} className="flex-1 text-center text-[9px]"
              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
              {i % 5 === 0 ? format(d, "MMM d") : ""}
            </div>
          ))}
        </div>

        {/* Carrier rows */}
        {carriers.slice(0, 8).map((carrier) => (
          <div key={carrier.id} className="flex items-center mb-2">
            <div className="w-[160px] pr-3 shrink-0">
              <p className="text-[12px] font-medium truncate" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{carrier.name}</p>
            </div>
            <div className="flex flex-1 gap-0.5 h-7">
              {days.map((d, i) => {
                // Deterministic mock blocks from carrier seed
                const seed = (carrier.id.charCodeAt(0) + i) % 10
                const type = seed < 3 ? "booked" : seed < 7 ? "available" : "maintenance"
                const colors = { booked: "#1A293F", available: "#00D4AA", maintenance: "#374151" }
                const labels = { booked: `Capacity: ${70 + seed * 3}%`, available: "Available", maintenance: "Maintenance window" }
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-sm cursor-pointer transition-opacity hover:opacity-80"
                    style={{ backgroundColor: colors[type] }}
                    onMouseEnter={(e) => setHovered({ text: labels[type], x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHovered(null)}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-3 pl-[160px] text-[11px]" style={{ fontFamily: "var(--ao-font-body)" }}>
          {[{ color: "#1A293F", label: "Booked" }, { color: "#00D4AA", label: "Available" }, { color: "#374151", label: "Maintenance" }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span style={{ color: "var(--ao-text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Performance comparison charts
function PerformanceTab({ carriers }: { carriers: Carrier[] }) {
  const reliabilityData = carriers.map((c) => ({ name: c.name.split(" ")[0] ?? c.name, value: c.reliabilityScore }))
  const capacityData = carriers.map((c) => ({ name: c.name.split(" ")[0] ?? c.name, value: c.availableCapacity }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {[
        { data: reliabilityData, label: "Reliability Score", goodColor: "#2ED573" },
        { data: capacityData, label: "Available Capacity (slots)", goodColor: "#3B82F6" },
      ].map(({ data, label, goodColor }) => (
        <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 20, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ao-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} />
              <YAxis tick={{ fontSize: 9, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} />
              <Tooltip contentStyle={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)", fontSize: 11 }} />
              <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                {data.map((_, i) => <Cell key={i} fill={goodColor} fillOpacity={0.7 + (i % 3) * 0.1} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}

export default function CarriersPage() {
  const { carriers } = useCarrierStore()
  const [tab, setTab] = useState<"directory" | "calendar" | "performance">("directory")
  const [search, setSearch] = useState("")
  const [modeFilter, setModeFilter] = useState("all")
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null)

  const filtered = carriers.filter((c) => {
    if (modeFilter !== "all" && !c.modes.includes(modeFilter as "air" | "sea" | "rail" | "road")) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
        {[
          { id: "directory", label: "Directory" },
          { id: "calendar", label: "Capacity Calendar" },
          { id: "performance", label: "Performance" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={cn("px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
              tab === id ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
            style={{ color: tab === id ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* DIRECTORY */}
        {tab === "directory" && (
          <motion.div key="directory" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-auto p-6">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search carriers…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
                </div>
                {["all", "air", "sea", "rail", "road"].map((m) => (
                  <button key={m} onClick={() => setModeFilter(m)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize"
                    style={{
                      backgroundColor: modeFilter === m ? "rgba(0,212,170,0.12)" : "var(--ao-surface)",
                      border: `1px solid ${modeFilter === m ? "var(--ao-accent)" : "var(--ao-border)"}`,
                      color: modeFilter === m ? "var(--ao-accent)" : "var(--ao-text-muted)",
                      fontFamily: "var(--ao-font-body)",
                    }}>
                    {m === "all" ? "All Modes" : m}
                  </button>
                ))}
              </div>

              {filtered.length === 0 ? (
                <EmptyState title="No carriers found" description="Adjust filters" icon={Truck} />
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filtered.map((c) => (
                    <CarrierCard key={c.id} carrier={c}
                      selected={selectedCarrier?.id === c.id}
                      onSelect={() => setSelectedCarrier(selectedCarrier?.id === c.id ? null : c)} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Detail panel */}
            <AnimatePresence>
              {selectedCarrier && (
                <motion.div
                  initial={{ x: "100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 28 } }}
                  exit={{ x: "100%", opacity: 0, transition: { duration: 0.2 } }}
                  className="w-72 border-l shrink-0 overflow-y-auto p-5 flex flex-col gap-4"
                  style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>{selectedCarrier.name}</p>
                    <button onClick={() => setSelectedCarrier(null)}><X className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} /></button>
                  </div>
                  <dl className="flex flex-col gap-2 text-[12px]">
                    {[
                      { label: "HQ", value: selectedCarrier.headquarters },
                      { label: "Coverage", value: selectedCarrier.coverageRegions.join(", ") },
                      { label: "Cold-Chain", value: selectedCarrier.tempCapabilities.join(", ") },
                      { label: "Capacity", value: `${selectedCarrier.availableCapacity}/${selectedCarrier.totalCapacity}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start justify-between gap-2">
                        <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
                        <dd className="text-right" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)" }}>Reliability</p>
                    <ReliabilityBadge score={selectedCarrier.reliabilityScore} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* CAPACITY CALENDAR */}
        {tab === "calendar" && (
          <motion.div key="calendar" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            <CapacityCalendar carriers={carriers} />
          </motion.div>
        )}

        {/* PERFORMANCE */}
        {tab === "performance" && (
          <motion.div key="performance" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            <PerformanceTab carriers={carriers} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
