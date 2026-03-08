"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Upload, CheckCircle2, Clock, AlertTriangle, X,
  Send, Megaphone, FileText, FileBadge, FileCheck, FileSpreadsheet,
  FileBox, FileWarning, FileKey, Plane, Ship, PackageCheck,
  Thermometer, ScrollText, ShieldCheck, Globe, ChevronDown, ChevronRight, Filter,
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import type { ComplianceDocType } from "@/lib/types/compliance"

// ─── Thread / announcement data ────────────────────────────────────────────────
const THREADS = [
  {
    id: "th-001", shipmentId: "SH-2847", subject: "Insulin Glargine — Mumbai → Frankfurt",
    messages: [
      { id: "m1", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 6, 09:12", text: "Your shipment departed Mumbai on schedule." },
      { id: "m2", sender: "client", senderName: "You", role: "client", time: "Mar 6, 10:05", text: "Great — any customs pre-clearance needed in Frankfurt?" },
      { id: "m3", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 6, 10:34", text: "Yes, docs are filed. Expect clearance within 4 hours of landing." },
    ],
  },
  {
    id: "th-002", shipmentId: "SH-1204", subject: "COVID Vaccines — Brussels → Nairobi",
    messages: [
      { id: "m4", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 5, 14:00", text: "Cold-chain integrity confirmed at Oslo departure." },
    ],
  },
  {
    id: "th-003", shipmentId: "SH-3091", subject: "mRNA Vaccines — Zürich → Toronto",
    messages: [
      { id: "m5", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 7, 08:20", text: "Shipment is at customs in Lagos Hub. Expected delay: 12 h." },
    ],
  },
]

const ANNOUNCEMENTS = [
  { id: "ann-001", title: "System maintenance — Mar 15, 02:00–04:00 UTC", date: "Mar 8, 2026", body: "The ArcticOps platform will be briefly unavailable during scheduled maintenance. Live tracking will resume automatically." },
  { id: "ann-002", title: "New: Real-time temperature excursion alerts", date: "Mar 5, 2026", body: "You will now receive an instant push notification whenever a monitored shipment crosses its temperature threshold." },
]

// ─── Doc type visual config ─────────────────────────────────────────────────────
const DOC_CONFIG: Record<ComplianceDocType, { icon: React.ElementType; color: string; bg: string; label: string; category: string }> = {
  certificate_of_analysis: { icon: FileBadge,      color: "#00C8A8", bg: "rgba(0,200,168,0.10)",   label: "Certificate of Analysis",   category: "Quality" },
  packing_declaration:     { icon: PackageCheck,    color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  label: "Packing Declaration",        category: "Logistics" },
  gdp_compliance:          { icon: ShieldCheck,     color: "#8B5CF6", bg: "rgba(139,92,246,0.10)",  label: "GDP Compliance",             category: "Quality" },
  temperature_log:         { icon: Thermometer,     color: "#06B6D4", bg: "rgba(6,182,212,0.10)",   label: "Temperature Log",            category: "Monitoring" },
  customs_declaration:     { icon: ScrollText,      color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  label: "Customs Declaration",        category: "Customs" },
  invoice:                 { icon: FileSpreadsheet, color: "#64748B", bg: "rgba(100,116,139,0.10)", label: "Commercial Invoice",         category: "Finance" },
  bill_of_lading:          { icon: Ship,            color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  label: "Bill of Lading",             category: "Logistics" },
  air_waybill:             { icon: Plane,           color: "#3B82F6", bg: "rgba(59,130,246,0.10)",  label: "Air Waybill",                category: "Logistics" },
  dangerous_goods:         { icon: FileWarning,     color: "#EF4444", bg: "rgba(239,68,68,0.10)",   label: "Dangerous Goods Declaration",category: "Safety" },
  import_permit:           { icon: FileKey,         color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  label: "Import Permit",              category: "Customs" },
  export_permit:           { icon: Globe,           color: "#10B981", bg: "rgba(16,185,129,0.10)",  label: "Export Permit",              category: "Customs" },
  phytosanitary:           { icon: FileCheck,       color: "#10B981", bg: "rgba(16,185,129,0.10)",  label: "Phytosanitary Certificate",  category: "Health" },
  health_certificate:      { icon: FileBox,         color: "#EC4899", bg: "rgba(236,72,153,0.10)",  label: "Health Certificate",         category: "Health" },
}

const CATEGORY_COLORS: Record<string, string> = {
  Quality:    "#00C8A8",
  Logistics:  "#3B82F6",
  Customs:    "#F59E0B",
  Monitoring: "#06B6D4",
  Safety:     "#EF4444",
  Health:     "#EC4899",
  Finance:    "#64748B",
}

// ─── DocumentCard ────────────────────────────────────────────────────────────────
function DocumentCard({ doc, index }: { doc: (typeof MOCK_DOCUMENTS)[0]; index: number }) {
  const cfg = DOC_CONFIG[doc.type] ?? { icon: FileText, color: "#64748B", bg: "rgba(100,116,139,0.1)", label: doc.type, category: "Other" }
  const Icon = cfg.icon

  const statusMeta = {
    complete: { icon: CheckCircle2, color: "#2ED573", label: "Complete",       bg: "rgba(46,213,115,0.10)" },
    pending:  { icon: Clock,        color: "#FFA502", label: "Pending",        bg: "rgba(255,165,2,0.10)" },
    missing:  { icon: AlertTriangle,color: "#FF4757", label: "Action Needed",  bg: "rgba(255,71,87,0.10)" },
    expired:  { icon: X,            color: "#FF4757", label: "Expired",        bg: "rgba(255,71,87,0.10)" },
  }[doc.status]
  const StatusIcon = statusMeta.icon

  const expiresDate = doc.expiresAt ? new Date(doc.expiresAt) : null
  const expiresLabel = expiresDate
    ? `Expires ${expiresDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: index * 0.04 } }}
      whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.18, ease: "easeOut" } }}
      className="group relative rounded-2xl cursor-default"
      style={{
        background: "linear-gradient(135deg, rgba(13,22,41,0.95) 0%, rgba(7,12,25,0.98) 100%)",
        border: `1px solid rgba(30,48,80,0.7)`,
        boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
        overflow: "hidden",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onHoverStart={e => { (e.target as HTMLElement).closest(".doc-card-el")?.setAttribute("style", `box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px ${cfg.color}33; border-color: ${cfg.color}44`) }}
    >
      {/* Hover glow top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}88, transparent)` }}
      />

      <div className="p-4 flex flex-col gap-3">
        {/* Top row: icon + type badge + status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
              style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
            >
              <Icon style={{ width: 18, height: 18, color: cfg.color }} />
            </div>
            <div>
              <span
                className="text-[9px] font-bold uppercase tracking-wider"
                style={{ color: cfg.color, fontFamily: "var(--ao-font-mono)" }}
              >
                {cfg.category}
              </span>
              <p
                className="text-[11px] font-semibold leading-tight mt-0.5"
                style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
              >
                {cfg.label}
              </p>
            </div>
          </div>
          {/* Status pill */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg shrink-0"
            style={{ background: statusMeta.bg, border: `1px solid ${statusMeta.color}33` }}
          >
            <StatusIcon style={{ width: 10, height: 10, color: statusMeta.color }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: statusMeta.color, fontFamily: "var(--ao-font-mono)", letterSpacing: "0.05em" }}>
              {statusMeta.label.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Document name */}
        <p
          className="text-[12px] font-medium leading-snug"
          style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
        >
          {doc.displayName}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap" style={{ borderTop: "1px solid rgba(30,48,80,0.5)", paddingTop: 10 }}>
          {doc.uploadedAt && (
            <div className="flex items-center gap-1">
              <CheckCircle2 style={{ width: 9, height: 9, color: "rgba(100,116,139,0.5)" }} />
              <span style={{ fontSize: 9, color: "rgba(100,116,139,0.6)", fontFamily: "var(--ao-font-mono)" }}>
                {new Date(doc.uploadedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
              </span>
            </div>
          )}
          {doc.uploadedBy && (
            <div className="flex items-center gap-1">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(100,116,139,0.4)" }} />
              <span style={{ fontSize: 9, color: "rgba(100,116,139,0.6)", fontFamily: "var(--ao-font-body)" }}>{doc.uploadedBy}</span>
            </div>
          )}
          {doc.fileSize && (
            <span style={{ fontSize: 9, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)", marginLeft: "auto" }}>
              {doc.fileSize}
            </span>
          )}
          {expiresLabel && !doc.fileSize && (
            <span style={{ fontSize: 9, color: "#FFA502", fontFamily: "var(--ao-font-mono)", marginLeft: "auto" }}>{expiresLabel}</span>
          )}
        </div>

        {/* Action button */}
        {doc.status === "complete" ? (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all opacity-0 group-hover:opacity-100"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--ao-text-secondary)",
              fontFamily: "var(--ao-font-body)",
              transform: "translateY(4px)",
              transition: "opacity 0.2s ease, transform 0.2s ease, background 0.15s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${cfg.color}18`
              e.currentTarget.style.borderColor = `${cfg.color}40`
              e.currentTarget.style.color = cfg.color
              e.currentTarget.style.transform = "translateY(0)"
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
              e.currentTarget.style.color = "var(--ao-text-secondary)"
              e.currentTarget.style.transform = "translateY(4px)"
            }}
          >
            <Download style={{ width: 12, height: 12 }} /> Download
          </button>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold transition-all"
            style={{
              background: doc.status === "missing" ? "rgba(255,71,87,0.08)" : "rgba(0,200,168,0.08)",
              border: `1px solid ${doc.status === "missing" ? "rgba(255,71,87,0.25)" : "rgba(0,200,168,0.25)"}`,
              color: doc.status === "missing" ? "#FF4757" : "var(--ao-accent)",
              fontFamily: "var(--ao-font-body)",
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.2)" }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)" }}
          >
            <Upload style={{ width: 12, height: 12 }} />
            {doc.status === "missing" ? "Upload Required" : "Upload Document"}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ─── DocumentsList ─────────────────────────────────────────────────────────────
function DocumentsList({ tenantId }: { tenantId: string | undefined }) {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set(["SH-2847"]))
  const [activeCategory, setActiveCategory] = useState<string>("All")

  const tenantShipments = MOCK_SHIPMENTS.filter((s) => s.tenantId === tenantId)
  const tenantDocs = MOCK_DOCUMENTS.filter((d) => tenantShipments.some((s) => s.id === d.shipmentId))

  const totalDocs = tenantDocs.length
  const completeDocs = tenantDocs.filter((d) => d.status === "complete").length
  const pendingDocs = tenantDocs.filter((d) => d.status === "pending").length
  const missingDocs = tenantDocs.filter((d) => d.status === "missing").length

  const categories = ["All", ...Array.from(new Set(tenantDocs.map((d) => DOC_CONFIG[d.type]?.category ?? "Other").filter(Boolean)))]

  const toggleShipment = (id: string) =>
    setExpandedShipments((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="flex flex-col gap-5">
      {/* ── Stats strip ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4 } }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { label: "Total Documents", value: totalDocs,    color: "var(--ao-text-secondary)", bg: "rgba(30,48,80,0.3)",      icon: FileText },
          { label: "Complete",        value: completeDocs,  color: "#2ED573",                  bg: "rgba(46,213,115,0.08)",    icon: CheckCircle2 },
          { label: "Pending Upload",  value: pendingDocs,   color: "#FFA502",                  bg: "rgba(255,165,2,0.08)",     icon: Clock },
          { label: "Action Needed",   value: missingDocs,   color: "#FF4757",                  bg: "rgba(255,71,87,0.08)",     icon: AlertTriangle },
        ].map(({ label, value, color, bg, icon: Ic }) => (
          <motion.div
            key={label}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: bg, border: `1px solid ${color}22`, backdropFilter: "blur(8px)" }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
              <Ic style={{ width: 16, height: 16, color }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--ao-font-mono)", lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 10, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", marginTop: 2 }}>{label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Category filter bar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter style={{ width: 13, height: 13, color: "var(--ao-text-muted)", flexShrink: 0 }} />
        {categories.map((cat) => {
          const active = activeCategory === cat
          const c = cat === "All" ? "var(--ao-accent)" : (CATEGORY_COLORS[cat] ?? "#64748B")
          return (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: active ? `${c}18` : "rgba(30,48,80,0.3)",
                border: `1px solid ${active ? `${c}50` : "rgba(30,48,80,0.7)"}`,
                color: active ? c : "var(--ao-text-muted)",
                fontFamily: "var(--ao-font-body)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {cat}
            </motion.button>
          )
        })}
      </div>

      {/* ── Per-shipment groups ─────────────────────────────────────────────── */}
      {tenantShipments.map((sh) => {
        const allDocs = MOCK_DOCUMENTS.filter((d) => d.shipmentId === sh.id)
        const filteredDocs = activeCategory === "All"
          ? allDocs
          : allDocs.filter((d) => (DOC_CONFIG[d.type]?.category ?? "Other") === activeCategory)
        if (filteredDocs.length === 0) return null

        const isOpen = expandedShipments.has(sh.id)
        const allDone = allDocs.every((d) => d.status === "complete")
        const hasMissing = allDocs.some((d) => d.status === "missing")
        const pendingCount = allDocs.filter((d) => d.status === "pending" || d.status === "missing").length
        const statusColor = hasMissing ? "#FF4757" : allDone ? "#2ED573" : "#FFA502"
        const StatusIc = hasMissing ? AlertTriangle : allDone ? CheckCircle2 : Clock

        return (
          <div key={sh.id}>
            {/* ── Shipment accordion header ─────────────────────────────── */}
            <motion.button
              whileHover={{ x: 2, transition: { duration: 0.12 } }}
              onClick={() => toggleShipment(sh.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-left mb-3"
              style={{
                background: isOpen
                  ? `linear-gradient(135deg, ${statusColor}08 0%, rgba(7,12,25,0.95) 100%)`
                  : "linear-gradient(135deg, rgba(13,22,41,0.8) 0%, rgba(7,12,25,0.95) 100%)",
                border: `1px solid ${isOpen ? `${statusColor}30` : "rgba(30,48,80,0.7)"}`,
                backdropFilter: "blur(8px)",
                boxShadow: isOpen ? `0 4px 20px ${statusColor}0a` : "0 2px 8px rgba(0,0,0,0.15)",
                transition: "all 0.2s ease",
              }}
              aria-expanded={isOpen}
            >
              <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronRight style={{ width: 14, height: 14, color: "var(--ao-text-muted)" }} />
              </motion.div>
              <span style={{ fontSize: 13, fontWeight: 800, color: statusColor, fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
              <span style={{ fontSize: 12, color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                {sh.materials[0]?.name} · {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span style={{ fontSize: 10, color: "rgba(100,116,139,0.5)", fontFamily: "var(--ao-font-mono)" }}>
                  {filteredDocs.length} docs
                </span>
                {pendingCount > 0 && (
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: `${statusColor}15`, color: statusColor,
                      border: `1px solid ${statusColor}35`, fontFamily: "var(--ao-font-mono)",
                    }}
                  >
                    {pendingCount} pending
                  </span>
                )}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: `${statusColor}10`, border: `1px solid ${statusColor}25` }}>
                  <StatusIc style={{ width: 10, height: 10, color: statusColor }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: statusColor, fontFamily: "var(--ao-font-mono)" }}>
                    {hasMissing ? "ACTION NEEDED" : allDone ? "COMPLETE" : "IN PROGRESS"}
                  </span>
                </div>
              </div>
            </motion.button>

            {/* ── Document cards grid ──────────────────────────────────── */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  key={sh.id + "-cards"}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto", transition: { duration: 0.25, ease: "easeOut" } }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.2, ease: "easeIn" } }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3 pb-4 pl-1 pr-1 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredDocs.map((doc, i) => (
                      <div key={doc.id} className="doc-card-el">
                        <DocumentCard doc={doc} index={i} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}

      {tenantShipments.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
          <FileText style={{ width: 40, height: 40, color: "rgba(100,116,139,0.3)" }} />
          <p style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", fontSize: 13 }}>No shipments found</p>
        </div>
      )}
    </div>
  )
}

// ─── CommunicationsPage (unchanged) ────────────────────────────────────────────
function CommunicationsPage() {
  const [selectedThread, setSelectedThread] = useState(THREADS[0]!)
  const [message, setMessage] = useState("")
  const [localMessages, setLocalMessages] = useState<{
    [key: string]: Array<{ id: string; sender: string; senderName: string; role: string; time: string; text: string }>
  }>(Object.fromEntries(THREADS.map((t) => [t.id, t.messages])))
  const [expandedAnn, setExpandedAnn] = useState<Set<string>>(new Set())

  const send = () => {
    if (!message.trim()) return
    setLocalMessages((prev) => ({
      ...prev,
      [selectedThread.id]: [
        ...(prev[selectedThread.id] ?? []),
        { id: `local-${Date.now()}`, sender: "client", senderName: "You", role: "client", time: "now", text: message },
      ],
    }))
    setMessage("")
  }

  return (
    <div className="flex h-full gap-4 p-5">
      {/* Thread list */}
      <div className="w-64 shrink-0 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>Conversations</p>
        {THREADS.map((t) => (
          <motion.button key={t.id} onClick={() => setSelectedThread(t)}
            whileHover={{ x: 2, transition: { duration: 0.1 } }}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
            style={{
              background: selectedThread.id === t.id ? "linear-gradient(135deg, rgba(0,200,168,0.12) 0%, rgba(6,13,27,0.9) 100%)" : "rgba(11,18,34,0.4)",
              border: `1px solid ${selectedThread.id === t.id ? "rgba(0,200,168,0.35)" : "var(--ao-border)"}`,
              backdropFilter: "blur(8px)",
            }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{t.shipmentId}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{t.subject}</p>
          </motion.button>
        ))}

        <p className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>Announcements</p>
        {ANNOUNCEMENTS.map((ann) => (
          <div key={ann.id}>
            <button
              onClick={() => setExpandedAnn((p) => { const n = new Set(p); n.has(ann.id) ? n.delete(ann.id) : n.add(ann.id); return n })}
              className="w-full text-left px-3 py-2.5 rounded-lg border transition-colors hover:bg-white/[0.02]"
              style={{ background: "rgba(11,18,34,0.4)", borderColor: "var(--ao-border)", backdropFilter: "blur(8px)" }}>
              <div className="flex items-start gap-1.5">
                <Megaphone className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "#3B82F6" }} />
                <p className="text-[11px] font-medium leading-snug" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{ann.title}</p>
              </div>
              <p className="text-[10px] mt-1 pl-4" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{ann.date}</p>
              <AnimatePresence>
                {expandedAnn.has(ann.id) && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} className="text-[11px] mt-1.5 pl-4 overflow-hidden"
                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    {ann.body}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>
          </div>
        ))}
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col rounded-xl border overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)", borderColor: "var(--ao-border)", backdropFilter: "blur(12px)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", background: "rgba(0,0,0,0.2)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{selectedThread.subject}</p>
          <p className="text-[11px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{selectedThread.shipmentId}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {(localMessages[selectedThread.id] ?? []).map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "client" ? "justify-end" : "justify-start")}>
              <div className="max-w-[70%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium" style={{ color: msg.role === "ops" ? "var(--ao-accent)" : "#3B82F6", fontFamily: "var(--ao-font-body)" }}>{msg.senderName}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{msg.role}</span>
                </div>
                <div className="px-3 py-2 rounded-2xl text-[13px]"
                  style={{
                    background: msg.sender === "client" ? "rgba(59,130,246,0.14)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${msg.sender === "client" ? "rgba(59,130,246,0.3)" : "var(--ao-border)"}`,
                    color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)",
                  }}>
                  {msg.text}
                  <span className="block text-[10px] mt-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3 flex gap-2" style={{ borderColor: "var(--ao-border)" }}>
          <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
          <button onClick={send} className="p-2.5 rounded-lg transition-all hover:brightness-110" style={{ backgroundColor: "#3B82F6", color: "white" }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ClientDocumentsPage() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-5">
        <DocumentsList tenantId={user?.tenantId ?? undefined} />
      </div>
    </div>
  )
}
