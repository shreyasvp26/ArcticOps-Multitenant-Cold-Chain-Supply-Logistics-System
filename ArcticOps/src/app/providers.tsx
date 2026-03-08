"use client"

import { AnimatePresence } from "framer-motion"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { RealtimeLoop } from "@/components/ops/realtime-loop"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <RealtimeLoop />
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "var(--ao-surface-elevated)",
            border: "1px solid var(--ao-border)",
            color: "var(--ao-text-primary)",
            fontFamily: "var(--ao-font-body)",
          },
        }}
      />
    </TooltipProvider>
  )
}
