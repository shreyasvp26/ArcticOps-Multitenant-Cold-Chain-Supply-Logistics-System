"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { TrendingUp, Thermometer, DollarSign, Heart, Leaf, ExternalLink, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { RiskScore } from "@/components/shared/risk-score"
import { Sparkline } from "@/components/shared/sparkline"
import {
  MOCK_DELAY_PREDICTIONS,
  MOCK_EXCURSION_HEATMAP,
  MOCK_COST_REPORTS,
  MOCK_CLIENT_HEALTH,
} from "@/lib/mock-data/analytics"
import { MOCK_CLIENTS } from "@/lib/mock-data/clients"
import { formatCurrency } from "@/lib/utils/format"
import { fadeVariants, staggerContainer, staggerChild } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Cell
} from "recharts"

// Predictive delay tab
function PredictiveDelays() {
  const router = useRouter()
  const predictions = MOCK_DELAY_PREDICTIONS

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "High Risk", value: predictions.filter((p) => p.confidencePercent >= 70).length, color: "#FF4757" },
          { label: "Avg Delay Hours", value: `${Math.round(predictions.reduce((s, p) => s + p.predictedDelayHours, 0) / (predictions.length || 1))}h`, color: "#FFA502" },
          { label: "Top Risk Factor", value: "Customs", color: "#3B82F6" },
          { label: "Monitored", value: predictions.length, color: "#2ED573" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {predictions.map((pred) => {
          const confColor = pred.confidencePercent >= 80 ? "#FF4757" : pred.confidencePercent >= 60 ? "#FFA502" : "#3B82F6"
          return (
            <div key={pred.shipmentId}
              className="rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01]"
              style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)", borderLeftWidth: 3, borderLeftColor: confColor }}
              onClick={() => router.push(`/shipments/${pred.shipmentId}`)}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{pred.shipmentId}</span>
                <ExternalLink className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
              </div>
              <p className="text-[12px] mb-1" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{pred.clientName}</p>
              <p className="text-[11px] mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{pred.currentStatus}</p>
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Predicted Delay</p>
                  <p className="text-[15px] font-bold" style={{ color: confColor, fontFamily: "var(--ao-font-mono)" }}>
                    {pred.predictedDelayHours >= 24
                      ? `${Math.floor(pred.predictedDelayHours / 24)}d ${pred.predictedDelayHours % 24}h`
                      : `${pred.predictedDelayHours}h`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Confidence</p>
                  <p className="text-[15px] font-bold" style={{ color: confColor, fontFamily: "var(--ao-font-mono)" }}>{pred.confidencePercent}%</p>
                </div>
                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  {pred.primaryRiskFactor}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Excursion analytics heatmap
function ExcursionAnalytics() {
  const heatmapData = MOCK_EXCURSION_HEATMAP
  const routes = [...new Set(heatmapData.map((d) => d.routeSegment))]
  const months = [...new Set(heatmapData.map((d) => d.month))]
  const maxCount = Math.max(...heatmapData.map((d) => d.excursionCount), 1)
  const totalExcursions = heatmapData.reduce((s, d) => s + d.excursionCount, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Excursions (YTD)", value: totalExcursions },
          { label: "Most Affected Route", value: routes[0] ?? "—" },
          { label: "Worst Carrier", value: "ArcticFreight" },
          { label: "Peak Month", value: months[1] ?? "—" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            <p className="text-[14px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Excursion Heatmap</p>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 500 }}>
            <div className="flex mb-2 pl-[180px]">
              {months.map((m) => (
                <div key={m} className="flex-1 text-[10px] text-center truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{m}</div>
              ))}
            </div>
            {routes.map((route) => (
              <div key={route} className="flex items-center mb-1.5">
                <div className="w-[180px] pr-3 shrink-0">
                  <p className="text-[10px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{route}</p>
                </div>
                <div className="flex flex-1 gap-1">
                  {months.map((month) => {
                    const cell = heatmapData.find((d) => d.routeSegment === route && d.month === month)
                    const count = cell?.excursionCount ?? 0
                    const intensity = count / maxCount
                    return (
                      <div key={month} className="flex-1 h-7 rounded-sm cursor-pointer flex items-center justify-center text-[10px] font-bold hover:opacity-80"
                        style={{
                          backgroundColor: count === 0 ? "var(--ao-surface-elevated)" : `rgba(255,71,87,${0.1 + intensity * 0.7})`,
                          color: count > 0 ? "#fff" : "var(--ao-text-muted)",
                          fontFamily: "var(--ao-font-mono)",
                        }}>
                        {count > 0 ? count : ""}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Cost optimization
function CostOptimization() {
  const costData = MOCK_COST_REPORTS
  const totalSavings = costData.reduce((s, c) => s + Math.max(0, c.estimatedCostUsd - c.actualCostUsd), 0)

  const modeData = ["air", "sea", "rail", "road"].map((m) => ({
    name: m.charAt(0).toUpperCase() + m.slice(1),
    cost: costData.filter((c) => c.primaryMode === m).reduce((s, c) => s + c.actualCostUsd, 0),
  })).filter((d) => d.cost > 0)

  const MODE_COLORS_BAR: Record<string, string> = { Air: "#3B82F6", Sea: "#06B6D4", Rail: "#7C3AED", Road: "#F59E0B" }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Savings Opportunity", value: formatCurrency(totalSavings), color: "#2ED573" },
          { label: "Most Expensive Route", value: "SIN → LHR", color: "#FF4757" },
          { label: "Best Efficiency", value: "ArcticFreight", color: "#00D4AA" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Cost by Transport Mode</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modeData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ao-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)", fontSize: 11 }} />
              <Bar dataKey="cost" radius={[3, 3, 0, 0]}>
                {modeData.map((d) => <Cell key={d.name} fill={MODE_COLORS_BAR[d.name] ?? "#64748B"} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.7)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Budget vs Actual</p>
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: "rgba(12,22,42,0.5)", borderBottom: "1px solid var(--ao-border)" }}>
                  {["Shipment", "Estimated", "Actual", "Variance"].map((h) => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {costData.slice(0, 12).map((c) => {
                  const varColor = c.variance <= 0 ? "#2ED573" : "#FF4757"
                  return (
                    <tr key={c.shipmentId} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                      <td className="px-3 py-2" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{c.shipmentId}</td>
                      <td className="px-3 py-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(c.estimatedCostUsd)}</td>
                      <td className="px-3 py-2" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(c.actualCostUsd)}</td>
                      <td className="px-3 py-2">
                        <span className="flex items-center gap-0.5" style={{ color: varColor, fontFamily: "var(--ao-font-mono)" }}>
                          {c.variance <= 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {formatCurrency(Math.abs(c.variance))}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// Client health
function ClientHealth() {
  const healthData = MOCK_CLIENT_HEALTH

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {healthData.map((h) => {
        const color = h.score >= 80 ? "#2ED573" : h.score >= 60 ? "#FFA502" : "#FF4757"
        const trendData = h.trend.map((t) => t.score)

        return (
          <div key={h.tenantId} className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: `${color}14`, color, fontFamily: "var(--ao-font-mono)" }}>
                {h.tenantName.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{h.tenantName}</p>
                <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  {h.orderFrequencyTrend === "up" ? "↑" : h.orderFrequencyTrend === "down" ? "↓" : "→"} Trend
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--ao-surface-elevated)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
                    strokeDasharray={`${h.score} ${100 - h.score}`} strokeLinecap="round" />
                </svg>
                <p className="absolute inset-0 flex items-center justify-center text-sm font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{h.score}</p>
              </div>
              <dl className="flex-1 grid gap-y-1 text-[11px]">
                {[
                  { label: "Issues", value: h.issueCount },
                  { label: "Satisfaction", value: `${h.satisfactionScore}/5` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
                    <dd style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {trendData.length > 2 && (
              <div>
                <p className="text-[10px] mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>6-month trend</p>
                <Sparkline data={trendData} color={color} width={220} height={28} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Sustainability
function SustainabilityDashboard() {
  const totalCo2 = 48500
  const savedKg = 6200

  const modeData = [
    { name: "Air", co2: 32000 },
    { name: "Sea", co2: 8500 },
    { name: "Rail", co2: 3000 },
    { name: "Road", co2: 5000 },
  ]
  const MODE_COLORS_BAR: Record<string, string> = { Air: "#3B82F6", Sea: "#06B6D4", Rail: "#7C3AED", Road: "#F59E0B" }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Total CO₂ (YTD)", value: `${(totalCo2 / 1000).toFixed(1)}t`, color: "#2ED573" },
          { label: "CO₂ Saved (eco routes)", value: `${(savedKg / 1000).toFixed(1)}t`, color: "#00D4AA" },
          { label: "Avg per Shipment", value: `${Math.round(totalCo2 / 12)} kg`, color: "#3B82F6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <p className="text-sm font-semibold mb-4" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>CO₂ by Transport Mode</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={modeData} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ao-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} />
            <YAxis tick={{ fontSize: 10, fill: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}t`} />
            <Tooltip contentStyle={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)", fontSize: 11 }} />
            <Bar dataKey="co2" radius={[3, 3, 0, 0]}>
              {modeData.map((d) => <Cell key={d.name} fill={MODE_COLORS_BAR[d.name] ?? "#2ED573"} fillOpacity={0.8} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Main analytics page
export default function AnalyticsPage() {
  const [tab, setTab] = useState<"delays" | "excursions" | "costs" | "clients" | "sustainability">("delays")

  const TABS = [
    { id: "delays", label: "Predictive Delays", icon: TrendingUp },
    { id: "excursions", label: "Excursion Analytics", icon: Thermometer },
    { id: "costs", label: "Cost Optimization", icon: DollarSign },
    { id: "clients", label: "Client Health", icon: Heart },
    { id: "sustainability", label: "Sustainability", icon: Leaf },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b overflow-x-auto shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={cn("flex items-center gap-2 px-5 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
              tab === id ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
            style={{ color: tab === id ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={fadeVariants} initial="initial" animate="animate" exit="exit"
          className="flex-1 overflow-auto p-6">
          {tab === "delays" && <PredictiveDelays />}
          {tab === "excursions" && <ExcursionAnalytics />}
          {tab === "costs" && <CostOptimization />}
          {tab === "clients" && <ClientHealth />}
          {tab === "sustainability" && <SustainabilityDashboard />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
