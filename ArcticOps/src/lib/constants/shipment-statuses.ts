import type { ShipmentStatus } from "@/lib/types/shipment"

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
}

export const SHIPMENT_STATUSES: Record<ShipmentStatus, StatusConfig> = {
  requested: {
    label: "Requested",
    color: "#64748B",
    bgColor: "rgba(100,116,139,0.10)",
    borderColor: "#64748B",
    icon: "Circle",
  },
  preparing: {
    label: "Preparing",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.10)",
    borderColor: "#3B82F6",
    icon: "Package",
  },
  in_transit: {
    label: "In Transit",
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.10)",
    borderColor: "#3B82F6",
    icon: "Truck",
  },
  at_customs: {
    label: "At Customs",
    color: "#FFA502",
    bgColor: "rgba(255,165,2,0.10)",
    borderColor: "#FFA502",
    icon: "Clock",
  },
  delivered: {
    label: "Delivered",
    color: "#2ED573",
    bgColor: "rgba(46,213,115,0.10)",
    borderColor: "#2ED573",
    icon: "PackageCheck",
  },
  cancelled: {
    label: "Cancelled",
    color: "#FF4757",
    bgColor: "rgba(255,71,87,0.10)",
    borderColor: "#FF4757",
    icon: "XCircle",
  },
}
