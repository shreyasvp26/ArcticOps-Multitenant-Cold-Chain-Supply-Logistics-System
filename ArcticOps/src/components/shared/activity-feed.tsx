"use client"
import { cn } from "@/lib/utils/cn"
import { AlertTriangle, AlertCircle, Info, CheckCircle, Zap } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Notification } from "@/lib/types/notification"
import { formatTimestamp } from "@/lib/utils/format"

interface ActivityFeedProps {
  notifications: Notification[]
  maxItems?: number
  className?: string
}

const SEVERITY_CONFIG = {
  info: {
    Icon: Info,
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.06)",
    borderColor: "rgba(59,130,246,0.3)",
    dotColor: "#3B82F6",
  },
  warning: {
    Icon: AlertTriangle,
    color: "#FFA502",
    bgColor: "rgba(255,165,2,0.05)",
    borderColor: "rgba(255,165,2,0.3)",
    dotColor: "#FFA502",
  },
  critical: {
    Icon: AlertCircle,
    color: "#FF4757",
    bgColor: "rgba(255,71,87,0.06)",
    borderColor: "rgba(255,71,87,0.35)",
    dotColor: "#FF4757",
  },
  emergency: {
    Icon: Zap,
    color: "#FF4757",
    bgColor: "rgba(255,71,87,0.08)",
    borderColor: "rgba(255,71,87,0.4)",
    dotColor: "#FF4757",
  },
}

export function ActivityFeed({ notifications, maxItems = 20, className }: ActivityFeedProps) {
  const items = notifications.slice(0, maxItems)

  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      aria-label="Activity feed"
      role="log"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {items.map((notif) => {
          const cfg = SEVERITY_CONFIG[notif.severity]
          const { Icon } = cfg
          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex gap-3 p-3 rounded-xl cursor-default transition-all hover:brightness-110",
                notif.read ? "opacity-50" : "opacity-100"
              )}
              style={{
                backgroundColor: cfg.bgColor,
                border: `1px solid ${cfg.borderColor}`,
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{
                  backgroundColor: `${cfg.dotColor}14`,
                  border: `1px solid ${cfg.dotColor}25`,
                }}
                aria-hidden="true"
              >
                <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="text-[12px] font-semibold leading-snug"
                  style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                >
                  {notif.title}
                </p>
                <p
                  className="text-[11px] mt-0.5 line-clamp-2 leading-snug"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                >
                  {notif.message}
                </p>
                <p
                  className="text-[10px] mt-1.5"
                  style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}
                >
                  {formatTimestamp(notif.createdAt)}
                </p>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10">
          <div
            className="p-3 rounded-2xl"
            style={{ backgroundColor: "rgba(0,200,168,0.06)", border: "1px solid rgba(0,200,168,0.1)" }}
          >
            <CheckCircle className="w-6 h-6" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
          </div>
          <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
            All quiet on the cold front
          </p>
          <p className="text-[11px] text-center" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            No recent activity to report
          </p>
        </div>
      )}
    </div>
  )
}
