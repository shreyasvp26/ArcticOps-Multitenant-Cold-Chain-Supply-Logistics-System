"use client"
import { use, useMemo } from "react"
import { notFound, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { 
  ArrowLeft, AlertTriangle, Thermometer, 
  Clock, DollarSign, Activity, ShieldCheck, 
  MapPin, Box, ChevronRight
} from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { RiskScore } from "@/components/shared/risk-score"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { Stepper } from "@/components/shared/stepper"
import { formatTemp, formatDatetime, formatEta, formatCurrency } from "@/lib/utils/format"
import { calculateRiskScore } from "@/lib/utils/risk"
import { MOCK_COST_REPORTS } from "@/lib/mock-data/analytics"
import { ResponsiveContainer, AreaChart, Area, ReferenceLine, YAxis, XAxis } from "recharts"

export default function TrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const shipments = useShipmentStore((s) => s.shipments)
  const getHistory = useTemperatureStore((s) => s.getHistory)
  const notifications = useNotificationStore((s) => s.notifications)

  const { shipment, tempHistory, costData, activeAlerts, risk, healthScore } = useMemo(() => {
    const sh = shipments.find((s) => s.id === id)
    if (!sh) return { shipment: null }

    const history = getHistory(id, 72)
    const cost = MOCK_COST_REPORTS.find(c => c.shipmentId === id)
    const alerts = notifications.filter((n) => n.relatedEntityId === id && !n.read)
    
    const r = calculateRiskScore({
      tempExcursions: history.filter(read => read.isExcursion).length,
      delayedLegs: sh.status === "at_customs" ? 1 : 0,
      criticalAlerts: alerts.filter(a => a.severity === "critical").length,
      overdueDocuments: 0,
      carrierReliability: 98
    })

    return {
      shipment: sh,
      tempHistory: history,
      costData: cost,
      activeAlerts: alerts,
      risk: r,
      healthScore: Math.max(0, 100 - r * 0.8)
    }
  }, [id, shipments, notifications, getHistory])

  if (!shipment) return notFound()

  const checkpointSteps = shipment.checkpoints.map((cp) => ({
    id: cp.id,
    label: cp.name,
    description: cp.actualArrival ? formatDatetime(cp.actualArrival) : `ETA ${formatDatetime(cp.estimatedArrival)}`,
  }))
  const currentCheckpointIdx = Math.max(0, shipment.checkpoints.findIndex((cp) => cp.status === "current"))
  const chartData = tempHistory.slice(-48).map((r, i) => ({ i, temp: r.temperature }))

  return (
    <div className="flex flex-col h-full bg-[#070F1D] overflow-hidden">
      {/* Dynamic Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between bg-[rgba(10,22,40,0.8)] backdrop-blur-md"
        style={{ borderColor: "var(--ao-border)" }}>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/tracker")} className="p-2 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--ao-text-muted)]" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-lg font-bold font-mono text-[var(--ao-accent)]">{shipment.id}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(0,212,170,0.1)] text-[var(--ao-accent)] font-bold uppercase tracking-wider">Live</span>
            </div>
            <p className="text-[11px] text-[var(--ao-text-muted)]">{shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase font-bold text-[var(--ao-text-muted)] tracking-widest">Supply Health</span>
            <span className="text-lg font-bold text-[#2ED573] font-mono">{healthScore.toFixed(0)}%</span>
          </div>
          <RiskScore score={risk} size="md" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Main Telemetry Panel */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            
            {/* Visual Route & Status */}
            <div className="rounded-2xl border bg-[rgba(10,22,40,0.4)] overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--ao-border)" }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ao-text-secondary)]">
                  <MapPin className="w-3.5 h-3.5" /> Route Integrity
                </div>
                <div className="text-xs font-mono text-[var(--ao-text-muted)]">
                  Current Position: {shipment.currentCoordinates[0].toFixed(2)}, {shipment.currentCoordinates[1].toFixed(2)}
                </div>
              </div>
              <div className="p-6">
                <Stepper steps={checkpointSteps} currentStep={currentCheckpointIdx} />
              </div>
            </div>

            {/* Thermal Telemetry */}
            <div className="rounded-2xl border bg-[rgba(10,22,40,0.4)] flex flex-col" style={{ borderColor: "var(--ao-border)" }}>
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--ao-border)" }}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ao-text-secondary)]">
                  <Thermometer className="w-3.5 h-3.5" /> Thermal Telemetry (72h)
                </div>
                {tempHistory.at(-1) && (
                  <TemperatureBadge temperature={tempHistory.at(-1)!.temperature} zone={shipment.temperatureZone}
                    requiredMin={shipment.requiredTempMin} requiredMax={shipment.requiredTempMax} size="sm" />
                )}
              </div>
              <div className="p-6 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ao-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--ao-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <ReferenceLine y={shipment.requiredTempMax} stroke="#FF4757" strokeDasharray="3 3" label={{ value: 'MAX', position: 'right', fill: '#FF4757', fontSize: 10 }} />
                    <ReferenceLine y={shipment.requiredTempMin} stroke="#3B82F6" strokeDasharray="3 3" label={{ value: 'MIN', position: 'right', fill: '#3B82F6', fontSize: 10 }} />
                    <Area type="monotone" dataKey="temp" stroke="var(--ao-accent)" strokeWidth={2} fill="url(#detailGrad)" dot={false} animationDuration={1000} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Side Intelligence Panel */}
          <div className="flex flex-col gap-6">
            
            {/* Delivery Intelligence */}
            <div className="rounded-2xl border bg-[rgba(10,22,40,0.4)] p-5" style={{ borderColor: "var(--ao-border)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ao-text-muted)] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--ao-accent)]" /> Delivery Intelligence
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-xs text-[var(--ao-text-secondary)]">Estimated Arrival</span>
                  <span className="text-xs font-bold text-[var(--ao-text-primary)] font-mono">{formatEta(shipment.eta)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.05)]">
                  <span className="text-xs text-[var(--ao-text-secondary)]">Projected Cost</span>
                  <span className="text-xs font-bold text-[var(--ao-text-primary)] font-mono">{costData ? formatCurrency(costData.estimatedCostUsd) : "—"}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-[var(--ao-text-secondary)]">Transport Mode</span>
                  <span className="text-[10px] font-bold uppercase text-[var(--ao-text-muted)] px-2 py-0.5 rounded bg-[rgba(255,255,255,0.05)]">{shipment.transportMode}</span>
                </div>
              </div>
            </div>

            {/* Recent Updates */}
            <div className="rounded-2xl border bg-[rgba(10,22,40,0.4)] p-5 flex-1" style={{ borderColor: "var(--ao-border)" }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ao-text-muted)] mb-4">Specific Updates</h3>
              <div className="flex flex-col gap-4">
                {activeAlerts.length > 0 ? (
                  activeAlerts.map(alert => (
                    <div key={alert.id} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: alert.severity === "critical" ? "#FF4757" : "#FFA502" }} />
                      <div>
                        <p className="text-[12px] font-bold text-[var(--ao-text-primary)] mb-0.5">{alert.title}</p>
                        <p className="text-[11px] text-[var(--ao-text-muted)] leading-relaxed">{alert.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 opacity-30">
                    <Activity className="w-8 h-8 mb-2" />
                    <p className="text-[10px] text-center">Continuous monitoring active.<br/>No deviations reported.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Material Cargo */}
            <div className="rounded-2xl border bg-[rgba(59,130,246,0.05)] border-[rgba(59,130,246,0.2)] p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B82F6] mb-4 flex items-center gap-2">
                <Box className="w-3.5 h-3.5" /> Material Inventory
              </h3>
              {shipment.materials.map(m => (
                <div key={m.id} className="flex items-center justify-between mb-2 last:mb-0">
                  <span className="text-xs text-[var(--ao-text-primary)] font-medium">{m.name}</span>
                  <span className="text-xs font-bold text-[#3B82F6] font-mono">{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
