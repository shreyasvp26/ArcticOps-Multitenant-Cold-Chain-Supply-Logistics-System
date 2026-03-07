"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { getRiskColor } from "@/lib/utils/risk"
import { formatTemp, formatEta } from "@/lib/utils/format"
import { Layers, RefreshCcw } from "lucide-react"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const STATUS_COLORS: Record<string, string> = {
  in_transit: "#00D4AA",
  at_customs: "#FFA502",
  preparing: "#3B82F6",
  requested: "#64748B",
  delivered: "#2ED573",
  cancelled: "#FF4757",
}

interface ShipmentPopup {
  shipmentId: string
  coordinates: [number, number]
  x: number
  y: number
}

export function GlobeMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const [weatherVisible, setWeatherVisible] = useState(false)
  const [popup, setPopup] = useState<ShipmentPopup | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const shipments = useShipmentStore((s) => s.shipments)
  const getLatestTemp = useTemperatureStore((s) => s.getLatest)

  const activeShipments = shipments.filter(
    (s) => s.status !== "cancelled"
  )

  const popupShipment = popup ? shipments.find((s) => s.id === popup.shipmentId) : null
  const popupTemp = popup ? getLatestTemp(popup.shipmentId) : null

  // Fallback map (no token) — show a styled placeholder with overlaid SVG pins
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: "#0D1B2E" }}>
        {/* Simple world map background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20"
          style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-text-muted)", fontSize: "11px", letterSpacing: "0.1em" }}>
          MAPBOX TOKEN REQUIRED — add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local
        </div>

        {/* Render shipments as relative-positioned dots on a 2D world representation */}
        <svg
          viewBox="0 0 800 400"
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.7 }}
          aria-label="Simplified world map with shipment positions"
        >
          {/* Simple world outline approximation */}
          <rect x="0" y="0" width="800" height="400" fill="#0A1628" />
          {/* Grid lines */}
          {[100, 200, 300, 400, 500, 600, 700].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="400" stroke="#1A293F" strokeWidth="0.5" />
          ))}
          {[80, 160, 240, 320].map((y) => (
            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#1A293F" strokeWidth="0.5" />
          ))}
          {/* Equator */}
          <line x1="0" y1="200" x2="800" y2="200" stroke="#243352" strokeWidth="1" />

          {/* Route lines */}
          {activeShipments.filter(s => s.status === "in_transit").map((sh) => {
            const ox = ((sh.originCoordinates[0] + 180) / 360) * 800
            const oy = ((90 - sh.originCoordinates[1]) / 180) * 400
            const dx = ((sh.destinationCoordinates[0] + 180) / 360) * 800
            const dy = ((90 - sh.destinationCoordinates[1]) / 180) * 400
            const cx1 = (sh.currentCoordinates[0] + 180) / 360 * 800
            const cy1 = ((90 - sh.currentCoordinates[1]) / 180) * 400
            return (
              <g key={sh.id}>
                <line x1={ox} y1={oy} x2={cx1} y2={cy1}
                  stroke={STATUS_COLORS[sh.status] ?? "#64748B"} strokeWidth="1.5" strokeOpacity="0.6" />
                <line x1={cx1} y1={cy1} x2={dx} y2={dy}
                  stroke="#243352" strokeWidth="1" strokeDasharray="4,3" />
              </g>
            )
          })}

          {/* Shipment markers */}
          {activeShipments.map((sh) => {
            const x = ((sh.currentCoordinates[0] + 180) / 360) * 800
            const y = ((90 - sh.currentCoordinates[1]) / 180) * 400
            const color = STATUS_COLORS[sh.status] ?? "#64748B"
            return (
              <g key={sh.id}>
                <circle cx={x} cy={y} r="8" fill={color} fillOpacity="0.15" />
                <circle cx={x} cy={y} r="4" fill={color} />
                <text x={x + 8} y={y + 4} fontSize="9" fill={color}
                  style={{ fontFamily: "var(--ao-font-mono)" }}>
                  {sh.id}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 text-[10px]"
          style={{ fontFamily: "var(--ao-font-body)" }}>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span style={{ color: "var(--ao-text-muted)" }}>{SHIPMENT_STATUSES[status as keyof typeof SHIPMENT_STATUSES]?.label ?? status}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Full Mapbox implementation when token is available
  return (
    <div className="relative w-full h-full">
      <MapboxMap />
    </div>
  )
}

// Separate component that handles Mapbox initialization
function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("mapbox-gl").Map | null>(null)
  const [loaded, setLoaded] = useState(false)
  const shipments = useShipmentStore((s) => s.shipments)
  const getLatestTemp = useTemperatureStore((s) => s.getLatest)
  const [popup, setPopup] = useState<{ id: string } | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return
    let map: import("mapbox-gl").Map | null = null

    const init = async () => {
      const mapboxgl = (await import("mapbox-gl")).default
      ;(mapboxgl as unknown as { accessToken: string }).accessToken = MAPBOX_TOKEN

      map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [20, 30],
        zoom: 2,
      })
      mapRef.current = map

      map.on("load", () => {
        setLoaded(true)

        shipments
          .filter((s) => s.status !== "cancelled")
          .forEach((sh) => {
            const el = document.createElement("div")
            el.className = "shipment-marker"
            el.style.cssText = `
              width: 12px; height: 12px; border-radius: 50%;
              background: ${STATUS_COLORS[sh.status] ?? "#64748B"};
              border: 2px solid rgba(255,255,255,0.3);
              cursor: pointer;
              box-shadow: 0 0 8px ${STATUS_COLORS[sh.status] ?? "#64748B"}80;
            `
            if (sh.status === "in_transit") {
              el.style.animation = "checkpoint-pulse 2s ease-in-out infinite"
            }

            new mapboxgl.Marker(el)
              .setLngLat(sh.currentCoordinates as [number, number])
              .addTo(map!)
            el.addEventListener("click", () => setPopup({ id: sh.id }))
          })

        // Route lines for in_transit shipments
        shipments
          .filter((s) => s.status === "in_transit")
          .forEach((sh) => {
            const sourceId = `route-${sh.id}`
            const completedCoords = sh.checkpoints
              .filter((cp) => cp.status === "passed" || cp.status === "current")
              .map((cp) => cp.coordinates)
            const upcomingCoords = sh.checkpoints
              .filter((cp) => cp.status === "upcoming")
              .map((cp) => cp.coordinates)

            if (completedCoords.length >= 2) {
              map!.addSource(`${sourceId}-done`, {
                type: "geojson",
                data: { type: "Feature", geometry: { type: "LineString", coordinates: completedCoords }, properties: {} },
              })
              map!.addLayer({
                id: `${sourceId}-done-layer`,
                type: "line",
                source: `${sourceId}-done`,
                paint: { "line-color": STATUS_COLORS[sh.status] ?? "#00D4AA", "line-width": 2, "line-opacity": 0.7 },
              })
            }

            if (upcomingCoords.length >= 2) {
              map!.addSource(`${sourceId}-upcoming`, {
                type: "geojson",
                data: { type: "Feature", geometry: { type: "LineString", coordinates: upcomingCoords }, properties: {} },
              })
              map!.addLayer({
                id: `${sourceId}-upcoming-layer`,
                type: "line",
                source: `${sourceId}-upcoming`,
                paint: { "line-color": "#243352", "line-width": 1.5, "line-dasharray": [3, 2] },
              })
            }
          })
      })
    }

    init().catch(console.error)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [])

  const popupShipment = popup ? shipments.find((s) => s.id === popup.id) : null
  const popupTemp = popup ? getLatestTemp(popup.id) : null

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full" aria-label="World map showing active shipments" />
      {popupShipment && (
        <div
          className="absolute top-4 right-4 rounded-xl p-4 min-w-[220px] shadow-xl z-10"
          style={{
            background: "rgba(17,29,51,0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--ao-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-accent)" }}>
              {popupShipment.id}
            </span>
            <button onClick={() => setPopup(null)} className="text-[var(--ao-text-muted)] hover:text-white text-xs">✕</button>
          </div>
          <p className="text-[12px] mb-1" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{popupShipment.clientName}</p>
          <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {popupShipment.origin.split(",")[0]} → {popupShipment.destination.split(",")[0]}
          </p>
          {popupTemp && (
            <p className="text-[12px] mt-2" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
              {formatTemp(popupTemp.temperature)}
            </p>
          )}
          <p className="text-[11px] mt-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            ETA: {formatEta(popupShipment.eta)}
          </p>
        </div>
      )}
    </>
  )
}
