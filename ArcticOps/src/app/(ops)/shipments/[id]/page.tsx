"use client"
import { useState } from "react"
import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, Thermometer, Map, FileText, MessageSquare,
  Check, Clock, X, Upload, Download, AlertTriangle
} from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { RiskScore } from "@/components/shared/risk-score"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { StatusBadge } from "@/components/shared/status-badge"
import { Sparkline } from "@/components/shared/sparkline"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { formatTemp, formatEta, formatDate, formatDatetime } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import type { ShipmentStatus } from "@/lib/types/shipment"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid
} from "recharts"
import { format, parseISO } from "date-fns"

const TABS = [
  { id: "overview", label: "Overview", icon: Package },
  { id: "temperature", label: "Temperature", icon: Thermometer },
  { id: "route", label: "Route", icon: Map },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "comms", label: "Communications", icon: MessageSquare },
]

const STATUS_TO_BADGE_STATUS: Record<ShipmentStatus, "on_track" | "in_transit" | "delayed" | "at_risk" | "delivered" | "pending"> = {
  in_transit: "in_transit",
  at_customs: "delayed",
  preparing: "pending",
  requested: "pending",
  delivered: "delivered",
  cancelled: "at_risk",
}

// Custom tooltip for temp chart
function TempTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg text-xs shadow-xl"
      style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
      <p>{label}</p>
      <p style={{ color: "var(--ao-accent)" }}>{payload[0]?.value?.toFixed(1)}°C</p>
    </div>
  )
}

export default function ShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [chatMessage, setChatMessage] = useState("")
  const [messages, setMessages] = useState([
    { id: 1, sender: "ops", text: "Shipment confirmed and loaded. Temperature stable at 4.8°C.", time: "2h ago" },
    { id: 2, sender: "client", text: "Excellent. Please ensure the Dubai transit is under 2 hours.", time: "1.5h ago" },
    { id: 3, sender: "ops", text: "Confirmed. Dubai transit checkpoint cleared in 35 minutes.", time: "45m ago" },
  ])

  const shipment = useShipmentStore((s) => s.shipments.find((sh) => sh.id === id))
  const tempHistory = useTemperatureStore((s) => s.getHistory(id, 24))

  if (!shipment) return notFound()

  const latestTemp = tempHistory.at(-1)
  const documents = MOCK_DOCUMENTS.filter((d) => d.shipmentId === id)
  const statusCfg = SHIPMENT_STATUSES[shipment.status]
  const badgeStatus = STATUS_TO_BADGE_STATUS[shipment.status]

  // Temp chart data
  const chartData = tempHistory.slice(-72).map((r) => ({
    time: format(parseISO(r.timestamp), "HH:mm"),
    temp: r.temperature,
  }))
  const excursionThreshold = shipment.requiredTempMax
  const excursionPoints = chartData.filter((d) => d.temp > excursionThreshold).map((d) => d.time)

  const sendMessage = () => {
    if (!chatMessage.trim()) return
    setMessages((m) => [...m, { id: Date.now(), sender: "ops", text: chatMessage, time: "now" }])
    setChatMessage("")
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.6)" }}
      >
        <button onClick={() => router.push("/shipments")}
          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          aria-label="Back to shipments">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ao-text-muted)" }} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold" style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-accent)" }}>
              {shipment.id}
            </h2>
            <StatusBadge status={badgeStatus} />
            <span className="text-[13px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              {shipment.clientName}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
            {shipment.origin} → {shipment.destination}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <RiskScore score={shipment.riskScore} size="md" />
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              Cold Chain
            </p>
            <p className="text-lg font-bold" style={{ color: shipment.coldChainConfidence >= 90 ? "#2ED573" : shipment.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757", fontFamily: "var(--ao-font-mono)" }}>
              {shipment.coldChainConfidence}%
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex border-b shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}
        role="tablist"
      >
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            role="tab"
            aria-selected={activeTab === tabId}
            aria-controls={`tabpanel-${tabId}`}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
              activeTab === tabId ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]"
            )}
            style={{
              color: activeTab === tabId ? "var(--ao-accent)" : "var(--ao-text-muted)",
              fontFamily: "var(--ao-font-body)",
            }}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto" id={`tabpanel-${activeTab}`} role="tabpanel">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Shipment summary */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Summary</h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
                {[
                  { label: "Materials", value: shipment.materials.map((m) => `${m.name} ×${m.quantity}`).join(", ") },
                  { label: "Carrier", value: shipment.carrierName },
                  { label: "Temperature Zone", value: shipment.temperatureZone.replace("_", "-") },
                  { label: "Required Range", value: `${shipment.requiredTempMin}°C to ${shipment.requiredTempMax}°C` },
                  { label: "Departure", value: formatDate(shipment.departureDate) },
                  { label: "ETA", value: formatEta(shipment.eta) },
                  { label: "Cold Chain", value: `${shipment.coldChainConfidence}% confidence` },
                  { label: "Risk Score", value: `${shipment.riskScore} / 100` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
                    <dd style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", marginTop: "2px" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Live temp snapshot */}
            <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Live Temperature</h3>
              {latestTemp ? (
                <div className="flex flex-col items-center gap-3">
                  <TemperatureBadge
                    temperature={latestTemp.temperature}
                    zone={shipment.temperatureZone}
                    requiredMin={shipment.requiredTempMin}
                    requiredMax={shipment.requiredTempMax}
                    size="lg"
                  />
                  <p className="text-xs" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    Required: {shipment.requiredTempMin}°C – {shipment.requiredTempMax}°C
                  </p>
                  {tempHistory.length > 2 && (
                    <Sparkline data={tempHistory.slice(-48).map((r) => r.temperature)} width={200} height={40} color="var(--ao-accent)" />
                  )}
                </div>
              ) : (
                <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No readings yet</p>
              )}
            </div>

            {/* Checkpoints */}
            <div className="rounded-xl border p-5 lg:col-span-2" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Checkpoints</h3>
              <div className="flex flex-col gap-2">
                {shipment.checkpoints.map((cp, i) => (
                  <div key={cp.id} className="flex items-start gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full mt-0.5 shrink-0",
                      cp.status === "passed" ? "bg-[#2ED573]" : cp.status === "current" ? "bg-[var(--ao-accent)]" : "bg-[var(--ao-border)]"
                    )} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{cp.name}</span>
                        {cp.status === "current" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,212,170,0.12)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>Current</span>
                        )}
                      </div>
                      {cp.actualArrival && (
                        <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                          Arrived: {formatDatetime(cp.actualArrival)}
                        </p>
                      )}
                      {!cp.actualArrival && (
                        <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                          ETA: {formatDatetime(cp.estimatedArrival)}
                        </p>
                      )}
                      {cp.delayReason && (
                        <p className="text-[11px] mt-0.5" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>
                          ⚠ {cp.delayReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEMPERATURE */}
        {activeTab === "temperature" && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                  Temperature Timeline (last 24h)
                </h3>
                {latestTemp && (
                  <TemperatureBadge
                    temperature={latestTemp.temperature}
                    zone={shipment.temperatureZone}
                    requiredMin={shipment.requiredTempMin}
                    requiredMax={shipment.requiredTempMax}
                    size="md"
                  />
                )}
              </div>

              {chartData.length > 2 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ao-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--ao-accent)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ao-border)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} interval={11} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} domain={["auto", "auto"]} />
                    <Tooltip content={<TempTooltip />} />
                    <ReferenceLine y={shipment.requiredTempMax} stroke="#FFA502" strokeDasharray="4 3" label={{ value: "Max", position: "right", fontSize: 10, fill: "#FFA502", fontFamily: "var(--ao-font-mono)" }} />
                    <ReferenceLine y={shipment.requiredTempMin} stroke="#3B82F6" strokeDasharray="4 3" label={{ value: "Min", position: "right", fontSize: 10, fill: "#3B82F6", fontFamily: "var(--ao-font-mono)" }} />
                    <Area type="monotone" dataKey="temp" stroke="var(--ao-accent)" strokeWidth={1.5} fill="url(#tempGrad)" dot={false} activeDot={{ r: 3, fill: "var(--ao-accent)" }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Temperature data is initializing…
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROUTE */}
        {activeTab === "route" && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Route Legs</h3>
              <div className="flex flex-col gap-3">
                {shipment.legs.map((leg, i) => (
                  <div key={leg.id} className="flex items-start gap-4 p-3 rounded-lg" style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)" }}>
                    <div className="px-2 py-1 rounded-md text-[11px] font-bold uppercase" style={{
                      backgroundColor: leg.mode === "air" ? "rgba(59,130,246,0.12)" : leg.mode === "sea" ? "rgba(6,182,212,0.12)" : leg.mode === "rail" ? "rgba(124,58,237,0.12)" : "rgba(245,158,11,0.12)",
                      color: leg.mode === "air" ? "#3B82F6" : leg.mode === "sea" ? "#06B6D4" : leg.mode === "rail" ? "#7C3AED" : "#F59E0B",
                      fontFamily: "var(--ao-font-mono)",
                    }}>
                      {leg.mode}
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                        {leg.origin} → {leg.destination}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {formatDatetime(leg.departureTime)} → {formatDatetime(leg.arrivalTime)} · {leg.distanceKm.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="p-6">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
              <table className="w-full" aria-label="Shipment documents">
                <thead>
                  <tr style={{ backgroundColor: "rgba(12,22,42,0.8)", borderBottom: "1px solid var(--ao-border)" }}>
                    {["Document", "Status", "Uploaded", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                      <td className="px-4 py-3">
                        <span className="text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("flex items-center gap-1.5 text-[12px] font-medium")} style={{
                          color: doc.status === "complete" ? "#2ED573" : doc.status === "missing" ? "#FF4757" : "#FFA502",
                          fontFamily: "var(--ao-font-body)",
                        }}>
                          {doc.status === "complete" ? <Check className="w-3.5 h-3.5" /> : doc.status === "missing" ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                          {doc.uploadedAt ? formatDate(doc.uploadedAt) : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {doc.status === "complete" && (
                            <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                              <Download className="w-3 h-3" /> Download
                            </button>
                          )}
                          {(doc.status === "missing" || doc.status === "pending") && (
                            <button className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors"
                              style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)", backgroundColor: "rgba(0,212,170,0.10)" }}>
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {documents.length === 0 && (
                <div className="px-4 py-8 text-center text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  No documents linked to this shipment yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMMUNICATIONS */}
        {activeTab === "comms" && (
          <div className="p-6 h-full flex flex-col gap-4">
            <div className="flex-1 flex flex-col rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.sender === "ops" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl text-sm")}
                      style={{
                        backgroundColor: msg.sender === "ops" ? "rgba(0,212,170,0.14)" : "var(--ao-surface-elevated)",
                        border: `1px solid ${msg.sender === "ops" ? "rgba(0,212,170,0.3)" : "var(--ao-border)"}`,
                        color: "var(--ao-text-primary)",
                        fontFamily: "var(--ao-font-body)",
                      }}>
                      {msg.text}
                      <span className="block text-[10px] mt-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-3 flex gap-2" style={{ borderColor: "var(--ao-border)" }}>
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                />
                <button onClick={sendMessage}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:brightness-110"
                  style={{ backgroundColor: "var(--ao-accent)", color: "#0A1628", fontFamily: "var(--ao-font-body)" }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
