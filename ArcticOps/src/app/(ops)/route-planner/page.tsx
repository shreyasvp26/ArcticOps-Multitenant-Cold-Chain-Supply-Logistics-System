"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Zap, RefreshCcw, ChevronDown } from "lucide-react"
import { RouteComparison } from "@/components/ops/route-comparison"
import { RouteConfirmModal } from "@/components/ops/route-confirm-modal"
import { ModalPortal } from "@/components/shared/modal-portal"
import { useRouteStore } from "@/lib/store/route-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { MOCK_MATERIALS } from "@/lib/mock-data/materials"
import { MOCK_CLIENTS } from "@/lib/mock-data/clients"
import { fadeVariants } from "@/lib/utils/motion"
import type { RouteOption } from "@/lib/types/route"
import type { Shipment, ShipmentLeg } from "@/lib/types/shipment"
import type { Tenant } from "@/lib/types/auth"

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", sublabel: "7–14 days", daysMin: 7, daysMax: 14, color: "#64748B" },
  { value: "express", label: "Express", sublabel: "3–5 days", daysMin: 3, daysMax: 5, color: "#FFA502" },
  { value: "emergency", label: "Emergency", sublabel: "1–2 days", daysMin: 1, daysMax: 2, color: "#FF4757" },
]

function getExpectedDelivery(daysMin: number, daysMax: number): string {
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const from = new Date(); from.setDate(from.getDate() + daysMin)
  const to = new Date(); to.setDate(to.getDate() + daysMax)
  return `${fmt(from)} – ${fmt(to)}`
}

const ZONE_OPTIONS = [
  { value: "ultra_cold", label: "Ultra-Cold", range: "−70°C" },
  { value: "frozen", label: "Frozen", range: "−20°C" },
  { value: "refrigerated", label: "Refrigerated", range: "2–8°C" },
]

const VIAL_OPTIONS = [
  { value: 0, label: "Any capacity" },
  { value: 1000, label: "1,000+ vials" },
  { value: 5000, label: "5,000+ vials" },
  { value: 10000, label: "10,000+ vials" },
  { value: 50000, label: "50,000+ vials" },
  { value: 100000, label: "100,000+ vials" },
]

const CITY_SUGGESTIONS = [
  "Singapore", "Dubai", "Frankfurt", "London", "New York",
  "Tokyo", "Mumbai", "São Paulo", "Sydney", "Chicago",
  "Amsterdam", "Hong Kong", "Seoul", "Toronto", "Los Angeles",
  "Shanghai", "Beijing", "Paris", "Madrid", "Milan",
  "Istanbul", "Cairo", "Nairobi", "Lagos", "Johannesburg",
  "Bangkok", "Kuala Lumpur", "Jakarta", "Manila", "Ho Chi Minh City",
  "Karachi", "Delhi", "Chennai", "Colombo", "Auckland",
  "Vancouver", "Montreal", "Mexico City", "Buenos Aires", "Lima",
]

/** Map temperature zone to temp-range values for the new shipment */
const ZONE_TEMP: Record<string, { min: number; max: number }> = {
  ultra_cold: { min: -80, max: -60 },
  frozen: { min: -25, max: -15 },
  refrigerated: { min: 2, max: 8 },
}

export default function RoutePlannerPage() {
  const router = useRouter()
  const { routeOptions, isGenerating, generateRoutes } = useRouteStore()
  const { addShipment } = useShipmentStore()

  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [clientId, setClientId] = useState("")
  const [materials, setMaterials] = useState<string[]>([])
  const [zone, setZone] = useState("refrigerated")
  const [urgency, setUrgency] = useState("standard")
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
  const [destSuggestions, setDestSuggestions] = useState<string[]>([])
  const [matSearch, setMatSearch] = useState("")
  const [minVials, setMinVials] = useState(0)

  // Confirmation modal state
  const [confirmRoute, setConfirmRoute] = useState<RouteOption | null>(null)

  const materialOptions = MOCK_MATERIALS.filter((m) =>
    matSearch ? m.name.toLowerCase().includes(matSearch.toLowerCase()) : true
  ).slice(0, 8)

  const selectedClient: Tenant | null = MOCK_CLIENTS.find((c) => c.id === clientId) ?? null

  const handleGenerate = () => {
    if (!origin || !destination) return
    generateRoutes(origin, destination)
  }

  const toggleMaterial = (id: string) =>
    setMaterials((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id])

  const suggestOrigin = (v: string) => {
    setOrigin(v)
    setOriginSuggestions(v.length > 1 ? CITY_SUGGESTIONS.filter((c) => c.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : [])
  }
  const suggestDest = (v: string) => {
    setDestination(v)
    setDestSuggestions(v.length > 1 ? CITY_SUGGESTIONS.filter((c) => c.toLowerCase().startsWith(v.toLowerCase())).slice(0, 5) : [])
  }

  /** Called from RouteComparison when user clicks "Select Route" */
  const handleSelectRoute = (route: RouteOption) => {
    setConfirmRoute(route)
  }

  /** User clicked Confirm in the modal — build a Shipment and save it */
  const handleConfirm = () => {
    if (!confirmRoute) return

    const now = new Date().toISOString()
    const etaDate = new Date(Date.now() + confirmRoute.totalEtaHours * 3_600_000).toISOString()
    const temps = ZONE_TEMP[zone] ?? { min: 2, max: 8 }

    // Build legs from route legs
    const legs: ShipmentLeg[] = confirmRoute.legs.map((leg, i) => ({
      id: `leg_${i + 1}`,
      mode: leg.mode,
      origin: leg.origin,
      destination: leg.destination,
      carrierId: leg.carrierId ?? "carrier_arctic_express",
      departureTime: now,
      arrivalTime: new Date(Date.now() + leg.etaHours * 3_600_000).toISOString(),
      distanceKm: leg.distanceKm,
    }))

    // Build selected material objects
    const selectedMats = MOCK_MATERIALS
      .filter((m) => materials.includes(m.id))
      .map((m) => ({ materialId: m.id, name: m.name, quantity: 1, unit: "unit" }))

    const shipmentId = `SH-${Math.floor(Math.random() * 9000) + 1000}`

    const newShipment: Shipment = {
      id: shipmentId,
      tenantId: selectedClient?.id ?? "tenant_pharma_alpha",
      clientName: selectedClient?.name ?? "Unknown Client",
      materials: selectedMats.length > 0 ? selectedMats : [{ materialId: "mat_000", name: "General Cargo", quantity: 1, unit: "unit" }],
      origin,
      destination,
      originCoordinates: confirmRoute.legs[0]?.originCoords ?? [0, 0],
      destinationCoordinates: confirmRoute.legs[confirmRoute.legs.length - 1]?.destinationCoords ?? [0, 0],
      currentCoordinates: confirmRoute.legs[0]?.originCoords ?? [0, 0],
      status: "requested",
      temperatureZone: (zone as "ultra_cold" | "frozen" | "refrigerated"),
      requiredTempMin: temps.min,
      requiredTempMax: temps.max,
      carrierId: confirmRoute.legs[0]?.carrierId ?? "carrier_arctic_express",
      carrierName: "Arctic Express Logistics",
      assignedCrewIds: [],
      legs,
      checkpoints: [
        {
          id: "cp_1",
          name: `${origin} Origin`,
          city: origin,
          country: "",
          coordinates: confirmRoute.legs[0]?.originCoords ?? [0, 0],
          estimatedArrival: now,
          status: "upcoming",
        },
        {
          id: "cp_2",
          name: `${destination} Destination`,
          city: destination,
          country: "",
          coordinates: confirmRoute.legs[confirmRoute.legs.length - 1]?.destinationCoords ?? [0, 0],
          estimatedArrival: etaDate,
          status: "upcoming",
        },
      ],
      riskScore: confirmRoute.riskScore,
      coldChainConfidence: confirmRoute.tempMaintenanceConfidence,
      eta: etaDate,
      departureDate: now,
      complianceDocIds: [],
      createdAt: now,
    }

    addShipment(newShipment)
    setConfirmRoute(null)
    router.push("/shipments")
  }

  return (
    <>
      {/* Confirm modal — rendered in a portal to sit above everything regardless of scroll */}
      {confirmRoute && (
        <ModalPortal>
          <RouteConfirmModal
            route={confirmRoute}
            origin={origin}
            destination={destination}
            zone={zone}
            urgency={urgency}
            client={selectedClient}
            onConfirm={handleConfirm}
            onCancel={() => setConfirmRoute(null)}
          />
        </ModalPortal>
      )}

      <div className="flex h-full gap-0 overflow-hidden">
        {/* Left input panel — 35% */}
        <div
          className="w-[35%] shrink-0 border-r overflow-y-auto p-5 flex flex-col gap-5"
          style={{
            borderColor: "var(--ao-border)",
            background: "linear-gradient(180deg, rgba(7,12,22,0.85) 0%, rgba(6,13,27,0.9) 100%)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-6 h-6 rounded flex items-center justify-center"
                style={{ background: "rgba(0,200,168,0.15)", border: "1px solid rgba(0,200,168,0.25)" }}
              >
                <Zap className="w-3 h-3" style={{ color: "var(--ao-accent)" }} />
              </div>
              <h2 className="text-[12px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.12em" }}>
                Route Criteria
              </h2>
            </div>

            {/* ── Client Selector ───────────────────────────────────── */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                Client
              </label>
              <div className="relative">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none pr-9 cursor-pointer"
                  style={{
                    backgroundColor: "var(--ao-surface)",
                    border: clientId ? "1px solid var(--ao-accent)" : "1px solid var(--ao-border)",
                    color: clientId ? "var(--ao-text-primary)" : "var(--ao-text-muted)",
                    fontFamily: "var(--ao-font-body)",
                  }}
                >
                  <option value="" style={{ backgroundColor: "#060D1B", color: "#64748B" }}>Select client…</option>
                  {MOCK_CLIENTS.map((c) => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: "#060D1B", color: "#F1F5F9" }}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "var(--ao-text-muted)" }}
                />
              </div>
              {/* Show selected client's contact */}
              {selectedClient && (
                <p className="mt-1.5 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Contact: {selectedClient.primaryContact} · {selectedClient.contactEmail}
                </p>
              )}
            </div>

            {/* ── Load Capacity ─────────────────────────────────────── */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                Load Capacity (Min. Vials)
              </label>
              <div className="relative">
                <select
                  value={minVials}
                  onChange={(e) => setMinVials(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none appearance-none pr-9 cursor-pointer"
                  style={{
                    backgroundColor: "var(--ao-surface)",
                    border: minVials > 0 ? "1px solid #818CF8" : "1px solid var(--ao-border)",
                    color: minVials > 0 ? "#818CF8" : "var(--ao-text-secondary)",
                    fontFamily: "var(--ao-font-body)",
                  }}
                >
                  {VIAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} style={{ backgroundColor: "#060D1B", color: "#F1F5F9" }}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "var(--ao-text-muted)" }} />
              </div>
              {minVials > 0 && (
                <p className="mt-1.5 text-[11px]" style={{ color: "#818CF8", fontFamily: "var(--ao-font-body)" }}>
                  Showing routes with ≥ {minVials.toLocaleString()} vial capacity
                </p>
              )}
            </div>

            {/* ── Origin ───────────────────────────────────────────── */}
            <div className="relative mb-3">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Origin</label>
              <input value={origin} onChange={(e) => suggestOrigin(e.target.value)}
                placeholder="e.g. Singapore"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
              {originSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-xl"
                  style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)" }}>
                  {originSuggestions.map((s) => (
                    <button key={s} onClick={() => { setOrigin(s); setOriginSuggestions([]) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.05)]"
                      style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Destination ──────────────────────────────────────── */}
            <div className="relative mb-3">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Destination</label>
              <input value={destination} onChange={(e) => suggestDest(e.target.value)}
                placeholder="e.g. Frankfurt"
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
              {destSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-xl"
                  style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)" }}>
                  {destSuggestions.map((s) => (
                    <button key={s} onClick={() => { setDestination(s); setDestSuggestions([]) }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[rgba(255,255,255,0.05)]"
                      style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{s}</button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Temperature Zone ─────────────────────────────────── */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Temperature Zone</label>
              <div className="flex gap-2">
                {ZONE_OPTIONS.map(({ value, label, range }) => (
                  <button key={value} onClick={() => setZone(value)}
                    className="flex-1 py-2 rounded-lg text-center transition-all"
                    style={{
                      backgroundColor: zone === value ? "rgba(0,200,168,0.12)" : "var(--ao-surface)",
                      border: `1px solid ${zone === value ? "var(--ao-accent)" : "var(--ao-border)"}`,
                      color: zone === value ? "var(--ao-accent)" : "var(--ao-text-muted)",
                    }}>
                    <p className="text-[12px] font-medium" style={{ fontFamily: "var(--ao-font-body)" }}>{label}</p>
                    <p className="text-[10px]" style={{ fontFamily: "var(--ao-font-mono)" }}>{range}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Urgency ──────────────────────────────────────────── */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Urgency Level</label>
              <div className="flex flex-col gap-1.5">
                {URGENCY_OPTIONS.map(({ value, label, sublabel, daysMin, daysMax, color }) => (
                  <label key={value} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all"
                    style={{
                      backgroundColor: urgency === value ? `${color}0D` : "var(--ao-surface)",
                      border: `1px solid ${urgency === value ? color : "var(--ao-border)"}`,
                    }}>
                    <input type="radio" name="urgency" value={value} checked={urgency === value} onChange={() => setUrgency(value)} className="sr-only" />
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                      style={{ borderColor: urgency === value ? color : "var(--ao-border)", backgroundColor: urgency === value ? color : "transparent" }}>
                      {urgency === value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                        <p className="text-[10px] font-semibold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{sublabel}</p>
                      </div>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        Est. delivery: {getExpectedDelivery(daysMin, daysMax)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* ── Materials ────────────────────────────────────────── */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Materials (optional)</label>
              <input value={matSearch} onChange={(e) => setMatSearch(e.target.value)} placeholder="Filter materials…"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none mb-2"
                style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
              <div className="flex flex-wrap gap-1.5">
                {materialOptions.map((m) => {
                  const selected = materials.includes(m.id)
                  return (
                    <button key={m.id} onClick={() => toggleMaterial(m.id)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
                      style={{
                        backgroundColor: selected ? "rgba(0,200,168,0.12)" : "var(--ao-surface-elevated)",
                        border: `1px solid ${selected ? "var(--ao-accent)" : "var(--ao-border)"}`,
                        color: selected ? "var(--ao-accent)" : "var(--ao-text-muted)",
                        fontFamily: "var(--ao-font-body)",
                      }}>
                      {m.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Generate button ───────────────────────────────────── */}
            <button
              onClick={handleGenerate}
              disabled={!origin || !destination || isGenerating}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, var(--ao-accent) 0%, #00B894 100%)",
                color: "#060D1B",
                fontFamily: "var(--ao-font-body)",
                boxShadow: "0 4px 20px rgba(0,200,168,0.3)",
              }}
            >
              {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isGenerating ? "Generating…" : "Generate Routes"}
            </button>
          </div>
        </div>

        {/* Right results panel — 65% */}
        <div className="flex-1 overflow-y-auto p-5">
          <motion.div variants={fadeVariants} initial="initial" animate="animate" key={routeOptions.length}>
            <RouteComparison
              routes={routeOptions}
              isGenerating={isGenerating}
              origin={origin}
              destination={destination}
              onSelectRoute={handleSelectRoute}
              minVials={minVials}
            />
          </motion.div>
        </div>
      </div>
    </>
  )
}
