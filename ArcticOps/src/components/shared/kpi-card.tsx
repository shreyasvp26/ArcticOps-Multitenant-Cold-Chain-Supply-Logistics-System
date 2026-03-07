"use client"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils/cn"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { motion } from "framer-motion"
import { cardVariants } from "@/lib/utils/motion"
import type { LucideIcon } from "lucide-react"

// ── CountUp: animates numeric values on change ─────────────────────────────
function CountUp({ value, className }: { value: string | number; className?: string }) {
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""))
  const isNumeric = !isNaN(numericValue)

  const [display, setDisplay] = useState(isNumeric ? numericValue : value)
  const prevRef = useRef(isNumeric ? numericValue : null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isNumeric) { setDisplay(value); return }

    const from = prevRef.current ?? numericValue
    prevRef.current = numericValue

    if (from === numericValue) return

    const start = performance.now()
    const duration = 600

    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
      const current = from + (numericValue - from) * eased
      setDisplay(Math.round(current))
      if (t < 1) rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [numericValue, isNumeric, value])

  return <span className={className}>{isNumeric ? display : value}</span>
}

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { direction: "up" | "down" | "flat"; percent: number; label?: string }
  sentiment?: "positive" | "negative" | "neutral" | "warning"
  emphasized?: boolean
  className?: string
}

export function KpiCard({ label, value, icon: Icon, trend, sentiment = "neutral", emphasized, className }: KpiCardProps) {
  const sentimentColors = {
    positive: "text-[var(--ao-success)]",
    negative: "text-[var(--ao-danger)]",
    neutral: "text-[var(--ao-text-primary)]",
    warning: "text-[var(--ao-warning)]",
  }

  const trendColors = {
    up: trend?.direction === "up" && sentiment === "positive" ? "text-[var(--ao-success)]" : "text-[var(--ao-danger)]",
    down: trend?.direction === "down" && sentiment === "negative" ? "text-[var(--ao-danger)]" : "text-[var(--ao-success)]",
    flat: "text-[var(--ao-text-muted)]",
  }

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.015, transition: { duration: 0.2, ease: "easeOut" } }}
      className={cn(
        "relative rounded-xl border p-5 transition-colors duration-300",
        "bg-[var(--ao-surface)] border-[var(--ao-border)]",
        "hover:border-[var(--ao-border-hover)] cursor-default",
        emphasized && "ring-1 ring-[var(--ao-accent)] shadow-[0_0_20px_rgba(0,212,170,0.15)]",
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[13px] text-[var(--ao-text-secondary)] font-medium uppercase tracking-wider leading-none"
          style={{ fontFamily: "var(--ao-font-body)" }}>
          {label}
        </span>
        <div className="p-1.5 rounded-lg bg-[var(--ao-surface-elevated)]">
          <Icon className="w-4 h-4 text-[var(--ao-text-muted)]" aria-hidden="true" />
        </div>
      </div>

      <div
        className={cn("text-3xl font-semibold mb-2 tabular-nums", sentimentColors[sentiment])}
        style={{ fontFamily: "var(--ao-font-mono)" }}
      >
        <CountUp value={value} />
      </div>

      {trend && (
        <div className={cn("flex items-center gap-1 text-[12px]", trendColors[trend.direction])}
          style={{ fontFamily: "var(--ao-font-body)" }}>
          <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{trend.percent}%</span>
          {trend.label && <span className="text-[var(--ao-text-muted)] ml-1">{trend.label}</span>}
        </div>
      )}
    </motion.div>
  )
}
