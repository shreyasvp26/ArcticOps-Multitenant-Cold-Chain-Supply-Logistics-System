"use client"
import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import { ArrowLeft, Plane, Ship, Train, Truck, Check, Clock, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { MOCK_CREWS } from "@/lib/mock-data/crews"
import { RiskScore } from "@/components/shared/risk-score"
import { Sparkline } from "@/components/shared/sparkline"
import { formatDate } from "@/lib/utils/format"
import { differenceInDays, parseISO } from "date-fns"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"

const MODE_ICONS = { air: Plane, sea: Ship, rail: Train, road: Truck }
const MODE_COLORS = { air: "#3B82F6", sea: "#06B6D4", rail: "#7C3AED", road: "#F59E0B" }
const DOC_STATUS_CONFIG = {
  verified: { color: "#2ED573", icon: Check, label: "Verified" },
  pending: { color: "#FFA502", icon: Clock, label: "Pending" },
  expired: { color: "#FF4757", icon: AlertTriangle, label: "Expired" },
  missing: { color: "#FF4757", icon: AlertTriangle, label: "Missing" },
}

export default function CrewProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const crew = MOCK_CREWS.find((c) => c.id === id)
  if (!crew) return notFound()

  const ModeIcon = MODE_ICONS[crew.transportMode] ?? Truck
  const modeColor = MODE_COLORS[crew.transportMode] ?? "#64748B"

  const today = new Date()
  const sortedDocs = [...crew.documents].sort((a, b) => {
    const aDate = a.expiryDate ? parseISO(a.expiryDate).getTime() : Infinity
    const bDate = b.expiryDate ? parseISO(b.expiryDate).getTime() : Infinity
    return differenceInDays(new Date(aDate), today) - differenceInDays(new Date(bDate), today)
  })

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.6)" }}>
        <button onClick={() => router.push("/transport")}
          className="p-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ao-text-muted)" }} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
            style={{ backgroundColor: `${modeColor}14`, color: modeColor, fontFamily: "var(--ao-font-mono)" }}>
            {crew.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>{crew.name}</h2>
            <div className="flex items-center gap-2">
              <ModeIcon className="w-3.5 h-3.5" style={{ color: modeColor }} />
              <span className="text-sm capitalize" style={{ color: modeColor, fontFamily: "var(--ao-font-body)" }}>{crew.transportMode} Operator</span>
              <span className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>· {crew.status}</span>
            </div>
          </div>
        </div>
        <RiskScore score={100 - crew.performanceScore} size="md" />
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: stats */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Performance</p>
            <dl className="flex flex-col gap-2 text-[12px]">
              {[
                { label: "Score", value: `${crew.performanceScore}/100`, color: crew.performanceScore >= 90 ? "#2ED573" : "#FFA502" },
                { label: "On-Time Rate", value: `${crew.onTimePercent}%` },
                { label: "Incidents", value: crew.incidentCount.toString(), color: crew.incidentCount === 0 ? "#2ED573" : "#FFA502" },
                { label: "Temp Record", value: `${crew.tempMaintenanceRecord}%` },
                { label: "License", value: crew.licenseNumber },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</dt>
                  <dd style={{ color: color ?? "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Performance sparklines */}
          <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>6-Month Trend</p>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Performance</p>
                <Sparkline data={[crew.performanceScore - 5, crew.performanceScore - 2, crew.performanceScore, crew.performanceScore + 1, crew.performanceScore, crew.performanceScore]} color="#2ED573" width={200} height={32} />
              </div>
            </div>
          </div>
        </div>

        {/* Middle: documents */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.7)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Documents</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "rgba(12,22,42,0.4)", borderBottom: "1px solid var(--ao-border)" }}>
                  {["Document", "Status", "Expires", "Days Left"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedDocs.map((doc) => {
                  const cfg = DOC_STATUS_CONFIG[doc.status as keyof typeof DOC_STATUS_CONFIG] ?? { color: "#64748B", label: doc.status }
                  const Icon = cfg.icon
                  const expiryStr = doc.expiryDate
                  const daysLeft = expiryStr ? differenceInDays(parseISO(expiryStr), today) : null
                  const daysColor = daysLeft === null ? "#64748B" : daysLeft < 0 ? "#FF4757" : daysLeft < 30 ? "#FFA502" : "#2ED573"
                  return (
                    <tr key={doc.id} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-[12px]" style={{ color: cfg.color, fontFamily: "var(--ao-font-body)" }}>
                          <Icon className="w-3.5 h-3.5" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{expiryStr ? formatDate(expiryStr) : "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] font-bold" style={{ color: daysColor, fontFamily: "var(--ao-font-mono)" }}>
                          {daysLeft === null ? "—" : daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d`}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Document expiry timeline */}
          <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Expiry Timeline</p>
            <div className="relative">
              <div className="h-1 rounded-full mb-4" style={{ backgroundColor: "var(--ao-surface-elevated)" }} />
              <div className="flex flex-col gap-2">
                {sortedDocs.map((doc) => {
                  const expiryStr = doc.expiryDate
                  const daysLeft = expiryStr ? differenceInDays(parseISO(expiryStr), today) : null
                  const pct = daysLeft !== null ? Math.min(Math.max((daysLeft / 365) * 100, 0), 100) : 0
                  const color = daysLeft === null ? "#64748B" : daysLeft < 0 ? "#FF4757" : daysLeft < 30 ? "#FFA502" : "#2ED573"
                  return (
                    <div key={doc.id} className="flex items-center gap-2 text-[11px]">
                      <div className="relative flex-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--ao-surface-elevated)" }}>
                        <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                      <span className="w-48 truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</span>
                      <span style={{ color, fontFamily: "var(--ao-font-mono)" }}>{daysLeft === null ? "—" : daysLeft < 0 ? "Expired" : `${daysLeft}d`}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
