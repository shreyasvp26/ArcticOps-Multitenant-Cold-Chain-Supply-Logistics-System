"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
      className="relative flex flex-col border-r shrink-0 h-screen"
      style={{
        backgroundColor: "rgba(12,22,42,0.95)",
        borderColor: "var(--ao-border)",
        backdropFilter: "blur(20px)",
      }}
      aria-label="Client navigation"
    >
      {/* Logo + tenant name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: "var(--ao-border)", minHeight: "64px" }}>
        <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: "rgba(59,130,246,0.14)" }}>
          <Snowflake className="w-5 h-5" style={{ color: "#3B82F6" }} aria-hidden="true" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            className="overflow-hidden"
          >
            <p className="text-[14px] font-semibold leading-none truncate max-w-[160px]"
              style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
              {user?.tenantName ?? "Client Portal"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
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
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group relative",
                    active ? "text-white" : "hover:bg-[rgba(255,255,255,0.04)]"
                  )}
                  style={active ? { backgroundColor: "#3B82F6", boxShadow: "0 0 16px rgba(59,130,246,0.25)" } : {}}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className="w-5 h-5 shrink-0"
                    style={{ color: active ? "white" : "var(--ao-text-muted)" }}
                    aria-hidden="true"
                  />
                  {sidebarOpen && (
                    <span className="text-[13px] font-medium truncate"
                      style={{ fontFamily: "var(--ao-font-body)", color: active ? "white" : "var(--ao-text-secondary)" }}>
                      {label}
                    </span>
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity"
                      style={{ backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-primary)", border: "1px solid var(--ao-border)", fontFamily: "var(--ao-font-body)" }}
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

<<<<<<< Updated upstream
      <div className="p-2 border-t" style={{ borderColor: "var(--ao-border)" }}>
        <button onClick={toggleSidebar}
          className="w-full flex items-center justify-center p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          style={{ color: "var(--ao-text-muted)" }}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
=======
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
                {user.name?.trim().charAt(0) ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold truncate" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                  {user.name}
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
>>>>>>> Stashed changes
      </div>
    </motion.aside>
  )
}
