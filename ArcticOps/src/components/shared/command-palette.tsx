"use client"
import { useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Package, Boxes, Map, Truck, Users, ShieldCheck, BarChart3,
  Settings, Home, MapPin, ShoppingCart, FileText, ClipboardList,
  Navigation, Thermometer, PackageCheck, Snowflake, Search,
  LayoutDashboard, Zap, Bell
} from "lucide-react"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator
} from "@/components/ui/command"
import { useUIStore } from "@/lib/store/ui-store"
import { useAuthStore } from "@/lib/store/auth-store"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { isOpsRole, isClientRole, isDriverRole } from "@/lib/utils/permissions"

export function CommandPalette() {
  const router = useRouter()
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { user } = useAuthStore()
  const shipments = useShipmentStore((s) => s.shipments)

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setCommandPaletteOpen])

  const run = useCallback((href: string) => {
    setCommandPaletteOpen(false)
    router.push(href)
  }, [router, setCommandPaletteOpen])

  const role = user?.role

  const OPS_PAGES = [
    { label: "Command Center", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Shipments", icon: Package, href: "/shipments" },
    { label: "Inventory", icon: Boxes, href: "/inventory" },
    { label: "Route Planner", icon: Map, href: "/route-planner" },
    { label: "Carriers", icon: Truck, href: "/carriers" },
    { label: "Transport & Crew", icon: Users, href: "/transport" },
    { label: "Compliance", icon: ShieldCheck, href: "/compliance" },
    { label: "Analytics", icon: BarChart3, href: "/analytics" },
    { label: "Settings", icon: Settings, href: "/settings" },
    { label: "Notifications", icon: Bell, href: "/notifications" },
  ]

  const CLIENT_PAGES = [
    { label: "Home", icon: Home, href: "/home" },
    { label: "Shipment Tracker", icon: MapPin, href: "/tracker" },
    { label: "Procurement", icon: ShoppingCart, href: "/procurement" },
    { label: "Documents", icon: FileText, href: "/documents" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ]

  const DRIVER_PAGES = [
    { label: "Assignment", icon: ClipboardList, href: "/assignment" },
    { label: "Navigate", icon: Navigation, href: "/navigate" },
    { label: "Monitor Temp", icon: Thermometer, href: "/monitor" },
    { label: "Deliver", icon: PackageCheck, href: "/deliver" },
  ]

  const QUICK_ACTIONS = [
    { label: "New Procurement Order", icon: Zap, href: "/procurement/order" },
    { label: "View Active Alerts", icon: Bell, href: "/notifications" },
    { label: "Open Route Planner", icon: Map, href: "/route-planner" },
  ]

  const pages =
    role && isOpsRole(role)
      ? OPS_PAGES
      : role && isClientRole(role)
      ? CLIENT_PAGES
      : role && isDriverRole(role)
      ? DRIVER_PAGES
      : OPS_PAGES

  // Filter active shipments for search results
  const activeShipments = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs").slice(0, 6)

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search pages, shipments, actions…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6">
            <Snowflake className="w-8 h-8" style={{ color: "var(--ao-text-muted)" }} />
            <span style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)", fontSize: "14px" }}>
              No results found
            </span>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map(({ label, icon: Icon, href }) => (
            <CommandItem
              key={href}
              value={label}
              onSelect={() => run(href)}
              className="gap-3"
            >
              <Zap className="w-4 h-4 shrink-0" style={{ color: "var(--ao-accent)" }} />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {pages.map(({ label, icon: Icon, href }) => (
            <CommandItem
              key={href}
              value={label}
              onSelect={() => run(href)}
              className="gap-3"
            >
              <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
              {label}
            </CommandItem>
          ))}
        </CommandGroup>

        {activeShipments.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Active Shipments">
              {activeShipments.map((sh) => (
                <CommandItem
                  key={sh.id}
                  value={`${sh.id} ${sh.clientName} ${sh.origin} ${sh.destination}`}
                  onSelect={() => run(`/shipments/${sh.id}`)}
                  className="gap-3"
                >
                  <Package className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
                  <span style={{ fontFamily: "var(--ao-font-mono)", fontSize: "13px" }}>{sh.id}</span>
                  <span className="text-xs" style={{ color: "var(--ao-text-muted)" }}>
                    {sh.origin} → {sh.destination}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
