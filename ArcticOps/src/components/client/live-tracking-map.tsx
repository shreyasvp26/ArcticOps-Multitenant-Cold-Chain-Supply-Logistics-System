"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Plane, Ship, Train, Truck,
  AlertTriangle, Thermometer, Clock, Shield, RefreshCw, MapPin, X, ChevronRight,
} from "lucide-react"
import type * as LeafletType from "leaflet"
import type { Shipment } from "@/lib/types/shipment"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { formatTemp, formatEta } from "@/lib/utils/format"

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Leaflet wants [lat, lng]; our data is stored as [lng, lat] */
function toLL(coords: [number, number]): [number, number] {
  return [coords[1], coords[0]]
}

function gcInterp(a: [number, number], b: [number, number], t: number): [number, number] {
  const r = (x: number) => (x * Math.PI) / 180
  const d = (x: number) => (x * 180) / Math.PI
  const [lng1, lat1] = a.map(r), [lng2, lat2] = b.map(r)
  const x1 = Math.cos(lat1!) * Math.cos(lng1!), y1 = Math.cos(lat1!) * Math.sin(lng1!), z1 = Math.sin(lat1!)
  const x2 = Math.cos(lat2!) * Math.cos(lng2!), y2 = Math.cos(lat2!) * Math.sin(lng2!), z2 = Math.sin(lat2!)
  const dot = Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2))
  const ang = Math.acos(dot)
  if (ang < 1e-9) return a
  const f = Math.sin((1 - t) * ang) / Math.sin(ang), g = Math.sin(t * ang) / Math.sin(ang)
  const x = f * x1 + g * x2, y = f * y1 + g * y2, z = f * z1 + g * z2
  return [d(Math.atan2(y, x)), d(Math.atan2(z, Math.sqrt(x * x + y * y)))]
}

function curvedLine(wps: [number, number][], n = 50): [number, number][] {
  if (wps.length < 2) return wps
  const out: [number, number][] = []
  for (let i = 0; i < wps.length - 1; i++) {
    const seg = Array.from({ length: n + 1 }, (_, j) => gcInterp(wps[i]!, wps[i + 1]!, j / n))
    out.push(...(i === 0 ? seg : seg.slice(1)))
  }
  return out
}

function routeProgress(sh: Shipment): number {
  const total = sh.checkpoints.length
  if (total === 0) return 0.5
  const passed = sh.checkpoints.filter((cp) => cp.status === "passed").length
  const hasCur = sh.checkpoints.some((cp) => cp.status === "current")
  return Math.min((passed + (hasCur ? 0.5 : 0)) / total, 0.95)
}

const STATUS_COLORS: Record<string, string> = {
  in_transit: "#00C8A8",
  at_customs: "#FFA502",
}
const STATUS_BG: Record<string, string> = {
  in_transit: "rgba(0,200,168,0.10)",
  at_customs: "rgba(255,165,2,0.10)",
}
const ZONE_COLOR: Record<string, string> = {
  ultra_cold: "#7C3AED", frozen: "#3B82F6", refrigerated: "#06B6D4",
}
const ZONE_LABEL: Record<string, string> = {
  ultra_cold: "Ultra Cold", frozen: "Frozen", refrigerated: "Refrigerated",
}

// ─── Left shipment list ────────────────────────────────────────────────────────

function ShipmentListPanel({
  shipments, selectedId, onSelect, getTemp,
}: {
  shipments: Shipment[]
  selectedId: string | null
  onSelect: (id: string) => void
  getTemp: (id: string) => { temperature: number; isExcursion: boolean } | null
}) {
  const inTransit = shipments.filter((s) => s.status === "in_transit")
  const atCustoms = shipments.filter((s) => s.status === "at_customs")
  const groups = [
    { label: "IN TRANSIT", items: inTransit },
    { label: "AT CUSTOMS", items: atCustoms },
  ].filter((g) => g.items.length > 0)

  return (
    <div
      style={{
        position: "absolute", left: 10, top: 10, bottom: 10, zIndex: 1000,
        width: 240,
        display: "flex", flexDirection: "column",
        background: "rgba(8,16,34,0.93)",
        backdropFilter: "blur(20px)",
        borderRadius: 14,
        border: "1px solid rgba(30,48,80,0.9)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid rgba(30,48,80,0.8)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 7px", borderRadius: 20, background: "rgba(0,200,168,0.12)", border: "1px solid rgba(0,200,168,0.28)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00C8A8", display: "inline-block", animation: "cp-pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#00C8A8", fontFamily: "var(--ao-font-mono)" }}>LIVE</span>
          </div>
          <span style={{ fontSize: 10, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {inTransit.length} in transit
          </span>
        </div>
        <span style={{ fontSize: 9, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>
          {shipments.length} total
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        {groups.map(({ label, items }) => (
          <div key={label}>
            <div style={{ padding: "8px 12px 4px" }}>
              <span style={{ fontSize: 9, letterSpacing: "0.1em", color: "rgba(100,116,139,0.6)", fontFamily: "var(--ao-font-mono)" }}>{label}</span>
            </div>
            {items.map((sh) => {
              const temp = getTemp(sh.id)
              const color = STATUS_COLORS[sh.status] ?? "#00C8A8"
              const pct = Math.round(routeProgress(sh) * 100)
              const sel = selectedId === sh.id
              const hasAlert = sh.riskScore > 60 || (temp?.isExcursion ?? false)
              return (
                <button
                  key={sh.id}
                  onClick={() => onSelect(sh.id)}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 12px 10px",
                    background: sel ? `linear-gradient(90deg, ${color}14 0%, transparent 100%)` : "transparent",
                    borderLeft: `2px solid ${sel ? color : "transparent"}`,
                    borderBottom: "1px solid rgba(30,48,80,0.4)",
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: sel ? color : "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
                      {hasAlert && <AlertTriangle style={{ width: 9, height: 9, color: "#FF4757" }} />}
                    </div>
                    <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: STATUS_BG[sh.status], color, letterSpacing: "0.05em", fontFamily: "var(--ao-font-mono)" }}>
                      {sh.status === "at_customs" ? "CUSTOMS" : "TRANSIT"}
                    </span>
                  </div>
                  <p style={{ fontSize: 10, color: "var(--ao-text-muted)", marginBottom: 5, fontFamily: "var(--ao-font-body)" }}>
                    {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(30,48,80,0.8)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, boxShadow: `0 0 5px ${color}55`, transition: "width 3s ease" }} />
                    </div>
                    <span style={{ fontSize: 8, color: "rgba(100,116,139,0.6)", fontFamily: "var(--ao-font-mono)" }}>{pct}%</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {temp ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Thermometer style={{ width: 9, height: 9, color: temp.isExcursion ? "#FF4757" : (ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4") }} />
                        <span style={{ fontSize: 9, color: temp.isExcursion ? "#FF4757" : (ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4"), fontFamily: "var(--ao-font-mono)" }}>
                          {formatTemp(temp.temperature)}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4", display: "inline-block" }} />
                        <span style={{ fontSize: 9, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-body)" }}>{ZONE_LABEL[sh.temperatureZone]}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock style={{ width: 8, height: 8, color: "rgba(100,116,139,0.4)" }} />
                      <span style={{ fontSize: 9, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>{formatEta(sh.eta)}</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Right detail panel ────────────────────────────────────────────────────────

function DetailPanel({
  shipment: sh, onClose, getTemp, onFullDetail,
}: {
  shipment: Shipment
  onClose: () => void
  getTemp: (id: string) => { temperature: number; isExcursion: boolean } | null
  onFullDetail: () => void
}) {
  const temp = getTemp(sh.id)
  const color = STATUS_COLORS[sh.status] ?? "#00C8A8"
  const pct = Math.round(routeProgress(sh) * 100)
  const zoneColor = ZONE_COLOR[sh.temperatureZone] ?? "#06B6D4"
  const modeIcon = (mode: string) => {
    if (mode === "air") return <Plane style={{ width: 9, height: 9 }} />
    if (mode === "sea") return <Ship style={{ width: 9, height: 9 }} />
    if (mode === "rail") return <Train style={{ width: 9, height: 9 }} />
    return <Truck style={{ width: 9, height: 9 }} />
  }

  return (
    <div
      style={{
        position: "absolute", right: 10, top: 10, bottom: 10, zIndex: 1000,
        width: 258,
        display: "flex", flexDirection: "column",
        background: "rgba(8,16,34,0.95)",
        backdropFilter: "blur(24px)",
        borderRadius: 14,
        border: `1px solid ${color}44`,
        boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${color}11, inset 0 1px 0 rgba(255,255,255,0.04)`,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${color}22`, background: `linear-gradient(135deg, ${color}0a 0%, transparent 60%)`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color, fontFamily: "var(--ao-font-mono)", letterSpacing: "0.02em" }}>{sh.id}</span>
              {sh.riskScore > 60 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 5px", borderRadius: 4, background: "rgba(255,71,87,0.15)", border: "1px solid rgba(255,71,87,0.3)" }}>
                  <AlertTriangle style={{ width: 8, height: 8, color: "#FF4757" }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#FF4757", fontFamily: "var(--ao-font-mono)" }}>HIGH RISK</span>
                </div>
              )}
            </div>
            <p style={{ fontSize: 11, color: "var(--ao-text-secondary)", fontWeight: 600, fontFamily: "var(--ao-font-body)" }}>{sh.clientName}</p>
          </div>
          <button
            onClick={onClose}
            style={{ width: 24, height: 24, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(30,48,80,0.5)", color: "var(--ao-text-muted)", cursor: "pointer", flexShrink: 0 }}
          >
            <X style={{ width: 10, height: 10 }} />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 7px", borderRadius: 20, background: STATUS_BG[sh.status], border: `1px solid ${color}44`, fontSize: 9, fontWeight: 700, color, fontFamily: "var(--ao-font-mono)", letterSpacing: "0.06em" }}>
            {sh.status === "in_transit" && <span style={{ animation: "cp-pulse 2s ease-in-out infinite" }}>●</span>}
            {sh.status === "in_transit" ? "IN TRANSIT" : "AT CUSTOMS"}
          </span>
          <span style={{ padding: "2px 6px", borderRadius: 20, background: `${zoneColor}15`, border: `1px solid ${zoneColor}33`, fontSize: 8, fontWeight: 600, color: zoneColor, fontFamily: "var(--ao-font-mono)" }}>
            {ZONE_LABEL[sh.temperatureZone]}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 12, scrollbarWidth: "none" }}>
        {/* Route */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}>
            <MapPin style={{ width: 9, height: 9, color: "var(--ao-text-muted)" }} />
            <span style={{ fontSize: 8, letterSpacing: "0.08em", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>ROUTE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{sh.origin.split(",")[0]}</p>
              <p style={{ fontSize: 9, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sh.origin.split(",").slice(1).join(",").trim()}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ao-text-muted)" }} />
              <div style={{ position: "relative", width: 36, height: 1, background: `linear-gradient(90deg, var(--ao-text-muted), ${color})` }}>
                <div style={{ position: "absolute", left: `${pct}%`, top: -4, transform: "translateX(-50%)", width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
              </div>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{sh.destination.split(",")[0]}</p>
              <p style={{ fontSize: 9, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sh.destination.split(",").slice(1).join(",").trim()}</p>
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: "rgba(30,48,80,0.8)", overflow: "hidden", marginBottom: 3 }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, boxShadow: `0 0 8px ${color}55`, transition: "width 3s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>0%</span>
            <span style={{ fontSize: 9, color, fontFamily: "var(--ao-font-mono)" }}>{pct}% complete</span>
            <span style={{ fontSize: 8, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>100%</span>
          </div>
        </div>

        {/* Temperature */}
        <div style={{ borderRadius: 10, padding: 10, background: temp?.isExcursion ? "rgba(255,71,87,0.06)" : `${zoneColor}0a`, border: `1px solid ${temp?.isExcursion ? "rgba(255,71,87,0.3)" : zoneColor + "22"}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Thermometer style={{ width: 10, height: 10, color: temp?.isExcursion ? "#FF4757" : zoneColor }} />
              <span style={{ fontSize: 8, letterSpacing: "0.08em", color: temp?.isExcursion ? "#FF4757" : zoneColor, fontFamily: "var(--ao-font-mono)" }}>
                TEMPERATURE {temp && <span style={{ animation: "cp-pulse 2s ease-in-out infinite" }}>●</span>}
              </span>
            </div>
            {temp?.isExcursion && (
              <span style={{ fontSize: 8, fontWeight: 700, color: "#FF4757", background: "rgba(255,71,87,0.15)", padding: "1px 5px", borderRadius: 3, fontFamily: "var(--ao-font-mono)" }}>EXCURSION</span>
            )}
          </div>
          {temp ? (
            <p style={{ fontSize: 22, fontWeight: 700, color: temp.isExcursion ? "#FF4757" : zoneColor, fontFamily: "var(--ao-font-mono)", lineHeight: 1 }}>
              {formatTemp(temp.temperature)}
            </p>
          ) : (
            <p style={{ fontSize: 11, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No reading</p>
          )}
          <p style={{ fontSize: 9, color: "var(--ao-text-muted)", marginTop: 3, fontFamily: "var(--ao-font-body)" }}>
            Target: {sh.requiredTempMin}°C – {sh.requiredTempMax}°C
          </p>
        </div>

        {/* Stats 2×2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {[
            { label: "ETA", value: formatEta(sh.eta), icon: <Clock style={{ width: 9, height: 9 }} />, accent: "var(--ao-text-secondary)" },
            { label: "Cold Chain", value: `${sh.coldChainConfidence}%`, icon: <Shield style={{ width: 9, height: 9 }} />, accent: sh.coldChainConfidence >= 85 ? "#00C8A8" : sh.coldChainConfidence >= 70 ? "#FFA502" : "#FF4757" },
            { label: "Risk Score", value: sh.riskScore, icon: <AlertTriangle style={{ width: 9, height: 9 }} />, accent: sh.riskScore > 60 ? "#FF4757" : sh.riskScore > 30 ? "#FFA502" : "#00C8A8" },
            { label: "Carrier", value: sh.carrierName.split(" ")[0]!, icon: <Plane style={{ width: 9, height: 9 }} />, accent: "var(--ao-text-muted)" },
          ].map(({ label, value, icon, accent }) => (
            <div key={label} style={{ borderRadius: 8, padding: 8, background: "rgba(30,48,80,0.25)", border: "1px solid rgba(30,48,80,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3, color: "var(--ao-text-muted)" }}>
                {icon}
                <span style={{ fontSize: 8, letterSpacing: "0.06em", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{label.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: accent, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Checkpoints */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
            <RefreshCw style={{ width: 9, height: 9, color: "var(--ao-text-muted)" }} />
            <span style={{ fontSize: 8, letterSpacing: "0.08em", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>CHECKPOINTS</span>
          </div>
          {sh.checkpoints.map((cp, idx) => {
            const isCur = cp.status === "current"
            const isPassed = cp.status === "passed"
            const isLast = idx === sh.checkpoints.length - 1
            const dotColor = isCur ? color : isPassed ? "#2ED573" : "rgba(30,48,80,1)"
            const dotBorder = isCur ? color : isPassed ? "#2ED573" : "rgba(100,116,139,0.4)"
            return (
              <div key={cp.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", minHeight: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 2, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, border: `1.5px solid ${dotBorder}`, boxShadow: isCur ? `0 0 6px ${color}88` : "none", animation: isCur ? "cp-pulse 2s ease-in-out infinite" : "none", flexShrink: 0 }} />
                  {!isLast && <div style={{ width: 1, flex: 1, marginTop: 2, background: isPassed ? "rgba(46,213,115,0.3)" : "rgba(30,48,80,0.6)", minHeight: 14 }} />}
                </div>
                <div style={{ paddingBottom: 8 }}>
                  <p style={{ fontSize: 10, color: isCur ? "var(--ao-text-primary)" : isPassed ? "var(--ao-text-secondary)" : "var(--ao-text-muted)", fontWeight: isCur ? 600 : 400, fontFamily: "var(--ao-font-body)" }}>
                    {cp.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {isCur && <span style={{ fontSize: 8, color, fontWeight: 700, fontFamily: "var(--ao-font-mono)" }}>CURRENT · </span>}
                    {modeIcon(sh.legs[idx - 1]?.mode ?? sh.legs[0]?.mode ?? "air")}
                    <span style={{ fontSize: 9, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-body)" }}>{cp.city}, {cp.country}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cargo */}
        <div style={{ borderRadius: 10, padding: 10, background: "rgba(30,48,80,0.3)", border: "1px solid rgba(30,48,80,0.6)" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.08em", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>CARGO</span>
          {sh.materials.map((m) => (
            <div key={m.materialId} style={{ marginTop: 5 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{m.name}</p>
              <p style={{ fontSize: 9, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{m.quantity.toLocaleString()} {m.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "8px 14px 12px", borderTop: "1px solid rgba(30,48,80,0.6)", flexShrink: 0 }}>
        <button
          onClick={onFullDetail}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: "pointer",
            background: `linear-gradient(135deg, ${color}22, ${color}10)`,
            border: `1px solid ${color}40`, color, fontFamily: "var(--ao-font-body)",
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.15)" }}
          onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
        >
          Full Shipment Detail <ChevronRight style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  )
}

// ─── marker HTML ──────────────────────────────────────────────────────────────

function markerHtml(color: string, isMoving: boolean, riskScore: number, selected: boolean) {
  if (selected) {
    const size = isMoving ? 20 : 16
    return `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
      <div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:0.6;animation:ring-expand 1.5s ease-out infinite;pointer-events:none;"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 0 16px ${color},0 0 32px ${color}44;"></div>
    </div>`
  }
  const size = isMoving ? 14 : 10
  const danger = riskScore > 60
  const rings = isMoving ? `
    <div style="position:absolute;inset:-8px;border-radius:50%;border:1.5px solid ${color};opacity:0;animation:ring-expand 2.5s ease-out infinite;pointer-events:none;"></div>
    <div style="position:absolute;inset:-5px;border-radius:50%;border:1px solid ${color};opacity:0;animation:ring-expand 2.5s ease-out 1.1s infinite;pointer-events:none;"></div>` : ""
  const shadow = danger
    ? `box-shadow:0 0 0 0 ${color}80;animation:danger-pulse 1.8s ease-in-out infinite;`
    : `box-shadow:0 0 10px ${color}66,0 0 20px ${color}22;`
  return `<div style="position:relative;width:${size}px;height:${size}px;cursor:pointer;">
    ${rings}
    <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.6);${shadow}"></div>
    ${danger ? `<div style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;background:#FF4757;border-radius:50%;border:1px solid #0D1829;"></div>` : ""}
  </div>`
}

// ─── draw all routes + markers on the map ─────────────────────────────────────
// Extracted so it can be called both on init and whenever shipments change.

function drawRoutes(
  L: typeof LeafletType,
  map: LeafletType.Map,
  shipments: Shipment[],
  selectedId: string | null,
  polylinesRef: React.MutableRefObject<LeafletType.Layer[]>,
  markersRef: React.MutableRefObject<Map<string, LeafletType.Marker>>,
  onMarkerClick: (id: string) => void,
) {
  // Remove old layers
  polylinesRef.current.forEach((l) => l.remove())
  polylinesRef.current = []
  markersRef.current.forEach((m) => m.remove())
  markersRef.current.clear()

  shipments.forEach((sh) => {
    const color = STATUS_COLORS[sh.status] ?? "#00C8A8"

    const passedCoords = sh.checkpoints
      .filter((cp) => cp.status === "passed" || cp.status === "current")
      .map((cp) => cp.coordinates as [number, number])
    const upcomingCoords = sh.checkpoints
      .filter((cp) => cp.status === "upcoming")
      .map((cp) => cp.coordinates as [number, number])

    // ── Solid completed path (origin → passed checkpoints) ──
    if (passedCoords.length >= 1) {
      const pts = curvedLine([sh.originCoordinates as [number, number], ...passedCoords])
      const leafPts = pts.map(toLL) as [number, number][]
      polylinesRef.current.push(
        L.polyline(leafPts, { color, weight: 3, opacity: 0.9 }).addTo(map),
        L.polyline(leafPts, { color, weight: 8, opacity: 0.07 }).addTo(map), // glow halo
      )
    }

    // ── Dashed upcoming path (current → upcoming checkpoints → destination) ──
    const upWps: [number, number][] = [
      sh.currentCoordinates as [number, number],
      ...upcomingCoords,
      sh.destinationCoordinates as [number, number],
    ]
    const upPts = curvedLine(upWps)
    if (upPts.length >= 2) {
      polylinesRef.current.push(
        L.polyline(upPts.map(toLL) as [number, number][], { color, weight: 1.5, opacity: 0.4, dashArray: "6, 7" }).addTo(map)
      )
    }

    // ── Origin dot ──
    const originMarker = L.marker(toLL(sh.originCoordinates as [number, number]), {
      icon: L.divIcon({
        html: `<div style="width:8px;height:8px;border-radius:50%;background:rgba(100,116,139,0.6);border:2px solid rgba(148,163,184,0.8);box-shadow:0 0 4px rgba(148,163,184,0.3);"></div>`,
        className: "", iconSize: [8, 8], iconAnchor: [4, 4],
      }),
      interactive: false,
    }).addTo(map)
    polylinesRef.current.push(originMarker as unknown as LeafletType.Layer)

    // ── Destination diamond ──
    const destMarker = L.marker(toLL(sh.destinationCoordinates as [number, number]), {
      icon: L.divIcon({
        html: `<div style="width:10px;height:10px;border-radius:2px;transform:rotate(45deg);background:${color}55;border:2px solid ${color};box-shadow:0 0 8px ${color}66;"></div>`,
        className: "", iconSize: [10, 10], iconAnchor: [5, 5],
      }),
      interactive: false,
    }).addTo(map)
    polylinesRef.current.push(destMarker as unknown as LeafletType.Layer)

    // ── Checkpoint dots for upcoming stops ──
    upcomingCoords.forEach((coord) => {
      const cpMarker = L.marker(toLL(coord), {
        icon: L.divIcon({
          html: `<div style="width:5px;height:5px;border-radius:50%;background:${color}44;border:1px solid ${color}88;"></div>`,
          className: "", iconSize: [5, 5], iconAnchor: [2, 2],
        }),
        interactive: false,
      }).addTo(map)
      polylinesRef.current.push(cpMarker as unknown as LeafletType.Layer)
    })
  })

  // ── Shipment position markers (on top) ──
  shipments.forEach((sh) => {
    const color = STATUS_COLORS[sh.status] ?? "#00C8A8"
    const isMoving = sh.status === "in_transit"
    const sel = sh.id === selectedId
    const size = sel ? (isMoving ? 20 : 16) : (isMoving ? 14 : 10)
    const html = markerHtml(color, isMoving, sh.riskScore, sel)
    const marker = L.marker(toLL(sh.currentCoordinates as [number, number]), {
      icon: L.divIcon({ html, className: "ao-ship-marker", iconSize: [size, size], iconAnchor: [size / 2, size / 2] }),
      zIndexOffset: sel ? 2000 : isMoving ? 1000 : 0,
    }).addTo(map)
    marker.on("click", () => onMarkerClick(sh.id))
    markersRef.current.set(sh.id, marker)
  })
}

// ─── main export ───────────────────────────────────────────────────────────────

interface Props {
  shipments: Shipment[]
  height?: number
}

export function LiveTrackingMap({ shipments, height = 480 }: Props) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletType.Map | null>(null)
  const LRef = useRef<typeof LeafletType | null>(null)
  const markersRef = useRef<Map<string, LeafletType.Marker>>(new Map())
  const polylinesRef = useRef<LeafletType.Layer[]>([])
  const mapReadyRef = useRef(false)
  const fitDoneRef = useRef(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const getTemp = useTemperatureStore((s) => s.getLatest)
  const initTemp = useTemperatureStore((s) => s.initialize)
  const tempInit = useTemperatureStore((s) => s.initialized)
  useEffect(() => { if (!tempInit) initTemp() }, [tempInit, initTemp])

  const handleMarkerClick = useCallback((id: string) => {
    setSelectedId((prev) => {
      const next = prev === id ? null : id
      if (next && mapRef.current) {
        const sh = shipments.find((s) => s.id === next)
        if (sh) mapRef.current.flyTo(toLL(sh.currentCoordinates as [number, number]), 5, { duration: 1.2 })
      }
      return next
    })
  }, [shipments])

  // ── Initialize Leaflet map once ──────────────────────────────────────────────
  useEffect(() => {
    if (mapReadyRef.current || !containerRef.current || typeof window === "undefined") return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapReadyRef.current) return
      mapReadyRef.current = true
      LRef.current = L

      if (!document.getElementById("leaflet-css-client")) {
        const link = document.createElement("link")
        link.id = "leaflet-css-client"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      const map = new L.Map(containerRef.current!, {
        center: [20, 30], zoom: 3,
        zoomControl: false, minZoom: 2,
        maxBounds: [[-85, -180], [85, 180]],
        attributionControl: false,
      })
      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20,
      }).addTo(map)
      mapRef.current = map
    }).catch(console.error)

    return () => {
      mapReadyRef.current = false
      fitDoneRef.current = false
      polylinesRef.current.forEach((l) => { try { (l as LeafletType.Layer & { remove?: () => void }).remove?.() } catch {} })
      polylinesRef.current = []
      markersRef.current.forEach((m) => { try { m.remove() } catch {} })
      markersRef.current.clear()
      if (mapRef.current) { try { mapRef.current.remove() } catch {} ; mapRef.current = null }
      LRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Re-draw routes when shipment set changes (first load / new shipments) ──────
  // Uses a key based on shipment IDs only — NOT coordinates — so this only fires
  // when the set of tracked shipments actually changes, not on every position tick.
  const shipmentIdsKey = shipments.map((s) => s.id).join("|")
  useEffect(() => {
    const L = LRef.current
    const map = mapRef.current
    if (!L || !map || shipments.length === 0) return

    drawRoutes(L, map, shipments, selectedIdRef.current, polylinesRef, markersRef, handleMarkerClick)

    // Fit bounds once after the initial draw
    if (!fitDoneRef.current) {
      fitDoneRef.current = true
      const allCoords = shipments.flatMap((sh) => [
        sh.originCoordinates as [number, number],
        sh.currentCoordinates as [number, number],
        sh.destinationCoordinates as [number, number],
        ...sh.checkpoints.map((cp) => cp.coordinates as [number, number]),
      ])
      const unique = allCoords.filter((c, i, arr) =>
        arr.findIndex((x) => x[0] === c[0] && x[1] === c[1]) === i
      )
      if (unique.length >= 2) {
        try {
          const bounds = L.latLngBounds(unique.map((c) => toLL(c) as [number, number]))
          map.fitBounds(bounds, { paddingTopLeft: [270, 40], paddingBottomRight: [60, 40], maxZoom: 6 })
        } catch {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentIdsKey, selectedId, handleMarkerClick])

  // ── Smoothly move markers on every live-tracking position tick ───────────────
  // Does NOT redraw polylines — just updates marker lat/lng.
  useEffect(() => {
    if (!mapRef.current) return
    shipments.forEach((sh) => {
      const marker = markersRef.current.get(sh.id)
      if (marker) marker.setLatLng(toLL(sh.currentCoordinates as [number, number]))
    })
  // Depend on coordinates string so this only fires when positions actually change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipments.map((s) => `${s.currentCoordinates[0].toFixed(4)},${s.currentCoordinates[1].toFixed(4)}`).join("|")])

  const handleSelect = useCallback((id: string) => {
    setSelectedId((prev) => {
      const next = prev === id ? null : id
      if (next && mapRef.current) {
        const sh = shipments.find((s) => s.id === next)
        if (sh) mapRef.current.flyTo(toLL(sh.currentCoordinates as [number, number]), 5, { duration: 1.2 })
      }
      return next
    })
  }, [shipments])

  const selectedShipment = selectedId ? shipments.find((s) => s.id === selectedId) ?? null : null

  if (shipments.length === 0) return null

  return (
    <div
      style={{
        position: "relative", height, borderRadius: 16, overflow: "hidden",
        border: "1px solid rgba(30,48,80,0.8)",
        background: "#060D1B",
        boxShadow: "0 4px 32px rgba(0,0,0,0.5)",
      }}
    >
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />

      <ShipmentListPanel
        shipments={shipments}
        selectedId={selectedId}
        onSelect={handleSelect}
        getTemp={getTemp}
      />

      {selectedShipment && (
        <DetailPanel
          shipment={selectedShipment}
          onClose={() => setSelectedId(null)}
          getTemp={getTemp}
          onFullDetail={() => router.push(`/tracker/${selectedShipment.id}`)}
        />
      )}

      <style>{`
        .ao-ship-marker { background: none !important; border: none !important; }
        .leaflet-control-zoom { border: none !important; }
        .leaflet-control-zoom a {
          background: rgba(6,13,27,0.88) !important;
          color: #94a3b8 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(0,200,168,0.15) !important;
          color: #00C8A8 !important;
        }
        @keyframes cp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes ring-expand {
          0%   { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0;   transform: scale(2.4); }
        }
        @keyframes danger-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,71,87,0.5); }
          50%      { box-shadow: 0 0 0 8px rgba(255,71,87,0); }
        }
      `}</style>
    </div>
  )
}
