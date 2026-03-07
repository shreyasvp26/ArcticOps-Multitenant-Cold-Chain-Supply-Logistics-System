"use client"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { OpsSidebar } from "@/components/ops/sidebar"
import { OpsHeader } from "@/components/ops/header"
import { AmbientBackground } from "@/components/shared/ambient-background"
import { CommandPalette } from "@/components/shared/command-palette"
import { ToastProvider } from "@/components/shared/toast-provider"
import { RealtimeLoop } from "@/components/ops/realtime-loop"
import { CrossDashboardBridge } from "@/components/ops/cross-dashboard-bridge"
import { pageVariants } from "@/lib/utils/motion"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Command Center",
  "/shipments": "Shipments",
  "/inventory": "Inventory",
  "/route-planner": "Route Planner",
  "/carriers": "Carriers",
  "/transport": "Transport",
  "/compliance": "Compliance",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/notifications": "Notifications",
  "/profile": "Profile",
}

function getTitle(pathname: string): string {
  const exact = PAGE_TITLES[pathname]
  if (exact) return exact
  const prefix = Object.keys(PAGE_TITLES).find((k) => k !== "/" && pathname.startsWith(k))
  return prefix ? PAGE_TITLES[prefix]! : "ArcticOps"
}

export function OpsLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <>
      <AmbientBackground />
      <RealtimeLoop />
      <CrossDashboardBridge />
      <CommandPalette />
      <ToastProvider />
      <div className="flex h-screen overflow-hidden">
        <OpsSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <OpsHeader title={title} />
          <main className="flex-1 overflow-auto" id="main-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  )
}
