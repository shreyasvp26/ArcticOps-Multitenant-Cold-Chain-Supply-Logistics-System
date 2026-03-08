"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Home, MapPin, ShoppingCart, FileText, MessageSquare,
  Settings, ChevronLeft, ChevronRight, Snowflake, Thermometer
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/store/ui-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { sidebarVariants } from "@/lib/utils/motion"

const NAV_ITEMS = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Supply Telemetry", href: "/tracker", icon: Thermometer },
  { label: "Procurement", href: "/procurement", icon: ShoppingCart },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <motion.aside
      variants={sidebarVariants}
      animate={sidebarOpen ? "expanded" : "collapsed"}
      className="relative flex flex-col shrink-0 h-screen"
      style={{
        background: "linear-gradient(180deg, rgba(5,10,19,0.98) 0%, rgba(7,12,25,0.98) 100%)",
        borderRight: "1px solid rgba(30,48,80,0.7)",
        backdropFilter: "blur(24px)",
      }}
      aria-label="Client navigation"
    >
      {/* Right edge subtle glow - blue for client */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-px pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(59,130,246,0.12) 30%, rgba(59,130,246,0.06) 70%, transparent 100%)" }}
      />

      {/* Logo + tenant name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "rgba(30,48,80,0.6)", minHeight: "64px" }}>
        <div
          className="p-2 rounded-xl shrink-0 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.06) 100%)",
            border: "1px solid rgba(59,130,246,0.2)",
            boxShadow: "0 0 16px rgba(59,130,246,0.08)",
          }}
        >
          <Snowflake className="w-5 h-5" style={{ color: "#3B82F6" }} aria-hidden="true" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            className="overflow-hidden"
          >
            <p className="text-[14px] font-semibold leading-none truncate max-w-[160px]"
              style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.01em" }}>
              {user?.tenantName ?? "Client Portal"}
            </p>
            <p className="text-[10px] mt-0.5 uppercase tracking-wide" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
              via ArcticOps
            </p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" role="navigation">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all group relative",
                    active ? "" : "hover:bg-[rgba(255,255,255,0.035)]"
                  )}
                  style={active ? {
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    boxShadow: "0 0 20px rgba(59,130,246,0.06)",
                  } : {
                    border: "1px solid transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ backgroundColor: "#3B82F6", boxShadow: "0 0 8px rgba(59,130,246,0.6)" }}
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className="w-4.5 h-4.5 shrink-0 transition-colors"
                    style={{ color: active ? "#3B82F6" : "rgba(148,163,184,0.6)" }}
                    aria-hidden="true"
                  />
                  {sidebarOpen && (
                    <span className="text-[13px] font-medium truncate"
                      style={{ fontFamily: "var(--ao-font-body)", color: active ? "var(--ao-text-primary)" : "var(--ao-text-secondary)" }}>
                      {label}
                    </span>
                  )}
                  {!sidebarOpen && (
                    <div
                      className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-[12px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity"
                      style={{
                        backgroundColor: "rgba(12,22,42,0.98)",
                        color: "var(--ao-text-primary)",
                        border: "1px solid rgba(30,48,80,0.8)",
                        fontFamily: "var(--ao-font-body)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                        backdropFilter: "blur(12px)",
                      }}
                      aria-hidden="true">
                      {label}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + collapse */}
      <div className="border-t" style={{ borderColor: "rgba(30,48,80,0.6)" }}>
        {sidebarOpen && user && (
          <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(30,48,80,0.4)" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0.08) 100%)",
                  color: "#3B82F6",
                  fontFamily: "var(--ao-font-mono)",
                  border: "1px solid rgba(59,130,246,0.2)",
                }}
                aria-hidden="true"
              >
                {user.name?.charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                  {user.name?.split(" ")[0]}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Client Portal
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="p-2">
          <button onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-xl transition-colors hover:bg-[rgba(255,255,255,0.04)]"
            style={{ color: "var(--ao-text-muted)" }}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
            {sidebarOpen ? <ChevronLeft className="w-4 h-4" aria-hidden="true" /> : <ChevronRight className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

      </div>
    </motion.aside>
  )
}
