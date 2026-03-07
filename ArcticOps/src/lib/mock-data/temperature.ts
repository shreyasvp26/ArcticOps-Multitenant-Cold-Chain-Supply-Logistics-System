import type { TempReading, TempZone } from "@/lib/types/temperature"

export function createTemperatureSimulator(
  shipmentId: string,
  zone: TempZone,
  startTemp?: number
): () => TempReading {
  const zoneDefaults: Record<TempZone, { min: number; max: number; target: number }> = {
    ultra_cold: { min: -80, max: -60, target: -70 },
    frozen: { min: -25, max: -15, target: -20 },
    refrigerated: { min: 2, max: 8, target: 5 },
  }

  const config = zoneDefaults[zone]
  let currentTemp = startTemp ?? config.target

  return function getNextReading(): TempReading {
    // Realistic thermal drift: small steps, occasional larger drifts
    const drift = (Math.random() - 0.5) * 0.4
    const meanReversion = (config.target - currentTemp) * 0.05
    currentTemp = currentTemp + drift + meanReversion

    // Occasional excursion event (5% chance)
    const isExcursionEvent = Math.random() < 0.05
    if (isExcursionEvent) {
      const direction = Math.random() < 0.7 ? 1 : -1
      currentTemp += direction * (Math.random() * 2 + 1)
    }

    const isExcursion = currentTemp < config.min || currentTemp > config.max

    return {
      shipmentId,
      timestamp: new Date().toISOString(),
      temperature: parseFloat(currentTemp.toFixed(1)),
      zone,
      isExcursion,
      compartment: "main",
    }
  }
}

export function generateTempHistory(
  shipmentId: string,
  zone: TempZone,
  hoursBack = 24,
  pointsPerHour = 12
): TempReading[] {
  const simulate = createTemperatureSimulator(shipmentId, zone)
  const readings: TempReading[] = []
  const totalPoints = hoursBack * pointsPerHour
  const intervalMs = (hoursBack * 60 * 60 * 1000) / totalPoints
  const startTime = Date.now() - hoursBack * 60 * 60 * 1000

  for (let i = 0; i < totalPoints; i++) {
    const reading = simulate()
    reading.timestamp = new Date(startTime + i * intervalMs).toISOString()
    readings.push(reading)
  }

  return readings
}
