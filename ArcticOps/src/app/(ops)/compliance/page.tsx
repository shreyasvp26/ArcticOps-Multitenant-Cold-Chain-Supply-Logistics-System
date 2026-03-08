"use client"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check, Clock, X, Download, Upload, Search,
  ChevronDown, ChevronRight, FileText, Shield, Calendar
} from "lucide-react"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { formatDate, formatDatetime } from "@/lib/utils/format"
import { fadeVariants, staggerContainer, staggerChild } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"
import { differenceInDays, parseISO, addDays, startOfToday, format } from "date-fns"

// ---------- Audit log data ----------
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

// ---------- Regulatory deadlines ----------
const today = startOfToday()
const DEADLINES = [
  { id: "REG-001", name: "GDP License Renewal — EU", type: "License", dueDate: addDays(today, 5).toISOString(), notes: "Annual renewal required for EU operations" },
  { id: "REG-002", name: "IATA DGR Certification", type: "Certification", dueDate: addDays(today, 18).toISOString(), notes: "Required for air transport of hazardous materials" },
  { id: "REG-003", name: "WHO PQS Audit Submission", type: "Submission", dueDate: addDays(today, 42).toISOString(), notes: "Quarterly quality system submission" },
  { id: "REG-004", name: "Cold Storage Facility Inspection", type: "Inspection", dueDate: addDays(today, 75).toISOString(), notes: "Annual facility inspection — Singapore depot" },
  { id: "REG-005", name: "IMDG Code Training Update", type: "Training", dueDate: addDays(today, -3).toISOString(), notes: "Required for sea freight team" },
  { id: "REG-006", name: "GMP Manufacturing Audit", type: "Audit", dueDate: addDays(today, 12).toISOString(), notes: "Triggered by PharmaAlpha compliance clause" },
]

function DeadlineColor(dueDate: string): { color: string; bg: string } {
  const days = differenceInDays(parseISO(dueDate), today)
  if (days < 0) return { color: "#FF4757", bg: "rgba(255,71,87,0.08)" }
  if (days <= 7) return { color: "#FF4757", bg: "rgba(255,71,87,0.06)" }
  if (days <= 30) return { color: "#FFA502", bg: "rgba(255,165,2,0.06)" }
  return { color: "#2ED573", bg: "rgba(46,213,115,0.04)" }
}

// ---------- Document repository with expandable shipment rows ----------
function DocumentRepository() {
  const [expandedShipments, setExpandedShipments] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const shipmentIds = [...new Set(MOCK_DOCUMENTS.map((d) => d.shipmentId).filter(Boolean))]
  const filteredShipments = shipmentIds.filter((sid) => {
    if (!search) return true
    return sid?.toLowerCase().includes(search.toLowerCase()) ||
      MOCK_SHIPMENTS.find((s) => s.id === sid)?.clientName.toLowerCase().includes(search.toLowerCase())
  })

  const toggle = (id: string) =>
    setExpandedShipments((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search shipments…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none transition-all"
            style={{ background: "rgba(11,18,34,0.6)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)", backdropFilter: "blur(8px)" }} />
        </div>
        {["all", "complete", "pending", "missing"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize"
            style={{
              background: statusFilter === s ? "rgba(0,200,168,0.12)" : "rgba(11,18,34,0.4)",
              border: `1px solid ${statusFilter === s ? "rgba(0,200,168,0.4)" : "var(--ao-border)"}`,
              color: statusFilter === s ? "var(--ao-accent)" : "var(--ao-text-muted)",
              fontFamily: "var(--ao-font-body)",
            }}>{s === "all" ? "All Status" : s}</button>
        ))}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
        {filteredShipments.map((sid, i) => {
          const shipment = MOCK_SHIPMENTS.find((s) => s.id === sid)
          const docs = MOCK_DOCUMENTS.filter((d) => d.shipmentId === sid &&
            (statusFilter === "all" || d.status === statusFilter))
          const allComplete = docs.every((d) => d.status === "complete")
          const hasMissing = docs.some((d) => d.status === "missing")
          const isOpen = expandedShipments.has(sid ?? "")

          return (
            <div key={sid ?? i} className={cn("border-b last:border-b-0")} style={{ borderColor: "var(--ao-border)" }}>
              {/* Shipment row header */}
              <button onClick={() => toggle(sid ?? "")}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
                aria-expanded={isOpen}>
                {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                  : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />}
                <span className="font-bold text-[13px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sid}</span>
                <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  {shipment?.clientName}
                </span>
                <span className="ml-auto text-[11px]" style={{
                  color: hasMissing ? "#FF4757" : allComplete ? "#2ED573" : "#FFA502",
                  fontFamily: "var(--ao-font-body)",
                }}>
                  {docs.length} doc{docs.length !== 1 ? "s" : ""}
                </span>
                {docs.length > 0 && (
                  <button onClick={(e) => { e.stopPropagation() }}
                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                    style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
                    <Download className="w-3 h-3" /> Bulk
                  </button>
                )}
              </button>

              {/* Expanded docs */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ height: 0, opacity: 0, transition: { duration: 0.1 } }} className="overflow-hidden">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-4 pl-12 pr-5 py-2.5 border-t"
                        style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.3)" }}>
                        <span className="flex-1 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</span>
                        <span className="flex items-center gap-1 text-[12px]" style={{
                          color: doc.status === "complete" ? "#2ED573" : doc.status === "missing" ? "#FF4757" : "#FFA502",
                          fontFamily: "var(--ao-font-body)",
                        }}>
                          {doc.status === "complete" ? <Check className="w-3.5 h-3.5" /> : doc.status === "missing" ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        <span className="text-[11px] w-24 text-right" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                          {doc.uploadedAt ? formatDate(doc.uploadedAt) : "—"}
                        </span>
                        {doc.status === "complete"
                          ? <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:opacity-80"
                              style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
                              <Download className="w-3 h-3" />
                            </button>
                          : <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                              style={{ color: "var(--ao-accent)", backgroundColor: "rgba(0,200,168,0.10)", border: "1px solid rgba(0,200,168,0.2)", fontFamily: "var(--ao-font-body)" }}>
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                        }
                      </div>
                    ))}
                    {docs.length === 0 && (
                      <div className="pl-12 pr-5 py-3 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                        No documents match the current filter
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------- Audit Log ----------
function AuditLog() {
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search log…"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
        </select>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium transition-all hover:brightness-110"
          style={{ backgroundColor: "rgba(0,200,168,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: "rgba(13,24,41,0.8)", borderBottom: "1px solid var(--ao-border)" }}>
              {["Timestamp", "User", "Action", "Entity", "Details", "IP"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 50).map((entry) => (
              <tr key={entry.id} className="border-t" style={{ borderColor: "var(--ao-border)" }}>
                <td className="px-4 py-2.5 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)", whiteSpace: "nowrap" }}>
                  {formatDatetime(entry.timestamp)}
                </td>
                <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-mono)" }}>{entry.user}</td>
                <td className="px-4 py-2.5">
                  <span className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "rgba(0,200,168,0.08)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                    {entry.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>{entry.entity}</td>
                <td className="px-4 py-2.5 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{entry.details}</td>
                <td className="px-4 py-2.5 text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{entry.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2 border-t text-[11px]"
          style={{ borderColor: "var(--ao-border)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", backgroundColor: "rgba(13,24,41,0.5)" }}>
          Showing {Math.min(filtered.length, 50)} of {filtered.length} entries
        </div>
      </div>
    </div>
  )
}

// ---------- Regulatory Calendar ----------
function RegulatoryCalendar() {
  return (
    <div className="flex flex-col gap-3">
      {DEADLINES.sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime()).map((dl) => {
        const daysLeft = differenceInDays(parseISO(dl.dueDate), today)
        const { color, bg } = DeadlineColor(dl.dueDate)
        return (
          <div key={dl.id} className="flex items-center gap-4 p-4 rounded-xl border"
            style={{ backgroundColor: bg, borderColor: `${color}30` }}>
            <div className="w-14 h-14 rounded-lg flex flex-col items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}14`, border: `1px solid ${color}30` }}>
              <p className="text-lg font-bold leading-none" style={{ color, fontFamily: "var(--ao-font-mono)" }}>
                {Math.abs(daysLeft)}
              </p>
              <p className="text-[9px]" style={{ color, fontFamily: "var(--ao-font-body)" }}>
                {daysLeft < 0 ? "overdue" : "days"}
              </p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{dl.name}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  {dl.type}
                </span>
              </div>
              <p className="text-[12px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{dl.notes}</p>
            </div>
            <p className="text-[12px] shrink-0" style={{ color, fontFamily: "var(--ao-font-mono)" }}>
              {format(parseISO(dl.dueDate), "MMM d, yyyy")}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ---------- Main page ----------
export default function CompliancePage() {
  const [tab, setTab] = useState<"documents" | "audit" | "calendar">("documents")

  const TABS = [
    { id: "documents", label: "Documents", icon: FileText, desc: "Shipment document repository" },
    { id: "audit", label: "Audit Trail", icon: Shield, desc: "All system actions and changes" },
    { id: "calendar", label: "Regulatory Calendar", icon: Calendar, desc: "Upcoming deadlines and renewals" },
  ]

  const activeTab = TABS.find((t) => t.id === tab)

  return (
    <div className="flex flex-col h-full">
      {/* Page header bar */}
      <div
        className="shrink-0 px-6 py-4 border-b"
        style={{
          borderColor: "var(--ao-border)",
          background: "linear-gradient(180deg, rgba(7,12,22,0.8) 0%, rgba(5,10,19,0.5) 100%)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)", border: "1px solid rgba(0,200,168,0.25)" }}
          >
            <Shield className="w-4 h-4" style={{ color: "var(--ao-accent)" }} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.12em" }}>
              Compliance &amp; Governance
            </p>
            <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {activeTab?.desc}
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id as typeof tab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(0,200,168,0.18) 0%, rgba(0,200,168,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "var(--ao-accent)" : "var(--ao-text-muted)",
                  border: isActive ? "1px solid rgba(0,200,168,0.3)" : "1px solid transparent",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: isActive ? "0 0 12px rgba(0,200,168,0.1)" : "none",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={fadeVariants} initial="initial" animate="animate" exit="exit"
          className="flex-1 overflow-auto p-6">
          {tab === "documents" && <DocumentRepository />}
          {tab === "audit" && <AuditLog />}
          {tab === "calendar" && <RegulatoryCalendar />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
