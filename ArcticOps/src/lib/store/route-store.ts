"use client"
import { create } from "zustand"
import type { RouteOption, RouteComparison, Scenario } from "@/lib/types/route"
import { MOCK_ROUTES } from "@/lib/mock-data/routes"

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
  routeOptions: MOCK_ROUTES,
  selectedRouteId: null,
  currentComparison: null,
  scenario: DEFAULT_SCENARIO,
  isGenerating: false,

  generateRoutes: (origin, destination) => {
    set({ isGenerating: true })
    setTimeout(() => {
      const routes = applyScenarioModifiers(MOCK_ROUTES, get().scenario)
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
    }, 1500)
  },

  selectRoute: (id) => set({ selectedRouteId: id }),

  updateScenario: (updates) => {
    const newScenario = { ...get().scenario, ...updates }
    const routes = applyScenarioModifiers(MOCK_ROUTES, newScenario)
    set({ scenario: newScenario, routeOptions: routes })
  },

  resetScenario: () => {
    set({ scenario: DEFAULT_SCENARIO, routeOptions: MOCK_ROUTES })
  },
}))
