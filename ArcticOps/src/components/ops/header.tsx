"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, User, ChevronDown, Settings } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { NotificationCenter } from "@/components/shared/notification-center"
import { cn } from "@/lib/utils/cn"

const PAGE_SUBTITLES: Record<string, string> = {
  "Command Center": "Global overview & live activity",
  "Shipments": "Monitor and manage cold-chain shipments",
  "Inventory": "Raw materials catalog & procurement",
  "Route Planner": "Multimodal route optimization",
  "Carriers": "Partner carriers & capacity",
  "Transport": "Crew operations & cold-chain health",
  "Compliance": "Documentation & audit trail",
  "Analytics": "Predictive insights & intelligence",
  "Settings": "Platform configuration",
  "Notifications": "Alerts & system events",
  "Profile": "Account preferences",
}

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
    window.location.href = "/login"
  }

  const subtitle = title ? PAGE_SUBTITLES[title] : undefined

  return (
    <header
      className="flex items-center justify-between px-6 h-[60px] border-b shrink-0 relative z-[1100]"
      style={{
        background: "linear-gradient(180deg, rgba(5,10,19,0.98) 0%, rgba(7,12,25,0.96) 100%)",
        borderColor: "rgba(30,48,80,0.7)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Left: page title */}
      <div className="flex flex-col justify-center">
        {title && (
          <>
            <h1
              className="text-[16px] font-semibold leading-tight"
              style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.01em" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] leading-none mt-0.5 hidden sm:block" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                {subtitle}
              </p>
            )}
          </>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="ao-icon-btn ao-icon-btn--teal ao-icon-btn--pill flex items-center"
          aria-label="Open command palette (⌘K)"
        >
          <Search className="ao-icon-btn__icon w-3.5 h-3.5 shrink-0" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
          <span className="text-[12px] hidden sm:block" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Search…
          </span>
          <kbd
            className="hidden sm:flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-md"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "var(--ao-text-muted)",
              fontFamily: "var(--ao-font-mono)",
              border: "1px solid rgba(30,48,80,0.8)",
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
              "ao-icon-btn ao-icon-btn--teal",
              notifOpen && "ao-icon-btn--active"
            )}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
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

        {/* Divider */}
        <div className="w-px h-6 mx-1" style={{ backgroundColor: "rgba(30,48,80,0.8)" }} aria-hidden="true" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl transition-all",
              profileOpen ? "bg-[rgba(255,255,255,0.07)]" : "hover:bg-[rgba(255,255,255,0.04)]"
            )}
            aria-expanded={profileOpen}
            aria-label="User menu"
            style={{ border: "1px solid transparent" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(0,200,168,0.25) 0%, rgba(0,200,168,0.1) 100%)",
                color: "var(--ao-accent)",
                fontFamily: "var(--ao-font-mono)",
                border: "1px solid rgba(0,200,168,0.2)",
              }}
              aria-hidden="true"
            >
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-[13px] font-medium hidden md:block" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {user?.name?.split(" ")[0] ?? "User"}
            </span>
            <ChevronDown
              className="w-3.5 h-3.5 hidden md:block transition-transform"
              style={{
                color: "var(--ao-text-muted)",
                transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
              aria-hidden="true"
            />
          </button>

          {/* Profile dropdown */}
          {profileOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl z-[1100]"
              style={{
                background: "rgba(8,14,28,0.98)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(30,48,80,0.8)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,200,168,0.05)",
              }}
              role="menu"
            >
              {/* User info */}
              <div className="px-4 py-3.5 border-b" style={{ borderColor: "rgba(30,48,80,0.6)" }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{
                      background: "radial-gradient(circle, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.06) 100%)",
                      color: "var(--ao-accent)",
                      fontFamily: "var(--ao-font-mono)",
                      border: "1px solid rgba(0,200,168,0.2)",
                    }}
                    aria-hidden="true"
                  >
                    {user?.name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{user?.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => { router.push("/profile"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-left transition-colors hover:bg-[rgba(255,255,255,0.04)] group"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                  role="menuitem"
                >
                  <span className="ao-icon-btn ao-icon-btn--teal" style={{ width: 28, height: 28 }}>
                    <User className="ao-icon-btn__icon w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                  </span>
                  Profile & Preferences
                </button>
                <button
                  onClick={() => { router.push("/settings"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-left transition-colors hover:bg-[rgba(255,255,255,0.04)]"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                  role="menuitem"
                >
                  <span className="ao-icon-btn ao-icon-btn--amber" style={{ width: 28, height: 28 }}>
                    <Settings className="ao-icon-btn__icon w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                  </span>
                  Settings
                </button>
                <div className="my-1 mx-2 h-px" style={{ backgroundColor: "rgba(30,48,80,0.6)" }} aria-hidden="true" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] text-left transition-colors hover:bg-[rgba(255,71,87,0.06)]"
                  style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}
                  role="menuitem"
                >
                  <span className="ao-icon-btn ao-icon-btn--danger" style={{ width: 28, height: 28 }}>
                    <LogOut className="ao-icon-btn__icon w-3.5 h-3.5" aria-hidden="true" style={{ color: "var(--ao-danger)" }} />
                  </span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
