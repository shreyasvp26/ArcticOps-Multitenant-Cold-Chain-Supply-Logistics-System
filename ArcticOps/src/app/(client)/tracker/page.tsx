"use client"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMemo } from "react"
import { 
  Thermometer, Activity, Clock, 
  ArrowUpRight, TrendingDown, TrendingUp, Package
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { MOCK_CLIENT_HEALTH } from "@/lib/mock-data/analytics"
import { RiskScore } from "@/components/shared/risk-score"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { formatEta } from "@/lib/utils/format"
import { calculateRiskScore } from "@/lib/utils/risk"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"

export default function SupplyTelemetryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  
  // Use stable selectors to avoid infinite loops
  const shipments = useShipmentStore((s) => s.shipments)
  const getLatest = useTemperatureStore((s) => s.getLatest)

  const { activeShipments, healthData } = useMemo(() => {
    const tenantShipments = shipments.filter(sh => sh.tenantId === user?.tenantId)
    const active = tenantShipments.filter(s => s.status !== "delivered" && s.status !== "cancelled")
    const health = MOCK_CLIENT_HEALTH.find(h => h.tenantId === user?.tenantId)
    return { activeShipments: active, healthData: health }
  }, [shipments, user?.tenantId])

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Supply Telemetry</h1>
          <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Real-time health monitoring and risk assessment</p>
        </div>
        
        {healthData && (
          <div className="flex items-center gap-4 bg-[rgba(10,22,40,0.4)] border border-[var(--ao-border)] p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--ao-text-muted)" }}>Network Health</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold" style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}>{healthData.score}%</span>
                {healthData.orderFrequencyTrend === "up" ? <TrendingUp className="w-3 h-3 text-[#2ED573]" /> : <TrendingDown className="w-3 h-3 text-[#FF4757]" />}
              </div>
            </div>
          </div>
        )}
      </div>

      {activeShipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-dashed rounded-2xl" style={{ borderColor: "var(--ao-border)" }}>
          <Package className="w-10 h-10 mb-3 opacity-20" style={{ color: "var(--ao-text-muted)" }} />
          <p style={{ color: "var(--ao-text-muted)" }}>No active supply lines</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" 
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeShipments.map((sh) => {
            const latest = getLatest(sh.id)
            const risk = calculateRiskScore({
              tempExcursions: latest?.isExcursion ? 1 : 0,
              delayedLegs: sh.status === "at_customs" ? 1 : 0,
              criticalAlerts: 0,
              overdueDocuments: 0,
              carrierReliability: 95
            })

            return (
              <motion.div key={sh.id} variants={staggerChild}
                onClick={() => router.push(`/tracker/${sh.id}`)}
                className="group relative rounded-2xl border p-5 cursor-pointer transition-all hover:border-[var(--ao-accent)] overflow-hidden"
                style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[12px] font-bold block mb-1" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
                    <p className="text-sm font-bold truncate pr-4" style={{ color: "var(--ao-text-primary)" }}>{sh.materials[0]?.name ?? "Consignment"}</p>
                  </div>
                  <RiskScore score={risk} size="sm" showLabel={false} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-[var(--ao-text-muted)] font-bold">Thermal</span>
                    {latest ? (
                      <TemperatureBadge temperature={latest.temperature} zone={sh.temperatureZone}
                        requiredMin={sh.requiredTempMin} requiredMax={sh.requiredTempMax} size="sm" />
                    ) : (
                      <span className="text-xs text-[var(--ao-text-muted)]">No data</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase text-[var(--ao-text-muted)] font-bold">ETA</span>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[var(--ao-accent)]" />
                      <span className="text-xs font-medium" style={{ color: "var(--ao-text-primary)" }}>{formatEta(sh.eta)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between" style={{ borderColor: "var(--ao-border)" }}>
                  <span className="text-[11px] font-medium" style={{ color: "#2ED573" }}>Supply Integrity: Optimal</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:text-[var(--ao-accent)] transition-colors" />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
