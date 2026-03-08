"use client"
import { cn } from "@/lib/utils/cn"
import {
  CheckCircle, Truck, Clock, AlertTriangle, PackageCheck,
  Circle, Thermometer, Shield, ShieldAlert
} from "lucide-react"

type StatusType =
  | "on_track" | "in_transit" | "delayed" | "at_risk"
  | "delivered" | "pending" | "excursion" | "compliant" | "non_compliant"

interface StatusBadgeProps {
  status: StatusType
  size?: "sm" | "md" | "lg"
  className?: string
}

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; border: string; Icon: React.ElementType }> = {
  on_track: { label: "On Track", color: "#2ED573", bg: "rgba(46,213,115,0.08)", border: "rgba(46,213,115,0.25)", Icon: CheckCircle },
  in_transit: { label: "In Transit", color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", Icon: Truck },
  delayed: { label: "Delayed", color: "#FFA502", bg: "rgba(255,165,2,0.08)", border: "rgba(255,165,2,0.25)", Icon: Clock },
  at_risk: { label: "At Risk", color: "#FF4757", bg: "rgba(255,71,87,0.08)", border: "rgba(255,71,87,0.25)", Icon: AlertTriangle },
  delivered: { label: "Delivered", color: "#2ED573", bg: "rgba(46,213,115,0.08)", border: "rgba(46,213,115,0.25)", Icon: PackageCheck },
  pending: { label: "Pending", color: "#94A3B8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)", Icon: Circle },
  excursion: { label: "Excursion", color: "#FF4757", bg: "rgba(255,71,87,0.08)", border: "rgba(255,71,87,0.25)", Icon: Thermometer },
  compliant: { label: "Compliant", color: "#2ED573", bg: "rgba(46,213,115,0.08)", border: "rgba(46,213,115,0.25)", Icon: Shield },
  non_compliant: { label: "Non-Compliant", color: "#FF4757", bg: "rgba(255,71,87,0.08)", border: "rgba(255,71,87,0.25)", Icon: ShieldAlert },
}

const sizeStyles = {
  sm: { padding: "2px 8px", fontSize: "10px", iconSize: "w-3 h-3", gap: "gap-1" },
  md: { padding: "3px 10px", fontSize: "11px", iconSize: "w-3.5 h-3.5", gap: "gap-1.5" },
  lg: { padding: "5px 12px", fontSize: "12px", iconSize: "w-4 h-4", gap: "gap-2" },
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const s = sizeStyles[size]
  const { Icon } = config

  return (
    <span
      className={cn("inline-flex items-center rounded-full font-semibold tracking-wide", s.gap, className)}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        fontFamily: "var(--ao-font-body)",
        letterSpacing: "0.01em",
      }}
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={cn(s.iconSize, "shrink-0")} aria-hidden="true" />
      {config.label}
    </span>
  )
}
