"use client"
import { useMemo } from "react"
import { cn } from "@/lib/utils/cn"

interface SparklineProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  className?: string
  showDot?: boolean
  ariaLabel?: string
}

export function Sparkline({ data, color = "#00D4AA", height = 24, width = 80, className, showDot = true, ariaLabel }: SparklineProps) {
  const points = useMemo(() => {
    if (!data || data.length < 2) return ""
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pad = 2

    return data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (width - pad * 2)
      const y = pad + (1 - (v - min) / range) * (height - pad * 2)
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(" ")
  }, [data, width, height])

  const lastPoint = useMemo(() => {
    if (!data || data.length < 2) return null
    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pad = 2
    const last = data[data.length - 1]!
    return {
      x: pad + (width - pad * 2),
      y: pad + (1 - (last - min) / range) * (height - pad * 2),
    }
  }, [data, width, height])

  if (!data || data.length < 2) return null

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-label={ariaLabel ?? `Sparkline chart with ${data.length} data points`}
      role="img"
    >
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          stroke="var(--ao-surface)"
          strokeWidth={1}
        />
      )}
    </svg>
  )
}
