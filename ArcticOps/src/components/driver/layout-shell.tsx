"use client"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { DriverHeader } from "@/components/driver/header"
import { DriverBottomNav } from "@/components/driver/bottom-nav"
import { AmbientBackground } from "@/components/shared/ambient-background"
import { ToastProvider } from "@/components/shared/toast-provider"
import { pageVariants } from "@/lib/utils/motion"

export function DriverLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <>
      <AmbientBackground />
      <ToastProvider />
      <div className="flex flex-col h-[100dvh] max-w-[480px] mx-auto overflow-hidden">
        <DriverHeader />
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
        <DriverBottomNav />
      </div>
    </>
  )
}
