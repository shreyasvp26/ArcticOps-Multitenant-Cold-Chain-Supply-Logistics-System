"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { NotificationCenter } from "@/components/shared/notification-center"
import { cn } from "@/lib/utils/cn"

export function ClientHeader({ title }: { title?: string }) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { setCommandPaletteOpen } = useUIStore()
  const { unreadCount } = useNotificationStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b shrink-0 relative"
      style={{ backgroundColor: "rgba(10,22,40,0.95)", borderColor: "var(--ao-border)", backdropFilter: "blur(20px)" }}>
      <div>
        {title && <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          style={{ border: "1px solid var(--ao-border)" }}
          aria-label="Open search (⌘K)">
          <Search className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} />
          <kbd className="hidden sm:flex items-center text-[10px] px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
            ⌘K
          </kbd>
        </button>

        <div className="relative">
          <button onClick={() => setNotifOpen((v) => !v)}
            className={cn("relative p-2 rounded-lg transition-colors", notifOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]")}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}>
            <Bell className="w-5 h-5" style={{ color: "var(--ao-text-secondary)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: "#FF4757", color: "white", fontFamily: "var(--ao-font-mono)" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="relative">
          <button onClick={() => setProfileOpen((v) => !v)}
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors", profileOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]")}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "rgba(59,130,246,0.18)", color: "#3B82F6", fontFamily: "var(--ao-font-mono)" }}>
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <span className="text-[13px] hidden md:block" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}>
              {user?.name?.split(" ")[0] ?? "User"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 hidden md:block" style={{ color: "var(--ao-text-muted)" }} />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl overflow-hidden shadow-xl z-50"
              style={{ background: "rgba(17,29,51,0.98)", backdropFilter: "blur(20px)", border: "1px solid var(--ao-border)" }}
              role="menu">
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{user?.name}</p>
                <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{user?.tenantName}</p>
              </div>
              <div className="p-1">
                <button onClick={() => { router.push("/profile"); setProfileOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-[rgba(255,255,255,0.05)]"
                  style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }} role="menuitem">
                  <User className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { logout(); router.push("/login") }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left hover:bg-[rgba(255,71,87,0.08)]"
                  style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }} role="menuitem">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
