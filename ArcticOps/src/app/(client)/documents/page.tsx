"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Upload, Check, Clock, X, ChevronDown, ChevronRight,
  FileText, Send, Megaphone
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"

// ---------- Static thread / announcement data ----------
const THREADS = [
  {
    id: "th-001",
    shipmentId: "SH-2847",
    subject: "Insulin Glargine — Mumbai → Frankfurt",
    messages: [
      { id: "m1", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 6, 09:12", text: "Your shipment departed Mumbai on schedule." },
      { id: "m2", sender: "client", senderName: "You", role: "client", time: "Mar 6, 10:05", text: "Great — any customs pre-clearance needed in Frankfurt?" },
      { id: "m3", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 6, 10:34", text: "Yes, docs are filed. Expect clearance within 4 hours of landing." },
    ],
  },
  {
    id: "th-002",
    shipmentId: "SH-1204",
    subject: "COVID Vaccines — Oslo → Singapore",
    messages: [
      { id: "m4", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 5, 14:00", text: "Cold-chain integrity confirmed at Oslo departure." },
    ],
  },
  {
    id: "th-003",
    shipmentId: "SH-3091",
    subject: "Antibiotics — São Paulo → Nairobi",
    messages: [
      { id: "m5", sender: "ops", senderName: "Ops Team", role: "ops", time: "Mar 7, 08:20", text: "Shipment is at customs in Lagos Hub. Expected delay: 12 h." },
    ],
  },
]

const ANNOUNCEMENTS = [
  {
    id: "ann-001",
    title: "System maintenance — Mar 15, 02:00–04:00 UTC",
    date: "Mar 8, 2026",
    body: "The ArcticOps platform will be briefly unavailable during scheduled maintenance. Live tracking will resume automatically.",
  },
  {
    id: "ann-002",
    title: "New: Real-time temperature excursion alerts",
    date: "Mar 5, 2026",
    body: "You will now receive an instant push notification whenever a monitored shipment crosses its temperature threshold.",
  },
]

// ---------- DocumentsList ----------
function DocumentsList({ tenantId }: { tenantId: string | undefined }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const tenantShipments = MOCK_SHIPMENTS.filter((s) => s.tenantId === tenantId)
  const toggle = (id: string) =>
    setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
        border: "1px solid var(--ao-border)",
        backdropFilter: "blur(12px)",
      }}>
      {tenantShipments.map((sh) => {
        const docs = MOCK_DOCUMENTS.filter((d) => d.shipmentId === sh.id)
        const isOpen = expanded.has(sh.id)
        const allDone = docs.every((d) => d.status === "complete")
        const hasMissing = docs.some((d) => d.status === "missing")
        const statusColor = hasMissing ? "#FF4757" : allDone ? "#2ED573" : "#FFA502"
        return (
          <div key={sh.id} className="border-b last:border-b-0" style={{ borderColor: "var(--ao-border)" }}>
            <button onClick={() => toggle(sh.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors text-left"
              aria-expanded={isOpen}>
              {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />}
              <span className="font-bold text-[13px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
              <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                {sh.materials[0]?.name} · {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
              </span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  background: `${statusColor}14`,
                  color: statusColor,
                  border: `1px solid ${statusColor}30`,
                  fontFamily: "var(--ao-font-body)",
                }}>
                {hasMissing ? "Action needed" : allDone ? "Complete" : "Pending"}
              </span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {docs.map((doc) => {
                    const docStatusColor = doc.status === "complete" ? "#2ED573" : doc.status === "missing" ? "#FF4757" : "#FFA502"
                    return (
                      <div key={doc.id} className="flex items-center gap-4 pl-12 pr-5 py-2.5 border-t"
                        style={{ borderColor: "var(--ao-border)", background: "rgba(0,0,0,0.15)" }}>
                        <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                        <span className="flex-1 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</span>
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: docStatusColor, fontFamily: "var(--ao-font-body)" }}>
                          {doc.status === "complete" ? <Check className="w-3.5 h-3.5" /> : doc.status === "missing" ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </span>
                        {doc.status === "complete"
                          ? <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                              style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", background: "rgba(255,255,255,0.04)", fontFamily: "var(--ao-font-body)" }}>
                              <Download className="w-3 h-3" /> Download
                            </button>
                          : <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md hover:brightness-110"
                              style={{ color: "var(--ao-accent)", background: "rgba(0,200,168,0.10)", border: "1px solid rgba(0,200,168,0.25)", fontFamily: "var(--ao-font-body)" }}>
                              <Upload className="w-3 h-3" /> Upload
                            </button>
                        }
                      </div>
                    )
                  })}
                  {docs.length === 0 && (
                    <p className="pl-12 py-3 text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No documents yet</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
      {tenantShipments.length === 0 && (
        <p className="px-5 py-8 text-center text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No shipments found</p>
      )}
// ---------- Static Data ----------
const DOCUMENT_SET = [
  "Certificate of Origin",
  "Invoice",
  "ARDA Certification",
  "Driver Registration",
  "Company Registration number",
  "Purchase order",
  "Bill of ladding"
]

const COMPLIANCE_SET = [
  "GDP compliance",
  "WHO MPS",
  "NDP compliance certificate",
  "Customs",
  "Declaration",
  "Bank Transfer"
]

// ---------- DocumentsList ----------
function DocumentsList({ type }: { type: "documents" | "compliance" }) {
  const list = type === "documents" ? DOCUMENT_SET : COMPLIANCE_SET

  return (
    <div className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
        border: "1px solid var(--ao-border)",
        backdropFilter: "blur(12px)",
      }}>
      <div className="px-5 py-3 border-b" style={{ borderColor: "var(--ao-border)", background: "rgba(0,0,0,0.2)" }}>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          {type === "documents" ? "Core Documentation" : "Regulatory Compliance"}
        </p>
      </div>
      {list.map((item, i) => (
        <div key={item} className={cn("flex items-center gap-4 px-5 py-4", i > 0 ? "border-t" : "")}
          style={{ borderColor: "var(--ao-border)", transition: "background 0.2s" }}>
          <div className="p-2 rounded-lg" style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <FileText className="w-4 h-4" style={{ color: "#3B82F6" }} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{item}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>VERIFIED SYSTEM RECORD</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
              style={{ background: "rgba(46,213,115,0.1)", color: "#2ED573", border: "1px solid rgba(46,213,115,0.2)" }}>
              <Check className="w-3 h-3" />
              COMPLETE
            </div>
            <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors" style={{ color: "var(--ao-text-muted)" }}>
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ---------- CommunicationsPage ----------
function CommunicationsPage() {
  const [selectedThread, setSelectedThread] = useState(THREADS[0]!)
  const [message, setMessage] = useState("")
  const [localMessages, setLocalMessages] = useState<{ [key: string]: Array<{ id: string; sender: string; senderName: string; role: string; time: string; text: string }> }>(
    Object.fromEntries(THREADS.map((t) => [t.id, t.messages]))
  )
  const [expandedAnn, setExpandedAnn] = useState<Set<string>>(new Set())

  const send = () => {
    if (!message.trim()) return
    setLocalMessages((prev) => ({
      ...prev,
      [selectedThread.id]: [...(prev[selectedThread.id] ?? []), {
        id: `local-${Date.now()}`, sender: "client", senderName: "You", role: "client", time: "now", text: message,
      }]
    }))
    setMessage("")
  }

  return (
    <div className="flex h-full gap-4 p-5">
      {/* Thread list */}
      <div className="w-64 shrink-0 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>Conversations</p>
        {THREADS.map((t) => (
          <button key={t.id} onClick={() => setSelectedThread(t)}
            className="w-full text-left px-3 py-2.5 rounded-lg transition-all"
            style={{
              background: selectedThread.id === t.id
                ? "linear-gradient(135deg, rgba(0,200,168,0.12) 0%, rgba(6,13,27,0.9) 100%)"
                : "rgba(11,18,34,0.4)",
              border: `1px solid ${selectedThread.id === t.id ? "rgba(0,200,168,0.35)" : "var(--ao-border)"}`,
              backdropFilter: "blur(8px)",
            }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{t.shipmentId}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{t.subject}</p>
          </button>
        ))}

        <p className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>Announcements</p>
        {ANNOUNCEMENTS.map((ann) => (
          <div key={ann.id}>
            <button onClick={() => setExpandedAnn((p) => { const n = new Set(p); n.has(ann.id) ? n.delete(ann.id) : n.add(ann.id); return n })}
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
        style={{
          background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
          borderColor: "var(--ao-border)",
          backdropFilter: "blur(12px)",
        }}>
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
                    color: "var(--ao-text-primary)",
                    fontFamily: "var(--ao-font-body)",
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
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
          <button onClick={send}
            className="p-2.5 rounded-lg transition-all hover:brightness-110"
            style={{ backgroundColor: "#3B82F6", color: "white" }}>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Page ----------
export default function ClientDocumentsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<"documents" | "comms">("documents")

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-4 border-b"
        style={{
          borderColor: "var(--ao-border)",
          background: "linear-gradient(180deg, rgba(7,12,22,0.8) 0%, rgba(5,10,19,0.5) 100%)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="flex gap-1">
          {[
            { id: "documents", label: "Documents & Compliance", icon: FileText },
            { id: "comms", label: "Communications", icon: Send },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "#3B82F6" : "var(--ao-text-muted)",
                  border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: isActive ? "0 0 12px rgba(59,130,246,0.1)" : "none",
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>
      </div>
// ---------- Page ----------
export default function ClientDocumentsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<"documents" | "compliance">("documents")

  const downloadSampleSet = (type: string) => {
    const content = `Sample ${type} set for ${user?.tenantName || 'Client'}\nGenerated on ${new Date().toLocaleDateString()}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type.toLowerCase()}-sample-set.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-6 py-4 border-b flex items-center justify-between"
        style={{
          borderColor: "var(--ao-border)",
          background: "linear-gradient(180deg, rgba(7,12,22,0.8) 0%, rgba(5,10,19,0.5) 100%)",
          backdropFilter: "blur(12px)",
        }}>
        <div className="flex gap-1">
          {[
            { id: "documents", label: "Documents", icon: FileText },
            { id: "compliance", label: "Compliance", icon: Check },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <button key={id} onClick={() => setTab(id as typeof tab)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.08) 100%)"
                    : "transparent",
                  color: isActive ? "#3B82F6" : "var(--ao-text-muted)",
                  border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: isActive ? "0 0 12px rgba(59,130,246,0.1)" : "none",
                }}>
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => downloadSampleSet(tab === "documents" ? "Documents" : "Compliance")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:brightness-110 shadow-lg"
          style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
            color: "white",
            fontFamily: "var(--ao-font-body)",
            boxShadow: "0 4px 12px rgba(59,130,246,0.25)"
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Download {tab === "documents" ? "Documents" : "Compliance"} Sample Set
        </button>
      </div>

      <motion.div key={tab} variants={fadeVariants} initial="initial" animate="animate"
        className="flex-1 overflow-auto p-5">
        <DocumentsList type={tab} />
      </motion.div>

      {tab === "documents" ? (
        <motion.div key="documents" variants={fadeVariants} initial="initial" animate="animate"
          className="flex-1 overflow-auto p-5">
          <DocumentsList tenantId={user?.tenantId ?? undefined} />
        </motion.div>
      ) : (
        <motion.div key="comms" variants={fadeVariants} initial="initial" animate="animate"
          className="flex-1 overflow-hidden">
          <CommunicationsPage />
        </motion.div>
      )}
    </div>
  )
}
