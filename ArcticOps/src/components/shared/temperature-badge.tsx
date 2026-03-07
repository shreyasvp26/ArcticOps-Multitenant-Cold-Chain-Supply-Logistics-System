"use client"
import { cn } from "@/lib/utils/cn"
import { Snowflake, Thermometer, AlertTriangle } from "lucide-react"
import type { TempZone } from "@/lib/types/temperature"
import { getTempStatusColor, isTempExcursion, isTempApproachingLimit } from "@/lib/utils/temperature"

interface TemperatureBadgeProps {
  temperature: number
  zone: TempZone
  requiredMin: number
  requiredMax: number
  size?: "sm" | "md" | "lg"
  className?: string
}

const ZONE_COLORS: Record<TempZone, string> = {
  ultra_cold: "#7C3AED",
  frozen: "#3B82F6",
  refrigerated: "#06B6D4",
}

const ZONE_LABELS: Record<TempZone, string> = {
  ultra_cold: "Ultra-Cold",
  frozen: "Frozen",
  refrigerated: "Refrigerated",
}

export function TemperatureBadge({ temperature, zone, requiredMin, requiredMax, size = "md", className }: TemperatureBadgeProps) {
  const isExcursion = isTempExcursion(temperature, requiredMin, requiredMax)
  const isApproaching = isTempApproachingLimit(temperature, requiredMin, requiredMax)
  const statusColor = getTempStatusColor(temperature, requiredMin, requiredMax)
  const bgColor = `${statusColor}18`

  const Icon = isExcursion || isApproaching ? AlertTriangle : zone === "ultra_cold" || zone === "frozen" ? Snowflake : Thermometer
  const zoneColor = ZONE_COLORS[zone]

  const sizeMap = {
    sm: { padding: "2px 8px", fontSize: "11px", iconSize: "w-3 h-3" },
    md: { padding: "4px 10px", fontSize: "12px", iconSize: "w-3.5 h-3.5" },
    lg: { padding: "6px 14px", fontSize: "14px", iconSize: "w-4 h-4" },
  }
  const s = sizeMap[size]

  const displayColor = isExcursion ? "#FF4757" : isApproaching ? "#F59E0B" : zoneColor

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full font-medium", className)}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        color: displayColor,
        backgroundColor: isExcursion ? "rgba(255,71,87,0.12)" : isApproaching ? "rgba(245,158,11,0.12)" : `${zoneColor}18`,
        fontFamily: "var(--ao-font-mono)",
      }}
      aria-label={`Temperature: ${temperature.toFixed(1)}°C — ${ZONE_LABELS[zone]}${isExcursion ? " (Excursion)" : isApproaching ? " (Approaching limit)" : ""}`}
    >
      <Icon className={s.iconSize} aria-hidden="true" />
      {temperature.toFixed(1)}°C
    </span>
  )
}
