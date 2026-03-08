"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ShoppingCart, Search, Check, Plus, Minus, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useInventoryStore } from "@/lib/store/inventory-store"
import { MOCK_MATERIALS } from "@/lib/mock-data/materials"
import { Stepper } from "@/components/shared/stepper"
import { TemperatureBadge } from "@/components/shared/temperature-badge"
import { formatCurrency } from "@/lib/utils/format"
import { getTempZoneColor, getTempZoneLabel } from "@/lib/utils/temperature"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import type { Material } from "@/lib/types/inventory"

const ZONES = ["all", "ultra_cold", "frozen", "refrigerated"] as const
const ROUTE_OPTIONS = [
  { id: "r1", name: "Sea + Rail", etaDays: 12, etaHours: 0, cost: 8400, risk: 28, tempConf: 94 },
  { id: "r2", name: "Air Direct", etaDays: 2, etaHours: 6, cost: 24000, risk: 15, tempConf: 98, recommended: true },
  { id: "r3", name: "Rail + Road", etaDays: 8, etaHours: 0, cost: 6200, risk: 38, tempConf: 87 },
]

const PAST_ORDERS = [
  { id: "ORD-2024-089", date: "2024-02-12", material: "Meropenem API", qty: "50 kg", status: "delivered", cost: 12400 },
  { id: "ORD-2024-067", date: "2024-01-28", material: "Epinephrine Base", qty: "20 kg", status: "delivered", cost: 8900 },
  { id: "ORD-2023-154", date: "2023-12-05", material: "Docetaxel Trihydrate", qty: "10 kg", status: "delivered", cost: 34000 },
]

const WIZARD_STEPS = [
  { id: "step1", label: "Materials" },
  { id: "step2", label: "Cold-Chain" },
  { id: "step3", label: "Delivery" },
  { id: "step4", label: "Routes" },
  { id: "step5", label: "Review" },
]

interface BasketItem { material: Material; quantity: number }

export default function ProcurementPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { addProcurementRequest } = useInventoryStore()
  const [view, setView] = useState<"catalog" | "wizard" | "history">("catalog")
  const [basket, setBasket] = useState<BasketItem[]>([])
  const [wizardStep, setWizardStep] = useState(0)
  const [zone, setZone] = useState("refrigerated")
  const [urgency, setUrgency] = useState("standard")
  const [destination, setDestination] = useState("")
  const [selectedRoute, setSelectedRoute] = useState(ROUTE_OPTIONS[1]!.id)
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [search, setSearch] = useState("")
  const [zoneFilter, setZoneFilter] = useState<string>("all")

  const filtered = MOCK_MATERIALS.filter((m) => {
    if (zoneFilter !== "all" && m.temperatureZone !== zoneFilter) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const addToBasket = (m: Material) =>
    setBasket((prev) => prev.some((b) => b.material.id === m.id) ? prev : [...prev, { material: m, quantity: 1 }])

  const updateQty = (id: string, delta: number) =>
    setBasket((prev) => prev.map((b) => b.material.id === id ? { ...b, quantity: Math.max(1, b.quantity + delta) } : b).filter((b) => b.quantity > 0))

  const removeFromBasket = (id: string) => setBasket((prev) => prev.filter((b) => b.material.id !== id))

  const submitOrder = () => {
    basket.forEach((item) => {
      addProcurementRequest({
        id: `REQ-${Date.now()}-${item.material.id}`,
        tenantId: user?.tenantId ?? "t1",
        clientName: user?.tenantName ?? "Client",
        materialId: item.material.id,
        materialName: item.material.name,
        quantity: item.quantity,
        unit: item.material.unit,
        temperatureZone: item.material.temperatureZone,
        priority: urgency as "standard" | "express" | "emergency",
        status: "pending",
        submittedAt: new Date().toISOString(),
      })
    })
    setSubmitted(true)
    setTimeout(() => { setView("history"); setSubmitted(false); setBasket([]); setWizardStep(0) }, 3000)
  }

  const wizardStepItems = WIZARD_STEPS.map((s) => ({ id: s.id, label: s.label }))

  return (
    <div className="flex flex-col h-full">
      {/* View toggle */}
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(13,24,41,0.6)" }}>
        {[
          { id: "catalog", label: "Material Catalog" },
          { id: "wizard", label: "New Order" },
          { id: "history", label: "Order History" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setView(id as typeof view)}
            className={cn("px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
              view === id ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
            style={{ color: view === id ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {label}
            {id === "wizard" && basket.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: "rgba(0,200,168,0.15)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                {basket.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* CATALOG */}
        {view === "catalog" && (
          <motion.div key="catalog" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search materials…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
              </div>
              {ZONES.map((z) => (
                <button key={z} onClick={() => setZoneFilter(z)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                  style={{
                    backgroundColor: zoneFilter === z ? "rgba(0,200,168,0.12)" : "var(--ao-surface)",
                    border: `1px solid ${zoneFilter === z ? "var(--ao-accent)" : "var(--ao-border)"}`,
                    color: zoneFilter === z ? "var(--ao-accent)" : "var(--ao-text-muted)",
                    fontFamily: "var(--ao-font-body)",
                  }}>{z === "all" ? "All Zones" : getTempZoneLabel(z as "ultra_cold" | "frozen" | "refrigerated")}</button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((m) => {
                const inBasket = basket.some((b) => b.material.id === m.id)
                return (
                  <div key={m.id} className="rounded-xl border p-4" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                    <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{m.name}</p>
                    <p className="text-[11px] mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{m.grade} · {m.supplier}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.certifications.slice(0, 2).map((c) => (
                        <span key={c} className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: "rgba(0,200,168,0.08)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{c}</span>
                      ))}
                    </div>
                    <p className="text-[12px] mb-3" style={{ color: getTempZoneColor(m.temperatureZone), fontFamily: "var(--ao-font-mono)" }}>
                      {m.requiredTempMin}°C – {m.requiredTempMax}°C
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                        {formatCurrency(m.unitPrice)}/{m.unit}
                      </span>
                      <button
                        onClick={() => inBasket ? removeFromBasket(m.id) : addToBasket(m)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                        style={inBasket
                          ? { backgroundColor: "rgba(0,200,168,0.12)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.3)" }
                          : { backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)" }}>
                        {inBasket ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {basket.length > 0 && (
              <button onClick={() => setView("wizard")}
                className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-xl"
                style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
                <ShoppingCart className="w-4 h-4" />
                {basket.length} item{basket.length > 1 ? "s" : ""} in basket → Continue
              </button>
            )}
          </motion.div>
        )}

        {/* ORDER WIZARD */}
        {view === "wizard" && (
          <motion.div key="wizard" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { type: "spring" } }}>
                  <CheckCircle2 className="w-16 h-16" style={{ color: "#2ED573" }} />
                </motion.div>
                <p className="text-xl font-bold" style={{ color: "#2ED573", fontFamily: "var(--ao-font-display)" }}>Order Submitted!</p>
                <p className="text-sm text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  The operations team will review within 2 hours. Redirecting to history…
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6"><Stepper steps={wizardStepItems} currentStep={wizardStep} /></div>

                {/* Step 1: Materials */}
                {wizardStep === 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Review & adjust quantities</p>
                    {basket.length === 0 ? (
                      <div className="text-center py-10">
                        <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No materials in basket. <button onClick={() => setView("catalog")} style={{ color: "var(--ao-accent)" }}>Browse catalog</button></p>
                      </div>
                    ) : (
                      basket.map((item) => (
                        <div key={item.material.id} className="flex items-center gap-4 p-3 rounded-xl border"
                          style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                          <div className="flex-1">
                            <p className="font-medium text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{item.material.name}</p>
                            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(item.material.unitPrice * item.quantity)} total</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item.material.id, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-muted)" }}><Minus className="w-3 h-3" /></button>
                            <span className="w-8 text-center text-[13px] font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{item.quantity}</span>
                            <button onClick={() => updateQty(item.material.id, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-muted)" }}><Plus className="w-3 h-3" /></button>
                            <button onClick={() => removeFromBasket(item.material.id)} className="text-[11px] ml-2" style={{ color: "#FF4757", fontFamily: "var(--ao-font-body)" }}>Remove</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Step 2: Cold-chain */}
                {wizardStep === 1 && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Temperature Requirements</p>
                    {["ultra_cold", "frozen", "refrigerated"].map((z) => (
                      <label key={z} className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                        style={{
                          backgroundColor: zone === z ? `${getTempZoneColor(z as "ultra_cold" | "frozen" | "refrigerated")}08` : "var(--ao-surface)",
                          borderColor: zone === z ? getTempZoneColor(z as "ultra_cold" | "frozen" | "refrigerated") : "var(--ao-border)",
                        }}>
                        <input type="radio" checked={zone === z} onChange={() => setZone(z)} className="sr-only" />
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: zone === z ? getTempZoneColor(z as "ultra_cold" | "frozen" | "refrigerated") : "var(--ao-border)" }}>
                          {zone === z && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTempZoneColor(z as "ultra_cold" | "frozen" | "refrigerated") }} />}
                        </div>
                        <div>
                          <p className="font-medium text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{getTempZoneLabel(z as "ultra_cold" | "frozen" | "refrigerated")}</p>
                          <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                            {z === "ultra_cold" ? "−80°C to −60°C · Liquid nitrogen or dry ice" : z === "frozen" ? "−25°C to −15°C · Deep freeze" : "2°C to 8°C · Refrigerated cold chain"}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 3: Delivery */}
                {wizardStep === 2 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Destination</label>
                      <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Delivery address or city"
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                        style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Urgency</label>
                      {[
                        { v: "standard", l: "Standard — 7–14 days", c: "$" },
                        { v: "express", l: "Express — 3–5 days", c: "$$" },
                        { v: "emergency", l: "Emergency — 1–2 days", c: "$$$" },
                      ].map(({ v, l, c }) => (
                        <label key={v} className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer transition-all"
                          style={{ backgroundColor: urgency === v ? "rgba(0,200,168,0.08)" : "var(--ao-surface)", border: `1px solid ${urgency === v ? "var(--ao-accent)" : "var(--ao-border)"}` }}>
                          <input type="radio" checked={urgency === v} onChange={() => setUrgency(v)} className="sr-only" />
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: urgency === v ? "var(--ao-accent)" : "var(--ao-border)" }}>
                            {urgency === v && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} />}
                          </div>
                          <span className="flex-1 text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{l}</span>
                          <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 4: Routes */}
                {wizardStep === 3 && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-semibold mb-2" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Select a route</p>
                    {ROUTE_OPTIONS.map((r) => (
                      <label key={r.id} className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                        style={{
                          backgroundColor: selectedRoute === r.id ? "rgba(0,200,168,0.06)" : "var(--ao-surface)",
                          borderColor: selectedRoute === r.id ? "var(--ao-accent)" : "var(--ao-border)",
                        }}>
                        <input type="radio" checked={selectedRoute === r.id} onChange={() => setSelectedRoute(r.id)} className="sr-only" />
                        <div className="w-4 h-4 mt-0.5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: selectedRoute === r.id ? "var(--ao-accent)" : "var(--ao-border)" }}>
                          {selectedRoute === r.id && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{r.name}</p>
                            {r.recommended && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "rgba(0,200,168,0.12)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}>Recommended</span>}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-[12px]" style={{ fontFamily: "var(--ao-font-mono)" }}>
                            <span style={{ color: "var(--ao-text-primary)" }}>{r.etaDays}d ETA</span>
                            <span style={{ color: "var(--ao-text-muted)" }}>{formatCurrency(r.cost)}</span>
                            <span style={{ color: r.tempConf >= 95 ? "#2ED573" : "#FFA502" }}>{r.tempConf}% temp</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Step 5: Review & submit */}
                {wizardStep === 4 && (
                  <div className="flex flex-col gap-4">
                    <div className="rounded-xl border p-4 flex flex-col gap-2" style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                      <p className="text-sm font-semibold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Order Summary</p>
                      {basket.map((item) => (
                        <div key={item.material.id} className="flex justify-between text-[12px]">
                          <span style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{item.material.name} ×{item.quantity}</span>
                          <span style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(item.material.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-1" style={{ borderColor: "var(--ao-border)" }}>
                        {[
                          { l: "Temperature Zone", v: getTempZoneLabel(zone as "ultra_cold" | "frozen" | "refrigerated") },
                          { l: "Urgency", v: urgency },
                          { l: "Destination", v: destination || "—" },
                          { l: "Route", v: ROUTE_OPTIONS.find((r) => r.id === selectedRoute)?.name ?? "—" },
                          { l: "Estimated Cost", v: formatCurrency(ROUTE_OPTIONS.find((r) => r.id === selectedRoute)?.cost ?? 0) },
                        ].map(({ l, v }) => (
                          <div key={l} className="flex justify-between text-[12px] mt-1">
                            <span style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{l}</span>
                            <span style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="sr-only" />
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center"
                        style={{ borderColor: agreed ? "var(--ao-accent)" : "var(--ao-border)", backgroundColor: agreed ? "var(--ao-accent)" : "transparent" }}>
                        {agreed && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none"><path d="M1 4l2.5 3L9 1" stroke="#060D1B" strokeWidth="1.5" strokeLinecap="round" /></svg>}
                      </div>
                      <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        I accept the terms and confirm this order
                      </span>
                    </label>
                    <button onClick={submitOrder} disabled={!agreed || basket.length === 0}
                      className="w-full py-3.5 rounded-xl text-base font-bold transition-all disabled:opacity-40"
                      style={{ backgroundColor: "#22E574", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
                      Submit Order
                    </button>
                  </div>
                )}

                {/* Wizard nav */}
                <div className="flex items-center justify-between mt-6">
                  <button onClick={() => setWizardStep((s) => Math.max(0, s - 1))} disabled={wizardStep === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-30"
                    style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  {wizardStep < 4 && (
                    <button onClick={() => setWizardStep((s) => Math.min(4, s + 1))}
                      disabled={wizardStep === 0 && basket.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                      style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
                      Next <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* HISTORY */}
        {view === "history" && (
          <motion.div key="history" variants={fadeVariants} initial="initial" animate="animate" exit="exit"
            className="flex-1 overflow-auto p-6">
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "rgba(13,24,41,0.8)", borderBottom: "1px solid var(--ao-border)" }}>
                    {["Order ID", "Date", "Material", "Status", "Cost"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PAST_ORDERS.map((o) => (
                    <tr key={o.id} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                      <td className="px-4 py-3"><span className="text-[12px] font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{o.id}</span></td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{o.date}</td>
                      <td className="px-4 py-3 text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{o.material}</td>
                      <td className="px-4 py-3"><span className="text-[12px] font-medium" style={{ color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>Delivered</span></td>
                      <td className="px-4 py-3 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{formatCurrency(o.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
