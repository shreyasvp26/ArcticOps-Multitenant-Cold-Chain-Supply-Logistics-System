"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Thermometer, AlertTriangle, CheckCircle2, Info, Clock, X } from "lucide-react"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { formatDistanceToNow, parseISO } from "date-fns"
import { fadeVariants } from "@/lib/utils/motion"
import { cn } from "@/lib/utils/cn"

const SEVERITY_CONFIG = {
  critical: { color: "#FF4757", icon: AlertTriangle, label: "Critical", bg: "rgba(255,71,87,0.08)" },
  warning: { color: "#FFA502", icon: Clock, label: "Warning", bg: "rgba(255,165,2,0.06)" },
  info: { color: "#3B82F6", icon: Info, label: "Info", bg: "rgba(59,130,246,0.06)" },
  success: { color: "#2ED573", icon: CheckCircle2, label: "Success", bg: "rgba(46,213,115,0.06)" },
}

export default function NotificationsPage() {
  const { user } = useAuthStore()
  const { notifications, markRead, markAllRead, dismiss } = useNotificationStore()
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all")

  const myNotifs = notifications.filter((n) =>
    !n.targetRoles || n.targetRoles.includes(user?.role ?? "")
  )

  const filtered = myNotifs.filter((n) => {
    if (filter === "unread") return !n.read
    if (filter === "critical") return n.severity === "critical"
    return true
  })

  const unreadCount = myNotifs.filter((n) => !n.read).length

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="p-6 flex flex-col gap-5 max-w-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)", border: "1px solid rgba(0,200,168,0.25)" }}
          >
            <Bell className="w-4.5 h-4.5" style={{ color: "var(--ao-accent)" }} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#FF4757", color: "#fff", fontFamily: "var(--ao-font-mono)" }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>Notifications</h1>
            <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-[12px] px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
            style={{
              background: "rgba(0,200,168,0.1)",
              border: "1px solid rgba(0,200,168,0.25)",
              color: "var(--ao-accent)",
              fontFamily: "var(--ao-font-body)",
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1">
        {[
          { id: "all", label: `All (${myNotifs.length})` },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "critical", label: "Critical" },
        ].map(({ id, label }) => {
          const isActive = filter === id
          return (
            <button
              key={id}
              onClick={() => setFilter(id as typeof filter)}
              className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all"
              style={{
                background: isActive
                  ? "linear-gradient(135deg, rgba(0,200,168,0.18) 0%, rgba(0,200,168,0.08) 100%)"
                  : "rgba(11,18,34,0.4)",
                color: isActive ? "var(--ao-accent)" : "var(--ao-text-muted)",
                border: isActive ? "1px solid rgba(0,200,168,0.3)" : "1px solid var(--ao-border)",
                fontFamily: "var(--ao-font-body)",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Notification list */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
          border: "1px solid var(--ao-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--ao-text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>No notifications to show</p>
          </div>
        ) : (
          filtered.map((n, i) => {
            const cfg = SEVERITY_CONFIG[n.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
            const Icon = cfg.icon
            const timeAgo = (() => {
              try {
                return formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })
              } catch { return n.createdAt }
            })()

            return (
              <div
                key={n.id}
                className={cn(
                  "relative flex items-start gap-3 px-4 py-4 border-b last:border-b-0 transition-colors cursor-pointer",
                  !n.read && "bg-white/[0.02]"
                )}
                style={{
                  borderColor: "var(--ao-border)",
                  borderLeftWidth: 3,
                  borderLeftColor: !n.read ? cfg.color : "transparent",
                }}
                onClick={() => markRead(n.id)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.color}25` }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-semibold leading-tight" style={{ color: n.read ? "var(--ao-text-secondary)" : "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: cfg.color }} />
                    )}
                  </div>
                  <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{n.body}</p>
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>{timeAgo}</p>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-70 transition-opacity mt-1"
                >
                  <X className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
                </button>
              </div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
