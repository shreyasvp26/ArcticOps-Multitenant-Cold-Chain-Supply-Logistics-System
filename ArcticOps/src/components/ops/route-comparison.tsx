"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plane, Ship, Train, Truck, Leaf, Clock, DollarSign,
  ChevronDown, ChevronUp, Award, ArrowRight,
  AlertTriangle, RefreshCcw
} from "lucide-react"
import { useRouteStore } from "@/lib/store/route-store"
import { RiskScore } from "@/components/shared/risk-score"
import { LoadingCrystallize } from "@/components/shared/loading-crystallize"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"
import type { RouteOption } from "@/lib/types/route"

const MODE_ICONS = {
  air: Plane,
  sea: Ship,
  rail: Train,
  road: Truck,
}

const MODE_COLORS: Record<string, string> = {
  air: "#3B82F6",
  sea: "#06B6D4",
  rail: "#7C3AED",
  road: "#F59E0B",
}

function TempConfidenceBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "#2ED573" : pct >= 70 ? "#FFA502" : "#FF4757"
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--ao-surface-elevated)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] w-9 text-right" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{pct}%</span>
    </div>
  )
}

interface ComputedRoute extends RouteOption {
  computedCost: number
  computedEtaHours: number
  affected: boolean
}

interface RouteCardProps {
  route: ComputedRoute
  selected: boolean
  onSelect: () => void
}

function RouteCard({ route, selected, onSelect }: RouteCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isRecommended = route.isRecommended
  const etaDays = Math.floor(route.computedEtaHours / 24)
  const etaHours = route.computedEtaHours % 24

  return (
    <motion.div
      variants={staggerChild}
      layout
      className={cn("rounded-xl border transition-all", selected ? "ring-1 ring-[var(--ao-accent)]" : "")}
      style={{
        backgroundColor: selected ? "rgba(0,212,170,0.06)" : "var(--ao-surface)",
        borderColor: selected ? "var(--ao-accent)" : route.affected ? "#FFA502" : "var(--ao-border)",
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
              {route.name}
            </span>
            {isRecommended && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "rgba(0,212,170,0.12)", color: "var(--ao-accent)", border: "1px solid rgba(0,212,170,0.3)", fontFamily: "var(--ao-font-body)" }}>
                <Award className="w-3 h-3" /> Recommended
              </span>
            )}
            {route.affected && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "rgba(255,165,2,0.12)", color: "#FFA502", border: "1px solid rgba(255,165,2,0.3)", fontFamily: "var(--ao-font-body)" }}>
                <AlertTriangle className="w-3 h-3" /> Impacted
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {route.legs.map((leg, i) => {
              const Icon = MODE_ICONS[leg.mode as keyof typeof MODE_ICONS] ?? Truck
              return (
                <div key={i} className="flex items-center gap-1">
                  <Icon className="w-3.5 h-3.5" style={{ color: MODE_COLORS[leg.mode] ?? "#64748B" }} />
                  {i < route.legs.length - 1 && <ArrowRight className="w-2.5 h-2.5" style={{ color: "var(--ao-text-muted)" }} />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>ETA</p>
            <p className="text-[15px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
              {etaDays}d {etaHours}h
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Estimated Cost</p>
            <p className="text-[15px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
              {formatCurrency(route.computedCost)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Risk Score</p>
            <RiskScore score={route.riskScore} size="sm" showLabel={false} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              <Leaf className="w-3 h-3 inline mr-0.5" style={{ color: "#2ED573" }} />CO₂
            </p>
            <p className="text-[13px] font-semibold" style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}>
              {route.co2EstimateKg.toLocaleString()} kg
            </p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Temp Maintenance Confidence
          </p>
          <TempConfidenceBar pct={route.tempMaintenanceConfidence} />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={selected
              ? { backgroundColor: "var(--ao-accent)", color: "#0A1628" }
              : { backgroundColor: "rgba(0,212,170,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,212,170,0.25)" }}
          >
            {selected ? "Selected ✓" : "Select Route"}
          </button>
          <button onClick={() => setExpanded((v) => !v)}
            className="p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            style={{ color: "var(--ao-text-muted)" }}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1, transition: { duration: 0.2 } }}
            exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
            className="overflow-hidden border-t"
            style={{ borderColor: "var(--ao-border)" }}
          >
            <div className="p-4 flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                Leg Breakdown
              </p>
              {route.legs.map((leg, i) => {
                const Icon = MODE_ICONS[leg.mode as keyof typeof MODE_ICONS] ?? Truck
                const color = MODE_COLORS[leg.mode] ?? "#64748B"
                return (
                  <div key={i} className="flex items-center gap-3 text-[12px]">
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      {leg.origin} → {leg.destination}
                    </span>
                    <span className="ml-auto" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                      {leg.etaHours}h · {leg.distanceKm.toLocaleString()} km
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

const SCENARIOS = [
  { id: "port_strike", label: "Port Strike", costMult: 1.15, etaMult: 1.4, description: "Sea routes delayed 40%", affectsMode: "sea" as const },
  { id: "severe_weather", label: "Severe Weather", costMult: 1.1, etaMult: 1.2, description: "Air and road +20% ETA", affectsMode: "air" as const },
  { id: "carrier_unavailable", label: "Carrier Unavailable", costMult: 1.25, etaMult: 1.15, description: "Best carrier replaced", affectsMode: null },
  { id: "customs_delay", label: "Customs Delay", costMult: 1.05, etaMult: 1.5, description: "All routes +50% ETA at borders", affectsMode: null },
]

interface RouteComparisonProps {
  routes: RouteOption[]
  isGenerating: boolean
}

export function RouteComparison({ routes, isGenerating }: RouteComparisonProps) {
  const { selectedRouteId, selectRoute } = useRouteStore()
  const [activeScenarios, setActiveScenarios] = useState<Set<string>>(new Set())
  const [scenarioOpen, setScenarioOpen] = useState(true)

  const toggleScenario = (id: string) =>
    setActiveScenarios((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const applyScenarios = (route: RouteOption): ComputedRoute => {
    let cost = route.totalCostUsd
    let etaHours = route.totalEtaHours
    let affected = false

    for (const sid of activeScenarios) {
      const s = SCENARIOS.find((sc) => sc.id === sid)
      if (!s) continue
      const legAffected = !s.affectsMode || route.legs.some((l) => l.mode === s.affectsMode)
      if (legAffected) {
        cost = Math.round(cost * s.costMult)
        etaHours = Math.round(etaHours * s.etaMult)
        affected = true
      }
    }

    return { ...route, computedCost: cost, computedEtaHours: etaHours, affected }
  }

  const computedRoutes = routes.map(applyScenarios)

  const impactLines: string[] = []
  if (activeScenarios.has("port_strike")) impactLines.push("Port strike adds ~40% to sea route ETAs")
  if (activeScenarios.has("severe_weather")) impactLines.push("Weather adds ~20% transit time on air/road")
  if (activeScenarios.has("carrier_unavailable")) impactLines.push("Primary carrier replaced — costs up ~25%")
  if (activeScenarios.has("customs_delay")) impactLines.push("Customs slowdown adds ~50% ETA on all routes")

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <LoadingCrystallize size="lg" />
        <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Calculating optimal routes…
        </p>
      </div>
    )
  }

  if (routes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <ArrowRight className="w-10 h-10" style={{ color: "var(--ao-text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Enter route criteria and click "Generate Routes"
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <motion.div variants={staggerContainer} initial="initial" animate="animate" className="flex flex-col gap-3">
        {computedRoutes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            selected={selectedRouteId === route.id}
            onSelect={() => selectRoute(route.id)}
          />
        ))}
      </motion.div>

      {/* Scenario simulator */}
      <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <button
          onClick={() => setScenarioOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgba(255,255,255,0.03)] transition-colors"
        >
          <span className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
            Scenario Simulator
          </span>
          {scenarioOpen ? <ChevronUp className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />}
        </button>

        <AnimatePresence>
          {scenarioOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1, transition: { duration: 0.2 } }}
              exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
              className="overflow-hidden border-t"
              style={{ borderColor: "var(--ao-border)" }}
            >
              <div className="p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  {SCENARIOS.map(({ id, label, description }) => {
                    const active = activeScenarios.has(id)
                    return (
                      <label
                        key={id}
                        className={cn("flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all", active ? "ring-1 ring-[#FFA502]" : "")}
                        style={{
                          backgroundColor: active ? "rgba(255,165,2,0.06)" : "var(--ao-surface-elevated)",
                          border: `1px solid ${active ? "#FFA502" : "var(--ao-border)"}`,
                        }}
                      >
                        <div className="relative mt-0.5">
                          <input type="checkbox" className="sr-only" checked={active} onChange={() => toggleScenario(id)} />
                          <div className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors"
                            style={{
                              borderColor: active ? "#FFA502" : "var(--ao-border)",
                              backgroundColor: active ? "#FFA502" : "transparent",
                            }}>
                            {active && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"><path d="M1 4l2.5 3L9 1" stroke="#0A1628" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                          </div>
                        </div>
                        <div>
                          <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                          <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>

                {impactLines.length > 0 && (
                  <div className="rounded-lg p-3" style={{ backgroundColor: "rgba(255,165,2,0.08)", border: "1px solid rgba(255,165,2,0.25)" }}>
                    <p className="text-[11px] font-semibold mb-1.5" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>Impact Summary</p>
                    {impactLines.map((line, i) => (
                      <p key={i} className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>• {line}</p>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
