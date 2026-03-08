"use client"
import { motion } from "framer-motion"
import { User, MapPin, Mail, Phone, Shield, Clock, Activity, Award } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { fadeVariants } from "@/lib/utils/motion"

const ACTIVITY_LOG = [
  { action: "Approved shipment SH-2847", time: "2h ago", type: "approval" },
  { action: "Reviewed temperature excursion alert", time: "4h ago", type: "alert" },
  { action: "Updated route for SH-1204", time: "Yesterday", type: "update" },
  { action: "Logged in from Singapore office", time: "Yesterday", type: "auth" },
  { action: "Generated compliance report", time: "2 days ago", type: "report" },
]

export default function ProfilePage() {
  const { user, logout } = useAuthStore()

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??"

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
          background: "linear-gradient(135deg, rgba(0,200,168,0.08) 0%, rgba(6,13,27,0.9) 100%)",
          border: "1px solid rgba(0,200,168,0.2)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Background orb */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: "-40%", right: "-10%",
            width: "300px", height: "300px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,200,168,0.06) 0%, transparent 70%)",
            filter: "blur(30px)", pointerEvents: "none",
          }}
        />

        <div className="flex items-start gap-5 relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, rgba(0,200,168,0.3) 0%, rgba(0,200,168,0.15) 100%)",
              border: "2px solid rgba(0,200,168,0.4)",
              color: "var(--ao-accent)",
              fontFamily: "var(--ao-font-mono)",
              boxShadow: "0 0 20px rgba(0,200,168,0.2)",
            }}
          >
            {initials}
          </div>

          <div className="flex-1">
            <h1 className="text-xl font-bold mb-1" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>
              {user?.name ?? "Unknown User"}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[11px] px-2.5 py-1 rounded-full font-semibold"
                style={{
                  background: "rgba(0,200,168,0.12)",
                  border: "1px solid rgba(0,200,168,0.3)",
                  color: "var(--ao-accent)",
                  fontFamily: "var(--ao-font-body)",
                }}
              >
                {user?.role?.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
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
            { icon: Shield, label: "Tenant", value: user?.tenantId ?? "ops-global" },
            { icon: MapPin, label: "Region", value: "Asia-Pacific" },
            { icon: Phone, label: "Emergency", value: "+65 9123 4567" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(0,200,168,0.1)", border: "1px solid rgba(0,200,168,0.2)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} />
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
          { icon: Activity, label: "Active Shipments", value: "5", color: "#00C8A8" },
          { icon: Award, label: "Compliance Score", value: "98%", color: "#2ED573" },
          { icon: Clock, label: "Avg Response", value: "4m", color: "#3B82F6" },
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

      {/* Recent activity */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
          border: "1px solid var(--ao-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", background: "rgba(0,0,0,0.15)" }}>
          <Activity className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} />
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>Recent Activity</p>
        </div>
        {ACTIVITY_LOG.map((entry, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
            style={{ borderColor: "var(--ao-border)" }}>
            <div className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: entry.type === "alert" ? "#FF4757" : entry.type === "approval" ? "#2ED573" : "var(--ao-accent)" }} />
            <div className="flex-1">
              <p className="text-[12px]" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>{entry.action}</p>
            </div>
            <span className="text-[11px] shrink-0" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{entry.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
