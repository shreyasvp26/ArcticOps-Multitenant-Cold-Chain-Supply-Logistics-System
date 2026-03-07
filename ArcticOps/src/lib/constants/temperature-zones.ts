import type { TempZone } from "@/lib/types/temperature"

export interface TempZoneConfig {
  label: string
  shortLabel: string
  min: number
  max: number
  color: string
  bgColor: string
  cssVar: string
  icon: string
  description: string
}

export const TEMP_ZONES: Record<TempZone, TempZoneConfig> = {
  ultra_cold: {
    label: "Ultra-Cold",
    shortLabel: "Ultra-Cold",
    min: -80,
    max: -60,
    color: "#7C3AED",
    bgColor: "rgba(124,58,237,0.10)",
    cssVar: "var(--ao-temp-cryo)",
    icon: "❄❄",
    description: "Below -60°C — cryogenic storage (mRNA vaccines, cell therapies)",
  },
  frozen: {
    label: "Frozen",
    shortLabel: "Frozen",
    min: -25,
    max: -15,
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.10)",
    cssVar: "var(--ao-temp-frozen)",
    icon: "❄",
    description: "-25°C to -15°C — frozen biologics, plasma, vaccines",
  },
  refrigerated: {
    label: "Refrigerated",
    shortLabel: "Refrigerated",
    min: 2,
    max: 8,
    color: "#06B6D4",
    bgColor: "rgba(6,182,212,0.10)",
    cssVar: "var(--ao-temp-cold)",
    icon: "🌡",
    description: "2°C to 8°C — standard cold-chain pharmaceuticals",
  },
}

export function getTempZoneFromTemp(temp: number): TempZone | "ambient" | "hot" {
  if (temp <= -60) return "ultra_cold"
  if (temp <= -15) return "frozen"
  if (temp <= 8) return "refrigerated"
  if (temp <= 25) return "ambient"
  return "hot"
}

export function getTempColor(temp: number, requiredMin: number, requiredMax: number): string {
  if (temp < requiredMin - 2 || temp > requiredMax + 2) return "#EF4444" // excursion
  if (temp < requiredMin || temp > requiredMax) return "#F59E0B"         // approaching
  return "#2ED573"                                                         // in range
}
