"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info, AlertTriangle, XCircle, Zap } from "lucide-react"
import { useNotificationStore } from "@/lib/store/notification-store"
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

  // Watch for new unread notifications and convert to toasts.
  // Show only 1 alert at a time — highest priority (emergency > critical > warning > info).
  useEffect(() => {
    if (isClient) return

    const candidates = notifications.filter((n) => {
      if (n.read || shownIds.has(n.id)) return false
      if (isDriver) {
        if (!currentAssignment) return false
        return n.relatedEntityId === currentAssignment.id
      }
      return true
    })

    if (candidates.length === 0) return

    const newToasts: Toast[] = candidates.map((n) => {
      shownIds.add(n.id)
      return {
        id: n.id,
        severity: n.severity,
        title: n.title,
        message: n.message,
        autoDismiss: n.severity === "info" || n.severity === "warning",
      }
    })

    setToasts((prev) => {
      const merged = [...newToasts, ...prev]
      const bucketOrder = ["emergency", "critical", "warning", "info"] as AlertSeverity[]
      // Take the single highest-priority toast
      for (const bucket of bucketOrder) {
        const match = merged.find((t) => t.severity === bucket)
        if (match) return [match]
      }
      return prev
    })
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

  return isClient ? null : (
    <>
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
                className={cn("rounded-2xl overflow-hidden", isCritical && "animate-shake")}
                style={{
                  background: `linear-gradient(135deg, ${cfg.bg} 0%, rgba(6,13,27,0.95) 100%)`,
                  border: `1px solid ${cfg.border}`,
                  backdropFilter: "blur(32px)",
                  boxShadow: `0 12px 40px ${isCritical ? "rgba(255,71,87,0.2)" : "rgba(0,0,0,0.4)"}, 0 0 0 1px rgba(255,255,255,0.02)`,
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
