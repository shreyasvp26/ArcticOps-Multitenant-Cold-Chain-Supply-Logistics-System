import type { TempZone } from "@/lib/types/temperature"

export function classifyTempZone(temp: number): TempZone | "ambient" | "hot" {
  if (temp <= -60) return "ultra_cold"
  if (temp <= -15) return "frozen"
  if (temp <= 8) return "refrigerated"
  if (temp <= 25) return "ambient"
  return "hot"
}

export function isTempInRange(temp: number, min: number, max: number): boolean {
  return temp >= min && temp <= max
}

export function isTempApproachingLimit(temp: number, min: number, max: number, buffer = 2): boolean {
  return (temp >= min - buffer && temp < min) || (temp > max && temp <= max + buffer)
}

export function isTempExcursion(temp: number, min: number, max: number): boolean {
  return temp < min - 0.5 || temp > max + 0.5
}

export function getTempStatusColor(temp: number, min: number, max: number): string {
  if (isTempExcursion(temp, min, max)) return "#EF4444"
  if (isTempApproachingLimit(temp, min, max)) return "#F59E0B"
  return "#2ED573"
}

export function getTempStatusLabel(temp: number, min: number, max: number): string {
  if (isTempExcursion(temp, min, max)) return "Excursion"
  if (isTempApproachingLimit(temp, min, max)) return "Approaching Limit"
  return "In Range"
}

export function getTempZoneColor(zone: TempZone): string {
  const colors: Record<TempZone, string> = {
    ultra_cold: "#7C3AED",
    frozen: "#3B82F6",
    refrigerated: "#06B6D4",
  }
  return colors[zone]
}

export function getTempZoneLabel(zone: TempZone): string {
  const labels: Record<TempZone, string> = {
    ultra_cold: "Ultra-Cold",
    frozen: "Frozen",
    refrigerated: "Refrigerated",
  }
  return labels[zone]
}
