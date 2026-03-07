import { formatDistanceToNow, format, differenceInMinutes, differenceInHours, parseISO } from "date-fns"

export function formatTemp(temp: number): string {
  return `${temp.toFixed(1)}°C`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: decimals }).format(n)
}

export function formatWeight(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg}kg`
}

export function formatDistance(km: number): string {
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km} km`
}

export function formatEta(isoDate: string): string {
  const date = parseISO(isoDate)
  const hoursAway = differenceInHours(date, new Date())
  if (hoursAway < 0) return "Overdue"
  if (hoursAway < 1) {
    const mins = differenceInMinutes(date, new Date())
    return `${mins}m`
  }
  if (hoursAway < 48) return `${hoursAway}h`
  const days = Math.floor(hoursAway / 24)
  const remainingHours = hoursAway % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

export function formatTimestamp(isoDate: string): string {
  const date = parseISO(isoDate)
  const diffMinutes = differenceInMinutes(new Date(), date)
  if (diffMinutes < 60) return formatDistanceToNow(date, { addSuffix: true })
  if (diffMinutes < 60 * 24) return formatDistanceToNow(date, { addSuffix: true })
  return format(date, "MMM d, yyyy 'at' HH:mm")
}

export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), "MMM d, yyyy")
}

export function formatDatetime(isoDate: string): string {
  return format(parseISO(isoDate), "MMM d, yyyy HH:mm")
}

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCO2(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(2)}t CO₂`
  return `${Math.round(kg)}kg CO₂`
}

export function formatShipmentId(id: string): string {
  return id.toUpperCase()
}
