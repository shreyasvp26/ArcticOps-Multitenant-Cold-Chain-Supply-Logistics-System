"use client"
import { useState } from "react"
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal,
  LayoutGrid, List, X
} from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { RiskScore } from "@/components/shared/risk-score"
import { Sparkline } from "@/components/shared/sparkline"
import { EmptyState } from "@/components/shared/empty-state"
import { ShipmentDetailModal } from "@/components/ops/shipment-detail-modal"
import { ModalPortal } from "@/components/shared/modal-portal"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { formatEta, formatDate } from "@/lib/utils/format"
import { isClientRole } from "@/lib/utils/permissions"
import { cn } from "@/lib/utils/cn"
import type { Shipment, ShipmentStatus } from "@/lib/types/shipment"
import { Package } from "lucide-react"

type SortKey = "id" | "clientName" | "status" | "riskScore" | "eta"
type SortDir = "asc" | "desc"

const STATUS_OPTIONS: { value: ShipmentStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "requested", label: "Requested" },
  { value: "preparing", label: "Preparing" },
  { value: "in_transit", label: "In Transit" },
  { value: "at_customs", label: "At Customs" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

const ZONE_OPTIONS = [
  { value: "all", label: "All Zones" },
  { value: "ultra_cold", label: "Ultra-Cold" },
  { value: "frozen", label: "Frozen" },
  { value: "refrigerated", label: "Refrigerated" },
]

export function ShipmentTable() {
  const { user } = useAuthStore()
  const { shipments } = useShipmentStore()
  const getHistory = useTemperatureStore((s) => s.getHistory)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("eta")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)

  const tenantId = isClientRole(user?.role ?? "driver") ? user?.tenantId : null

  const filtered = shipments
    .filter((s) => {
      if (tenantId && s.tenantId !== tenantId) return false
      if (statusFilter !== "all" && s.status !== statusFilter) return false
      if (zoneFilter !== "all" && s.temperatureZone !== zoneFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return s.id.toLowerCase().includes(q) ||
          s.clientName.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      let va: string | number, vb: string | number
      if (sortKey === "id") { va = a.id; vb = b.id }
      else if (sortKey === "clientName") { va = a.clientName; vb = b.clientName }
      else if (sortKey === "status") { va = a.status; vb = b.status }
      else if (sortKey === "riskScore") { va = a.riskScore; vb = b.riskScore }
      else { va = new Date(a.eta).getTime(); vb = new Date(b.eta).getTime() }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown className="w-3 h-3 opacity-40" /> :
      sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[13px] outline-none transition-all"
            style={{
              background: "rgba(12,22,42,0.8)",
              border: "1px solid rgba(30,48,80,0.8)",
              color: "var(--ao-text-primary)",
              fontFamily: "var(--ao-font-body)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(0,200,168,0.4)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,168,0.06)" }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(30,48,80,0.8)"; e.target.style.boxShadow = "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:opacity-80" aria-label="Clear search">
              <X className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | "all")}
          className="px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
          style={{
            background: "rgba(12,22,42,0.8)",
            border: "1px solid rgba(30,48,80,0.8)",
            color: "var(--ao-text-secondary)",
            fontFamily: "var(--ao-font-body)",
          }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-[13px] outline-none cursor-pointer"
          style={{
            background: "rgba(12,22,42,0.8)",
            border: "1px solid rgba(30,48,80,0.8)",
            color: "var(--ao-text-secondary)",
            fontFamily: "var(--ao-font-body)",
          }}
          aria-label="Filter by temperature zone"
        >
          {ZONE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No shipments found"
          description="Try adjusting your search or filters"
          icon={Package}
        />
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "rgba(30,48,80,0.7)", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Shipments table">
              <thead>
                <tr style={{ background: "linear-gradient(180deg, rgba(7,12,25,0.98) 0%, rgba(13,24,41,0.95) 100%)", borderBottom: "1px solid rgba(30,48,80,0.7)" }}>
                  {[
                    { label: "ID", key: "id" as SortKey },
                    { label: "Client", key: "clientName" as SortKey },
                    { label: "Route", key: null },
                    { label: "Status", key: "status" as SortKey },
                    { label: "Temperature", key: null },
                    { label: "ETA", key: "eta" as SortKey },
                    { label: "Risk", key: "riskScore" as SortKey },
                    { label: "Carrier", key: null },
                  ].map(({ label, key }) => (
                    <th
                      key={label}
                      className={cn(
                        "px-4 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest",
                        key && "cursor-pointer select-none hover:opacity-80"
                      )}
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}
                      onClick={key ? () => toggleSort(key) : undefined}
                    >
                      <div className="flex items-center gap-1.5">
                        {label}
                        {key && <SortIcon k={key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((shipment, idx) => {
                  const statusCfg = SHIPMENT_STATUSES[shipment.status]
                  const tempHistory = getHistory(shipment.id, 24).map((r) => r.temperature)
                  const latestTemp = tempHistory.at(-1)
                  return (
                    <tr
                      key={shipment.id}
                      onClick={() => setSelectedShipment(shipment)}
                      className="cursor-pointer transition-all"
                      style={{
                        borderBottom: "1px solid rgba(30,48,80,0.4)",
                        background: idx % 2 === 0 ? "rgba(7,12,25,0.6)" : "rgba(13,24,41,0.4)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(0,200,168,0.025)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = idx % 2 === 0 ? "rgba(7,12,25,0.6)" : "rgba(13,24,41,0.4)" }}
                    >
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                          {shipment.id}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                          {shipment.clientName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                          {shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{
                            color: statusCfg.color,
                            backgroundColor: statusCfg.bgColor,
                            border: `1px solid ${statusCfg.color}30`,
                            fontFamily: "var(--ao-font-body)",
                          }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {latestTemp !== undefined && (
                            <TemperatureBadge
                              temperature={latestTemp}
                              zone={shipment.temperatureZone}
                              requiredMin={shipment.requiredTempMin}
                              requiredMax={shipment.requiredTempMax}
                              size="sm"
                            />
                          )}
                          {tempHistory.length > 2 && (
                            <Sparkline
                              data={tempHistory.slice(-48)}
                              color={
                                shipment.temperatureZone === "ultra_cold" ? "#7C3AED" :
                                  shipment.temperatureZone === "frozen" ? "#3B82F6" : "#06B6D4"
                              }
                              width={60}
                              height={20}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
                          {formatEta(shipment.eta)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <RiskScore score={shipment.riskScore} size="sm" showLabel={false} />
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                          {shipment.carrierName}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "rgba(30,48,80,0.6)", background: "rgba(5,10,19,0.7)" }}
          >
            <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              Showing <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>{filtered.length}</span> shipment{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Shipment detail modal */}
      {selectedShipment && (
        <ModalPortal>
          <ShipmentDetailModal
            shipment={selectedShipment}
            onClose={() => setSelectedShipment(null)}
          />
        </ModalPortal>
      )}
    </div>
  )
}
