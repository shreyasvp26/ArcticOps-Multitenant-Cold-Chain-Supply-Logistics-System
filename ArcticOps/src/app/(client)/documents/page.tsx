"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
<<<<<<< Updated upstream
  Download, Upload, Check, Clock, X, ChevronDown, ChevronRight,
=======
  Download, Check, ChevronDown, ChevronRight,
>>>>>>> Stashed changes
  FileText
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { fadeVariants } from "@/lib/utils/motion"

<<<<<<< Updated upstream
function DocumentsList({ tenantId }: { tenantId: string | undefined }) {
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
=======
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
>>>>>>> Stashed changes
    </div>
  )
}

<<<<<<< Updated upstream
export default function ClientDocumentsPage() {
  const { user } = useAuthStore()

  return (
    <div className="flex flex-col h-full p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>Documents & Compliance</h1>
        <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Manage regulatory filings and shipment documentation</p>
      </div>
      
      <motion.div variants={fadeVariants} initial="initial" animate="animate"
        className="flex-1 overflow-auto">
        <DocumentsList tenantId={user?.tenantId ?? undefined} />
=======
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
>>>>>>> Stashed changes
      </motion.div>
    </div>
  )
}
