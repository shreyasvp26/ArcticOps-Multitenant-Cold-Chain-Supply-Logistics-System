"use client"
import { cn } from "@/lib/utils/cn"
import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Notification } from "@/lib/types/notification"
import { formatTimestamp } from "@/lib/utils/format"

interface ActivityFeedProps {
  notifications: Notification[]
  maxItems?: number
  className?: string
}

const SEVERITY_CONFIG = {
  info: { Icon: Info, color: "#3B82F6", border: "border-l-[#3B82F6]" },
  warning: { Icon: AlertTriangle, color: "#FFA502", border: "border-l-[#FFA502]" },
  critical: { Icon: AlertCircle, color: "#FF4757", border: "border-l-[#FF4757]" },
  emergency: { Icon: AlertCircle, color: "#FF4757", border: "border-l-[#FF4757]" },
}

export function ActivityFeed({ notifications, maxItems = 20, className }: ActivityFeedProps) {
  const items = notifications.slice(0, maxItems)

  return (
    <div
      className={cn("flex flex-col gap-1 overflow-y-auto", className)}
      aria-label="Activity feed"
      role="log"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {items.map((notif) => {
          const { Icon, color, border } = SEVERITY_CONFIG[notif.severity]
          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "flex gap-3 p-3 rounded-lg border-l-2 cursor-default",
                border,
                notif.read ? "opacity-60" : "opacity-100"
              )}
              style={{ backgroundColor: "var(--ao-surface)" }}
            >
              <Icon
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                style={{ color }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px] font-medium truncate"
                  style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                >
                  {notif.title}
                </p>
                <p
                  className="text-[12px] mt-0.5 line-clamp-2"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                >
                  {notif.message}
                </p>
                <p
                  className="text-[11px] mt-1"
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
        <div className="text-center py-8" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", fontSize: "14px" }}>
          All quiet on the cold front
        </div>
      )}
    </div>
  )
}
