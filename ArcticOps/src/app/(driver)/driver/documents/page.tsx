"use client"
import { Check, Clock, X, Upload, AlertTriangle } from "lucide-react"
import { useDriverStore } from "@/lib/store/driver-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_CREWS } from "@/lib/mock-data/crews"

const MODE_DOCS: Record<string, string[]> = {
  road: ["Driver's License", "Vehicle Registration", "ADR Certificate", "CMR Waybill", "Temperature Log", "Packing List"],
  air: ["Air Waybill (AWB)", "Shipper's Declaration", "IATA DGR Certification", "Temperature Log", "Certificate of Analysis"],
  sea: ["Bill of Lading", "Dangerous Goods Declaration (IMDG)", "Packing Certificate", "Temperature Log", "Customs Entry"],
  rail: ["Rail Consignment Note (CIM)", "Dangerous Goods Declaration (RID)", "Temperature Log", "Certificate of Analysis"],
}

export default function DriverDocumentsPage() {
  const { user } = useAuthStore()
  const { currentAssignment } = useDriverStore()
  const shipment = currentAssignment ?? MOCK_SHIPMENTS.find((s) => s.status === "in_transit")
  const crew = MOCK_CREWS.find((c) => c.status === "on_duty")

  const mode = shipment?.legs[0]?.mode ?? "road"
  const docs = MODE_DOCS[mode] ?? MODE_DOCS.road!

  // Mock submission state — alternate between statuses
  const getStatus = (i: number): "submitted" | "pending" | "missing" =>
    i < 2 ? "submitted" : i < 4 ? "pending" : "missing"

  const nextBorder = "UAE → Germany border in ~4 hours"
  const requiredAtBorder = ["Customs Entry", "Packing Certificate"]

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      {/* Border notification */}
      <div className="flex items-start gap-3 p-3 rounded-xl border"
        style={{ backgroundColor: "rgba(255,165,2,0.08)", borderColor: "rgba(255,165,2,0.3)" }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FFA502" }} />
        <div>
          <p className="text-[12px] font-semibold" style={{ color: "#FFA502", fontFamily: "var(--ao-font-body)" }}>
            {nextBorder}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Required: {requiredAtBorder.join(", ")}
          </p>
        </div>
      </div>

      {/* Doc checklist */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          {mode.toUpperCase()} — Document Checklist
        </p>
        <div className="flex flex-col gap-2">
          {docs.map((doc, i) => {
            const status = getStatus(i)
            return (
              <div key={doc} className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                style={{
                  backgroundColor: "var(--ao-surface)",
                  borderColor: status === "missing" ? "rgba(255,71,87,0.3)" : "var(--ao-border)",
                }}>
                {status === "submitted" ? <Check className="w-4 h-4 shrink-0" style={{ color: "#2ED573" }} />
                  : status === "pending" ? <Clock className="w-4 h-4 shrink-0" style={{ color: "#FFA502" }} />
                  : <X className="w-4 h-4 shrink-0" style={{ color: "#FF4757" }} />}
                <span className="flex-1 text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{doc}</span>
                {status !== "submitted" && (
                  <button className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: "rgba(0,212,170,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,212,170,0.2)", fontFamily: "var(--ao-font-body)" }}>
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
