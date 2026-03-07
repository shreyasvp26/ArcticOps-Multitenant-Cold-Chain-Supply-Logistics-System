export type TempZone = "ultra_cold" | "frozen" | "refrigerated"

export interface TempReading {
  shipmentId: string
  timestamp: string
  temperature: number
  zone: TempZone
  isExcursion: boolean
  compartment?: string
}

export interface TempExcursion {
  id: string
  shipmentId: string
  startTime: string
  endTime?: string
  peakTemperature: number
  requiredMin: number
  requiredMax: number
  durationMinutes?: number
  resolved: boolean
}

export interface RefrigerationUnit {
  shipmentId: string
  powerOn: boolean
  compressorPercent: number
  coolantPressureBar: number
  doorOpen: boolean
  lastDoorEvent: string
  ambientTemp: number
  internalTemp: number
  compartments: Array<{
    id: string
    label: string
    materialName: string
    requiredMin: number
    requiredMax: number
    currentTemp: number
    status: "normal" | "approaching" | "excursion"
  }>
}
