export function createGPSSimulator(
  routeCoordinates: Array<[number, number]>,
  speedMultiplier = 1
): () => [number, number] {
  if (routeCoordinates.length < 2) return () => routeCoordinates[0] ?? [0, 0]

  const totalSegments = routeCoordinates.length - 1
  let progress = 0 // 0 to 1 across the whole route

  return function getNextPosition(): [number, number] {
    // Advance by a small step each call
    progress = Math.min(1, progress + 0.002 * speedMultiplier)

    // Map progress to segment + local progress
    const segmentIndex = Math.min(Math.floor(progress * totalSegments), totalSegments - 1)
    const segmentProgress = (progress * totalSegments) - segmentIndex

    const from = routeCoordinates[segmentIndex]
    const to = routeCoordinates[segmentIndex + 1]

    if (!from || !to) return routeCoordinates[routeCoordinates.length - 1] ?? [0, 0]

    const lng = from[0] + (to[0] - from[0]) * segmentProgress
    const lat = from[1] + (to[1] - from[1]) * segmentProgress

    // Add tiny GPS jitter (realistic noise)
    const jitter = 0.001
    return [
      parseFloat((lng + (Math.random() - 0.5) * jitter).toFixed(4)),
      parseFloat((lat + (Math.random() - 0.5) * jitter).toFixed(4)),
    ]
  }
}

export function interpolateRoute(
  from: [number, number],
  to: [number, number],
  steps = 100
): Array<[number, number]> {
  const coords: Array<[number, number]> = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    coords.push([
      parseFloat((from[0] + (to[0] - from[0]) * t).toFixed(4)),
      parseFloat((from[1] + (to[1] - from[1]) * t).toFixed(4)),
    ])
  }
  return coords
}
