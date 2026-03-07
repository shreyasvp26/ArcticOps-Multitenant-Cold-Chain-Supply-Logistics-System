"use client"
import { cn } from "@/lib/utils/cn"
import { Snowflake } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { fadeVariants } from "@/lib/utils/motion"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  cta?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ title, description, icon: Icon = Snowflake, cta, className }: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-8",
        className
      )}
    >
      <div
        className="mb-6 p-5 rounded-2xl"
        style={{ backgroundColor: "var(--ao-surface-elevated)" }}
      >
        <Icon
          className="w-12 h-12"
          style={{ color: "var(--ao-text-muted)" }}
          aria-hidden="true"
        />
      </div>

      <h3
        className="mb-2 text-lg font-semibold"
        style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="mb-6 max-w-xs leading-relaxed"
          style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)", fontSize: "14px" }}
        >
          {description}
        </p>
      )}

      {cta && (
        <button
          onClick={cta.onClick}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:brightness-110 focus-visible:outline-none"
          style={{
            backgroundColor: "var(--ao-accent)",
            color: "var(--ao-background)",
            fontFamily: "var(--ao-font-body)",
          }}
        >
          {cta.label}
        </button>
      )}
    </motion.div>
  )
}
