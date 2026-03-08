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

const SENTIMENT_CONFIG = {
  positive: {
    valueColor: "#2ED573",
    iconBg: "rgba(46,213,115,0.1)",
    iconColor: "#2ED573",
    glowColor: "rgba(46,213,115,0.08)",
    borderAccent: "rgba(46,213,115,0.2)",
  },
  negative: {
    valueColor: "#FF4757",
    iconBg: "rgba(255,71,87,0.1)",
    iconColor: "#FF4757",
    glowColor: "rgba(255,71,87,0.08)",
    borderAccent: "rgba(255,71,87,0.2)",
  },
  warning: {
    valueColor: "#FFA502",
    iconBg: "rgba(255,165,2,0.1)",
    iconColor: "#FFA502",
    glowColor: "rgba(255,165,2,0.06)",
    borderAccent: "rgba(255,165,2,0.2)",
  },
  neutral: {
    valueColor: "var(--ao-text-primary)",
    iconBg: "rgba(0,200,168,0.08)",
    iconColor: "var(--ao-accent)",
    glowColor: "rgba(0,200,168,0.04)",
    borderAccent: "rgba(0,200,168,0.12)",
  },
}

export function KpiCard({ label, value, icon: Icon, trend, sentiment = "neutral", emphasized, className }: KpiCardProps) {
  const config = SENTIMENT_CONFIG[sentiment]

  const trendIsPositive =
    (trend?.direction === "up" && sentiment === "positive") ||
    (trend?.direction === "down" && sentiment === "negative")

  const trendColor = trend?.direction === "flat"
    ? "var(--ao-text-muted)"
    : trendIsPositive
    ? "#2ED573"
    : "#FF4757"

  const TrendIcon = trend?.direction === "up" ? TrendingUp : trend?.direction === "down" ? TrendingDown : Minus

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.015, transition: { duration: 0.2, ease: "easeOut" } }}
      className={cn(
        "relative rounded-2xl border p-5 overflow-hidden transition-all duration-300 cursor-default",
        className
      )}
      style={{
        background: emphasized
          ? `linear-gradient(135deg, rgba(0,200,168,0.08) 0%, rgba(10,22,40,0.95) 100%)`
          : `linear-gradient(135deg, rgba(13,22,41,0.95) 0%, rgba(7,12,25,0.95) 100%)`,
        borderColor: emphasized
          ? "rgba(0,200,168,0.25)"
          : config.borderAccent,
        boxShadow: emphasized
          ? "0 0 30px rgba(0,200,168,0.1), 0 4px 16px rgba(0,0,0,0.2)"
          : "0 4px 16px rgba(0,0,0,0.15)",
      }}
    >
      {/* Background gradient orb */}
      <div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
        aria-hidden="true"
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <span
            className="text-[11px] font-semibold uppercase tracking-widest leading-none"
            style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}
          >
            {label}
          </span>
          <div
            className="p-2 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: config.iconBg,
              border: `1px solid ${config.borderAccent}`,
            }}
          >
            <Icon className="w-4 h-4" style={{ color: config.iconColor }} aria-hidden="true" />
          </div>
        </div>

        <div
          className="text-[32px] font-bold mb-2 leading-none tabular-nums"
          style={{ fontFamily: "var(--ao-font-mono)", color: config.valueColor, letterSpacing: "-0.02em" }}
        >
          <CountUp value={value} />
        </div>

        {trend && (
          <div
            className="flex items-center gap-1.5 text-[12px]"
            style={{ fontFamily: "var(--ao-font-body)", color: trendColor }}
          >
            <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="font-medium">{trend.percent}%</span>
            {trend.label && (
              <span style={{ color: "var(--ao-text-muted)" }}>{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
