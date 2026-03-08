"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info, AlertTriangle, XCircle, Zap } from "lucide-react"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDriverStore } from "@/lib/store/driver-store"
import { CLIENT_ROLES } from "@/lib/constants/roles"
import type { AlertSeverity } from "@/lib/types/notification"
import { cn } from "@/lib/utils/cn"

interface Toast {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  autoDismiss: boolean
}

interface SevConfig {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  bg: string
  border: string
  duration: number
}

const SEV_CONFIG: Record<AlertSeverity, SevConfig> = {
  info: { icon: Info, color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", duration: 4000 },
  warning: { icon: AlertTriangle, color: "#FFA502", bg: "rgba(255,165,2,0.08)", border: "rgba(255,165,2,0.35)", duration: 7000 },
  critical: { icon: XCircle, color: "#FF4757", bg: "rgba(255,71,87,0.10)", border: "rgba(255,71,87,0.45)", duration: 0 },
  emergency: { icon: Zap, color: "#FF4757", bg: "rgba(255,71,87,0.14)", border: "#FF4757", duration: 0 },
}

// Track which notification IDs we've already shown as toasts
const shownIds = new Set<string>()

export function ToastProvider() {
  const notifications = useNotificationStore((s) => s.notifications)
  const { user } = useAuthStore()
  const { currentAssignment } = useDriverStore()
  const [toasts, setToasts] = useState<Toast[]>([])

  const isDriver = user?.role === "driver"
  const isClient = user?.role && (CLIENT_ROLES as string[]).includes(user.role)

  if (isClient) return null

  // Emergency banner - filtered for drivers
  const emergencyAlert = notifications.find((n) => {
    if (n.severity !== "emergency" || n.read) return false
    if (isDriver) {
      if (!currentAssignment) return false
      return n.relatedEntityId === currentAssignment.id
    }
    return true
  })

  // Watch for new unread notifications and convert to toasts
  useEffect(() => {
    const recent = notifications
      .filter((n) => {
        if (n.read || shownIds.has(n.id)) return false
        if (isDriver) {
          if (!currentAssignment) return false
          return n.relatedEntityId === currentAssignment.id
        }
        return true
      })
      .slice(0, 3)

    if (recent.length === 0) return

    const newToasts: Toast[] = recent.map((n) => {
      shownIds.add(n.id)
      return {
        id: n.id,
        severity: n.severity,
        title: n.title,
        message: n.message,
        autoDismiss: n.severity === "info" || n.severity === "warning",
      }
    })

    setToasts((prev) => [...newToasts, ...prev].slice(0, 5))
  }, [notifications, isDriver, currentAssignment])

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))

  useEffect(() => {
    toasts.forEach((toast) => {
      const cfg = SEV_CONFIG[toast.severity]
      if (cfg.duration > 0 && toast.autoDismiss) {
        const timer = setTimeout(() => dismiss(toast.id), cfg.duration)
        return () => clearTimeout(timer)
      }
    })
  }, [toasts])

  return (
    <>
      {/* Emergency full-width banner */}
      <AnimatePresence>
        {emergencyAlert && (
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }}
            exit={{ y: -60, opacity: 0, transition: { duration: 0.2 } }}
            className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 px-5 py-3"
            style={{ backgroundColor: "#FF4757", color: "white" }}
          >
            <Zap className="w-5 h-5 shrink-0 animate-bounce" />
            <p className="flex-1 text-sm font-bold" style={{ fontFamily: "var(--ao-font-body)" }}>
              EMERGENCY — {emergencyAlert.title}: {emergencyAlert.message}
            </p>
            <button onClick={() => useNotificationStore.getState().markRead(emergencyAlert.id)}
              className="p-1 rounded hover:bg-[rgba(255,255,255,0.2)]">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast stack */}
      <div className="fixed bottom-5 right-5 z-[190] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-24px)]">
        <AnimatePresence>
          {toasts.map((toast) => {
            const cfg = SEV_CONFIG[toast.severity]
            const Icon = cfg.icon
            const isCritical = toast.severity === "critical" || toast.severity === "emergency"

            return (
              <motion.div
                key={toast.id}
                initial={{ x: 80, opacity: 0, scale: 0.95 }}
                animate={{
                  x: 0, opacity: 1, scale: 1,
                  transition: { type: "spring", stiffness: 380, damping: 28 },
                }}
                exit={{ x: 80, opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                className={cn("rounded-xl overflow-hidden shadow-2xl", isCritical && "animate-shake")}
                style={{
                  backgroundColor: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  backdropFilter: "blur(20px)",
                  boxShadow: `0 8px 32px ${isCritical ? "rgba(255,71,87,0.25)" : "rgba(0,0,0,0.4)"}`,
                }}
                role="alert"
                aria-live={isCritical ? "assertive" : "polite"}
              >
                {/* Severity accent bar */}
                <div className="h-0.5 w-full" style={{ backgroundColor: cfg.color }} />

                <div className="flex items-start gap-3 p-4">
                  <div className="mt-0.5 shrink-0 p-1.5 rounded-lg" style={{ backgroundColor: `${cfg.color}14` }}>
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                      {toast.title}
                    </p>
                    <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
                      {toast.message}
                    </p>
                  </div>
                  {!isCritical && (
                    <button onClick={() => dismiss(toast.id)}
                      className="p-1 rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
                    </button>
                  )}
                  {isCritical && (
                    <button onClick={() => dismiss(toast.id)}
                      className="text-[11px] px-2 py-1 rounded font-medium shrink-0"
                      style={{ backgroundColor: `${cfg.color}14`, color: cfg.color, fontFamily: "var(--ao-font-body)" }}>
                      Dismiss
                    </button>
                  )}
                </div>

                {/* Auto-dismiss progress bar */}
                {cfg.duration > 0 && (
                  <motion.div
                    className="h-0.5"
                    style={{ backgroundColor: cfg.color, transformOrigin: "left" }}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0, transition: { duration: cfg.duration / 1000, ease: "linear" } }}
                  />
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
