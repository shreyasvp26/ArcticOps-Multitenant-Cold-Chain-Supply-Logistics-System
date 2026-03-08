"use client"
import { useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, AlertCircle, AlertTriangle, Info, CheckCircle,
  BellOff
} from "lucide-react"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDriverStore } from "@/lib/store/driver-store"
import { formatTimestamp } from "@/lib/utils/format"
import { cn } from "@/lib/utils/cn"
import type { AlertSeverity } from "@/lib/types/notification"

const SEVERITY_ICONS: Record<AlertSeverity, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
  emergency: AlertCircle,
}
const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: "#3B82F6",
  warning: "#FFA502",
  critical: "#FF4757",
  emergency: "#FF4757",
}
const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  info: "border-l-[#3B82F6]",
  warning: "border-l-[#FFA502]",
  critical: "border-l-[#FF4757]",
  emergency: "border-l-[#FF4757]",
}

interface NotificationCenterProps {
  open: boolean
  onClose: () => void
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { currentAssignment } = useDriverStore()
  const { notifications, markRead, markAllRead, getForTenant } = useNotificationStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const isDriver = user?.role === "driver"
  const tenantNotifications = getForTenant(user?.tenantId ?? null)
    .filter((n) => {
      if (isDriver) {
        // Extremely strict: only show if there is an assignment AND the notification is for it
        if (!currentAssignment) return false
        return n.relatedEntityId === currentAssignment.id
      }
      return true
    })
    .slice(0, 30)

  const unreadCount = tenantNotifications.filter(n => !n.read).length

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose])

  const handleNotificationClick = (notifId: string, href?: string) => {
    markRead(notifId)
    if (href) {
      router.push(href)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: "easeOut" } }}
          exit={{ opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15 } }}
          className="absolute right-0 top-full mt-2 w-[380px] rounded-xl overflow-hidden shadow-2xl z-50"
          style={{
            background: "rgba(17,29,51,0.96)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--ao-border)",
          }}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--ao-border)" }}
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4" style={{ color: "var(--ao-accent)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: "#FF4757", color: "white", fontFamily: "var(--ao-font-mono)" }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-[12px] transition-opacity hover:opacity-80"
              style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-body)" }}
            >
              Mark all read
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-[440px] overflow-y-auto">
            {tenantNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <BellOff className="w-8 h-8" style={{ color: "var(--ao-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  All quiet on the cold front
                </p>
              </div>
            ) : (
              tenantNotifications.map((notif) => {
                const Icon = SEVERITY_ICONS[notif.severity]
                const color = SEVERITY_COLORS[notif.severity]
                const primaryAction = notif.actions.find((a) => a.href)
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.id, primaryAction?.href)}
                    className={cn(
                      "w-full text-left flex gap-3 px-4 py-3 border-b border-l-2 transition-colors",
                      SEVERITY_BORDER[notif.severity],
                      notif.read ? "opacity-55" : "opacity-100"
                    )}
                    style={{
                      borderBottomColor: "var(--ao-border)",
                      backgroundColor: notif.read ? "transparent" : "rgba(26,41,66,0.4)",
                    }}
                  >
                    <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} aria-hidden="true" />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-[13px] font-medium leading-snug"
                          style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} aria-label="Unread" />
                        )}
                      </div>
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
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div
            className="px-4 py-2.5 border-t text-center"
            style={{ borderColor: "var(--ao-border)" }}
          >
            <button
              onClick={() => { router.push("/notifications"); onClose() }}
              className="text-[12px] transition-opacity hover:opacity-80"
              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}
            >
              View all notifications
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
