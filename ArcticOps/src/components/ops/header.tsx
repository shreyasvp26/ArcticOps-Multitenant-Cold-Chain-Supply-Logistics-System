"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { NotificationCenter } from "@/components/shared/notification-center"
import { cn } from "@/lib/utils/cn"

interface OpsHeaderProps {
  title?: string
}

export function OpsHeader({ title }: OpsHeaderProps) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { setCommandPaletteOpen } = useUIStore()
  const { unreadCount } = useNotificationStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header
      className="flex items-center justify-between px-6 h-16 border-b shrink-0 relative"
      style={{
        backgroundColor: "rgba(10,22,40,0.95)",
        borderColor: "var(--ao-border)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Left: page title */}
      <div>
        {title && (
          <h1
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}
          >
            {title}
          </h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          style={{ border: "1px solid var(--ao-border)" }}
          aria-label="Open command palette (⌘K)"
        >
          <Search className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
          <span className="text-[12px] hidden sm:block" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Search…
          </span>
          <kbd
            className="hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: "rgba(255,255,255,0.06)",
              color: "var(--ao-text-muted)",
              fontFamily: "var(--ao-font-mono)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className={cn(
              "relative p-2 rounded-lg transition-colors",
              notifOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]"
            )}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            aria-expanded={notifOpen}
          >
            <Bell className="w-5 h-5" style={{ color: "var(--ao-text-secondary)" }} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: "#FF4757", color: "white", fontFamily: "var(--ao-font-mono)" }}
                aria-hidden="true"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
              profileOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]"
            )}
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: "rgba(0,212,170,0.18)", color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}
              aria-hidden="true"
            >
              {user?.name?.trim().charAt(0) ?? "?"}
            </div>
<<<<<<< Updated upstream
            <span className="text-[13px] hidden md:block" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {user?.name?.split(" ")[0] ?? "User"}
=======
            <span className="text-[13px] font-medium hidden md:block" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {user?.name ?? "User"}
>>>>>>> Stashed changes
            </span>
            <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-xl z-50"
              style={{
                background: "rgba(17,29,51,0.98)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--ao-border)",
              }}
              role="menu"
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{user?.name}</p>
                <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { router.push("/profile"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                  role="menuitem"
                >
                  <User className="w-4 h-4" aria-hidden="true" /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-[rgba(255,71,87,0.08)]"
                  style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
