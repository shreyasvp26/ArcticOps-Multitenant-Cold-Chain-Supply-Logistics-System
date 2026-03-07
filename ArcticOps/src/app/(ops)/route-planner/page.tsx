"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Zap, RefreshCcw } from "lucide-react"
import { RouteComparison } from "@/components/ops/route-comparison"
import { useRouteStore } from "@/lib/store/route-store"
import { MOCK_MATERIALS } from "@/lib/mock-data/materials"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"

const URGENCY_OPTIONS = [
  { value: "standard", label: "Standard", sublabel: "7–14 days", color: "#64748B" },
  { value: "express", label: "Express", sublabel: "3–5 days", color: "#FFA502" },
  { value: "emergency", label: "Emergency", sublabel: "1–2 days", color: "#FF4757" },
]

const ZONE_OPTIONS = [
  { value: "ultra_cold", label: "Ultra-Cold", range: "−70°C" },
  { value: "frozen", label: "Frozen", range: "−20°C" },
  { value: "refrigerated", label: "Refrigerated", range: "2–8°C" },
]

const CITY_SUGGESTIONS = [
  "Singapore", "Dubai", "Frankfurt", "London", "New York",
  "Tokyo", "Mumbai", "São Paulo", "Sydney", "Chicago",
  "Amsterdam", "Hong Kong", "Seoul", "Toronto"
]

export default function RoutePlannerPage() {
  const { routeOptions, isGenerating, generateRoutes } = useRouteStore()
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [materials, setMaterials] = useState<string[]>([])
  const [zone, setZone] = useState("refrigerated")
  const [urgency, setUrgency] = useState("standard")
  const [deadline, setDeadline] = useState("")
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
  const [destSuggestions, setDestSuggestions] = useState<string[]>([])
  const [matSearch, setMatSearch] = useState("")

  const materialOptions = MOCK_MATERIALS.filter((m) =>
    matSearch ? m.name.toLowerCase().includes(matSearch.toLowerCase()) : true
  ).slice(0, 8)

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

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* Left input panel — 35% */}
      <div
        className="w-[35%] shrink-0 border-r overflow-y-auto p-5 flex flex-col gap-5"
        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.7)" }}
      >
        <div>
          <h2 className="text-[13px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Route Criteria
          </h2>

          {/* Origin */}
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

          {/* Destination */}
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

          {/* Temperature zone */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Temperature Zone</label>
            <div className="flex gap-2">
              {ZONE_OPTIONS.map(({ value, label, range }) => (
                <button key={value} onClick={() => setZone(value)}
                  className="flex-1 py-2 rounded-lg text-center transition-all"
                  style={{
                    backgroundColor: zone === value ? "rgba(0,212,170,0.12)" : "var(--ao-surface)",
                    border: `1px solid ${zone === value ? "var(--ao-accent)" : "var(--ao-border)"}`,
                    color: zone === value ? "var(--ao-accent)" : "var(--ao-text-muted)",
                  }}>
                  <p className="text-[12px] font-medium" style={{ fontFamily: "var(--ao-font-body)" }}>{label}</p>
                  <p className="text-[10px]" style={{ fontFamily: "var(--ao-font-mono)" }}>{range}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Delivery Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }} />
          </div>

          {/* Urgency */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Urgency Level</label>
            <div className="flex flex-col gap-1.5">
              {URGENCY_OPTIONS.map(({ value, label, sublabel, color }) => (
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
                  <div>
                    <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                    <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sublabel}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Materials */}
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
                      backgroundColor: selected ? "rgba(0,212,170,0.12)" : "var(--ao-surface-elevated)",
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!origin || !destination || isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--ao-accent)", color: "#0A1628", fontFamily: "var(--ao-font-body)" }}
          >
            {isGenerating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isGenerating ? "Generating…" : "Generate Routes"}
          </button>
        </div>
      </div>

      {/* Right results panel — 65% */}
      <div className="flex-1 overflow-y-auto p-5">
        <motion.div variants={fadeVariants} initial="initial" animate="animate" key={routeOptions.length}>
          <RouteComparison routes={routeOptions} isGenerating={isGenerating} />
        </motion.div>
      </div>
    </div>
  )
}
