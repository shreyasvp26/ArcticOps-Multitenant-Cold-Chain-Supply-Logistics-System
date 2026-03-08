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
import { CLIENT_ROLES } from "@/lib/constants/roles"
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
  const isClient = user?.role && (CLIENT_ROLES as string[]).includes(user.role)

  if (isClient) return null

  const tenantNotifications = getForTenant(user?.tenantId ?? null)
    .filter((n) => {
      if (isDriver) {
        if (!currentAssignment) return false
        return n.relatedEntityId === currentAssignment.id
      }
      if (isClient) {
        return n.tenantId === user?.tenantId
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
          className="absolute right-0 top-full mt-2 w-[400px] rounded-2xl overflow-hidden shadow-2xl z-[1100]"
          style={{
            background: "rgba(6,13,27,0.98)",
            backdropFilter: "blur(32px)",
            border: "1px solid rgba(30,48,80,0.8)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,200,168,0.04)",
          }}
          role="dialog"
          aria-label="Notifications"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b"
            style={{ borderColor: "rgba(30,48,80,0.6)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: "rgba(0,200,168,0.08)", border: "1px solid rgba(0,200,168,0.15)" }}
              >
                <Bell className="w-3.5 h-3.5" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
              </div>
              <span className="text-[14px] font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{
                    background: "linear-gradient(135deg, #FF4757 0%, #FF6B6B 100%)",
                    color: "white",
                    fontFamily: "var(--ao-font-mono)",
                    boxShadow: "0 0 8px rgba(255,71,87,0.4)",
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={markAllRead}
              className="text-[12px] font-medium transition-opacity hover:opacity-80 px-2.5 py-1 rounded-lg"
              style={{
                color: "var(--ao-accent)",
                fontFamily: "var(--ao-font-body)",
                backgroundColor: "rgba(0,200,168,0.06)",
                border: "1px solid rgba(0,200,168,0.12)",
              }}
            >
              Mark all read
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-[440px] overflow-y-auto">
            {tenantNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(0,200,168,0.06)", border: "1px solid rgba(0,200,168,0.1)" }}>
                  <BellOff className="w-6 h-6" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
                </div>
                <div className="text-center">
                  <p className="text-[14px] font-semibold mb-0.5" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                    You&apos;re all caught up
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    No new notifications
                  </p>
                </div>
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
                      "w-full text-left flex gap-3 px-4 py-3.5 border-b transition-all hover:brightness-110",
                      notif.read ? "opacity-50" : "opacity-100"
                    )}
                    style={{
                      borderBottomColor: "rgba(30,48,80,0.5)",
                      borderLeft: `3px solid ${notif.read ? "transparent" : color}`,
                      backgroundColor: notif.read ? "transparent" : `${color}06`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${color}12`,
                        border: `1px solid ${color}25`,
                      }}
                      aria-hidden="true"
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-[13px] font-semibold leading-snug"
                          style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}
                        >
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div
                            className="w-2 h-2 rounded-full shrink-0 mt-1"
                            style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
                            aria-label="Unread"
                          />
                        )}
                      </div>
                      <p
                        className="text-[12px] mt-0.5 line-clamp-2 leading-snug"
                        style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                      >
                        {notif.message}
                      </p>
                      <p
                        className="text-[11px] mt-1.5"
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
            className="px-4 py-3 border-t"
            style={{ borderColor: "rgba(30,48,80,0.6)", background: "rgba(5,10,19,0.5)" }}
          >
            <button
              onClick={() => { router.push("/notifications"); onClose() }}
              className="w-full text-center text-[12px] font-medium transition-opacity hover:opacity-80"
              style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}
            >
              View all notifications →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
