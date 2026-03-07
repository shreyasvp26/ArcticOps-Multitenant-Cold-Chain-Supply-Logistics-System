export const MAPBOX_STYLE = "mapbox://styles/mapbox/dark-v11"

export const MAPBOX_FALLBACK_ENABLED = !process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export const DEFAULT_VIEWPORT = {
  longitude: 20,
  latitude: 30,
  zoom: 2,
  pitch: 0,
  bearing: 0,
}

export const MARKER_CONFIG = {
  shipmentActive: { radius: 12, pulseColor: "#00D4AA" },
  shipmentCritical: { radius: 12, pulseColor: "#FF4757" },
  checkpoint: { radius: 8 },
  origin: { radius: 16, shape: "circle" },
  destination: { radius: 16, shape: "diamond" },
  coldStorage: { icon: "snowflake", color: "#F1F5F9" },
}

export const ROUTE_LINE_CONFIG = {
  active: { width: 3, color: "#00D4AA", glowColor: "rgba(0,212,170,0.4)", glowWidth: 8 },
  completed: { width: 2, color: "#2ED573" },
  alternate: { width: 2, color: "#64748B", dashArray: [4, 4] },
}
