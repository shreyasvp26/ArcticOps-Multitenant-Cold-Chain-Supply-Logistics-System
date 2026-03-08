"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Megaphone } from "lucide-react"
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

export default function ClientCommunicationsPage() {
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
    <div className="flex h-full p-6 gap-6">
      {/* Thread list */}
      <div className="w-72 shrink-0 flex flex-col gap-1">
        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Conversations</p>
        <div className="flex flex-col gap-2">
          {THREADS.map((t) => (
            <button key={t.id} onClick={() => setSelectedThread(t)}
              className={cn("w-full text-left px-4 py-3 rounded-xl transition-all border",
                selectedThread.id === t.id ? "" : "hover:bg-[rgba(255,255,255,0.02)]")}
              style={{
                backgroundColor: selectedThread.id === t.id ? "rgba(59,130,246,0.08)" : "var(--ao-surface)",
                borderColor: selectedThread.id === t.id ? "#3B82F6" : "var(--ao-border)",
              }}>
              <p className="text-[12px] font-bold mb-0.5" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{t.shipmentId}</p>
              <p className="text-[11px] font-medium truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{t.subject}</p>
            </button>
          ))}
        </div>

        {/* Announcements */}
        <p className="text-[11px] font-bold uppercase tracking-wider mt-6 mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Network Announcements</p>
        <div className="flex flex-col gap-2">
          {ANNOUNCEMENTS.map((ann) => (
            <div key={ann.id}>
              <button onClick={() => setExpandedAnn((p) => { const n = new Set(p); n.has(ann.id) ? n.delete(ann.id) : n.add(ann.id); return n })}
                className="w-full text-left px-4 py-3 rounded-xl border transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
                <div className="flex items-start gap-2">
                  <Megaphone className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#3B82F6" }} />
                  <p className="text-[11px] font-bold leading-snug" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{ann.title}</p>
                </div>
                <p className="text-[10px] mt-1 pl-5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{ann.date}</p>
                <AnimatePresence>
                  {expandedAnn.has(ann.id) && (
                    <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="text-[11px] mt-2 pl-5 overflow-hidden leading-relaxed"
                      style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      {ann.body}
                    </motion.p>
                  )}
                </AnimatePresence>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col rounded-2xl border overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--ao-surface)", borderColor: "var(--ao-border)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(12,22,42,0.6)" }}>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{selectedThread.subject}</p>
            <p className="text-[11px] font-medium" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>{selectedThread.shipmentId} · Operations Support</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#2ED573]" />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Ops Online</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {(localMessages[selectedThread.id] ?? []).map((msg) => (
            <div key={msg.id} className={cn("flex", msg.sender === "client" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[80%]", msg.sender === "client" ? "flex flex-col items-end" : "")}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className="text-[10px] font-bold" style={{ color: msg.role === "ops" ? "var(--ao-accent)" : "#3B82F6", fontFamily: "var(--ao-font-body)" }}>{msg.senderName}</span>
                  <span className="text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.05)]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{msg.role}</span>
                </div>
                <div className="px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg"
                  style={{
                    backgroundColor: msg.sender === "client" ? "#3B82F6" : "var(--ao-surface-elevated)",
                    border: `1px solid ${msg.sender === "client" ? "rgba(255,255,255,0.1)" : "var(--ao-border)"}`,
                    color: "white",
                    fontFamily: "var(--ao-font-body)",
                    borderBottomRightRadius: msg.sender === "client" ? "4px" : "20px",
                    borderBottomLeftRadius: msg.sender === "client" ? "20px" : "4px",
                  }}>
                  {msg.text}
                  <span className="block text-[10px] mt-1.5 opacity-60 text-right" style={{ fontFamily: "var(--ao-font-mono)" }}>{msg.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t" style={{ borderColor: "var(--ao-border)", backgroundColor: "rgba(10,22,40,0.4)" }}>
          <div className="relative flex items-center gap-3">
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message to operations..."
              className="flex-1 px-5 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[#3B82F6]/50"
              style={{ backgroundColor: "var(--ao-surface-elevated)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
            <button onClick={send}
              disabled={!message.trim()}
              className="p-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
              style={{ backgroundColor: "#3B82F6", color: "white", boxShadow: "0 4px 15px rgba(59,130,246,0.3)" }}>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
