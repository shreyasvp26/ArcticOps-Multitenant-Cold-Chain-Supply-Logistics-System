"use client"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ClientSidebar } from "@/components/client/sidebar"
import { ClientHeader } from "@/components/client/header"
import { AmbientBackground } from "@/components/shared/ambient-background"
import { CommandPalette } from "@/components/shared/command-palette"
import { ToastProvider } from "@/components/shared/toast-provider"
import { pageVariants } from "@/lib/utils/motion"

const PAGE_TITLES: Record<string, string> = {
  "/home": "Home",
  "/tracker": "Supply Telemetry",
  "/procurement": "Procurement",
  "/documents": "Documents",
  "/communications": "Communications",
  "/settings": "Settings",
  "/notifications": "Notifications",
  "/profile": "Profile",
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]!
  const prefix = Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(k + "/"))
  return prefix ? PAGE_TITLES[prefix]! : "Portal"
}

export function ClientLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <>
      <AmbientBackground />
      <CommandPalette />
      <ToastProvider />
      <div className="flex h-screen overflow-hidden">
        <ClientSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <ClientHeader title={title} />
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
