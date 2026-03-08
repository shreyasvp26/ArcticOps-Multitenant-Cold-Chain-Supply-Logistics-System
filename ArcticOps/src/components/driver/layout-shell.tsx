"use client"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DriverHeader } from "@/components/driver/header"
import { DriverBottomNav } from "@/components/driver/bottom-nav"
import { AmbientBackground } from "@/components/shared/ambient-background"
import { ToastProvider } from "@/components/shared/toast-provider"
import { pageVariants } from "@/lib/utils/motion"
import { useUIStore } from "@/lib/store/ui-store"

export function DriverLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isNavigate = pathname === "/navigate"
  const updateStressLevel = useUIStore((s) => s.updateStressLevel)

  // Lock ambient background to serene — drivers never see risk/emergency visuals
  useEffect(() => {
    updateStressLevel({ tempExcursions: 0, delayedShipments: 0, criticalAlerts: 0, overdueDocuments: 0, capacityIssues: 0 })
  }, [updateStressLevel])

  return (
    <>
      <AmbientBackground />
      <ToastProvider />
      <div className="flex flex-col h-[100dvh] max-w-[480px] mx-auto overflow-hidden">
        <DriverHeader />
        <main
          className={isNavigate ? "flex-1 overflow-hidden flex flex-col" : "flex-1 overflow-auto"}
          id="main-content"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={isNavigate ? "flex-1 flex flex-col h-full" : "min-h-full"}
              style={isNavigate ? { flex: 1, minHeight: 0 } : undefined}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <DriverBottomNav />
      </div>
    </>
  )
}
