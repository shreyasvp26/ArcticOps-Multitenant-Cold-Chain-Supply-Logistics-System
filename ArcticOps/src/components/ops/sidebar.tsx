"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Package, Boxes, Map, Users,
  ShieldCheck, BarChart3, Settings, ChevronLeft, ChevronRight,
  Snowflake
} from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/store/ui-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { sidebarVariants } from "@/lib/utils/motion"

const NAV_ITEMS = [
  { label: "Command Center", href: "/dashboard", icon: LayoutDashboard },
  { label: "Shipments", href: "/shipments", icon: Package },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Route Planner", href: "/route-planner", icon: Map },
  { label: "Transport", href: "/transport", icon: Users },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  ops_manager: "Ops Manager",
  compliance_officer: "Compliance",
  client_admin: "Client Admin",
  client_viewer: "Viewer",
  driver: "Driver",
}

export function OpsSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar } = useUIStore()
  const { user } = useAuthStore()

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)

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
      aria-label="Main navigation"
    >
      {/* Right edge glow */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-px pointer-events-none"
        style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,200,168,0.12) 30%, rgba(0,200,168,0.06) 70%, transparent 100%)" }}
      />

      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: "rgba(30,48,80,0.6)", minHeight: "64px" }}
      >
        <div
          className="p-2 rounded-xl shrink-0 flex items-center justify-center"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.06) 100%)",
            border: "1px solid rgba(0,200,168,0.2)",
            boxShadow: "0 0 16px rgba(0,200,168,0.08)",
          }}
        >
          <Snowflake className="w-5 h-5" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
        </div>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[15px] font-bold leading-none" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.02em" }}>
              ArcticOps
            </p>
            <p className="text-[10px] mt-0.5 tracking-wide uppercase" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
              Control Tower
            </p>
          </motion.div>
        )}
      </div>

      {/* Nav items */}
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
                    active
                      ? ""
                      : "hover:bg-[rgba(255,255,255,0.035)]"
                  )}
                  style={active ? {
                    background: "linear-gradient(135deg, rgba(0,200,168,0.15) 0%, rgba(0,200,168,0.08) 100%)",
                    border: "1px solid rgba(0,200,168,0.2)",
                    boxShadow: "0 0 20px rgba(0,200,168,0.08)",
                  } : {
                    border: "1px solid transparent",
                  }}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Left accent bar */}
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                      style={{ backgroundColor: "var(--ao-accent)", boxShadow: "0 0 8px rgba(0,200,168,0.6)" }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={cn(
                      "ao-icon-btn shrink-0",
                      active ? "ao-icon-btn--active" : "ao-icon-btn--teal"
                    )}
                    style={{ width: 30, height: 30, borderRadius: 8, pointerEvents: "none" }}
                    aria-hidden="true"
                  >
                    <Icon
                      className="ao-icon-btn__icon w-4 h-4"
                      style={{ color: active ? "var(--ao-accent)" : "rgba(148,163,184,0.6)" }}
                    />
                  </span>
                  {sidebarOpen && (
                    <span
                      className="text-[13px] font-medium truncate"
                      style={{
                        fontFamily: "var(--ao-font-body)",
                        color: active ? "var(--ao-text-primary)" : "var(--ao-text-secondary)",
                      }}
                    >
                      {label}
                    </span>
                  )}
                  {/* Tooltip for collapsed state */}
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
                      aria-hidden="true"
                    >
                      {label}
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + collapse toggle */}
      <div className="border-t" style={{ borderColor: "rgba(30,48,80,0.6)" }}>
        {/* Role badge */}
        {sidebarOpen && user && (
          <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(30,48,80,0.4)" }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: "radial-gradient(circle, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)",
                  color: "var(--ao-accent)",
                  fontFamily: "var(--ao-font-mono)",
                  border: "1px solid rgba(0,200,168,0.2)",
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
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#22E574", boxShadow: "0 0 6px rgba(46,213,115,0.5)" }} aria-hidden="true" />
            </div>
          </div>
        )}
        <div className="p-2">
          <button
            onClick={toggleSidebar}
            className="ao-icon-btn ao-icon-btn--teal w-full"
            style={{ borderRadius: 10, width: "100%" }}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen
              ? <ChevronLeft className="ao-icon-btn__icon w-4 h-4" aria-hidden="true" style={{ color: "var(--ao-text-muted)" }} />
              : <ChevronRight className="ao-icon-btn__icon w-4 h-4" aria-hidden="true" style={{ color: "var(--ao-text-muted)" }} />}
          </button>
        </div>

      </div>
    </motion.aside>
  )
}
