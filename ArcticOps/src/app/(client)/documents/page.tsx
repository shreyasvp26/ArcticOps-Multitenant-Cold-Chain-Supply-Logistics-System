"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Download, Upload, Check, Clock, X, ChevronDown, ChevronRight,
  FileText
} from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { fadeVariants } from "@/lib/utils/motion"

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
    </div>
  )
}

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
      </motion.div>
    </div>
  )
}
