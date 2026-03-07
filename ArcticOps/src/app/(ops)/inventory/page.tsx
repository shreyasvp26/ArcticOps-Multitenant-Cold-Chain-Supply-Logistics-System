"use client"
import { useState } from "react"
import { Search, X, Check, XCircle, Info, Boxes, ChevronRight, ChevronLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { EmptyState } from "@/components/shared/empty-state"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { fadeVariants, staggerContainer, staggerChild } from "@/lib/utils/motion"
import { isClientRole, isOpsRole, canApproveOrders } from "@/lib/utils/permissions"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import type { Material } from "@/lib/types/inventory"
import { getTempZoneColor, getTempZoneLabel } from "@/lib/utils/temperature"

const ZONE_FILTERS = ["all", "ultra_cold", "frozen", "refrigerated"] as const
const STOCK_FILTERS = ["all", "healthy", "low", "critical"] as const
const STATUS_COLORS = {
  pending: "#FFA502",
  approved: "#3B82F6",
  allocated: "#7C3AED",
  dispatched: "#2ED573",
  rejected: "#FF4757",
}

function StockBar({ current, allocated, available, minimum }: { current: number; allocated: number; available: number; minimum: number }) {
  const pct = Math.min((available / current) * 100, 100)
  const color = pct <= (minimum / current) * 100 ? "#FF4757" : pct <= (minimum / current) * 150 ? "#FFA502" : "#2ED573"
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
        <span>Available: {available}</span>
        <span>Total: {current}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ao-surface-elevated)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function MaterialDetail({ material, onClose }: { material: Material; onClose: () => void }) {
  const { stockLevels } = useInventoryStore()
  const stock = stockLevels.find((s) => s.materialId === material.id)

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 28 } }}
      exit={{ x: "100%", opacity: 0, transition: { duration: 0.2 } }}
      className="w-80 border-l shrink-0 flex flex-col overflow-y-auto"
      style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--ao-border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Material Details</h3>
        <button onClick={onClose} className="hover:opacity-70">
          <X className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
        </button>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div>
          <h4 className="font-semibold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>{material.name}</h4>
          <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{material.casNumber}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {material.certifications.map((cert) => (
            <span key={cert} className="px-2 py-0.5 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: "rgba(0,212,170,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,212,170,0.2)", fontFamily: "var(--ao-font-mono)" }}>
              {cert}
            </span>
          ))}
        </div>
        <dl className="grid gap-y-2 text-[12px]">
          {[
            { label: "Grade", value: material.grade },
            { label: "Supplier", value: material.supplier },
            { label: "Unit", value: material.unit },
            { label: "Unit Price", value: formatCurrency(material.unitPrice) },
            { label: "Temp Zone", value: getTempZoneLabel(material.temperatureZone) },
            { label: "Required Range", value: `${material.requiredTempMin}°C to ${material.requiredTempMax}°C` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
              <dd style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{value}</dd>
            </div>
          ))}
        </dl>
        {stock && (
          <div className="pt-2">
            <h5 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Stock</h5>
            <StockBar current={stock.current} allocated={stock.allocated} available={stock.available} minimum={stock.minimum} />
            {stock.restockEta && (
              <p className="text-[11px] mt-2" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>
                Restock ETA: {formatDate(stock.restockEta)}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function InventoryPage() {
  const { user } = useAuthStore()
  const { materials, stockLevels, procurementRequests, approveProcurement, rejectProcurement } = useInventoryStore()
  const [tab, setTab] = useState<"catalog" | "procurement">("catalog")
  const [search, setSearch] = useState("")
  const [zoneFilter, setZoneFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)

  const isOps = isOpsRole(user?.role ?? "client_viewer")
  const isClient = isClientRole(user?.role ?? "driver")

  const filteredMaterials = materials.filter((m) => {
    if (zoneFilter !== "all" && m.temperatureZone !== zoneFilter) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    if (stockFilter !== "all") {
      const stock = stockLevels.find((s) => s.materialId === m.id)
      if (stock && stock.status !== stockFilter) return false
    }
    return true
  })

  const filteredRequests = isClient
    ? procurementRequests.filter((r) => r.tenantId === user?.tenantId)
    : procurementRequests

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
        <button
          onClick={() => setTab("catalog")}
          className={cn("px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
            tab === "catalog" ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
          style={{ color: tab === "catalog" ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Material Catalog
        </button>
        <button
          onClick={() => setTab("procurement")}
          className={cn("px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
            tab === "procurement" ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
          style={{ color: tab === "procurement" ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Procurement Queue
          {procurementRequests.filter((r) => r.status === "pending").length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px]"
              style={{ backgroundColor: "#FFA50220", color: "#FFA502", fontFamily: "var(--ao-font-mono)" }}>
              {procurementRequests.filter((r) => r.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {/* MATERIAL CATALOG */}
        {tab === "catalog" && (
          <motion.div key="catalog" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex flex-1 overflow-hidden">
            {/* Main content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Filters */}
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search materials…"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
                </div>
                {ZONE_FILTERS.map((z) => (
                  <button key={z} onClick={() => setZoneFilter(z)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: zoneFilter === z ? "rgba(0,212,170,0.12)" : "var(--ao-surface)",
                      border: `1px solid ${zoneFilter === z ? "var(--ao-accent)" : "var(--ao-border)"}`,
                      color: zoneFilter === z ? "var(--ao-accent)" : "var(--ao-text-muted)",
                      fontFamily: "var(--ao-font-body)",
                    }}>
                    {z === "all" ? "All Zones" : getTempZoneLabel(z as "ultra_cold" | "frozen" | "refrigerated")}
                  </button>
                ))}
                {STOCK_FILTERS.map((s) => (
                  <button key={s} onClick={() => setStockFilter(s)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                    style={{
                      backgroundColor: stockFilter === s ? "rgba(0,212,170,0.08)" : "var(--ao-surface)",
                      border: `1px solid ${stockFilter === s ? "var(--ao-border-hover)" : "var(--ao-border)"}`,
                      color: stockFilter === s ? "var(--ao-text-primary)" : "var(--ao-text-muted)",
                      fontFamily: "var(--ao-font-body)",
                    }}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              {/* Grid */}
              {filteredMaterials.length === 0 ? (
                <EmptyState title="No materials found" description="Try adjusting filters" icon={Boxes} />
              ) : (
                <motion.div variants={staggerContainer} initial="initial" animate="animate"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredMaterials.map((material) => {
                    const stock = stockLevels.find((s) => s.materialId === material.id)
                    const stockColor = stock?.status === "critical" ? "#FF4757" : stock?.status === "low" ? "#FFA502" : "#2ED573"
                    const isSelected = selectedMaterial?.id === material.id

                    return (
                      <motion.div key={material.id} variants={staggerChild}
                        onClick={() => setSelectedMaterial(isSelected ? null : material)}
                        className={cn("rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01]",
                          isSelected && "ring-1 ring-[var(--ao-accent)]")}
                        style={{ backgroundColor: "var(--ao-surface)", borderColor: isSelected ? "var(--ao-accent)" : "var(--ao-border)" }}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-[13px] font-semibold leading-tight" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                            {material.name}
                          </h4>
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: stockColor }} aria-hidden="true" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(0,212,170,0.08)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)", border: "1px solid rgba(0,212,170,0.15)" }}>
                            {material.grade}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${getTempZoneColor(material.temperatureZone)}14`, color: getTempZoneColor(material.temperatureZone), fontFamily: "var(--ao-font-mono)", border: `1px solid ${getTempZoneColor(material.temperatureZone)}30` }}>
                            {material.requiredTempMin}°C – {material.requiredTempMax}°C
                          </span>
                        </div>
                        {stock && (
                          <StockBar current={stock.current} allocated={stock.allocated} available={stock.available} minimum={stock.minimum} />
                        )}
                        <div className="flex justify-between items-center mt-2 text-[11px]">
                          <span style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            {formatCurrency(material.unitPrice)}/{material.unit}
                          </span>
                          <span style={{ color: stockColor, fontFamily: "var(--ao-font-body)" }}>
                            {stock?.status?.charAt(0).toUpperCase()}{stock?.status?.slice(1)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </div>

            {/* Detail panel */}
            <AnimatePresence>
              {selectedMaterial && (
                <MaterialDetail material={selectedMaterial} onClose={() => setSelectedMaterial(null)} />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* PROCUREMENT QUEUE */}
        {tab === "procurement" && (
          <motion.div key="procurement" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
              <table className="w-full" aria-label="Procurement requests">
                <thead>
                  <tr style={{ backgroundColor: "rgba(12,22,42,0.8)", borderBottom: "1px solid var(--ao-border)" }}>
                    {["Request ID", "Client", "Material", "Qty", "Zone", "Priority", "Status", "Date", ...(isOps ? ["Actions"] : [])].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                        style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{req.id}</span>
                      </td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{req.clientName}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{req.materialName}</td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{req.quantity} {req.unit}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                          backgroundColor: `${getTempZoneColor(req.temperatureZone)}14`,
                          color: getTempZoneColor(req.temperatureZone),
                          fontFamily: "var(--ao-font-mono)",
                        }}>{getTempZoneLabel(req.temperatureZone)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium")} style={{
                          backgroundColor: req.priority === "emergency" ? "rgba(255,71,87,0.10)" : req.priority === "express" ? "rgba(255,165,2,0.10)" : "rgba(100,116,139,0.10)",
                          color: req.priority === "emergency" ? "#FF4757" : req.priority === "express" ? "#FFA502" : "#64748B",
                          fontFamily: "var(--ao-font-body)",
                        }}>{req.priority}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-medium" style={{ color: STATUS_COLORS[req.status as keyof typeof STATUS_COLORS] ?? "#64748B", fontFamily: "var(--ao-font-body)" }}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {formatDate(req.submittedAt)}
                      </td>
                      {isOps && (
                        <td className="px-4 py-3">
                          {req.status === "pending" && (
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => approveProcurement(req.id)}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md"
                                style={{ backgroundColor: "rgba(46,213,115,0.12)", color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button onClick={() => rejectProcurement(req.id)}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md"
                                style={{ backgroundColor: "rgba(255,71,87,0.10)", color: "#FF4757", fontFamily: "var(--ao-font-body)" }}>
                                <XCircle className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="px-4 py-10 text-center text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  No procurement requests
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
