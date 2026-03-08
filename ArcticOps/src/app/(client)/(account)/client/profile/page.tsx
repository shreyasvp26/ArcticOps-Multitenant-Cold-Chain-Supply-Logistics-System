"use client"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Mail, Shield, MapPin, Phone, Package, CheckCircle2, Clock, LogOut } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { fadeVariants } from "@/lib/utils/motion"

export default function ClientProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const allShipments = useShipmentStore((s) => s.shipments)

  const shipments = allShipments.filter((s) => s.tenantId === user?.tenantId)
  const active = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")
  const delivered = shipments.filter((s) => s.status === "delivered")

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??"

  const handleSignOut = () => {
    logout()
    window.location.href = "/login"
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="p-6 max-w-2xl mx-auto flex flex-col gap-5"
    >
      {/* Profile card */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(6,13,27,0.9) 100%)",
          border: "1px solid rgba(59,130,246,0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: "-40%", right: "-10%",
            width: "300px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
            filter: "blur(30px)", pointerEvents: "none",
          }}
        />
        <div className="flex items-start gap-5 relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.15) 100%)",
              border: "2px solid rgba(59,130,246,0.4)",
              color: "#3B82F6",
              fontFamily: "var(--ao-font-mono)",
              boxShadow: "0 0 20px rgba(59,130,246,0.2)",
            }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
              {user?.name ?? "Unknown User"}
            </h1>
            <p className="text-[13px] mb-2" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              {user?.tenantName ?? "Your Organisation"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: "rgba(59,130,246,0.12)",
                  border: "1px solid rgba(59,130,246,0.3)",
                  color: "#3B82F6",
                  fontFamily: "var(--ao-font-body)",
                }}
              >
                {user?.role?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {[
            { icon: Mail, label: "Email", value: user?.email ?? "—" },
            { icon: Shield, label: "Account Type", value: "Client Admin" },
            { icon: MapPin, label: "Region", value: "Global" },
            { icon: Phone, label: "Support", value: "+1 800 ARCTIC" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                <p className="text-[12px]" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Package, label: "Total Orders", value: String(shipments.length), color: "#3B82F6" },
          { icon: CheckCircle2, label: "Delivered", value: String(delivered.length), color: "#2ED573" },
          { icon: Clock, label: "In Transit", value: String(active.length), color: "#00C8A8" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center"
            style={{
              background: `linear-gradient(135deg, ${color}0d 0%, rgba(6,13,27,0.8) 100%)`,
              border: `1px solid ${color}28`,
              backdropFilter: "blur(12px)",
            }}>
            <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
            <p className="text-xl font-bold" style={{ color, fontFamily: "var(--ao-font-mono)" }}>{value}</p>
            <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[13px] font-semibold transition-all hover:brightness-110"
        style={{
          background: "rgba(255,71,87,0.08)",
          border: "1px solid rgba(255,71,87,0.25)",
          color: "#FF4757",
          fontFamily: "var(--ao-font-body)",
        }}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </motion.div>
  )
}
