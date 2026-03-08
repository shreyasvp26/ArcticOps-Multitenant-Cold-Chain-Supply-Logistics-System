"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import type * as Leaflet from "leaflet"
import { Plane, Ship, Truck, Train, AlertTriangle, Thermometer, ChevronRight, X, MapPin, Clock, Shield, RefreshCw } from "lucide-react"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { formatTemp, formatEta } from "@/lib/utils/format"
import type { Shipment } from "@/lib/types/shipment"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const STATUS_COLORS: Record<string, string> = {
  in_transit: "#00D4AA",
  at_customs: "#FFA502",
  preparing: "#3B82F6",
  requested: "#64748B",
  delivered: "#2ED573",
  cancelled: "#FF4757",
}

const STATUS_BG: Record<string, string> = {
  in_transit: "rgba(0,212,170,0.1)",
  at_customs: "rgba(255,165,2,0.1)",
  preparing: "rgba(59,130,246,0.1)",
  requested: "rgba(100,116,139,0.1)",
  delivered: "rgba(46,213,115,0.1)",
  cancelled: "rgba(255,71,87,0.1)",
}

const TEMP_ZONE_COLOR: Record<string, string> = {
  ultra_cold: "#7C3AED",
  frozen: "#3B82F6",
  refrigerated: "#06B6D4",
}

const TEMP_ZONE_LABEL: Record<string, string> = {
  ultra_cold: "Ultra Cold",
  frozen: "Frozen",
  refrigerated: "Refrigerated",
}

// ---------- Math helpers ----------
function toLeafletLatLng(coords: [number, number]): [number, number] {
  return [coords[1], coords[0]]
}

function greatCircleInterpolate(start: [number, number], end: [number, number], t: number): [number, number] {
  const [lng1, lat1] = start.map((x) => (x * Math.PI) / 180)
  const [lng2, lat2] = end.map((x) => (x * Math.PI) / 180)
  const x1 = Math.cos(lat1) * Math.cos(lng1), y1 = Math.cos(lat1) * Math.sin(lng1), z1 = Math.sin(lat1)
  const x2 = Math.cos(lat2) * Math.cos(lng2), y2 = Math.cos(lat2) * Math.sin(lng2), z2 = Math.sin(lat2)
  const dot = x1 * x2 + y1 * y2 + z1 * z2
  const d = Math.acos(Math.max(-1, Math.min(1, dot)))
  if (d < 1e-9) return start
  const f = Math.sin((1 - t) * d) / Math.sin(d), g = Math.sin(t * d) / Math.sin(d)
  const x = f * x1 + g * x2, y = f * y1 + g * y2, z = f * z1 + g * z2
  return [(Math.atan2(y, x) * 180) / Math.PI, (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI]
}

function toCurvedLine(waypoints: [number, number][], n = 40): [number, number][] {
  if (waypoints.length < 2) return waypoints
  const result: [number, number][] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const leg = Array.from({ length: n + 1 }, (_, j) => greatCircleInterpolate(waypoints[i]!, waypoints[i + 1]!, j / n))
    result.push(...(i === 0 ? leg : leg.slice(1)))
  }
  return result
}

function collectBoundsCoords(shipments: Shipment[]): [number, number][] {
  return shipments.flatMap((sh) => [
    sh.originCoordinates, sh.currentCoordinates, sh.destinationCoordinates,
    ...sh.checkpoints.map((cp) => cp.coordinates),
  ])
}

// Estimate 0–1 progress along full route based on checkpoint data
function getRouteProgress(sh: Shipment): number {
  const total = sh.checkpoints.length
  if (total === 0) return 0.5
  const passed = sh.checkpoints.filter((cp) => cp.status === "passed").length
  const hasCurrent = sh.checkpoints.some((cp) => cp.status === "current")
  return Math.min((passed + (hasCurrent ? 0.5 : 0)) / total, 0.95)
}

// ---------- Marker HTML ----------
function buildMarkerHtml(color: string, isMoving: boolean, riskScore: number) {
  const danger = riskScore > 60
  const size = isMoving ? 16 : 12
  const rings = isMoving ? `
    <div style="position:absolute;inset:-8px;border-radius:50%;border:1.5px solid ${color};opacity:0;animation:ring-expand 2.5s ease-out infinite;pointer-events:none;"></div>
    <div style="position:absolute;inset:-6px;border-radius:50%;border:1px solid ${color};opacity:0;animation:ring-expand 2.5s ease-out 1.1s infinite;pointer-events:none;"></div>
  ` : ""
  const dangerPulse = danger ? `box-shadow:0 0 0 0 ${color}80;animation:danger-pulse 1.8s ease-in-out infinite;` : `box-shadow:0 0 10px ${color}66,0 0 20px ${color}22;`
  return `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
    ${rings}
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);${dangerPulse}"></div>
    ${danger ? `<div style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;background:#FF4757;border-radius:50%;border:1px solid #111D33;"></div>` : ""}
  </div>`
}

// ---------- Shared ShipmentPanel ----------
function ShipmentListPanel({
  shipments,
  selectedId,
  onSelect,
  getLatestTemp,
}: {
  shipments: Shipment[]
  selectedId: string | null
  onSelect: (id: string) => void
  getLatestTemp: (id: string) => { temperature: number; isExcursion: boolean } | null
}) {
  const active = shipments.filter((s) => s.status !== "cancelled")
  const inTransit = active.filter((s) => s.status === "in_transit")
  const others = active.filter((s) => s.status !== "in_transit")

  return (
    <div
      className="absolute left-3 top-3 bottom-3 flex flex-col rounded-xl overflow-hidden z-[1000]"
      style={{
        width: "248px",
        background: "rgba(8,16,34,0.92)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(36,51,82,0.9)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Panel header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 shrink-0"
        style={{ borderBottom: "1px solid rgba(36,51,82,0.8)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,212,170,0.12)", border: "1px solid rgba(0,212,170,0.3)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#00D4AA", animation: "checkpoint-pulse 2s ease-in-out infinite" }}
            />
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: "#00D4AA", fontWeight: 700, letterSpacing: "0.08em" }}>
              LIVE
            </span>
          </div>
          <span style={{ fontFamily: "var(--ao-font-body)", fontSize: "11px", color: "var(--ao-text-muted)" }}>
            {inTransit.length} in transit
          </span>
        </div>
        <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "10px", color: "rgba(100,116,139,0.6)" }}>
          {active.length} total
        </span>
      </div>

      {/* Shipment cards */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {inTransit.length > 0 && (
          <>
            <div className="px-3 pt-2.5 pb-1">
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: "rgba(100,116,139,0.7)", letterSpacing: "0.1em" }}>
                IN TRANSIT
              </span>
            </div>
            {inTransit.map((sh) => (
              <ShipmentCard key={sh.id} shipment={sh} selected={selectedId === sh.id} onSelect={onSelect} getLatestTemp={getLatestTemp} />
            ))}
          </>
        )}
        {others.length > 0 && (
          <>
            <div className="px-3 pt-2.5 pb-1">
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: "rgba(100,116,139,0.7)", letterSpacing: "0.1em" }}>
                OTHER
              </span>
            </div>
            {others.map((sh) => (
              <ShipmentCard key={sh.id} shipment={sh} selected={selectedId === sh.id} onSelect={onSelect} getLatestTemp={getLatestTemp} />
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function ShipmentCard({
  shipment: sh,
  selected,
  onSelect,
  getLatestTemp,
}: {
  shipment: Shipment
  selected: boolean
  onSelect: (id: string) => void
  getLatestTemp: (id: string) => { temperature: number; isExcursion: boolean } | null
}) {
  const temp = getLatestTemp(sh.id)
  const color = STATUS_COLORS[sh.status] ?? "#64748B"
  const progress = getRouteProgress(sh)
  const hasAlert = sh.riskScore > 60 || (temp?.isExcursion ?? false)

  return (
    <button
      onClick={() => onSelect(sh.id)}
      className="w-full text-left px-3 py-2.5 transition-all"
      style={{
        background: selected ? `linear-gradient(90deg, ${color}14 0%, transparent 100%)` : "transparent",
        borderLeft: `2px solid ${selected ? color : "transparent"}`,
        borderBottom: "1px solid rgba(36,51,82,0.4)",
        cursor: "pointer",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "11px", color: selected ? color : "var(--ao-text-secondary)", fontWeight: 700 }}>
            {sh.id}
          </span>
          {hasAlert && (
            <AlertTriangle size={9} color="#FF4757" />
          )}
        </div>
        <span
          className="px-1.5 py-0.5 rounded-sm"
          style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", fontWeight: 700, background: STATUS_BG[sh.status], color, letterSpacing: "0.05em" }}
        >
          {SHIPMENT_STATUSES[sh.status as keyof typeof SHIPMENT_STATUSES]?.label?.toUpperCase() ?? sh.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "10px", color: "var(--ao-text-muted)", marginBottom: "4px" }}>
        {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
      </p>

      {/* Progress bar */}
      {(sh.status === "in_transit" || sh.status === "at_customs") && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(36,51,82,0.8)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${color}aa, ${color})`,
                boxShadow: `0 0 6px ${color}66`,
                transition: "width 3s ease",
              }}
            />
          </div>
          <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "rgba(100,116,139,0.7)" }}>
            {Math.round(progress * 100)}%
          </span>
        </div>
      )}

      <div className="flex items-center justify-between">
        {temp ? (
          <div className="flex items-center gap-1">
            <Thermometer size={9} color={temp.isExcursion ? "#FF4757" : TEMP_ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4"} />
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: temp.isExcursion ? "#FF4757" : (TEMP_ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4") }}>
              {formatTemp(temp.temperature)}
            </span>
            {temp.isExcursion && (
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "#FF4757", fontWeight: 700 }}>!</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: TEMP_ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4" }}
            />
            <span style={{ fontFamily: "var(--ao-font-body)", fontSize: "9px", color: "rgba(100,116,139,0.6)" }}>
              {TEMP_ZONE_LABEL[sh.temperatureZone] ?? sh.temperatureZone}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock size={8} color="rgba(100,116,139,0.5)" />
          <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: "rgba(100,116,139,0.6)" }}>
            {formatEta(sh.eta)}
          </span>
        </div>
      </div>
    </button>
  )
}

// ---------- Detail panel (right side, shown when a shipment is selected) ----------
function ShipmentDetailPanel({
  shipment: sh,
  onClose,
  getLatestTemp,
}: {
  shipment: Shipment
  onClose: () => void
  getLatestTemp: (id: string) => { temperature: number; isExcursion: boolean } | null
}) {
  const temp = getLatestTemp(sh.id)
  const color = STATUS_COLORS[sh.status] ?? "#64748B"
  const progress = getRouteProgress(sh)
  const tempZoneColor = TEMP_ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4"

  const modeIcon = (mode: string) => {
    if (mode === "air") return <Plane size={9} />
    if (mode === "sea") return <Ship size={9} />
    if (mode === "rail") return <Train size={9} />
    return <Truck size={9} />
  }

  return (
    <div
      className="absolute right-3 top-3 bottom-3 flex flex-col rounded-xl overflow-hidden z-[1000]"
      style={{
        width: "260px",
        background: "rgba(8,16,34,0.95)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${color}44`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${color}11, inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Header */}
      <div
        className="px-4 pt-3 pb-2.5 shrink-0"
        style={{
          borderBottom: `1px solid ${color}22`,
          background: `linear-gradient(135deg, ${color}0a 0%, transparent 60%)`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "13px", color, fontWeight: 800, letterSpacing: "0.02em" }}>
                {sh.id}
              </span>
              {sh.riskScore > 60 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.3)" }}>
                  <AlertTriangle size={8} color="#FF4757" />
                  <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "#FF4757", fontWeight: 700 }}>HIGH RISK</span>
                </div>
              )}
            </div>
            <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "11px", color: "var(--ao-text-secondary)", fontWeight: 600 }}>
              {sh.clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-lg transition-colors"
            style={{ background: "rgba(36,51,82,0.5)", color: "var(--ao-text-muted)" }}
          >
            <X size={10} />
          </button>
        </div>

        {/* Status pill + transport mode */}
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: STATUS_BG[sh.status], border: `1px solid ${color}44`, fontFamily: "var(--ao-font-mono)", fontSize: "9px", color, fontWeight: 700, letterSpacing: "0.06em" }}
          >
            {sh.status === "in_transit" && <span style={{ animation: "checkpoint-pulse 2s ease-in-out infinite" }}>●</span>}
            {SHIPMENT_STATUSES[sh.status as keyof typeof SHIPMENT_STATUSES]?.label?.toUpperCase() ?? sh.status.toUpperCase()}
          </span>
          <span
            className="px-1.5 py-0.5 rounded-full"
            style={{ background: `${tempZoneColor}15`, border: `1px solid ${tempZoneColor}33`, fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: tempZoneColor, fontWeight: 600 }}
          >
            {TEMP_ZONE_LABEL[sh.temperatureZone] ?? sh.temperatureZone}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ scrollbarWidth: "none" }}>
        {/* Route */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <MapPin size={9} color="var(--ao-text-muted)" />
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "var(--ao-text-muted)", letterSpacing: "0.08em" }}>ROUTE</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 text-right">
              <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "10px", color: "var(--ao-text-primary)", fontWeight: 600 }}>{sh.origin.split(",")[0]}</p>
              <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "9px", color: "var(--ao-text-muted)" }}>{sh.origin.split(",").slice(1).join(",").trim()}</p>
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ao-text-muted)" }} />
              <div className="w-8 h-px" style={{ background: `linear-gradient(90deg, var(--ao-text-muted), ${color})`, position: "relative" }}>
                <div style={{ position: "absolute", left: `${progress * 100}%`, top: "-4px", transform: "translateX(-50%)", width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
              </div>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            </div>
            <div className="flex-1">
              <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "10px", color: "var(--ao-text-primary)", fontWeight: 600 }}>{sh.destination.split(",")[0]}</p>
              <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "9px", color: "var(--ao-text-muted)" }}>{sh.destination.split(",").slice(1).join(",").trim()}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 rounded-full overflow-hidden mb-1" style={{ background: "rgba(36,51,82,0.8)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress * 100}%`,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                boxShadow: `0 0 8px ${color}55`,
                transition: "width 3s ease",
              }}
            />
          </div>
          <div className="flex justify-between">
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "rgba(100,116,139,0.5)" }}>0%</span>
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color }}>
              {Math.round(progress * 100)}% complete
            </span>
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "rgba(100,116,139,0.5)" }}>100%</span>
          </div>
        </div>

        {/* Live temperature */}
        <div
          className="rounded-lg p-3"
          style={{
            background: temp?.isExcursion ? "rgba(255,71,87,0.06)" : `${tempZoneColor}0a`,
            border: `1px solid ${temp?.isExcursion ? "rgba(255,71,87,0.3)" : tempZoneColor + "22"}`,
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Thermometer size={10} color={temp?.isExcursion ? "#FF4757" : tempZoneColor} />
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: temp?.isExcursion ? "#FF4757" : tempZoneColor, letterSpacing: "0.08em" }}>
                TEMPERATURE {temp && <span className="ml-1" style={{ animation: "checkpoint-pulse 2s ease-in-out infinite", display: "inline-block" }}>●</span>}
              </span>
            </div>
            {temp?.isExcursion && (
              <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", fontWeight: 700, color: "#FF4757", background: "rgba(255,71,87,0.15)", padding: "1px 4px", borderRadius: "3px" }}>
                EXCURSION
              </span>
            )}
          </div>
          {temp ? (
            <p style={{ fontFamily: "var(--ao-font-mono)", fontSize: "20px", fontWeight: 700, color: temp.isExcursion ? "#FF4757" : tempZoneColor, lineHeight: 1 }}>
              {formatTemp(temp.temperature)}
            </p>
          ) : (
            <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "11px", color: "var(--ao-text-muted)" }}>No reading</p>
          )}
          <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "9px", color: "var(--ao-text-muted)", marginTop: "2px" }}>
            Target: {sh.requiredTempMin}°C – {sh.requiredTempMax}°C
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCell label="ETA" value={formatEta(sh.eta)} icon={<Clock size={9} />} accent="var(--ao-text-secondary)" />
          <StatCell
            label="Cold Chain"
            value={`${sh.coldChainConfidence}%`}
            icon={<Shield size={9} />}
            accent={sh.coldChainConfidence >= 85 ? "#00D4AA" : sh.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757"}
          />
          <StatCell
            label="Risk Score"
            value={sh.riskScore}
            icon={<AlertTriangle size={9} />}
            accent={sh.riskScore > 60 ? "#FF4757" : sh.riskScore > 30 ? "#FFA502" : "#00D4AA"}
          />
          <StatCell label="Carrier" value={sh.carrierName.split(" ")[0]!} icon={<Plane size={9} />} accent="var(--ao-text-muted)" />
        </div>

        {/* Checkpoints timeline */}
        <div>
          <div className="flex items-center gap-1 mb-2">
            <RefreshCw size={9} color="var(--ao-text-muted)" />
            <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "var(--ao-text-muted)", letterSpacing: "0.08em" }}>CHECKPOINTS</span>
          </div>
          <div className="flex flex-col gap-0">
            {sh.checkpoints.map((cp, idx) => {
              const isCurrent = cp.status === "current"
              const isPassed = cp.status === "passed"
              const isLast = idx === sh.checkpoints.length - 1
              const dotColor = isCurrent ? color : isPassed ? "#2ED573" : "rgba(36,51,82,1)"
              const dotBorder = isCurrent ? color : isPassed ? "#2ED573" : "rgba(100,116,139,0.4)"
              return (
                <div key={cp.id} className="flex gap-2.5 items-start" style={{ minHeight: "28px" }}>
                  <div className="flex flex-col items-center shrink-0" style={{ paddingTop: "2px" }}>
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: dotColor,
                        border: `1.5px solid ${dotBorder}`,
                        boxShadow: isCurrent ? `0 0 6px ${color}88` : "none",
                        animation: isCurrent ? "checkpoint-pulse 2s ease-in-out infinite" : "none",
                      }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 mt-0.5" style={{ background: isPassed ? "rgba(46,213,115,0.3)" : "rgba(36,51,82,0.6)", minHeight: "14px" }} />
                    )}
                  </div>
                  <div className="pb-2">
                    <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "10px", color: isCurrent ? "var(--ao-text-primary)" : isPassed ? "var(--ao-text-secondary)" : "var(--ao-text-muted)", fontWeight: isCurrent ? 600 : 400 }}>
                      {cp.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color, fontWeight: 700 }}>CURRENT · </span>
                      )}
                      {modeIcon(sh.legs[idx - 1]?.mode ?? sh.legs[0]?.mode ?? "air")}
                      <span style={{ fontFamily: "var(--ao-font-body)", fontSize: "9px", color: "rgba(100,116,139,0.5)" }}>
                        {cp.city}, {cp.country}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Cargo */}
        <div
          className="rounded-lg p-2.5"
          style={{ background: "rgba(36,51,82,0.3)", border: "1px solid rgba(36,51,82,0.6)" }}
        >
          <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "var(--ao-text-muted)", letterSpacing: "0.08em" }}>CARGO</span>
          {sh.materials.map((m) => (
            <div key={m.materialId} className="mt-1">
              <p style={{ fontFamily: "var(--ao-font-body)", fontSize: "10px", color: "var(--ao-text-secondary)", fontWeight: 600 }}>{m.name}</p>
              <p style={{ fontFamily: "var(--ao-font-mono)", fontSize: "9px", color: "var(--ao-text-muted)" }}>
                {m.quantity.toLocaleString()} {m.unit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCell({ label, value, icon, accent }: { label: string; value: string | number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-lg p-2" style={{ background: "rgba(36,51,82,0.25)", border: "1px solid rgba(36,51,82,0.5)" }}>
      <div className="flex items-center gap-1 mb-0.5" style={{ color: "var(--ao-text-muted)" }}>
        {icon}
        <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "8px", color: "var(--ao-text-muted)", letterSpacing: "0.06em" }}>{label.toUpperCase()}</span>
      </div>
      <p style={{ fontFamily: "var(--ao-font-mono)", fontSize: "12px", fontWeight: 700, color: accent }}>{value}</p>
    </div>
  )
}

// ---------- Main export ----------
export function GlobeMap() {
  if (!MAPBOX_TOKEN) {
    return (
      <div className="relative w-full h-full">
        <LeafletMap />
      </div>
    )
  }
  return (
    <div className="relative w-full h-full">
      <MapboxMap />
    </div>
  )
}

// ---------- Leaflet implementation ----------
function LeafletMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markersRef = useRef<Map<string, Leaflet.Marker>>(new Map())
  const polylinesRef = useRef<Leaflet.Polyline[]>([])
  const initDoneRef = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const shipments = useShipmentStore((s) => s.shipments)
  const startLiveTracking = useShipmentStore((s) => s.startLiveTracking)
  const getLatestTemp = useTemperatureStore((s) => s.getLatest)
  const tempInitialized = useTemperatureStore((s) => s.initialized)
  const initTemp = useTemperatureStore((s) => s.initialize)

  const activeShipments = shipments.filter((s) => s.status !== "cancelled")

  useEffect(() => {
    if (!tempInitialized) initTemp()
    const stop = startLiveTracking()
    return stop
  }, [startLiveTracking, tempInitialized, initTemp])

  // Fly to shipment when selected
  const flyToShipment = useCallback((id: string) => {
    const sh = shipments.find((s) => s.id === id)
    if (!sh || !mapRef.current) return
    mapRef.current.flyTo(toLeafletLatLng(sh.currentCoordinates), 5, { duration: 1.2 })
  }, [shipments])

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => {
      const next = prev === id ? null : id
      if (next) flyToShipment(next)
      return next
    })
  }, [flyToShipment])

  // Initialize Leaflet once
  useEffect(() => {
    if (initDoneRef.current || !containerRef.current || typeof window === "undefined") return
    initDoneRef.current = true

    import("leaflet").then((L) => {
      if (!containerRef.current) return

      const map = new L.Map(containerRef.current!, {
        center: [20, 10],
        zoom: 2,
        zoomControl: false,
        minZoom: 2,
        maxBounds: [[-85, -180], [85, 180]],
        attributionControl: false,
      })

      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Attribution minimal
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://carto.com">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 20,
      }).addTo(map)

      mapRef.current = map

      // Draw route polylines
      activeShipments.forEach((sh) => {
        if (sh.status !== "in_transit" && sh.status !== "at_customs") return
        const color = STATUS_COLORS[sh.status] ?? "#00D4AA"

        const passedCoords = sh.checkpoints
          .filter((cp) => cp.status === "passed" || cp.status === "current")
          .map((cp) => cp.coordinates)
        const upcomingCoords = sh.checkpoints
          .filter((cp) => cp.status === "upcoming")
          .map((cp) => cp.coordinates)

        // Completed path
        if (passedCoords.length >= 1) {
          const pts = toCurvedLine([sh.originCoordinates, ...passedCoords])
          polylinesRef.current.push(
            L.polyline(pts.map(toLeafletLatLng), { color, weight: 2.5, opacity: 0.8 }).addTo(map),
            L.polyline(pts.map(toLeafletLatLng), { color, weight: 6, opacity: 0.08 }).addTo(map)
          )
        }
        // Upcoming path
        const upcomingPts = toCurvedLine([sh.currentCoordinates, ...upcomingCoords, sh.destinationCoordinates])
        if (upcomingPts.length >= 2) {
          polylinesRef.current.push(
            L.polyline(upcomingPts.map(toLeafletLatLng), {
              color,
              weight: 1.5,
              opacity: 0.3,
              dashArray: "5, 6",
            }).addTo(map)
          )
        }

        // Origin dot
        const originHtml = `<div style="width:7px;height:7px;border-radius:50%;background:rgba(100,116,139,0.6);border:1.5px solid rgba(100,116,139,0.8);"></div>`
        L.marker(toLeafletLatLng(sh.originCoordinates), {
          icon: L.divIcon({ html: originHtml, className: "", iconSize: [7, 7], iconAnchor: [3, 3] }),
          interactive: false,
        }).addTo(map)

        // Destination diamond
        const destHtml = `<div style="width:8px;height:8px;border-radius:1px;transform:rotate(45deg);background:${color}55;border:1.5px solid ${color};box-shadow:0 0 6px ${color}44;"></div>`
        L.marker(toLeafletLatLng(sh.destinationCoordinates), {
          icon: L.divIcon({ html: destHtml, className: "", iconSize: [8, 8], iconAnchor: [4, 4] }),
          interactive: false,
        }).addTo(map)
      })

      // Shipment markers
      activeShipments.forEach((sh) => {
        const color = STATUS_COLORS[sh.status] ?? "#64748B"
        const isMoving = sh.status === "in_transit"
        const html = buildMarkerHtml(color, isMoving, sh.riskScore)

        const marker = L.marker(toLeafletLatLng(sh.currentCoordinates), {
          icon: L.divIcon({ html, className: "shipment-leaflet-marker", iconSize: [isMoving ? 16 : 12, isMoving ? 16 : 12], iconAnchor: [isMoving ? 8 : 6, isMoving ? 8 : 6] }),
          zIndexOffset: isMoving ? 1000 : 0,
        }).addTo(map)

        marker.on("click", () => setSelectedId((prev) => prev === sh.id ? null : sh.id))
        markersRef.current.set(sh.id, marker)
      })

      // Fit bounds
      const allCoords = collectBoundsCoords(activeShipments)
      const unique = allCoords.filter((c, i, arr) => arr.findIndex((x) => x[0] === c[0] && x[1] === c[1]) === i)
      if (unique.length >= 2) {
        const bounds = L.latLngBounds(unique.map((c) => toLeafletLatLng(c) as [number, number]))
        map.fitBounds(bounds, { padding: [60, 280], maxZoom: 5 })
      }
    }).catch(console.error)

    return () => {
      initDoneRef.current = false
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      polylinesRef.current.forEach((p) => p.remove())
      polylinesRef.current = []
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update marker positions live
  useEffect(() => {
    if (!mapRef.current) return
    activeShipments.forEach((sh) => {
      const marker = markersRef.current.get(sh.id)
      if (marker) marker.setLatLng(toLeafletLatLng(sh.currentCoordinates))
    })

    // Update marker icon when selected changes
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        activeShipments.forEach((sh) => {
          const marker = markersRef.current.get(sh.id)
          if (!marker) return
          const color = STATUS_COLORS[sh.status] ?? "#64748B"
          const isMoving = sh.status === "in_transit"
          const isSelected = sh.id === selectedId
          const size = isMoving ? 16 : 12
          const html = isSelected
            ? `<div style="position:relative;width:${size + 4}px;height:${size + 4}px;cursor:pointer;">
                <div style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.6;animation:ring-expand 1.5s ease-out infinite;pointer-events:none;"></div>
                <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 0 16px ${color},0 0 32px ${color}44;"></div>
              </div>`
            : buildMarkerHtml(color, isMoving, sh.riskScore)
          marker.setIcon(L.divIcon({ html, className: "shipment-leaflet-marker", iconSize: [isSelected ? size + 4 : size, isSelected ? size + 4 : size], iconAnchor: [isSelected ? (size + 4) / 2 : size / 2, isSelected ? (size + 4) / 2 : size / 2] }))
          marker.setZIndexOffset(isSelected ? 2000 : isMoving ? 1000 : 0)
        })
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeShipments, selectedId])

  const selectedShipment = selectedId ? shipments.find((s) => s.id === selectedId) ?? null : null

  return (
    <>
      <div ref={containerRef} className="w-full h-full min-h-[400px]" aria-label="Live shipment tracking map" />
      <ShipmentListPanel
        shipments={shipments}
        selectedId={selectedId}
        onSelect={handleSelect}
        getLatestTemp={getLatestTemp}
      />
      {selectedShipment && (
        <ShipmentDetailPanel
          shipment={selectedShipment}
          onClose={() => setSelectedId(null)}
          getLatestTemp={getLatestTemp}
        />
      )}
    </>
  )
}

// ---------- Mapbox implementation ----------
function MapboxMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import("mapbox-gl").Map | null>(null)
  const mapboxMarkersRef = useRef<Map<string, import("mapbox-gl").Marker>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const shipments = useShipmentStore((s) => s.shipments)
  const startLiveTracking = useShipmentStore((s) => s.startLiveTracking)
  const getLatestTemp = useTemperatureStore((s) => s.getLatest)
  const tempInitialized = useTemperatureStore((s) => s.initialized)
  const initTemp = useTemperatureStore((s) => s.initialize)

  useEffect(() => {
    if (!tempInitialized) initTemp()
    const stop = startLiveTracking()
    return stop
  }, [startLiveTracking, tempInitialized, initTemp])

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return
    let map: import("mapbox-gl").Map | null = null

    const init = async () => {
      const mapboxgl = (await import("mapbox-gl")).default
      ;(mapboxgl as unknown as { accessToken: string }).accessToken = MAPBOX_TOKEN

      map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [20, 20],
        zoom: 2,
        minZoom: 2,
        maxBounds: [[-85, -180], [85, 180]],
      })
      mapRef.current = map

      map.on("load", () => {
        const active = shipments.filter((s) => s.status !== "cancelled")

        active.forEach((sh) => {
          const el = document.createElement("div")
          el.innerHTML = buildMarkerHtml(STATUS_COLORS[sh.status] ?? "#64748B", sh.status === "in_transit", sh.riskScore)
          el.style.cssText = `width:${sh.status === "in_transit" ? 16 : 12}px;height:${sh.status === "in_transit" ? 16 : 12}px;cursor:pointer;`
          const marker = new mapboxgl.Marker(el).setLngLat(sh.currentCoordinates as [number, number]).addTo(map!)
          el.addEventListener("click", () => setSelectedId((prev) => prev === sh.id ? null : sh.id))
          mapboxMarkersRef.current.set(sh.id, marker)
        })

        active.filter((s) => s.status === "in_transit").forEach((sh) => {
          const id = `route-${sh.id}`
          const color = STATUS_COLORS[sh.status] ?? "#00D4AA"
          const passedCoords = sh.checkpoints.filter((cp) => cp.status === "passed" || cp.status === "current").map((cp) => cp.coordinates)
          const upcomingCoords = sh.checkpoints.filter((cp) => cp.status === "upcoming").map((cp) => cp.coordinates)

          const completedLine = toCurvedLine([sh.originCoordinates, ...passedCoords])
          if (completedLine.length >= 2) {
            map!.addSource(`${id}-done`, { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: completedLine }, properties: {} } })
            map!.addLayer({ id: `${id}-done-glow`, type: "line", source: `${id}-done`, paint: { "line-color": color, "line-width": 6, "line-opacity": 0.07 } })
            map!.addLayer({ id: `${id}-done-layer`, type: "line", source: `${id}-done`, paint: { "line-color": color, "line-width": 2.5, "line-opacity": 0.8 } })
          }

          const upcomingLine = toCurvedLine([sh.currentCoordinates, ...upcomingCoords, sh.destinationCoordinates])
          if (upcomingLine.length >= 2) {
            map!.addSource(`${id}-upcoming`, { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: upcomingLine }, properties: {} } })
            map!.addLayer({ id: `${id}-upcoming-layer`, type: "line", source: `${id}-upcoming`, paint: { "line-color": color, "line-width": 1.5, "line-opacity": 0.3, "line-dasharray": [4, 4] } })
          }
        })

        const allCoords: [number, number][] = []
        active.forEach((sh) => { allCoords.push(sh.originCoordinates, sh.currentCoordinates, sh.destinationCoordinates) })
        const unique = allCoords.filter((c, i, arr) => arr.findIndex((x) => x[0] === c[0] && x[1] === c[1]) === i)
        if (unique.length >= 2) {
          const bounds = new mapboxgl.LngLatBounds()
          unique.forEach((c) => bounds.extend(c as [number, number]))
          map!.fitBounds(bounds, { padding: { top: 50, bottom: 50, left: 280, right: 60 }, maxZoom: 5 })
        }
      })
    }

    init().catch(console.error)
    return () => { mapRef.current?.remove(); mapRef.current = null; mapboxMarkersRef.current.clear() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    shipments.filter((s) => s.status === "in_transit").forEach((sh) => {
      mapboxMarkersRef.current.get(sh.id)?.setLngLat(sh.currentCoordinates as [number, number])
    })
  }, [shipments])

  const selectedShipment = selectedId ? shipments.find((s) => s.id === selectedId) ?? null : null

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full" aria-label="Live shipment tracking map" />
      <ShipmentListPanel shipments={shipments} selectedId={selectedId} onSelect={setSelectedId} getLatestTemp={getLatestTemp} />
      {selectedShipment && (
        <ShipmentDetailPanel shipment={selectedShipment} onClose={() => setSelectedId(null)} getLatestTemp={getLatestTemp} />
      )}
    </>
  )
}
