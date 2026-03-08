"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Thermometer, DollarSign, Heart, Leaf, ArrowUpRight, ArrowDownRight } from "lucide-react"
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
  const predictions = MOCK_DELAY_PREDICTIONS

  const RISK_FACTOR_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    customs:    { label: "Customs Hold",      icon: "📋", color: "#FFA502" },
    weather:    { label: "Weather Event",     icon: "🌩️", color: "#3B82F6" },
    carrier:    { label: "Carrier Issue",     icon: "🚛", color: "#7C3AED" },
    route:      { label: "Route Congestion",  icon: "🛣️", color: "#06B6D4" },
    compliance: { label: "Compliance Gap",    icon: "⚠️",  color: "#FF4757" },
  }

  const highRisk   = predictions.filter((p) => p.confidencePercent >= 70).length
  const avgDelay   = Math.round(predictions.reduce((s, p) => s + p.predictedDelayHours, 0) / (predictions.length || 1))
  const topFactor  = predictions.reduce<Record<string, number>>((acc, p) => {
    acc[p.primaryRiskFactor] = (acc[p.primaryRiskFactor] ?? 0) + 1; return acc
  }, {})
  const topFactorKey = Object.entries(topFactor).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "customs"

  return (
    <div className="flex flex-col gap-6">

      {/* ── Summary stat row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "High Risk",      value: highRisk,            sub: "≥70% confidence",    color: "#FF4757",  icon: "⚠️" },
          { label: "Avg Delay",      value: `${avgDelay}h`,      sub: "across all tracked",  color: "#FFA502",  icon: "⏱️" },
          { label: "Top Risk Factor",value: RISK_FACTOR_CONFIG[topFactorKey]?.label ?? "Customs",
                                                                  sub: "most frequent cause", color: "#3B82F6",  icon: RISK_FACTOR_CONFIG[topFactorKey]?.icon ?? "📋" },
          { label: "Monitored",      value: predictions.length,  sub: "active shipments",    color: "#2ED573",  icon: "👁️" },
        ].map(({ label, value, sub, color, icon }) => (
          <motion.div
            key={label}
            initial={false}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 350, damping: 25 } }}
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{
              background: `linear-gradient(135deg, ${color}14 0%, rgba(6,13,27,0.9) 100%)`,
              border: `1px solid ${color}30`,
              backdropFilter: "blur(16px)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}44, 0 12px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <span className="text-lg">{icon}</span>
            </div>
            <p className="text-[28px] font-bold leading-none"
              style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Prediction cards ── */}
      <div className="flex flex-col gap-4">
        {predictions.map((pred, i) => {
          const isOnTime     = pred.predictedDelayHours === 0
          const isLowDelay   = pred.predictedDelayHours > 0 && pred.predictedDelayHours <= 6
          const isHighConf   = pred.confidencePercent >= 70

          // Severity tier drives the entire card colour scheme
          // Green  = on time AND high confidence (model says "all good, we're sure")
          // Yellow = small delay (1-6h) OR medium confidence (50-69%) regardless of timing
          // Red    = meaningful delay (>6h) AND high confidence  →  real risk
          // Blue   = low confidence catch-all (model is uncertain)
          const cardColor =
            isOnTime && isHighConf          ? "#2ED573"  // green  — healthy
            : isLowDelay || !isHighConf     ? "#FFA502"  // yellow — caution
            : pred.predictedDelayHours > 6  ? "#FF4757"  // red    — at risk
            :                                 "#3B82F6"  // blue   — uncertain

          const statusLabel =
            isOnTime && isHighConf ? "On Track"
            : isLowDelay           ? "Minor Delay"
            : !isHighConf          ? "Uncertain"
            :                        "At Risk"

          const rf = RISK_FACTOR_CONFIG[pred.primaryRiskFactor] ?? { label: pred.primaryRiskFactor, icon: "⚙️", color: "#64748B" }
          const delayDisplay = isOnTime ? "On Time"
            : pred.predictedDelayHours >= 24
              ? `${Math.floor(pred.predictedDelayHours / 24)}d ${pred.predictedDelayHours % 24}h`
              : `${pred.predictedDelayHours}h`

          // Build richer bg gradient per tier
          const bgGradient =
            isOnTime && isHighConf
              ? `linear-gradient(135deg, rgba(46,213,115,0.09) 0%, rgba(0,200,120,0.04) 40%, rgba(6,13,27,0.97) 100%)`
              : isLowDelay || !isHighConf
              ? `linear-gradient(135deg, rgba(255,165,2,0.09) 0%, rgba(220,130,0,0.04) 40%, rgba(8,16,34,0.97) 100%)`
              : `linear-gradient(135deg, rgba(255,71,87,0.09) 0%, rgba(200,30,50,0.04) 40%, rgba(8,16,34,0.97) 100%)`

          return (
            <motion.div
              key={pred.shipmentId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
              whileHover={{
                scale: 1.012,
                y: -3,
                transition: { type: "spring", stiffness: 340, damping: 26 },
              }}
              style={{
                cursor: "default",
                borderRadius: "16px",
                background: bgGradient,
                border: `1px solid ${cardColor}28`,
                borderLeft: `3px solid ${cardColor}`,
                backdropFilter: "blur(16px)",
                boxShadow: `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${cardColor}0a`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 0 0 1px ${cardColor}40, 0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 ${cardColor}18`
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 ${cardColor}0a`
              }}
            >
              <div className="p-5">
                {/* ── Header row ── */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl shrink-0"
                      style={{ background: `${cardColor}18`, border: `1px solid ${cardColor}35` }}>
                      <span className="text-base leading-none">{rf.icon}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <span className="text-[15px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                          {pred.shipmentId}
                        </span>
                        {/* Status pill */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"
                          style={{ background: `${cardColor}20`, color: cardColor, border: `1px solid ${cardColor}40`, fontFamily: "var(--ao-font-body)" }}>
                          {statusLabel}
                        </span>
                        {/* Risk factor pill */}
                        <span className="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide"
                          style={{ background: "rgba(30,48,80,0.5)", color: "var(--ao-text-muted)", border: "1px solid rgba(30,48,80,0.8)", fontFamily: "var(--ao-font-body)" }}>
                          {rf.label}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                        {pred.clientName}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        {pred.currentStatus}
                      </p>
                    </div>
                  </div>

                  {/* Delay badge */}
                  <div className="text-right shrink-0 pl-4">
                    <p className="text-[10px] uppercase tracking-wider mb-1"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Predicted Delay</p>
                    <p className="text-[26px] font-bold leading-none"
                      style={{ color: cardColor, fontFamily: "var(--ao-font-mono)" }}>
                      {delayDisplay}
                    </p>
                  </div>
                </div>

                {/* ── Risk detail ── */}
                <div className="rounded-xl px-4 py-3 mb-4"
                  style={{ background: `${cardColor}08`, border: `1px solid ${cardColor}18` }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: cardColor, fontFamily: "var(--ao-font-body)", opacity: 0.75 }}>Risk Intelligence</p>
                  <p className="text-[13px] leading-snug" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                    {pred.riskDetails}
                  </p>
                </div>

                {/* ── Confidence bar ── */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Model Confidence</p>
                    <p className="text-[13px] font-bold" style={{ color: cardColor, fontFamily: "var(--ao-font-mono)" }}>
                      {pred.confidencePercent}%
                    </p>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(30,48,80,0.5)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${cardColor}bb, ${cardColor})`, boxShadow: `0 0 8px ${cardColor}55` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pred.confidencePercent}%`, transition: { duration: 0.9, delay: 0.3 + i * 0.07, ease: [0.16, 1, 0.3, 1] } }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px]" style={{ color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>Low</span>
                    <span className="text-[9px]" style={{ color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>High</span>
                  </div>
                </div>
              </div>
            </motion.div>
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

  // Per-route totals for the bar chart
  const routeTotals = routes.map((r) => ({
    route: r.split(" → ")[0] + " →\n" + (r.split(" → ")[1] ?? ""),
    label: r,
    total: heatmapData.filter((d) => d.routeSegment === r).reduce((s, d) => s + d.excursionCount, 0),
  }))

  const STAT_ITEMS = [
    { label: "Total Excursions (YTD)", value: totalExcursions, sub: "across all routes",     color: "#FF4757",  icon: "🌡️" },
    { label: "Most Affected Route",    value: routes[0] ?? "—", sub: "highest breach count", color: "#FFA502",  icon: "🛣️" },
    { label: "Worst Carrier",          value: "ArcticFreight",  sub: "most incidents logged", color: "#3B82F6",  icon: "🚚" },
    { label: "Peak Month",             value: months[1] ?? "—", sub: "highest excursion rate",color: "#7C3AED",  icon: "📅" },
  ]

  return (
    <div className="flex flex-col gap-6">

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_ITEMS.map(({ label, value, sub, color, icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            whileHover={{ scale: 1.04, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            style={{
              cursor: "default",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${color}14 0%, rgba(6,13,27,0.92) 100%)`,
              border: `1px solid ${color}30`,
              backdropFilter: "blur(16px)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
              padding: "20px",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}44, 0 12px 40px rgba(0,0,0,0.4)`
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <span className="text-lg">{icon}</span>
            </div>
            <p className="text-[26px] font-bold leading-none mb-1"
              style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Heatmap + route bar chart side by side ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">

        {/* Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.32, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="rounded-2xl border p-5"
          style={{
            background: "linear-gradient(135deg, rgba(11,18,34,0.92) 0%, rgba(6,13,27,0.97) 100%)",
            borderColor: "var(--ao-border)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-1.5 rounded-lg" style={{ background: "rgba(255,71,87,0.12)", border: "1px solid rgba(255,71,87,0.2)" }}>
              <span className="text-sm">🌡️</span>
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                Excursion Heatmap
              </p>
              <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                Temperature breach frequency by route &amp; month
              </p>
            </div>
            {/* Legend */}
            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(30,48,80,0.6)" }} />
                <span className="text-[9px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>0</span>
              </div>
              {[0.25, 0.5, 0.75, 1].map((v) => (
                <div key={v} className="w-3 h-3 rounded-sm" style={{ background: `rgba(255,71,87,${0.1 + v * 0.7})` }} />
              ))}
              <span className="text-[9px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>High</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div style={{ minWidth: 480 }}>
              {/* Month headers */}
              <div className="flex mb-3 pl-[172px] gap-1.5">
                {months.map((m) => (
                  <div key={m} className="flex-1 text-center text-[10px] font-medium truncate"
                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{m}</div>
                ))}
              </div>

              {/* Rows */}
              {routes.map((route, ri) => (
                <motion.div
                  key={route}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.4 + ri * 0.07, duration: 0.35, ease: "easeOut" } }}
                  className="flex items-center mb-2"
                >
                  <div className="w-[172px] pr-3 shrink-0">
                    <p className="text-[11px] font-medium truncate" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      {route}
                    </p>
                  </div>
                  <div className="flex flex-1 gap-1.5">
                    {months.map((month, ci) => {
                      const cell = heatmapData.find((d) => d.routeSegment === route && d.month === month)
                      const count = cell?.excursionCount ?? 0
                      const intensity = count / maxCount
                      const isHot = count >= maxCount * 0.7
                      return (
                        <motion.div
                          key={month}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { delay: 0.45 + ri * 0.07 + ci * 0.04, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
                          }}
                          whileHover={{ scale: 1.25, zIndex: 10, transition: { type: "spring", stiffness: 500, damping: 22 } }}
                          className="flex-1 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold relative"
                          style={{
                            cursor: "default",
                            backgroundColor: count === 0
                              ? "rgba(30,48,80,0.35)"
                              : `rgba(255,71,87,${0.1 + intensity * 0.75})`,
                            color: count > 0 ? "#fff" : "rgba(100,116,139,0.4)",
                            fontFamily: "var(--ao-font-mono)",
                            border: count > 0 ? `1px solid rgba(255,71,87,${0.15 + intensity * 0.4})` : "1px solid rgba(30,48,80,0.3)",
                            boxShadow: isHot ? `0 0 12px rgba(255,71,87,${0.3 + intensity * 0.3})` : "none",
                          }}
                        >
                          {count > 0 ? count : "·"}
                          {/* pulse ring on hottest cells */}
                          {isHot && (
                            <motion.span
                              className="absolute inset-0 rounded-lg pointer-events-none"
                              animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.3, 1] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                              style={{ border: "1px solid rgba(255,71,87,0.5)" }}
                            />
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Route bar chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          className="rounded-2xl border p-5 flex flex-col"
          style={{
            background: "linear-gradient(135deg, rgba(11,18,34,0.92) 0%, rgba(6,13,27,0.97) 100%)",
            borderColor: "var(--ao-border)",
            backdropFilter: "blur(16px)",
          }}
        >
          <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
            Breaches by Route
          </p>
          <p className="text-[11px] mb-5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Total incidents per corridor
          </p>
          <div className="flex flex-col gap-3 flex-1">
            {routeTotals
              .sort((a, b) => b.total - a.total)
              .map(({ label, total }, i) => {
                const barPct = (total / Math.max(...routeTotals.map((r) => r.total), 1)) * 100
                const barColor = i === 0 ? "#FF4757" : i === 1 ? "#FFA502" : "#3B82F6"
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.55 + i * 0.07, duration: 0.35, ease: "easeOut" } }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-medium truncate max-w-[180px]"
                        style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                      <p className="text-[12px] font-bold shrink-0 ml-2"
                        style={{ color: barColor, fontFamily: "var(--ao-font-mono)" }}>{total}</p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(30,48,80,0.5)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${barColor}bb, ${barColor})`, boxShadow: `0 0 6px ${barColor}55` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${barPct}%`, transition: { duration: 0.9, delay: 0.6 + i * 0.07, ease: [0.16, 1, 0.3, 1] } }}
                      />
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </motion.div>
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
          { label: "Best Efficiency", value: "ArcticFreight", color: "#00C8A8" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${color}0d 0%, rgba(6,13,27,0.8) 100%)`,
              border: `1px solid ${color}28`,
              backdropFilter: "blur(12px)",
            }}>
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            <p className="text-xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, rgba(11,18,34,0.9) 0%, rgba(6,13,27,0.95) 100%)", borderColor: "var(--ao-border)", backdropFilter: "blur(12px)" }}>
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

        <div className="rounded-xl border overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(11,18,34,0.9) 0%, rgba(6,13,27,0.95) 100%)", borderColor: "var(--ao-border)", backdropFilter: "blur(12px)" }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(0,0,0,0.2)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Budget vs Actual</p>
          </div>
          <div className="overflow-y-auto max-h-[200px]">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: "rgba(13,24,41,0.5)", borderBottom: "1px solid var(--ao-border)" }}>
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

// Supply health (formerly Client Health)
function ClientHealth() {
  const healthData = MOCK_CLIENT_HEALTH

  // Animated ring component — draws the arc from 0 → score on mount
  function ScoreRing({ score, color }: { score: number; color: string }) {
    const circumference = 2 * Math.PI * 15.9
    return (
      <div className="relative w-20 h-20 shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="18" cy="18" r="15.9" fill="none"
            stroke="rgba(30,48,80,0.5)" strokeWidth="2.8" />
          {/* Animated fill */}
          <motion.circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="2.8" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
          {/* Subtle glow ring */}
          <motion.circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference, opacity: 0 }}
            animate={{ strokeDashoffset: circumference * (1 - score / 100), opacity: 0.12 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </svg>
        {/* Score counter */}
        <motion.p
          className="absolute inset-0 flex items-center justify-center text-[15px] font-bold"
          style={{ color, fontFamily: "var(--ao-font-mono)" }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {score}
        </motion.p>
      </div>
    )
  }

  // Animated stat bar
  function StatBar({ pct, color }: { pct: number; color: string }) {
    return (
      <div className="h-1.5 rounded-full overflow-hidden mt-0.5" style={{ background: "rgba(30,48,80,0.5)" }}>
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 5px ${color}44` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
        />
      </div>
    )
  }

  const overallAvg = Math.round(healthData.reduce((s, h) => s + h.score, 0) / (healthData.length || 1))
  const totalIssues = healthData.reduce((s, h) => s + h.issueCount, 0)
  const avgSatisfaction = (healthData.reduce((s, h) => s + h.satisfactionScore, 0) / (healthData.length || 1)).toFixed(1)

  return (
    <div className="flex flex-col gap-6">

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Portfolio Health",   value: `${overallAvg}`,      sub: "average across clients", color: overallAvg >= 80 ? "#2ED573" : overallAvg >= 60 ? "#FFA502" : "#FF4757", icon: "💚" },
          { label: "Open Issues",        value: `${totalIssues}`,     sub: "requiring attention",    color: totalIssues === 0 ? "#2ED573" : totalIssues <= 3 ? "#FFA502" : "#FF4757", icon: "⚠️" },
          { label: "Avg Satisfaction",   value: `${avgSatisfaction}`, sub: "out of 100",             color: "#3B82F6",  icon: "⭐" },
        ].map(({ label, value, sub, color, icon }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.09, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            style={{
              cursor: "default", borderRadius: "16px", padding: "20px",
              background: `linear-gradient(135deg, ${color}12 0%, rgba(6,13,27,0.94) 100%)`,
              border: `1px solid ${color}28`, backdropFilter: "blur(16px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}40, 0 12px 36px rgba(0,0,0,0.4)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <span className="text-base">{icon}</span>
            </div>
            <p className="text-[30px] font-bold leading-none mb-1"
              style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Client cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {healthData.map((h, i) => {
          const color  = h.score >= 80 ? "#2ED573" : h.score >= 60 ? "#FFA502" : "#FF4757"
          const trendDir = h.orderFrequencyTrend
          const trendIcon = trendDir === "up" ? "↑" : trendDir === "down" ? "↓" : "→"
          const trendColor = trendDir === "up" ? "#2ED573" : trendDir === "down" ? "#FF4757" : "#FFA502"
          const trendData = h.trend.map((t) => t.score)
          const satPct = h.satisfactionScore   // already 0-100

          return (
            <motion.div
              key={h.tenantId}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.28 + i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
              whileHover={{ scale: 1.015, y: -4, transition: { type: "spring", stiffness: 340, damping: 26 } }}
              style={{
                cursor: "default", borderRadius: "18px",
                background: `linear-gradient(150deg, ${color}10 0%, rgba(8,16,34,0.97) 55%, rgba(6,13,27,0.99) 100%)`,
                border: `1px solid ${color}28`,
                borderTop: `2px solid ${color}55`,
                backdropFilter: "blur(18px)",
                boxShadow: `0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 ${color}0a`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 0 0 1px ${color}35, 0 20px 52px rgba(0,0,0,0.45), inset 0 1px 0 ${color}18`
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  `0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 ${color}0a`
              }}
            >
              <div className="p-5">
                {/* ── Header ── */}
                <div className="flex items-start gap-3 mb-5">
                  <motion.div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-[15px] font-bold shrink-0"
                    style={{ background: `${color}1a`, color, fontFamily: "var(--ao-font-mono)", border: `1px solid ${color}30` }}
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.35 + i * 0.1, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {h.tenantName.charAt(0)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[14px] truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                      {h.tenantName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <motion.span
                        className="text-[12px] font-semibold"
                        style={{ color: trendColor, fontFamily: "var(--ao-font-mono)" }}
                        animate={{ y: trendDir === "up" ? [0, -2, 0] : trendDir === "down" ? [0, 2, 0] : [0] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {trendIcon}
                      </motion.span>
                      <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        Order frequency {trendDir}
                      </span>
                    </div>
                  </div>
                  {/* Health badge */}
                  <motion.span
                    className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide shrink-0"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}35`, fontFamily: "var(--ao-font-body)" }}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    {h.score >= 80 ? "Healthy" : h.score >= 60 ? "At Risk" : "Critical"}
                  </motion.span>
                </div>

                {/* ── Score ring + stats ── */}
                <div className="flex items-center gap-5 mb-5">
                  <ScoreRing score={h.score} color={color} />
                  <div className="flex-1 flex flex-col gap-3">
                    {/* Open issues */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Open Issues</span>
                        <span className="text-[11px] font-bold" style={{ color: h.issueCount === 0 ? "#2ED573" : "#FFA502", fontFamily: "var(--ao-font-mono)" }}>
                          {h.issueCount}
                        </span>
                      </div>
                      <StatBar pct={Math.min(h.issueCount * 20, 100)} color={h.issueCount === 0 ? "#2ED573" : "#FFA502"} />
                    </div>
                    {/* Satisfaction */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Satisfaction</span>
                        <span className="text-[11px] font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>
                          {h.satisfactionScore}
                        </span>
                      </div>
                      <StatBar pct={satPct} color={color} />
                    </div>
                  </div>
                </div>

                {/* ── 6-month trend sparkline ── */}
                {trendData.length > 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.75 + i * 0.1, duration: 0.5 } }}
                    className="rounded-xl px-3 pt-3 pb-2"
                    style={{ background: "rgba(6,13,27,0.55)", border: `1px solid ${color}15` }}
                  >
                    <p className="text-[10px] mb-2 font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                      6-month trend
                    </p>
                    <Sparkline data={trendData} color={color} width={240} height={32} />
                    <div className="flex justify-between mt-1">
                      <span className="text-[9px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {h.trend[0]?.month}
                      </span>
                      <span className="text-[9px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {h.trend[h.trend.length - 1]?.month}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
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
          { label: "CO₂ Saved (eco routes)", value: `${(savedKg / 1000).toFixed(1)}t`, color: "#00C8A8" },
          { label: "Avg per Shipment", value: `${Math.round(totalCo2 / 12)} kg`, color: "#3B82F6" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 transition-all hover:scale-[1.01]"
            style={{
              background: `linear-gradient(135deg, ${color}0d 0%, rgba(6,13,27,0.8) 100%)`,
              border: `1px solid ${color}28`,
              backdropFilter: "blur(12px)",
            }}>
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-3.5 h-3.5" style={{ color }} />
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5" style={{ background: "linear-gradient(135deg, rgba(11,18,34,0.9) 0%, rgba(6,13,27,0.95) 100%)", borderColor: "var(--ao-border)", backdropFilter: "blur(12px)" }}>
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
    { id: "delays", label: "Predictive Delays", icon: TrendingUp, desc: "AI-powered delay forecasting" },
    { id: "excursions", label: "Excursion Analytics", icon: Thermometer, desc: "Temperature breach patterns" },
    { id: "costs", label: "Cost Optimization", icon: DollarSign, desc: "Budget vs actual analysis" },
    { id: "clients", label: "Supply Health", icon: Heart, desc: "Supply partner health & satisfaction scores" },
    { id: "sustainability", label: "Sustainability", icon: Leaf, desc: "Carbon footprint tracking" },
  ]

  const activeTab = TABS.find((t) => t.id === tab)

  return (
    <div className="flex flex-col h-full">
      {/* Page header bar */}
      <div
        className="shrink-0 px-6 py-4 border-b"
        style={{
          borderColor: "var(--ao-border)",
          background: "linear-gradient(180deg, rgba(7,12,22,0.8) 0%, rgba(5,10,19,0.5) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)", border: "1px solid rgba(0,200,168,0.25)" }}
          >
            <TrendingUp className="w-4 h-4" style={{ color: "var(--ao-accent)" }} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.12em" }}>
              Intelligence Suite
            </p>
            <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {activeTab?.desc}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id as typeof tab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all whitespace-nowrap"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,200,168,0.18) 0%, rgba(0,200,168,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "var(--ao-accent)" : "var(--ao-text-muted)",
                  border: isActive ? "1px solid rgba(0,200,168,0.3)" : "1px solid transparent",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: isActive ? "0 0 12px rgba(0,200,168,0.1)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
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
