"use client"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, CheckCircle2, Camera, FileSignature, Thermometer, ClipboardList, ArrowRight, Package } from "lucide-react"
import { useDriverStore } from "@/lib/store/driver-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { formatTemp } from "@/lib/utils/format"
import { Stepper } from "@/components/shared/stepper"

const STEPS = [
  { id: "s1", label: "Arrival" },
  { id: "s2", label: "Proof" },
  { id: "s3", label: "Signature" },
  { id: "s4", label: "Temp Log" },
  { id: "s5", label: "Condition" },
]

export default function DeliverPage() {
  const [step, setStep] = useState(0)
  const [arrived, setArrived] = useState(false)
  const [photoCapture, setPhotoCapture] = useState(false)
  const [signed, setSigned] = useState(false)
  const [condition, setCondition] = useState("")
  const [complete, setComplete] = useState(false)
  const [fluctuation, setFluctuation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setFluctuation((Math.random() - 0.5) * 0.4)
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [step])

  const { currentAssignment, submitDelivery } = useDriverStore()
  const getLatest = useTemperatureStore((s) => s.getLatest)
  const shipment = currentAssignment ?? MOCK_SHIPMENTS.find((s) => s.status === "in_transit")
  const latestReading = shipment ? getLatest(shipment.id) : null
  const baseTemp = latestReading?.temperature ?? (shipment ? (shipment.requiredTempMin + shipment.requiredTempMax) / 2 : 0)
  const latestTemp = baseTemp + fluctuation

  const stepItems = STEPS.map((s) => ({ id: s.id, label: s.label }))

  const handleSubmit = () => {
    if (shipment) submitDelivery()
    setComplete(true)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoCapture(true)
    }
  }

  // Canvas drawing for signature
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    ctx.beginPath()
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
  }
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return
    const ctx = canvasRef.current!.getContext("2d")!
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#00C8A8"
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY)
    ctx.stroke()
  }
  const endDraw = () => { isDrawing.current = false; setSigned(true) }
  const clearSig = () => {
    const canvas = canvasRef.current!
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
  }

  if (!shipment) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
      <Package className="w-10 h-10" style={{ color: "var(--ao-text-muted)" }} />
      <p className="text-sm text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No active delivery</p>
    </div>
  )

  if (complete) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { type: "spring" } }}>
        <CheckCircle2 className="w-20 h-20" style={{ color: "#2ED573" }} />
      </motion.div>
      <p className="text-2xl font-bold" style={{ color: "#2ED573", fontFamily: "var(--ao-font-display)" }}>Delivery Complete!</p>
      <p className="text-sm text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
        {shipment.id} delivered successfully. Returning to assignments…
      </p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto h-full">
      <Stepper steps={stepItems} currentStep={step} />

      {/* Step 1: Confirm arrival */}
      {step === 0 && (
        <div className="flex flex-col items-center gap-4 py-4">
          <ClipboardList className="w-12 h-12" style={{ color: arrived ? "#2ED573" : "var(--ao-text-muted)" }} />
          <p className="text-sm text-center" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
            Confirm your arrival at <strong>{shipment.destination.split(",")[0]}</strong>
          </p>
          {!arrived ? (
            <button onClick={() => { setArrived(true) }}
              className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
              style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
              ✓ Confirm Arrival
            </button>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8" style={{ color: "#2ED573" }} />
              <p className="text-[12px]" style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}>
                Arrival confirmed at {new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Photo proof */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-4 py-4">
          <Camera className="w-12 h-12" style={{ color: photoCapture ? "#2ED573" : "var(--ao-text-muted)" }} />
          <p className="text-sm text-center" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
            Capture photo proof of delivery
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
          {!photoCapture ? (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xs py-3.5 rounded-xl text-base font-bold"
              style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
              <Camera className="w-4 h-4 inline mr-2" /> Upload Photo
            </button>
          ) : (
            <div className="w-full max-w-xs h-40 rounded-xl flex items-center justify-center text-[12px]"
              style={{ backgroundColor: "rgba(0,200,168,0.08)", border: "1px solid rgba(0,200,168,0.3)", color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>
              ✓ Photo captured
            </div>
          )}
        </div>
      )}

      {/* Step 3: Signature */}
      {step === 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>Recipient Signature</p>
          <canvas
            ref={canvasRef} width={320} height={120}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            className="w-full rounded-xl cursor-crosshair touch-none"
            style={{ backgroundColor: "var(--ao-surface)", border: `1px solid ${signed ? "var(--ao-accent)" : "var(--ao-border)"}` }}
          />
          <div className="flex gap-2">
            <button onClick={clearSig} className="px-3 py-1.5 rounded-lg text-[12px]"
              style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
              Clear
            </button>
            {signed && <span className="text-[12px] flex items-center gap-1" style={{ color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>
              <Check className="w-3.5 h-3.5" /> Signature captured
            </span>}
          </div>
        </div>
      )}

      {/* Step 4: Temp log */}
      {step === 3 && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Thermometer className="w-10 h-10" style={{ color: "var(--ao-accent)" }} />
          <p className="text-sm" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>Temperature at Delivery</p>
          <p className="text-4xl font-bold" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
            {latestTemp ? formatTemp(latestTemp) : "—"}
          </p>
          <p className="text-[12px]" style={{ color: "#2ED573", fontFamily: "var(--ao-font-body)" }}>✓ Within required range</p>
        </div>
      )}

      {/* Step 5: Condition report */}
      {step === 4 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>Condition Report</p>
          <textarea value={condition} onChange={(e) => setCondition(e.target.value)}
            placeholder="Note any damage, deviations, or special observations. Leave blank if all is well."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
            style={{ backgroundColor: "var(--ao-surface)", border: "1px solid var(--ao-border)", color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-auto">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="px-4 py-2.5 rounded-xl text-sm disabled:opacity-30"
          style={{ color: "var(--ao-text-muted)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}>
          Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={
              (step === 0 && !arrived) ||
              (step === 1 && !photoCapture) ||
              (step === 2 && !signed)
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
            style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
            Next <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#22E574", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}>
            Submit Delivery <CheckCircle2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
