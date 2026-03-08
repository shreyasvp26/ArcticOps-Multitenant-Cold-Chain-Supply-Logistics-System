"use client"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

// Simplified SVG route map for driver navigation
export default function NavigatePage() {
  const assignment = MOCK_SHIPMENTS.find((s) => s.status === "in_transit") ?? MOCK_SHIPMENTS[0]!
  const checkpoints = assignment.checkpoints

  const ox = ((assignment.originCoordinates[0] + 180) / 360) * 100
  const oy = ((90 - assignment.originCoordinates[1]) / 180) * 60
  const dx = ((assignment.destinationCoordinates[0] + 180) / 360) * 100
  const dy = ((90 - assignment.destinationCoordinates[1]) / 180) * 60
  const cx = ((assignment.currentCoordinates[0] + 180) / 360) * 100
  const cy = ((90 - assignment.currentCoordinates[1]) / 180) * 60

  const nextCheckpoint = checkpoints.find((cp) => cp.status === "upcoming")

  return (
    <div className="flex flex-col h-full">
      {/* Map */}
      <div className="flex-1 relative" style={{ backgroundColor: "#060D1B" }}>
        <svg viewBox={`0 0 100 60`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="100" height="60" fill="#060D1B" />
          {/* Grid */}
          {[20, 40, 60, 80].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="#1A293F" strokeWidth="0.3" />)}
          {[15, 30, 45].map((y) => <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#1A293F" strokeWidth="0.3" />)}
          {/* Completed route */}
          <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#00C8A8" strokeWidth="0.8" />
          {/* Remaining route */}
          <line x1={cx} y1={cy} x2={dx} y2={dy} stroke="#1E3050" strokeWidth="0.6" strokeDasharray="2,1.5" />
          {/* Origin/destination */}
          <circle cx={ox} cy={oy} r="1.5" fill="#64748B" />
          <circle cx={dx} cy={dy} r="1.5" fill="#2ED573" />
          {/* Checkpoints */}
          {checkpoints.map((cp) => {
            const cpx = ((cp.coordinates[0] + 180) / 360) * 100
            const cpy = ((90 - cp.coordinates[1]) / 180) * 60
            return <circle key={cp.id} cx={cpx} cy={cpy} r="1.2" fill={cp.status === "passed" ? "#2ED573" : cp.status === "current" ? "#00C8A8" : "#374151"} />
          })}
          {/* Current position with pulse */}
          <circle cx={cx} cy={cy} r="3" fill="#00C8A8" fillOpacity="0.1">
            <animate attributeName="r" from="2" to="5" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={cx} cy={cy} r="2" fill="#00C8A8" />
        </svg>

        {/* Next checkpoint overlay */}
        {nextCheckpoint && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl p-3"
            style={{ backgroundColor: "rgba(13,22,41,0.95)", backdropFilter: "blur(12px)", border: "1px solid var(--ao-border)" }}>
            <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Next Checkpoint</p>
            <p className="font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{nextCheckpoint.name}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
              ETA: {new Date(nextCheckpoint.estimatedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </div>

      {/* Checkpoint list */}
      <div className="border-t p-3 max-h-48 overflow-y-auto" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(13,24,41,0.9)" }}>
        {checkpoints.map((cp) => (
          <div key={cp.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--ao-border)" }}>
            <div className={`w-2 h-2 rounded-full shrink-0`}
              style={{ backgroundColor: cp.status === "passed" ? "#2ED573" : cp.status === "current" ? "#00C8A8" : "#374151" }} />
            <span className="flex-1 text-[12px]" style={{ color: cp.status === "upcoming" ? "var(--ao-text-muted)" : "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
              {cp.name}
            </span>
            <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
              {cp.actualArrival ? new Date(cp.actualArrival).toLocaleDateString() : new Date(cp.estimatedArrival).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
