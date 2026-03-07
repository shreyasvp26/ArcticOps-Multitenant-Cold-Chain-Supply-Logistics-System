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

const STATUS_CONFIG: Record<StatusType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  on_track: { label: "On Track", color: "#2ED573", bg: "rgba(46,213,115,0.12)", Icon: CheckCircle },
  in_transit: { label: "In Transit", color: "#3B82F6", bg: "rgba(59,130,246,0.12)", Icon: Truck },
  delayed: { label: "Delayed", color: "#FFA502", bg: "rgba(255,165,2,0.12)", Icon: Clock },
  at_risk: { label: "At Risk", color: "#FF4757", bg: "rgba(255,71,87,0.12)", Icon: AlertTriangle },
  delivered: { label: "Delivered", color: "#2ED573", bg: "rgba(46,213,115,0.12)", Icon: PackageCheck },
  pending: { label: "Pending", color: "#64748B", bg: "rgba(100,116,139,0.12)", Icon: Circle },
  excursion: { label: "Excursion", color: "#FF4757", bg: "rgba(255,71,87,0.12)", Icon: Thermometer },
  compliant: { label: "Compliant", color: "#2ED573", bg: "rgba(46,213,115,0.12)", Icon: Shield },
  non_compliant: { label: "Non-Compliant", color: "#FF4757", bg: "rgba(255,71,87,0.12)", Icon: ShieldAlert },
}

const sizeStyles = {
  sm: { padding: "2px 8px", fontSize: "11px", iconSize: "w-3 h-3", gap: "gap-1" },
  md: { padding: "4px 10px", fontSize: "12px", iconSize: "w-3.5 h-3.5", gap: "gap-1.5" },
  lg: { padding: "6px 12px", fontSize: "13px", iconSize: "w-4 h-4", gap: "gap-2" },
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const s = sizeStyles[size]
  const { Icon } = config

  return (
    <span
      className={cn("inline-flex items-center rounded-full font-medium", s.gap, className)}
      style={{
        padding: s.padding,
        fontSize: s.fontSize,
        color: config.color,
        backgroundColor: config.bg,
        fontFamily: "var(--ao-font-body)",
      }}
      aria-label={`Status: ${config.label}`}
    >
      <Icon className={s.iconSize} aria-hidden="true" />
      {config.label}
    </span>
  )
}
