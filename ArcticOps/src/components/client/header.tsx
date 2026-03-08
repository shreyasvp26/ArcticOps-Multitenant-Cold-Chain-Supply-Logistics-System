"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, LogOut, User, ChevronDown } from "lucide-react"
import { useAuthStore } from "@/lib/store/auth-store"
import { useUIStore } from "@/lib/store/ui-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { NotificationCenter } from "@/components/shared/notification-center"
import { cn } from "@/lib/utils/cn"

<<<<<<< Updated upstream
import { CLIENT_ROLES } from "@/lib/constants/roles"
=======
const PAGE_SUBTITLES: Record<string, string> = {
  "Home": "Your active orders & recent activity",
  "Tracker": "Live shipment tracking",
  "Procurement": "Order materials & view history",
  "Documents": "Compliance documents & downloads",
  "Settings": "Team & account settings",
  "Notifications": "Alerts & system events",
  "Profile": "Account preferences",
}
>>>>>>> Stashed changes

export function ClientHeader({ title }: { title?: string }) {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const { setCommandPaletteOpen } = useUIStore()
  const { notifications } = useNotificationStore()
  const [profileOpen, setProfileOpen] = useState(false)

  const isClient = user?.role && (CLIENT_ROLES as string[]).includes(user.role)

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
          <button onClick={() => setProfileOpen((v) => !v)}
<<<<<<< Updated upstream
            className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors", profileOpen ? "bg-[rgba(255,255,255,0.08)]" : "hover:bg-[rgba(255,255,255,0.05)]")}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "rgba(59,130,246,0.18)", color: "#3B82F6", fontFamily: "var(--ao-font-mono)" }}>
              {user?.name?.charAt(0) ?? "?"}
=======
            className={cn("flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl transition-all", profileOpen ? "bg-[rgba(255,255,255,0.07)]" : "hover:bg-[rgba(255,255,255,0.04)]")}
            style={{ border: "1px solid transparent" }}
            aria-expanded={profileOpen}
            aria-label="User menu"
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{ background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.25) 0%, rgba(59,130,246,0.1) 100%)", color: "#3B82F6", fontFamily: "var(--ao-font-mono)", border: "1px solid rgba(59,130,246,0.2)" }}
              aria-hidden="true">
              {user?.name?.trim().charAt(0) ?? "?"}
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
              <div className="px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)" }}>
                <p className="text-sm font-semibold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{user?.name}</p>
                <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{user?.tenantName}</p>
=======
              <div className="px-4 py-3.5 border-b" style={{ borderColor: "rgba(30,48,80,0.6)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.06) 100%)", color: "#3B82F6", fontFamily: "var(--ao-font-mono)", border: "1px solid rgba(59,130,246,0.2)" }}
                    aria-hidden="true">
                    {user?.name?.trim().charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{user?.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{user?.tenantName}</p>
                  </div>
                </div>
>>>>>>> Stashed changes
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
