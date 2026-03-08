"use client"
import { useRouter } from "next/navigation"
import { Bell, LogOut, Snowflake } from "lucide-react"
import { useState } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useDriverStore } from "@/lib/store/driver-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { NotificationCenter } from "@/components/shared/notification-center"
import { cn } from "@/lib/utils/cn"

export function DriverHeader() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { currentAssignment } = useDriverStore()
  const { notifications } = useNotificationStore()
  const [notifOpen, setNotifOpen] = useState(false)

  const isDriver = user?.role === "driver"
  const relevantNotifications = notifications.filter((n) => {
    if (isDriver) return n.relatedEntityId === currentAssignment?.id
    return true
  })
  const unreadCount = relevantNotifications.filter(n => !n.read).length

  const status = currentAssignment?.status
  const statusConfig = status ? SHIPMENT_STATUSES[status] : null

  return (
    <header
      className="flex items-center justify-between px-4 shrink-0"
      style={{
        background: "linear-gradient(180deg, rgba(5,10,19,0.99) 0%, rgba(7,12,25,0.98) 100%)",
        borderBottom: "1px solid rgba(30,48,80,0.7)",
        backdropFilter: "blur(24px)",
        height: "56px",
      }}
    >
      {/* Assignment info */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo icon */}
        <div
          className="p-1.5 rounded-lg shrink-0 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle, rgba(0,200,168,0.15) 0%, rgba(0,200,168,0.05) 100%)",
            border: "1px solid rgba(0,200,168,0.15)",
          }}
        >
          <Snowflake className="w-4 h-4" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
        </div>
        {currentAssignment ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                backgroundColor: statusConfig?.color ?? "var(--ao-text-muted)",
                boxShadow: `0 0 6px ${statusConfig?.color ?? "transparent"}`,
                animation: status === "in_transit" ? "checkpoint-pulse 2s ease-in-out infinite" : "none",
              }}
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="text-[13px] font-bold leading-none" style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-accent)" }}>
                {currentAssignment.id}
              </p>
              <p className="text-[11px] truncate mt-0.5" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
                {currentAssignment.origin.split(",")[0]} → {currentAssignment.destination.split(",")[0]}
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-0">
            <p className="text-[13px] font-semibold" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
              No Active Assignment
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={cn("ao-icon-btn ao-icon-btn--teal", notifOpen && "ao-icon-btn--active")}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            aria-expanded={notifOpen}
          >
            <Bell className="ao-icon-btn__icon w-4 h-4" style={{ color: unreadCount > 0 ? "var(--ao-text-secondary)" : "var(--ao-text-muted)" }} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: "linear-gradient(135deg, #FF4757 0%, #FF6B6B 100%)",
                  color: "white",
                  fontFamily: "var(--ao-font-mono)",
                  boxShadow: "0 0 8px rgba(255,71,87,0.5)",
                  zIndex: 3,
                }}
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
        <button
          onClick={() => { logout(); window.location.href = "/login" }}
          className="ao-icon-btn ao-icon-btn--danger"
          aria-label="Sign out"
        >
          <LogOut className="ao-icon-btn__icon w-4 h-4" aria-hidden="true" style={{ color: "var(--ao-danger)" }} />
        </button>
      </div>
    </header>
  )
}
