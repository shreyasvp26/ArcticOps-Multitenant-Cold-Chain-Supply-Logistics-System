"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const { user } = useAuthStore()
  const { shipments } = useShipmentStore()
  const getHistory = useTemperatureStore((s) => s.getHistory)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ShipmentStatus | "all">("all")
  const [zoneFilter, setZoneFilter] = useState("all")
  const [sortKey, setSortKey] = useState<SortKey>("eta")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

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
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shipments…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: "var(--ao-surface)",
              border: "1px solid var(--ao-border)",
              color: "var(--ao-text-primary)",
              fontFamily: "var(--ao-font-body)",
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ShipmentStatus | "all")}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
        >
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
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
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Shipments table">
              <thead>
                <tr style={{ backgroundColor: "rgba(12,22,42,0.8)", borderBottom: "1px solid var(--ao-border)" }}>
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
                        "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider",
                        key && "cursor-pointer select-none hover:opacity-80"
                      )}
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}
                      onClick={key ? () => toggleSort(key) : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        {key && <SortIcon k={key} />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((shipment) => {
                  const statusCfg = SHIPMENT_STATUSES[shipment.status]
                  const tempHistory = getHistory(shipment.id, 24).map((r) => r.temperature)
                  const latestTemp = tempHistory.at(-1)
                  return (
                    <tr
                      key={shipment.id}
                      onClick={() => router.push(`/shipments/${shipment.id}`)}
                      className="cursor-pointer transition-colors border-t hover:bg-[rgba(255,255,255,0.03)]"
                      style={{ borderColor: "var(--ao-border)" }}
                    >
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                          {shipment.id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                          {shipment.clientName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                          {shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                          style={{ color: statusCfg.color, backgroundColor: statusCfg.bgColor, fontFamily: "var(--ao-font-body)" }}
                        >
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
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
                      <td className="px-4 py-3">
                        <span className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
                          {formatEta(shipment.eta)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <RiskScore score={shipment.riskScore} size="sm" showLabel={false} />
                      </td>
                      <td className="px-4 py-3">
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
            style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}
          >
            <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              {filtered.length} shipment{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
