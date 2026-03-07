import type { TransportMode } from "@/lib/types/shipment"

export interface TransportModeConfig {
  label: string
  icon: string
  color: string
  documents: string[]
}

export const TRANSPORT_MODES: Record<TransportMode, TransportModeConfig> = {
  air: {
    label: "Air Freight",
    icon: "Plane",
    color: "#3B82F6",
    documents: ["Air Waybill", "Dangerous Goods Declaration", "Shipper's Letter of Instruction", "IATA Certificate", "Customs Export Declaration"],
  },
  sea: {
    label: "Sea Freight",
    icon: "Ship",
    color: "#06B6D4",
    documents: ["Bill of Lading", "Packing List", "Commercial Invoice", "Certificate of Origin", "IMDG Code Declaration", "Customs Entry"],
  },
  rail: {
    label: "Rail Freight",
    icon: "Train",
    color: "#7C3AED",
    documents: ["Rail Consignment Note", "Dangerous Goods Certificate", "Customs Transit Document", "Temperature Monitoring Certificate"],
  },
  road: {
    label: "Road Freight",
    icon: "Truck",
    color: "#F59E0B",
    documents: ["CMR Consignment Note", "Driver License", "Vehicle Fitness Certificate", "ADR Certificate", "Transport Insurance", "Route Authorization"],
  },
}
