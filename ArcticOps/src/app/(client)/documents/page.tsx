"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Upload, Check, Clock, X, ChevronDown, ChevronRight,
  FileText, Send, Megaphone
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { formatDate, formatDatetime } from "@/lib/utils/format"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"

const ANNOUNCEMENTS = [
  { id: "ann1", title: "New Compliance Form Required for EU Shipments", date: "2025-01-15", body: "Starting Feb 1, all EU-bound shipments require the updated GDP Annex 7 form. Please ensure your team is aware." },
  { id: "ann2", title: "Maintenance Window: Jan 22–23", date: "2025-01-10", body: "The platform will be in read-only mode during the maintenance window. Shipment tracking will still be available." },
  { id: "ann3", title: "Q4 Performance Report Available", date: "2025-01-05", body: "Your Q4 shipment performance report is ready. Overall on-time delivery: 94.2%. View it in Documents." },
]

const THREADS = [
  {
    id: "t1", shipmentId: "SHP-0001", subject: "Re: Temperature excursion alert",
    messages: [
      { id: "m1", sender: "ops", senderName: "Alex Carter", role: "ops", time: "2h ago", text: "We've identified a brief excursion of 0.8°C above your threshold. The unit has been recalibrated and temp is now stable at 4.2°C." },
      { id: "m2", sender: "client", senderName: "Jane Smith", role: "client", time: "1.5h ago", text: "Thank you for the quick response. Will the materials still be within spec?" },
      { id: "m3", sender: "ops", senderName: "Alex Carter", role: "ops", time: "45m ago", text: "Yes, per the stability data the brief excursion of <2 hours at +1°C does not affect material integrity. We'll include a note in the CoA." },
    ]
  },
  {
    id: "t2", shipmentId: "SHP-0003", subject: "Customs clearance update",
    messages: [
      { id: "m4", sender: "ops", senderName: "Priya Singh", role: "ops", time: "5h ago", text: "Your shipment has cleared customs in Dubai. ETA Frankfurt remains on schedule for Jan 29." },
      { id: "m5", sender: "client", senderName: "Jane Smith", role: "client", time: "4h ago", text: "Excellent! Please send the updated customs documentation to our compliance team." },
    ]
  },
]

function DocumentsPage({ tenantId }: { tenantId: string | undefined }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const tenantShipments = MOCK_SHIPMENTS.filter((s) => s.tenantId === tenantId)
  const toggle = (id: string) =>
    setExpanded((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--ao-border)" }}>
      {tenantShipments.map((sh) => {
        const docs = MOCK_DOCUMENTS.filter((d) => d.shipmentId === sh.id)
        const isOpen = expanded.has(sh.id)
        const allDone = docs.every((d) => d.status === "complete")
        const hasMissing = docs.some((d) => d.status === "missing")
        return (
          <div key={sh.id} className="border-b last:border-b-0" style={{ borderColor: "var(--ao-border)" }}>
            <button onClick={() => toggle(sh.id)}
              className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
              aria-expanded={isOpen}>
              {isOpen ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />}
              <span className="font-bold text-[13px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{sh.id}</span>
              <span className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                {sh.materials[0]?.name} · {sh.origin.split(",")[0]} → {sh.destination.split(",")[0]}
              </span>
              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: hasMissing ? "rgba(255,71,87,0.08)" : allDone ? "rgba(46,213,115,0.08)" : "rgba(255,165,2,0.08)",
                  color: hasMissing ? "#FF4757" : allDone ? "#2ED573" : "#FFA502",
                  fontFamily: "var(--ao-font-body)",
                }}>
                {hasMissing ? "Action needed" : allDone ? "Complete" : "Pending"}
              </span>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-4 pl-12 pr-5 py-2.5 border-t"
                      style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.3)" }}>
                      <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                      <span className="flex-1 text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{doc.displayName}</span>
                      <span className="flex items-center gap-1 text-[12px]" style={{
                        color: doc.status === "complete" ? "#2ED573" : doc.status === "missing" ? "#FF4757" : "#FFA502",
                        fontFamily: "var(--ao-font-body)",
                      }}>
                        {doc.status === "complete" ? <Check className="w-3.5 h-3.5" /> : doc.status === "missing" ? <X className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                      </span>
                      {doc.status === "complete"
                        ? <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:opacity-80 transition-opacity"
                            style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
                            <Download className="w-3 h-3" /> Download
                          </button>
                        : <button className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded"
                            style={{ color: "var(--ao-accent)", backgroundColor: "rgba(0,212,170,0.10)", border: "1px solid rgba(0,212,170,0.2)", fontFamily: "var(--ao-font-body)" }}>
                            <Upload className="w-3 h-3" /> Upload
                          </button>
                      }
                    </div>
                  ))}
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
    </div>
  )
}

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
    <div className="flex h-full gap-4">
      {/* Thread list */}
      <div className="w-64 shrink-0 flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Conversations</p>
        {THREADS.map((t) => (
          <button key={t.id} onClick={() => setSelectedThread(t)}
            className={cn("w-full text-left px-3 py-2.5 rounded-lg transition-all",
              selectedThread.id === t.id ? "ring-1 ring-[var(--ao-accent)]" : "hover:bg-[rgba(255,255,255,0.03)]")}
            style={{
              backgroundColor: selectedThread.id === t.id ? "rgba(0,212,170,0.06)" : "var(--ao-surface)",
              border: `1px solid ${selectedThread.id === t.id ? "var(--ao-accent)" : "var(--ao-border)"}`,
            }}>
            <p className="text-[12px] font-semibold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{t.shipmentId}</p>
            <p className="text-[11px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{t.subject}</p>
          </button>
        ))}

        {/* Announcements */}
        <p className="text-[11px] font-semibold uppercase tracking-wider mt-4 mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Announcements</p>
        {ANNOUNCEMENTS.map((ann) => (
          <div key={ann.id}>
            <button onClick={() => setExpandedAnn((p) => { const n = new Set(p); n.has(ann.id) ? n.delete(ann.id) : n.add(ann.id); return n })}
              className="w-full text-left px-3 py-2.5 rounded-lg border transition-colors hover:bg-[rgba(255,255,255,0.03)]"
              style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
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
        style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{selectedThread.subject}</p>
          <p className="text-[11px]" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{selectedThread.shipmentId}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {(localMessages[selectedThread.id] ?? []).map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "client" ? "justify-end" : "justify-start")}>
              <div className="max-w-[70%]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium" style={{ color: msg.role === "ops" ? "var(--ao-accent)" : "#3B82F6", fontFamily: "var(--ao-font-body)" }}>{msg.senderName}</span>
                  <span className="text-[9px] px-1 py-0.5 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{msg.role}</span>
                </div>
                <div className="px-3 py-2 rounded-2xl text-[13px]"
                  style={{
                    backgroundColor: msg.sender === "client" ? "rgba(59,130,246,0.14)" : "var(--ao-surface-elevated)",
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

export default function ClientDocumentsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<"documents" | "comms">("documents")

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b shrink-0" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
        {[
          { id: "documents", label: "Documents & Compliance" },
          { id: "comms", label: "Communications" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id as typeof tab)}
            className={cn("px-5 py-3 text-[13px] font-medium border-b-2 transition-colors",
              tab === id ? "border-[var(--ao-accent)]" : "border-transparent hover:bg-[rgba(255,255,255,0.03)]")}
            style={{ color: tab === id ? "var(--ao-accent)" : "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} variants={fadeVariants} initial="initial" animate="animate" exit="exit"
          className="flex-1 overflow-auto p-6">
          {tab === "documents" && <DocumentsPage tenantId={user?.tenantId ?? undefined} />}
          {tab === "comms" && <CommunicationsPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
