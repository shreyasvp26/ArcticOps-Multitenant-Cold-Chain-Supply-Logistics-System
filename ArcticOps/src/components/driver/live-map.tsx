"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { AlertTriangle, Navigation, ChevronUp, ChevronDown, Thermometer, Package, Shield } from "lucide-react"
import type * as LeafletType from "leaflet"
import type { Shipment, Checkpoint } from "@/lib/types/shipment"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"

// ─── constants ────────────────────────────────────────────────────────────────

const TILE_URL   = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
const TILE_ATTR  = "© OpenStreetMap contributors © CARTO"
const SHEET_COLLAPSED_PX = 96   // height of bottom sheet when closed
const SPEED_KMH  = 320          // simulated speed (air-freight scale)

// ─── helpers ─────────────────────────────────────────────────────────────────

function toRad(d: number) { return (d * Math.PI) / 180 }
function toDeg(r: number) { return (r * 180) / Math.PI }

function distKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function bearingBetween(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[1]), lat2 = toRad(b[1])
  const dLng = toRad(b[0] - a[0])
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

// Great-circle interpolation → [lat, lng] for Leaflet
function gcInterp(a: [number, number], b: [number, number], t: number): [number, number] {
  const [lng1, lat1] = [toRad(a[0]), toRad(a[1])]
  const [lng2, lat2] = [toRad(b[0]), toRad(b[1])]
  const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
  const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
  const d = Math.acos(Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2)))
  if (d < 1e-9) return [toDeg(lat1), toDeg(lng1)]
  const f = Math.sin((1 - t) * d) / Math.sin(d), g = Math.sin(t * d) / Math.sin(d)
  const x = f * x1 + g * x2, y = f * y1 + g * y2, z = f * z1 + g * z2
  return [toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]
}

// Build ordered waypoints [lng, lat] for full route
function buildWaypoints(sh: Shipment): [number, number][] {
  return [
    sh.originCoordinates,
    ...sh.checkpoints.map((cp) => cp.coordinates as [number, number]),
    sh.destinationCoordinates,
  ]
}

// Sample N points along the full multi-leg route (returns [lat, lng] for Leaflet)
function sampleRoute(waypoints: [number, number][], steps = 120): [number, number][] {
  const pts: [number, number][] = []
  const legCount = waypoints.length - 1
  for (let l = 0; l < legCount; l++) {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const [lat, lng] = gcInterp(waypoints[l]!, waypoints[l + 1]!, t)
      pts.push([lat, lng])
    }
  }
  return pts
}

// Position along sampled route at progress p ∈ [0,1]
function posAtProgress(pts: [number, number][], p: number): [number, number] {
  const idx = Math.min(Math.floor(p * (pts.length - 1)), pts.length - 1)
  return pts[idx]!
}

// ─── driver marker html ───────────────────────────────────────────────────────

function makeDriverIcon(L: typeof LeafletType, bearing: number) {
  const html = `
    <div style="
      width:64px;height:64px;
      display:flex;align-items:center;justify-content:center;
      position:relative;
    ">
      <div style="
        position:absolute;
        width:44px;height:44px;
        border-radius:50%;
        border:2px solid rgba(0,200,168,0.25);
        animation:driver-pulse 2.2s ease-in-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        width:32px;height:32px;
        border-radius:50%;
        border:2px solid rgba(0,200,168,0.4);
        animation:driver-pulse 2.2s ease-in-out infinite 0.4s;
        pointer-events:none;
      "></div>
      <div style="
        width:22px;height:22px;
        border-radius:50%;
        background:rgba(6,13,27,0.92);
        border:2.5px solid #00C8A8;
        box-shadow:0 0 18px rgba(0,200,168,0.7), 0 0 6px rgba(0,200,168,0.9);
        display:flex;align-items:center;justify-content:center;
        position:relative;z-index:2;
      ">
        <svg width="10" height="10" viewBox="0 0 10 10" style="transform:rotate(${bearing}deg);transition:transform 0.3s ease">
          <polygon points="5,1 9,9 5,7 1,9" fill="#00C8A8"/>
        </svg>
      </div>
    </div>
  `
  return L.divIcon({
    className: "driver-leaflet-marker",
    html,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  })
}

function makeCheckpointIcon(L: typeof LeafletType, status: Checkpoint["status"], label: string) {
  const colors: Record<string, string> = {
    passed: "#2ED573", current: "#00C8A8", upcoming: "#374151", delayed: "#FF4757",
  }
  const color = colors[status] ?? "#374151"
  const html = `
    <div style="
      width:26px;height:26px;
      border-radius:50%;
      background:rgba(6,13,27,0.9);
      border:2px solid ${color};
      box-shadow:0 0 8px ${color}66;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;font-weight:700;color:${color};
      font-family:monospace;
    ">${label}</div>
  `
  return L.divIcon({
    className: "driver-leaflet-marker",
    html,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  })
}

function makeDestIcon(L: typeof LeafletType) {
  const html = `
    <div style="
      width:24px;height:24px;
      border-radius:4px;
      background:#2ED573;
      border:2px solid #fff;
      box-shadow:0 0 12px rgba(46,213,115,0.7);
      display:flex;align-items:center;justify-content:center;
      transform:rotate(45deg);
    "></div>
  `
  return L.divIcon({
    className: "driver-leaflet-marker",
    html,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

// ─── component ────────────────────────────────────────────────────────────────

export function DriverLiveMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<LeafletType.Map | null>(null)
  const LRef         = useRef<typeof LeafletType | null>(null)
  const driverMarker = useRef<LeafletType.Marker | null>(null)
  const completedLine = useRef<LeafletType.Polyline | null>(null)
  const remainingLine = useRef<LeafletType.Polyline | null>(null)
  const rafRef       = useRef<number | null>(null)
  const progressRef  = useRef(0.35)   // start mid-route
  const routePtsRef  = useRef<[number, number][]>([])

  const [progress, setProgress]   = useState(0.35)
  const [bearing,  setBearing]    = useState(45)
  const [speedKmh, setSpeedKmh]   = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [centered,  setCentered]  = useState(true)
  const [tempOk,    setTempOk]    = useState(true)

  const assignment = MOCK_SHIPMENTS.find((s) => s.status === "in_transit") ?? MOCK_SHIPMENTS[0]!
  const waypoints  = buildWaypoints(assignment)
  const totalDistKm = waypoints.reduce((acc, wp, i) =>
    i === 0 ? acc : acc + distKm(waypoints[i - 1]!, wp), 0)

  // next checkpoint
  const nextCp = assignment.checkpoints.find((cp) => cp.status === "current" || cp.status === "upcoming")
  const nextCpCoords = nextCp?.coordinates as [number, number] | undefined

  const etaDate = new Date(assignment.eta)
  const etaStr  = etaDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) +
    " " + etaDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // ── init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      LRef.current = L

      if (!document.getElementById("leaflet-css-driver")) {
        const link = document.createElement("link")
        link.id = "leaflet-css-driver"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // inject driver-pulse keyframe once
      if (!document.getElementById("driver-pulse-css")) {
        const style = document.createElement("style")
        style.id = "driver-pulse-css"
        style.textContent = `
          @keyframes driver-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50%       { opacity: 0;   transform: scale(1.8); }
          }
          .driver-leaflet-marker { background: none !important; border: none !important; }
          .leaflet-tooltip.ao-nav-tip {
            background: rgba(6,13,27,0.94) !important;
            border: 1px solid rgba(255,255,255,0.1) !important;
            border-radius: 8px !important;
            padding: 4px 8px !important;
            color: #e2e8f0 !important;
            font-size: 11px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          }
          .leaflet-tooltip.ao-nav-tip::before { display: none !important; }
        `
        document.head.appendChild(style)
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const routePts = sampleRoute(waypoints)
      routePtsRef.current = routePts

      const startPos = posAtProgress(routePts, progressRef.current)
      const map = L.map(containerRef.current, {
        center: startPos,
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      })
      mapRef.current = map

      setTimeout(() => map.invalidateSize(), 100)

      L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19, subdomains: "abcd" }).addTo(map)
      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Full dashed background arc
      L.polyline(routePts, {
        color: "rgba(255,255,255,0.08)",
        weight: 2,
        dashArray: "5 8",
      }).addTo(map)

      // Completed path
      const splitIdx = Math.floor(progressRef.current * routePts.length)
      completedLine.current = L.polyline(routePts.slice(0, splitIdx + 1), {
        color: "#00C8A8", weight: 3, opacity: 0.85,
      }).addTo(map)

      // Remaining path
      remainingLine.current = L.polyline(routePts.slice(splitIdx), {
        color: "#1E3050", weight: 2, dashArray: "6 6",
      }).addTo(map)

      // Origin marker
      const originIcon = L.divIcon({
        className: "driver-leaflet-marker",
        html: `<div style="width:12px;height:12px;border-radius:50%;background:#64748B;border:2px solid #94A3B8;"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      })
      L.marker([waypoints[0]![1], waypoints[0]![0]], { icon: originIcon })
        .addTo(map)
        .bindTooltip(assignment.origin.split(",")[0]!, { className: "ao-nav-tip" })

      // Destination marker
      L.marker(
        [assignment.destinationCoordinates[1], assignment.destinationCoordinates[0]],
        { icon: makeDestIcon(L) }
      ).addTo(map)
        .bindTooltip(assignment.destination.split(",")[0]!, { className: "ao-nav-tip" })

      // Checkpoint markers
      assignment.checkpoints.forEach((cp, i) => {
        L.marker(
          [cp.coordinates[1], cp.coordinates[0]],
          { icon: makeCheckpointIcon(L, cp.status, String(i + 1)) }
        ).addTo(map)
          .bindTooltip(cp.name, { className: "ao-nav-tip", direction: "top" })
      })

      // Driver marker
      const initBearing = routePts.length > 1
        ? bearingBetween(
            [routePts[splitIdx]![1], routePts[splitIdx]![0]],
            [routePts[Math.min(splitIdx + 5, routePts.length - 1)]![1], routePts[Math.min(splitIdx + 5, routePts.length - 1)]![0]],
          )
        : 0
      driverMarker.current = L.marker(startPos, {
        icon: makeDriverIcon(L, initBearing),
        zIndexOffset: 1000,
      }).addTo(map)

      // Detect user panning away from driver
      map.on("movestart", () => setCentered(false))
    })

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── simulate movement ────────────────────────────────────────────────────
  useEffect(() => {
    let lastMs = 0
    const FRAC_PER_SEC = SPEED_KMH / (totalDistKm * 3600) * 30 // 30× time-lapse

    function tick(now: number) {
      const dt = Math.min((now - lastMs) / 1000, 0.5)
      lastMs = now

      const prev = progressRef.current
      const next = Math.min(prev + FRAC_PER_SEC * dt, 0.99)
      progressRef.current = next

      const L   = LRef.current
      const map = mapRef.current
      const pts = routePtsRef.current
      if (!L || !map || pts.length < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const idx  = Math.min(Math.floor(next * (pts.length - 1)), pts.length - 2)
      const pos  = pts[idx]!
      const posB = pts[Math.min(idx + 4, pts.length - 1)]!

      // bearing (expects [lat,lng] for both)
      const brg = bearingBetween([pos[1], pos[0]], [posB[1], posB[0]])

      // update driver marker icon (bearing) + position
      if (driverMarker.current) {
        driverMarker.current.setLatLng(pos)
        driverMarker.current.setIcon(makeDriverIcon(L, brg))
      }

      // update polylines
      if (completedLine.current) completedLine.current.setLatLngs(pts.slice(0, idx + 1))
      if (remainingLine.current)  remainingLine.current.setLatLngs(pts.slice(idx))

      // pan map to keep driver centred
      if (centered && driverMarker.current) {
        const sheetPx = sheetOpen ? 260 : SHEET_COLLAPSED_PX
        map.setView(pos, map.getZoom(), { animate: false })
        map.panBy([0, -sheetPx / 2], { animate: false })
      }

      setProgress(next)
      setBearing(Math.round(brg))
      setSpeedKmh(Math.round(SPEED_KMH * (0.85 + Math.random() * 0.3)))

      // oscillate temp status for demo
      setTempOk((Date.now() % 14000) < 12000)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centered, sheetOpen])

  // ── recenter ──────────────────────────────────────────────────────────────
  const recenter = useCallback(() => {
    const map = mapRef.current
    const pts = routePtsRef.current
    if (!map || pts.length === 0) return
    const idx = Math.min(Math.floor(progressRef.current * (pts.length - 1)), pts.length - 1)
    const pos = pts[idx]!
    map.setView(pos, 6, { animate: true })
    const sheetPx = sheetOpen ? 260 : SHEET_COLLAPSED_PX
    map.panBy([0, -sheetPx / 2])
    setCentered(true)
  }, [sheetOpen])

  const distToNext = nextCpCoords
    ? (() => {
        const pts  = routePtsRef.current
        const idx  = Math.min(Math.floor(progress * (pts.length - 1)), pts.length - 1)
        const pos  = pts[idx]
        return pos ? Math.round(distKm([pos[1], pos[0]], nextCpCoords)) : "—"
      })()
    : "—"

  const sheetH = sheetOpen ? 260 : SHEET_COLLAPSED_PX
  const mapH   = `calc(100% - ${sheetH}px)`

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* ── Map canvas ── */}
      <div
        ref={containerRef}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: `${sheetH}px`, zIndex: 0 }}
      />

      {/* ── Top HUD ── */}
      <div
        style={{
          position: "absolute", top: 12, left: 12, right: 12,
          background: "rgba(6,13,27,0.88)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: "10px 14px",
          zIndex: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div>
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", fontFamily: "var(--ao-font-body)", margin: 0 }}>
            {assignment.id}
          </p>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", margin: 0 }}>
            {assignment.origin.split(",")[0]} → {assignment.destination.split(",")[0]}
          </p>
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20,
            background: tempOk ? "rgba(0,200,168,0.12)" : "rgba(255,71,87,0.14)",
            border: `1px solid ${tempOk ? "rgba(0,200,168,0.35)" : "rgba(255,71,87,0.4)"}`,
          }}
        >
          {!tempOk && <AlertTriangle style={{ width: 11, height: 11, color: "#FF4757" }} />}
          <Thermometer style={{ width: 11, height: 11, color: tempOk ? "#00C8A8" : "#FF4757" }} />
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: tempOk ? "#00C8A8" : "#FF4757",
            fontFamily: "var(--ao-font-mono)",
          }}>
            {tempOk ? "TEMP OK" : "EXCURSION"}
          </span>
        </div>
      </div>

      {/* ── Speed / bearing HUD ── */}
      <div
        style={{
          position: "absolute", top: 74, left: 12,
          background: "rgba(6,13,27,0.82)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "8px 12px",
          zIndex: 800,
        }}
      >
        <p style={{ fontSize: 20, fontWeight: 700, color: "#00C8A8", fontFamily: "var(--ao-font-mono)", margin: 0, lineHeight: 1 }}>
          {speedKmh}
        </p>
        <p style={{ fontSize: 8, color: "#64748B", fontFamily: "var(--ao-font-body)", margin: 0 }}>km/h</p>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Navigation
            style={{ width: 10, height: 10, color: "#94A3B8", transform: `rotate(${bearing}deg)`, transition: "transform 0.3s" }}
          />
          <span style={{ fontSize: 9, color: "#94A3B8", fontFamily: "var(--ao-font-mono)" }}>{bearing}°</span>
        </div>
        {nextCpCoords && (
          <p style={{ fontSize: 9, color: "#64748B", fontFamily: "var(--ao-font-mono)", margin: "4px 0 0", whiteSpace: "nowrap" }}>
            {distToNext} km left
          </p>
        )}
      </div>

      {/* ── Recenter button ── */}
      {!centered && (
        <button
          onClick={recenter}
          style={{
            position: "absolute", top: 74, right: 12,
            width: 40, height: 40, borderRadius: "50%",
            background: "rgba(6,13,27,0.9)",
            border: "1.5px solid rgba(0,200,168,0.5)",
            color: "#00C8A8",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 800, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
          aria-label="Recenter map"
        >
          <Navigation style={{ width: 16, height: 16 }} />
        </button>
      )}

      {/* ── Bottom sheet ── */}
      <div
        style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: sheetH,
          background: "rgba(6,13,27,0.97)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(0,200,168,0.15)",
          borderRadius: "20px 20px 0 0",
          transition: "height 0.35s cubic-bezier(0.34,1.1,0.64,1)",
          zIndex: 900,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sheet handle + toggle */}
        <button
          onClick={() => setSheetOpen((v) => !v)}
          style={{
            width: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, padding: "10px 16px 6px",
            background: "none", border: "none", cursor: "pointer",
            flexShrink: 0,
          }}
          aria-label={sheetOpen ? "Collapse details" : "Expand details"}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <div>
              <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--ao-font-body)", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Next Stop
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", margin: 0 }}>
                {nextCp?.name ?? assignment.destination.split(",")[0]}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 9, color: "#64748B", fontFamily: "var(--ao-font-body)", margin: 0 }}>ETA</p>
                <p style={{ fontSize: 11, color: "#00C8A8", fontFamily: "var(--ao-font-mono)", margin: 0 }}>
                  {etaStr}
                </p>
              </div>
              {sheetOpen
                ? <ChevronDown style={{ width: 16, height: 16, color: "#64748B" }} />
                : <ChevronUp   style={{ width: 16, height: 16, color: "#64748B" }} />
              }
            </div>
          </div>
        </button>

        {/* Expanded content */}
        {sheetOpen && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>

            {/* Progress bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--ao-font-body)" }}>Route Progress</span>
                <span style={{ fontSize: 10, color: "#00C8A8", fontFamily: "var(--ao-font-mono)" }}>{Math.round(progress * 100)}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${Math.round(progress * 100)}%`,
                  background: "linear-gradient(90deg, #00C8A888, #00C8A8)",
                  boxShadow: "0 0 8px rgba(0,200,168,0.5)",
                  transition: "width 0.5s ease",
                }} />
              </div>
            </div>

            {/* Checkpoint timeline */}
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748B", fontFamily: "var(--ao-font-body)", marginBottom: 8 }}>
              Checkpoints
            </p>
            {assignment.checkpoints.map((cp, i) => {
              const cpColors: Record<string, string> = { passed: "#2ED573", current: "#00C8A8", upcoming: "#374151", delayed: "#FF4757" }
              const c = cpColors[cp.status] ?? "#374151"
              return (
                <div key={cp.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, position: "relative" }}>
                  {i < assignment.checkpoints.length - 1 && (
                    <div style={{ position: "absolute", left: 9, top: 18, width: 2, height: "calc(100% + 4px)", background: cp.status === "passed" ? "rgba(46,213,115,0.3)" : "rgba(255,255,255,0.06)" }} />
                  )}
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${c}22`, border: `2px solid ${c}`, display: "flex", alignItems: "center", justifyContent: "center", shrink: 0, position: "relative", zIndex: 1 }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: c }}>{i + 1}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: cp.status === "upcoming" ? "#64748B" : "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", margin: 0 }}>
                      {cp.name}
                    </p>
                    <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--ao-font-mono)", margin: 0 }}>
                      {cp.actualArrival
                        ? `Arrived ${new Date(cp.actualArrival).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                        : `ETA ${new Date(cp.estimatedArrival).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                    </p>
                  </div>
                </div>
              )
            })}

            {/* Cargo + cold chain */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(0,200,168,0.06)", border: "1px solid rgba(0,200,168,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Package style={{ width: 11, height: 11, color: "#64748B" }} />
                  <span style={{ fontSize: 9, color: "#64748B", fontFamily: "var(--ao-font-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cargo</span>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", margin: 0 }}>
                  {assignment.materials[0]?.name}
                </p>
                <p style={{ fontSize: 10, color: "#64748B", fontFamily: "var(--ao-font-mono)", margin: 0 }}>
                  {assignment.requiredTempMin}°–{assignment.requiredTempMax}°C
                </p>
              </div>
              <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(46,213,115,0.06)", border: "1px solid rgba(46,213,115,0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Shield style={{ width: 11, height: 11, color: "#64748B" }} />
                  <span style={{ fontSize: 9, color: "#64748B", fontFamily: "var(--ao-font-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cold Chain</span>
                </div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#2ED573", fontFamily: "var(--ao-font-mono)", margin: 0 }}>
                  {assignment.coldChainConfidence}%
                </p>
                <p style={{ fontSize: 9, color: "#64748B", fontFamily: "var(--ao-font-body)", margin: 0 }}>Confidence</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
