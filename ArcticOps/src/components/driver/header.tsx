"use client"
import { useRouter } from "next/navigation"
import { Bell, LogOut } from "lucide-react"
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
  const { unreadCount } = useNotificationStore()
  const [notifOpen, setNotifOpen] = useState(false)

  const status = currentAssignment?.status
  const statusConfig = status ? SHIPMENT_STATUSES[status] : null

  return (
    <header
      className="flex items-center justify-between px-4 h-14 border-b shrink-0"
      style={{
        backgroundColor: "rgba(10,22,40,0.98)",
        borderColor: "var(--ao-border)",
      }}
    >
      {/* Assignment info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: statusConfig?.color ?? "var(--ao-text-muted)",
            boxShadow: `0 0 6px ${statusConfig?.color ?? "transparent"}`,
            animation: status === "in_transit" ? "checkpoint-pulse 2s ease-in-out infinite" : "none",
          }}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ fontFamily: "var(--ao-font-mono)", color: "var(--ao-text-primary)" }}
          >
            {currentAssignment ? currentAssignment.id : "No Active Assignment"}
          </p>
          {currentAssignment && (
            <p
              className="text-[11px] truncate"
              style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}
            >
              {currentAssignment.origin.split(",")[0]} → {currentAssignment.destination.split(",")[0]}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={cn("relative p-2 rounded-lg transition-colors", notifOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]")}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
          >
            <Bell className="w-5 h-5" style={{ color: "var(--ao-text-secondary)" }} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: "#FF4757", color: "white", fontFamily: "var(--ao-font-mono)" }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
        <button
          onClick={() => { logout(); router.push("/login") }}
          className="p-2 rounded-lg transition-colors hover:bg-[rgba(255,71,87,0.08)]"
          style={{ color: "var(--ao-danger)" }}
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}
