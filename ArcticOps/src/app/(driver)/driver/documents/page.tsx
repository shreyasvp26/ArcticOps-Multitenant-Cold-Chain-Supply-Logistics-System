"use client"
import { useState, useRef } from "react"
import { Check, Clock, X, Upload, AlertTriangle, QrCode } from "lucide-react"
import { useDriverStore } from "@/lib/store/driver-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { useAuthStore } from "@/lib/store/auth-store"
import { MOCK_CREWS } from "@/lib/mock-data/crews"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

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

  // Track uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set(["Driver's License", "Vehicle Registration"]))
  const [isUploading, setIsUploading] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeDoc, setActiveDoc] = useState<string | null>(null)

  const handleUploadClick = (doc: string) => {
    setActiveDoc(doc)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && activeDoc) {
      setIsUploading(activeDoc)
      setTimeout(() => {
        setUploadedDocs((prev) => {
          const next = new Set(prev)
          next.add(activeDoc)
          return next
        })
        setIsUploading(null)
        setActiveDoc(null)
      }, 1500)
    }
  }

  const handleMarkAllComplete = () => {
    setUploadedDocs(new Set(docs))
  }

  // Required docs logic: pick the last 2 docs of the current mode as "required for border"
  // This ensures they are actually in the checklist and can be uploaded to clear the alert.
  const requiredAtBorder = docs.slice(-2)
  const missingRequired = requiredAtBorder.filter(doc => !uploadedDocs.has(doc))
  const showDocumentationAlert = missingRequired.length > 0
  const allUploaded = docs.every(doc => uploadedDocs.has(doc))

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Documentation Alert */}
      {showDocumentationAlert && (
        <div className="flex items-start gap-3 p-3 rounded-xl border"
          style={{ backgroundColor: "rgba(255,71,87,0.08)", borderColor: "rgba(255,71,87,0.3)" }}>
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#FF4757" }} />
          <div>
            <p className="text-[12px] font-semibold" style={{ color: "#FF4757", fontFamily: "var(--ao-font-body)" }}>
              Incomplete Documentation
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              Required for next border: {missingRequired.join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* QR Code Handoff Button (Only shows when all docs are uploaded) */}
      {allUploaded && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: "var(--ao-accent)",
                color: "#060D1B",
                boxShadow: "0 0 25px rgba(0,200,168,0.3)"
              }}
            >
              <QrCode className="w-6 h-6" />
              GENERATE HANDOFF QR
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[rgba(10,22,40,0.95)] backdrop-blur-xl border-[var(--ao-border)]">
            <DialogHeader>
              <DialogTitle className="text-center font-bold text-xl" style={{ color: "var(--ao-text-primary)" }}>Handoff Verification</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 gap-6">
              <div className="p-4 bg-white rounded-2xl">
                {/* QR Code Image - using placeholder API that generates a QR code */}
                <img
                  src="/images/driver/drive_handoff_2.png"
                  alt="Handoff QR Code"
                  className="w-[250px] h-[250px]"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--ao-accent)" }}>{shipment?.id}</p>
                <p className="text-[12px]" style={{ color: "var(--ao-text-muted)" }}>Scan to verify documentation and temperature integrity at handoff.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Doc checklist */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            {mode.toUpperCase()} — Document Checklist
          </p>
          <button
            onClick={handleMarkAllComplete}
            className="text-[10px] px-2 py-0.5 rounded border border-dashed opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--ao-text-muted)", borderColor: "var(--ao-border)" }}
          >
            Mark all complete
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {docs.map((doc, i) => {
            const isUploaded = uploadedDocs.has(doc)
            return (
              <div key={doc} className="flex items-center gap-3 p-3 rounded-lg border transition-all"
                style={{
                  backgroundColor: "var(--ao-surface)",
                  borderColor: !isUploaded ? "rgba(255,71,87,0.2)" : "var(--ao-border)",
                }}>
                {isUploaded ? <Check className="w-4 h-4 shrink-0" style={{ color: "#2ED573" }} />
                  : <Clock className="w-4 h-4 shrink-0" style={{ color: "#FFA502" }} />}
                <span className="flex-1 text-[13px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{doc}</span>
                {!isUploaded && (
                  <button
                    onClick={() => handleUploadClick(doc)}
                    disabled={isUploading === doc}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg disabled:opacity-50"
                    style={{ backgroundColor: "rgba(0,200,168,0.10)", color: "var(--ao-accent)", border: "1px solid rgba(0,200,168,0.2)", fontFamily: "var(--ao-font-body)" }}>
                    {isUploading === doc ? "Uploading..." : <><Upload className="w-3 h-3" /> Upload</>}
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
