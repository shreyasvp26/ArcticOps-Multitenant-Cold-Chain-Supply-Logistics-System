"use client"
import { use } from "react"
import { notFound, useRouter } from "next/navigation"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { Sparkline } from "@/components/shared/sparkline"
import { Stepper } from "@/components/shared/stepper"
import { formatTemp, formatDatetime, formatEta } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import { ResponsiveContainer, AreaChart, Area, ReferenceLine } from "recharts"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

export default function TrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const shipment = useShipmentStore((s) => s.shipments.find((sh) => sh.id === id))
  const tempHistory = useTemperatureStore((s) => s.getHistory(id, 72))
  const activeAlerts = useNotificationStore((s) =>
    s.notifications.filter((n) => n.relatedEntityId === id && !n.read)
  )
  const latestTemp = tempHistory.at(-1)

  if (!shipment) return notFound()

  const checkpointSteps = shipment.checkpoints.map((cp) => ({
    id: cp.id,
    label: cp.name,
    description: cp.actualArrival ? formatDatetime(cp.actualArrival) : `ETA ${formatDatetime(cp.estimatedArrival)}`,
  }))
  const currentCheckpointIdx = Math.max(0, shipment.checkpoints.findIndex((cp) => cp.status === "current"))

  const chartData = tempHistory.slice(-96).map((r, i) => ({ i, temp: r.temperature }))

  // Simplified map SVG (same approach as globe-map fallback — no Mapbox token needed)
  const ox = ((shipment.originCoordinates[0] + 180) / 360) * 800
  const oy = ((90 - shipment.originCoordinates[1]) / 180) * 400
  const dx = ((shipment.destinationCoordinates[0] + 180) / 360) * 800
  const dy = ((90 - shipment.destinationCoordinates[1]) / 180) * 400
  const cx = ((shipment.currentCoordinates[0] + 180) / 360) * 800
  const cy = ((90 - shipment.currentCoordinates[1]) / 180) * 400

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.6)" }}>
        <button onClick={() => router.push("/home")} className="p-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.05)]">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--ao-text-muted)" }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{shipment.id}</p>
          <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {shipment.origin.split(",")[0]} → {shipment.destination.split(",")[0]} · ETA {formatEta(shipment.eta)}
          </p>
        </div>
        {latestTemp && (
          <TemperatureBadge temperature={latestTemp.temperature} zone={shipment.temperatureZone}
            requiredMin={shipment.requiredTempMin} requiredMax={shipment.requiredTempMax} size="sm" />
        )}
      </div>

      {/* Map area — 55% viewport height */}
      <div className="relative shrink-0" style={{ height: "55vh", backgroundColor: "#0A1628" }}>
        <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full" aria-label="Route map">
          <rect width="800" height="400" fill="#0A1628" />
          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#1A293F" strokeWidth="0.5" />
          ))}
          {[80, 160, 240, 320].map((y) => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1A293F" strokeWidth="0.5" />
          ))}
          {/* Route: completed (green) + remaining (gray) */}
          <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#00D4AA" strokeWidth="2" strokeOpacity="0.8" />
          <line x1={cx} y1={cy} x2={dx} y2={dy} stroke="#243352" strokeWidth="1.5" strokeDasharray="5,3" />
          {/* Origin */}
          <circle cx={ox} cy={oy} r="5" fill="#64748B" />
          <text x={ox + 7} y={oy + 4} fontSize="9" fill="#64748B" fontFamily="monospace">{shipment.origin.split(",")[0]}</text>
          {/* Destination */}
          <circle cx={dx} cy={dy} r="5" fill="#2ED573" />
          <text x={dx + 7} y={dy + 4} fontSize="9" fill="#2ED573" fontFamily="monospace">{shipment.destination.split(",")[0]}</text>
          {/* Current position — animated pulse */}
          <circle cx={cx} cy={cy} r="10" fill="#00D4AA" fillOpacity="0.15">
            <animate attributeName="r" from="6" to="14" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r="5" fill="#00D4AA" />
          {/* Checkpoints */}
          {shipment.checkpoints.map((cp) => {
            const cpx = ((cp.coordinates[0] + 180) / 360) * 800
            const cpy = ((90 - cp.coordinates[1]) / 180) * 400
            return (
              <circle key={cp.id} cx={cpx} cy={cpy} r="3"
                fill={cp.status === "passed" ? "#2ED573" : cp.status === "current" ? "#00D4AA" : "#374151"} />
            )
          })}
        </svg>
      </div>

      {/* Checkpoint flow */}
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.8)" }}>
        <Stepper steps={checkpointSteps} currentStep={currentCheckpointIdx} />
      </div>

      {/* Temperature strip */}
      {chartData.length > 2 && (
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
          <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Temperature Journey
          </p>
          <ResponsiveContainer width="100%" height={70}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="trackerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4AA" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <ReferenceLine y={shipment.requiredTempMax} stroke="#FFA502" strokeDasharray="4 3" />
              <ReferenceLine y={shipment.requiredTempMin} stroke="#3B82F6" strokeDasharray="4 3" />
              <Area type="monotone" dataKey="temp" stroke="#00D4AA" strokeWidth={1.5} fill="url(#trackerGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="px-5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#FF4757", fontFamily: "var(--ao-font-body)" }}>
            Active Alerts
          </p>
          {activeAlerts.map((n) => (
            <div key={n.id} className="flex items-start gap-2 mb-2 p-3 rounded-lg"
              style={{ backgroundColor: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)" }}>
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#FF4757" }} />
              <div>
                <p className="text-[12px] font-medium" style={{ color: "#FF4757", fontFamily: "var(--ao-font-body)" }}>{n.title}</p>
                <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
