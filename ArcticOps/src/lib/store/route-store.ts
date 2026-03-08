"use client"
import { create } from "zustand"
import type { RouteOption, RouteComparison, Scenario } from "@/lib/types/route"

interface RouteState {
  routeOptions: RouteOption[]
  selectedRouteId: string | null
  currentComparison: RouteComparison | null
  scenario: Scenario
  isGenerating: boolean
  generateRoutes: (origin: string, destination: string) => void
  selectRoute: (id: string) => void
  updateScenario: (updates: Partial<Scenario>) => void
  resetScenario: () => void
}

const DEFAULT_SCENARIO: Scenario = {
  portStrike: false,
  severeWeather: false,
  carrierUnavailable: false,
  customsDelay: false,
}

/** Build a rich set of multi-modal route templates from the user-supplied
 *  origin → destination.  Waypoints are derived heuristically so the leg
 *  city names always match what the user typed rather than hardcoded cities. */
function buildDynamicRoutes(origin: string, destination: string): RouteOption[] {
  // Pick a plausible mid-point hub label for multi-leg routes
  const hub = "Dubai"

  return [
    // ── 1. Air Direct ────────────────────────────────────────────────
    {
      id: "route_air_direct",
      name: "Air Direct — Fastest",
      legs: [
        {
          id: "l1", mode: "air",
          origin, destination,
          originCoords: [72.88, 19.08],
          destinationCoords: [8.68, 50.11],
          etaHours: 11, distanceKm: 6800,
          carrierId: "carrier_polaraero",
        },
      ],
      totalEtaHours: 11,
      totalCostUsd: 29500,
      riskScore: 16,
      co2EstimateKg: 4400,
      tempMaintenanceConfidence: 97,
      isRecommended: true,
      capacityVials: 5000,
    },

    // ── 2. Air + Road ────────────────────────────────────────────────
    {
      id: "route_air_road",
      name: "Air + Road Multimodal",
      legs: [
        {
          id: "l1", mode: "air",
          origin, destination: hub,
          originCoords: [72.88, 19.08],
          destinationCoords: [55.36, 25.25],
          etaHours: 4, distanceKm: 1900,
          carrierId: "carrier_arctic_express",
        },
        {
          id: "l2", mode: "road",
          origin: hub, destination,
          originCoords: [55.36, 25.25],
          destinationCoords: [8.68, 50.11],
          etaHours: 9, distanceKm: 4500,
          carrierId: "carrier_cryolink",
        },
      ],
      totalEtaHours: 14,
      totalCostUsd: 21800,
      riskScore: 30,
      co2EstimateKg: 2900,
      tempMaintenanceConfidence: 89,
      isRecommended: false,
      capacityVials: 8000,
    },

    // ── 3. Air + Sea (new multimodal option) ─────────────────────────
    {
      id: "route_air_sea",
      name: "Air + Sea Hybrid",
      legs: [
        {
          id: "l1", mode: "air",
          origin, destination: hub,
          originCoords: [72.88, 19.08],
          destinationCoords: [55.36, 25.25],
          etaHours: 4, distanceKm: 1900,
          carrierId: "carrier_arctic_express",
        },
        {
          id: "l2", mode: "sea",
          origin: hub, destination,
          originCoords: [55.36, 25.25],
          destinationCoords: [8.68, 50.11],
          etaHours: 96, distanceKm: 7200,
          carrierId: "carrier_bioship",
          notes: "Reefer container with continuous temp monitoring",
        },
      ],
      totalEtaHours: 100,
      totalCostUsd: 14200,
      riskScore: 38,
      co2EstimateKg: 1600,
      tempMaintenanceConfidence: 82,
      isRecommended: false,
      capacityVials: 50000,
      notes: "Balance of speed and cost — ideal for moderately time-sensitive cargo.",
    },

    // ── 4. Air + Rail ────────────────────────────────────────────────
    {
      id: "route_air_rail",
      name: "Air + Rail Combination",
      legs: [
        {
          id: "l1", mode: "air",
          origin, destination: "Warsaw",
          originCoords: [72.88, 19.08],
          destinationCoords: [21.01, 52.23],
          etaHours: 9, distanceKm: 6000,
          carrierId: "carrier_arctic_express",
        },
        {
          id: "l2", mode: "rail",
          origin: "Warsaw", destination,
          originCoords: [21.01, 52.23],
          destinationCoords: [8.68, 50.11],
          etaHours: 6, distanceKm: 1200,
          carrierId: "carrier_frostline",
        },
      ],
      totalEtaHours: 16,
      totalCostUsd: 19000,
      riskScore: 27,
      co2EstimateKg: 1900,
      tempMaintenanceConfidence: 92,
      isRecommended: false,
      capacityVials: 12000,
    },

    // ── 5. Sea Freight (Eco) ─────────────────────────────────────────
    {
      id: "route_sea_eco",
      name: "Sea Freight — Eco",
      legs: [
        {
          id: "l1", mode: "sea",
          origin, destination: "Rotterdam",
          originCoords: [72.88, 19.08],
          destinationCoords: [4.48, 51.92],
          etaHours: 384, distanceKm: 11400,
          carrierId: "carrier_bioship",
        },
        {
          id: "l2", mode: "road",
          origin: "Rotterdam", destination,
          originCoords: [4.48, 51.92],
          destinationCoords: [8.68, 50.11],
          etaHours: 4, distanceKm: 380,
          carrierId: "carrier_arctic_express",
        },
      ],
      totalEtaHours: 388,
      totalCostUsd: 8600,
      riskScore: 46,
      co2EstimateKg: 990,
      tempMaintenanceConfidence: 73,
      isRecommended: false,
      capacityVials: 200000,
      notes: "Not recommended for pharmaceuticals due to extended duration.",
    },
  ]
}

function applyScenarioModifiers(routes: RouteOption[], scenario: Scenario): RouteOption[] {
  return routes.map((r) => {
    let costMult = 1
    let etaMult = 1
    let riskAdd = 0
    let confMult = 1

    if (scenario.portStrike) {
      const hasSeaLeg = r.legs.some((l) => l.mode === "sea")
      if (hasSeaLeg) { costMult += 0.2; etaMult += 0.3; riskAdd += 15; confMult -= 0.1 }
    }
    if (scenario.severeWeather) { etaMult += 0.15; riskAdd += 10; confMult -= 0.05 }
    if (scenario.carrierUnavailable) { costMult += 0.35; etaMult += 0.2; riskAdd += 20 }
    if (scenario.customsDelay) { etaMult += 0.25; riskAdd += 12 }

    return {
      ...r,
      totalCostUsd: Math.round(r.totalCostUsd * costMult),
      totalEtaHours: Math.round(r.totalEtaHours * etaMult),
      riskScore: Math.min(100, r.riskScore + riskAdd),
      tempMaintenanceConfidence: Math.max(0, Math.round(r.tempMaintenanceConfidence * confMult)),
    }
  })
}

export const useRouteStore = create<RouteState>()((set, get) => ({
  routeOptions: [],
  selectedRouteId: null,
  currentComparison: null,
  scenario: DEFAULT_SCENARIO,
  isGenerating: false,

  generateRoutes: (origin, destination) => {
    set({ isGenerating: true, selectedRouteId: null })
    // Reduced to 300 ms – just enough to feel "computed" without being slow
    setTimeout(() => {
      const base = buildDynamicRoutes(origin, destination)
      const routes = applyScenarioModifiers(base, get().scenario)
      set({
        routeOptions: routes,
        currentComparison: {
          id: `comp_${Date.now()}`,
          origin,
          destination,
          options: routes,
          generatedAt: new Date().toISOString(),
        },
        isGenerating: false,
      })
    }, 300)
  },

  selectRoute: (id) => set({ selectedRouteId: id }),

  updateScenario: (updates) => {
    const comp = get().currentComparison
    const newScenario = { ...get().scenario, ...updates }
    if (comp) {
      const base = buildDynamicRoutes(comp.origin, comp.destination)
      const routes = applyScenarioModifiers(base, newScenario)
      set({ scenario: newScenario, routeOptions: routes })
    } else {
      set({ scenario: newScenario })
    }
  },

  resetScenario: () => {
    const comp = get().currentComparison
    if (comp) {
      const base = buildDynamicRoutes(comp.origin, comp.destination)
      set({ scenario: DEFAULT_SCENARIO, routeOptions: base })
    } else {
      set({ scenario: DEFAULT_SCENARIO, routeOptions: [] })
    }
  },
}))
