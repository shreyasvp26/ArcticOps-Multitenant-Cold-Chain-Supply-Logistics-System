"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, Clock, X, Download, Upload, Search,
  ChevronDown, ChevronRight, FileText, Shield, Calendar,
  AlertTriangle, CheckCircle2, TrendingUp, Lock,
} from "lucide-react"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { formatDate, formatDatetime } from "@/lib/utils/format"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import { differenceInDays, parseISO, addDays, startOfToday, format } from "date-fns"

// ─── Audit log data ────────────────────────────────────────────────────────
const AUDIT_ENTRIES = Array.from({ length: 60 }, (_, i) => ({
  id: `AUD-${String(i + 1).padStart(4, "0")}`,
  timestamp: new Date(Date.now() - i * 3_600_000 * (0.5 + Math.random())).toISOString(),
  user: ["alice.carter@ops", "j.patel@ops", "compliance@ops", "system"][i % 4]!,
  action: ["uploaded_document", "approved_shipment", "updated_status", "generated_report", "logged_in", "exported_data"][i % 6]!,
  entity: i % 3 === 0 ? `SHP-${String((i % 12) + 1).padStart(4, "0")}` : `DOC-${String((i % 40) + 1).padStart(4, "0")}`,
  entityType: i % 3 === 0 ? "shipment" : "document",
  details: ["Temperature log submitted", "GDP compliance form approved", "Status changed to In Transit", "Monthly report generated"][i % 4]!,
  ip: `192.168.${(i % 10) + 1}.${(i % 50) + 100}`,
}))

// ─── Regulatory deadlines ──────────────────────────────────────────────────
const today = startOfToday()
const DEADLINES = [
  { id: "REG-001", name: "GDP License Renewal — EU",       type: "License",       dueDate: addDays(today, 5).toISOString(),   notes: "Annual renewal required for EU operations" },
  { id: "REG-002", name: "IATA DGR Certification",         type: "Certification", dueDate: addDays(today, 18).toISOString(),  notes: "Required for air transport of hazardous materials" },
  { id: "REG-003", name: "WHO PQS Audit Submission",       type: "Submission",    dueDate: addDays(today, 42).toISOString(),  notes: "Quarterly quality system submission" },
  { id: "REG-004", name: "Cold Storage Facility Inspection", type: "Inspection", dueDate: addDays(today, 75).toISOString(),  notes: "Annual facility inspection — Singapore depot" },
  { id: "REG-005", name: "IMDG Code Training Update",      type: "Training",      dueDate: addDays(today, -3).toISOString(), notes: "Required for sea freight team" },
  { id: "REG-006", name: "GMP Manufacturing Audit",        type: "Audit",         dueDate: addDays(today, 12).toISOString(), notes: "Triggered by PharmaAlpha compliance clause" },
]

function deadlineStyle(dueDate: string) {
  const days = differenceInDays(parseISO(dueDate), today)
  if (days < 0)  return { color: "#FF4757", bg: "rgba(255,71,87,0.09)",  glow: "rgba(255,71,87,0.25)",  label: "Overdue",  labelBg: "rgba(255,71,87,0.15)" }
  if (days <= 7) return { color: "#FF4757", bg: "rgba(255,71,87,0.06)",  glow: "rgba(255,71,87,0.15)",  label: "Critical", labelBg: "rgba(255,71,87,0.12)" }
  if (days <= 30) return { color: "#FFA502", bg: "rgba(255,165,2,0.06)", glow: "rgba(255,165,2,0.15)",  label: "Soon",     labelBg: "rgba(255,165,2,0.12)" }
  return          { color: "#2ED573", bg: "rgba(46,213,115,0.04)",        glow: "rgba(46,213,115,0.1)",  label: "On Track", labelBg: "rgba(46,213,115,0.10)" }
}

// ─── Glass panel wrapper ────────────────────────────────────────────────────
function GlassPanel({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={cn("rounded-2xl border", className)}
      style={{
        background: "linear-gradient(135deg, rgba(11,18,34,0.85) 0%, rgba(6,13,27,0.95) 100%)",
        border: "1px solid rgba(30,48,80,0.6)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Document Repository ───────────────────────────────────────────────────
function DocumentRepository() {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const shipmentIds = [...new Set(MOCK_DOCUMENTS.map((d) => d.shipmentId).filter(Boolean))] as string[]
  const filteredShipments = shipmentIds.filter((sid) => {
    if (!search) return true
    return sid.toLowerCase().includes(search.toLowerCase()) ||
      MOCK_SHIPMENTS.find((s) => s.id === sid)?.clientName.toLowerCase().includes(search.toLowerCase())
  })

  const totalDocs   = MOCK_DOCUMENTS.length
  const complete    = MOCK_DOCUMENTS.filter((d) => d.status === "complete").length
  const pending     = MOCK_DOCUMENTS.filter((d) => d.status === "pending").length
  const missing     = MOCK_DOCUMENTS.filter((d) => d.status === "missing").length
  const compliancePct = Math.round((complete / (totalDocs || 1)) * 100)

  const toggle = (id: string) =>
    setExpandedShipments((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const DOC_STATUS_CONFIG = {
    complete: { color: "#2ED573", icon: Check },
    pending:  { color: "#FFA502", icon: Clock },
    missing:  { color: "#FF4757", icon: X },
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Compliance Rate", value: `${compliancePct}%`, sub: `${complete} of ${totalDocs} docs`, color: compliancePct >= 80 ? "#2ED573" : "#FFA502", icon: TrendingUp },
          { label: "Complete",        value: complete,             sub: "all documents present",            color: "#2ED573", icon: CheckCircle2 },
          { label: "Pending Upload",  value: pending,              sub: "awaiting submission",              color: "#FFA502", icon: Clock },
          { label: "Missing",         value: missing,              sub: "action required",                  color: "#FF4757", icon: AlertTriangle },
        ].map(({ label, value, sub, color, icon: Icon }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            style={{
              cursor: "default", borderRadius: "16px", padding: "18px",
              background: `linear-gradient(135deg, ${color}12 0%, rgba(6,13,27,0.95) 100%)`,
              border: `1px solid ${color}28`, backdropFilter: "blur(16px)",
              boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}40, 0 12px 36px rgba(0,0,0,0.4)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <div className="p-1.5 rounded-lg" style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-[28px] font-bold leading-none mb-1" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{sub}</p>
            {/* Compliance bar only on first card */}
            {label === "Compliance Rate" && (
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,48,80,0.5)" }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${color}bb, ${color})`, boxShadow: `0 0 6px ${color}55` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${compliancePct}%`, transition: { duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] } }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.28, duration: 0.35 } }}>
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shipments or clients…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "rgba(7,12,25,0.7)", border: "1px solid rgba(30,48,80,0.7)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,200,168,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,168,0.08)" }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(30,48,80,0.7)"; e.target.style.boxShadow = "none" }}
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "complete", "pending", "missing"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className="px-3 py-2 rounded-xl text-[12px] font-medium transition-all capitalize"
                  style={{
                    background: statusFilter === s ? "rgba(0,200,168,0.14)" : "rgba(7,12,25,0.6)",
                    border: `1px solid ${statusFilter === s ? "rgba(0,200,168,0.4)" : "rgba(30,48,80,0.6)"}`,
                    color: statusFilter === s ? "var(--ao-accent)" : "var(--ao-text-muted)",
                    fontFamily: "var(--ao-font-body)",
                    boxShadow: statusFilter === s ? "0 0 10px rgba(0,200,168,0.1)" : "none",
                  }}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ── Document rows ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35, duration: 0.4 } }}>
        <GlassPanel className="overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b"
            style={{ borderColor: "rgba(30,48,80,0.6)", background: "rgba(0,0,0,0.2)" }}>
            <div className="w-4" />
            <p className="w-28 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Shipment</p>
            <p className="flex-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Client</p>
            <p className="w-20 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Docs</p>
            <p className="w-20 text-right text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Actions</p>
          </div>

          {filteredShipments.map((sid, i) => {
            const shipment = MOCK_SHIPMENTS.find((s) => s.id === sid)
            const docs = MOCK_DOCUMENTS.filter((d) => d.shipmentId === sid &&
              (statusFilter === "all" || d.status === statusFilter))
            const allComplete = docs.every((d) => d.status === "complete")
            const hasMissing  = docs.some((d)  => d.status === "missing")
            const isOpen = expandedShipments.has(sid)
            const rowColor = hasMissing ? "#FF4757" : allComplete ? "#2ED573" : "#FFA502"

            return (
              <motion.div key={sid}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.38 + i * 0.05, duration: 0.3, ease: "easeOut" } }}
                className="border-b last:border-b-0"
                style={{ borderColor: "rgba(30,48,80,0.4)" }}
              >
                {/* Shipment header row */}
                <motion.button
                  onClick={() => toggle(sid)}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.025)" }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors"
                  style={{ borderLeft: `3px solid ${isOpen ? rowColor : "transparent"}`, transition: "border-color 0.2s" }}
                  aria-expanded={isOpen}
                >
                  <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                  </motion.div>
                  <span className="w-28 font-bold text-[13px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sid}</span>
                  <span className="flex-1 text-[12px] truncate" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                    {shipment?.clientName ?? "—"}
                  </span>
                  <span className="w-20 text-right">
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: `${rowColor}18`, color: rowColor, border: `1px solid ${rowColor}30`, fontFamily: "var(--ao-font-mono)" }}>
                      {docs.length} doc{docs.length !== 1 ? "s" : ""}
                    </span>
                  </span>
                  <div className="w-20 flex justify-end">
                    {docs.length > 0 && (
                      <button onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg transition-all hover:brightness-110"
                        style={{ color: "var(--ao-text-muted)", border: "1px solid rgba(30,48,80,0.7)", background: "rgba(7,12,25,0.5)", fontFamily: "var(--ao-font-body)" }}>
                        <Download className="w-3 h-3" /> Bulk
                      </button>
                    )}
                  </div>
                </motion.button>

                {/* Expanded documents */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
                      exit={{ height: 0, opacity: 0, transition: { duration: 0.15 } }}
                      className="overflow-hidden"
                    >
                      {docs.map((doc, di) => {
                        const cfg = DOC_STATUS_CONFIG[doc.status as keyof typeof DOC_STATUS_CONFIG] ?? DOC_STATUS_CONFIG.pending
                        const StatusIcon = cfg.icon
                        return (
                          <motion.div key={doc.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0, transition: { delay: di * 0.04, duration: 0.22 } }}
                            className="flex items-center gap-4 pl-12 pr-5 py-3 border-t"
                            style={{ borderColor: "rgba(30,48,80,0.35)", background: "rgba(7,12,25,0.5)" }}
                          >
                            <div className="p-1.5 rounded-lg shrink-0" style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}25` }}>
                              <StatusIcon className="w-3 h-3" style={{ color: cfg.color }} />
                            </div>
                            <span className="flex-1 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                              {doc.displayName}
                            </span>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.color}25`, fontFamily: "var(--ao-font-body)" }}>
                              {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                            </span>
                            <span className="text-[11px] w-24 text-right" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                              {doc.uploadedAt ? formatDate(doc.uploadedAt) : "—"}
                            </span>
                            {doc.status === "complete"
                              ? <button className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity"
                                  style={{ color: "var(--ao-text-muted)", border: "1px solid rgba(30,48,80,0.7)", background: "rgba(7,12,25,0.5)", fontFamily: "var(--ao-font-body)" }}>
                                  <Download className="w-3 h-3" />
                                </button>
                              : <button className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg hover:brightness-110 transition-all"
                                  style={{ color: "var(--ao-accent)", background: "rgba(0,200,168,0.10)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
                                  <Upload className="w-3 h-3" /> Upload
                                </button>
                            }
                          </motion.div>
                        )
                      })}
                      {docs.length === 0 && (
                        <div className="pl-12 pr-5 py-4 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", background: "rgba(7,12,25,0.5)" }}>
                          No documents match the current filter.
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </GlassPanel>
      </motion.div>
    </div>
  )
}

// ─── Audit Log ─────────────────────────────────────────────────────────────
function AuditLog() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  const ACTION_COLORS: Record<string, string> = {
    uploaded_document: "#00C8A8",
    approved_shipment: "#2ED573",
    updated_status:    "#3B82F6",
    generated_report:  "#7C3AED",
    logged_in:         "#64748B",
    exported_data:     "#FFA502",
  }

  const filtered = AUDIT_ENTRIES.filter((e) => {
    if (actionFilter !== "all" && e.action !== actionFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return e.user.includes(q) || e.entity.toLowerCase().includes(q) || e.details.toLowerCase().includes(q)
    }
    return true
  })

  const downloadCSV = () => {
    const header = "ID,Timestamp,User,Action,Entity,Details,IP\n"
    const rows = filtered.map((e) =>
      `${e.id},"${e.timestamp}","${e.user}","${e.action}","${e.entity}","${e.details}","${e.ip}"`
    ).join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  const uniqueActions = [...new Set(AUDIT_ENTRIES.map((e) => e.action))]

  return (
    <div className="flex flex-col gap-5">

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Entries",  value: AUDIT_ENTRIES.length, color: "#3B82F6",  icon: Lock },
          { label: "Unique Users",   value: [...new Set(AUDIT_ENTRIES.map((e) => e.user))].length, color: "#00C8A8", icon: Shield },
          { label: "Last 24h",       value: AUDIT_ENTRIES.filter((e) => Date.now() - new Date(e.timestamp).getTime() < 86_400_000).length, color: "#7C3AED", icon: Clock },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.38, ease: [0.16, 1, 0.3, 1] } }}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            style={{
              cursor: "default", borderRadius: "14px", padding: "16px",
              background: `linear-gradient(135deg, ${color}12 0%, rgba(6,13,27,0.95) 100%)`,
              border: `1px solid ${color}28`, backdropFilter: "blur(16px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}40, 0 10px 32px rgba(0,0,0,0.35)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-[26px] font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filters ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25, duration: 0.35 } }}>
        <GlassPanel className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search user, entity, details…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "rgba(7,12,25,0.7)", border: "1px solid rgba(30,48,80,0.7)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,200,168,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,168,0.08)" }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(30,48,80,0.7)"; e.target.style.boxShadow = "none" }}
              />
            </div>
            <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-[12px] outline-none"
              style={{ background: "rgba(7,12,25,0.7)", border: "1px solid rgba(30,48,80,0.7)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              <option value="all">All Actions</option>
              {uniqueActions.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
            </select>
            <button onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-medium transition-all hover:brightness-110"
              style={{ background: "rgba(0,200,168,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </GlassPanel>
      </motion.div>

      {/* ── Audit table ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.33, duration: 0.4 } }}>
        <GlassPanel className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(30,48,80,0.6)", background: "rgba(0,0,0,0.25)" }}>
                  {["Timestamp", "User", "Action", "Entity", "Details", "IP"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((entry, i) => {
                  const actionColor = ACTION_COLORS[entry.action] ?? "#64748B"
                  return (
                    <motion.tr key={entry.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: 0.36 + i * 0.02, duration: 0.22 } }}
                      className="border-t group"
                      style={{ borderColor: "rgba(30,48,80,0.35)" }}
                      whileHover={{ backgroundColor: "rgba(255,255,255,0.018)" } as never}
                    >
                      <td className="px-4 py-2.5 text-[11px] whitespace-nowrap" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {formatDatetime(entry.timestamp)}
                      </td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>
                        {entry.user}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap"
                          style={{ background: `${actionColor}14`, color: actionColor, border: `1px solid ${actionColor}25`, fontFamily: "var(--ao-font-mono)" }}>
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                        {entry.entity}
                      </td>
                      <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        {entry.details}
                      </td>
                      <td className="px-4 py-2.5 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                        {entry.ip}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t text-[11px]"
            style={{ borderColor: "rgba(30,48,80,0.5)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", background: "rgba(0,0,0,0.15)" }}>
            Showing {Math.min(filtered.length, 50)} of {filtered.length} entries
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  )
}

// ─── Regulatory Calendar ───────────────────────────────────────────────────
function RegulatoryCalendar() {
  const sorted = [...DEADLINES].sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime())

  const overdue  = sorted.filter((d) => differenceInDays(parseISO(d.dueDate), today) < 0).length
  const critical = sorted.filter((d) => { const n = differenceInDays(parseISO(d.dueDate), today); return n >= 0 && n <= 7 }).length
  const upcoming = sorted.filter((d) => differenceInDays(parseISO(d.dueDate), today) > 7).length

  return (
    <div className="flex flex-col gap-5">

      {/* ── Summary ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Overdue",  value: overdue,  color: "#FF4757", icon: AlertTriangle },
          { label: "Critical (≤7d)", value: critical, color: "#FFA502", icon: Clock },
          { label: "Upcoming", value: upcoming, color: "#2ED573",  icon: Calendar },
        ].map(({ label, value, color, icon: Icon }, i) => (
          <motion.div key={label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.38, ease: [0.16, 1, 0.3, 1] } }}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 380, damping: 26 } }}
            style={{
              cursor: "default", borderRadius: "14px", padding: "18px",
              background: `linear-gradient(135deg, ${color}12 0%, rgba(6,13,27,0.95) 100%)`,
              border: `1px solid ${color}28`, backdropFilter: "blur(16px)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1.5px ${color}40, 0 10px 32px rgba(0,0,0,0.35)` }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-[28px] font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Deadline cards ── */}
      <div className="flex flex-col gap-3">
        {sorted.map((dl, i) => {
          const daysLeft = differenceInDays(parseISO(dl.dueDate), today)
          const { color, bg, glow, label, labelBg } = deadlineStyle(dl.dueDate)
          const isOverdue = daysLeft < 0

          return (
            <motion.div key={dl.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.28 + i * 0.07, duration: 0.38, ease: [0.16, 1, 0.3, 1] } }}
              whileHover={{ scale: 1.012, y: -2, transition: { type: "spring", stiffness: 360, damping: 26 } }}
              style={{
                cursor: "default", borderRadius: "16px",
                background: `linear-gradient(135deg, ${bg} 0%, rgba(6,13,27,0.97) 100%)`,
                border: `1px solid ${color}28`,
                borderLeft: `3px solid ${color}`,
                backdropFilter: "blur(16px)",
                boxShadow: `0 4px 20px rgba(0,0,0,0.25)`,
                padding: "16px 20px",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${color}35, 0 12px 36px rgba(0,0,0,0.4), 0 0 20px ${glow}`
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)"
              }}
            >
              <div className="flex items-center gap-4">
                {/* Day counter badge */}
                <motion.div
                  className="w-16 h-16 rounded-xl flex flex-col items-center justify-center shrink-0"
                  style={{ background: `${color}14`, border: `1px solid ${color}30` }}
                  animate={isOverdue ? { boxShadow: [`0 0 0 0 ${color}40`, `0 0 0 6px ${color}00`] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  <p className="text-[22px] font-bold leading-none" style={{ color, fontFamily: "var(--ao-font-mono)" }}>
                    {Math.abs(daysLeft)}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide mt-0.5"
                    style={{ color, fontFamily: "var(--ao-font-body)", opacity: 0.8 }}>
                    {isOverdue ? "overdue" : "days"}
                  </p>
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-bold text-[14px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
                      {dl.name}
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                      style={{ background: labelBg, color, border: `1px solid ${color}30`, fontFamily: "var(--ao-font-body)" }}>
                      {label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(30,48,80,0.5)", color: "var(--ao-text-muted)", border: "1px solid rgba(30,48,80,0.8)", fontFamily: "var(--ao-font-body)" }}>
                      {dl.type}
                    </span>
                  </div>
                  <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{dl.notes}</p>
                </div>

                {/* Due date */}
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Due</p>
                  <p className="text-[13px] font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>
                    {format(parseISO(dl.dueDate), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function CompliancePage() {
  const [tab, setTab] = useState<"documents" | "audit" | "calendar">("documents")

  const TABS = [
    { id: "documents", label: "Documents",          icon: FileText, desc: "Shipment document repository & compliance status" },
    { id: "audit",     label: "Audit Trail",         icon: Shield,   desc: "All system actions, changes and access logs" },
    { id: "calendar",  label: "Regulatory Calendar", icon: Calendar, desc: "Upcoming deadlines, renewals and inspections" },
  ]

  const activeTab = TABS.find((t) => t.id === tab)

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="shrink-0 px-6 py-4 border-b"
        style={{ borderColor: "var(--ao-border)", background: "linear-gradient(180deg, rgba(7,12,22,0.92) 0%, rgba(5,10,19,0.6) 100%)", backdropFilter: "blur(16px)" }}>

        <div className="flex items-center gap-3 mb-4">
          <motion.div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)", border: "1px solid rgba(0,200,168,0.3)" }}
            animate={{ boxShadow: ["0 0 0 0 rgba(0,200,168,0.3)", "0 0 0 8px rgba(0,200,168,0)", "0 0 0 0 rgba(0,200,168,0)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          >
            <Shield className="w-4.5 h-4.5" style={{ color: "var(--ao-accent)" }} />
          </motion.div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold"
              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.14em" }}>
              Compliance &amp; Governance
            </p>
            <motion.p key={activeTab?.desc} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-[13px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {activeTab?.desc}
            </motion.p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1.5">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-medium transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,200,168,0.18) 0%, rgba(0,200,168,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "var(--ao-accent)" : "var(--ao-text-muted)",
                  border: isActive ? "1px solid rgba(0,200,168,0.3)" : "1px solid transparent",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: isActive ? "0 0 14px rgba(0,200,168,0.12)" : "none",
                  backdropFilter: isActive ? "blur(8px)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {isActive && (
                  <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: "var(--ao-accent)", boxShadow: "0 0 6px rgba(0,200,168,0.6)" }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={fadeVariants} initial="initial" animate="animate" exit="exit"
          className="flex-1 overflow-auto p-6">
          {tab === "documents" && <DocumentRepository />}
          {tab === "audit"     && <AuditLog />}
          {tab === "calendar"  && <RegulatoryCalendar />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
