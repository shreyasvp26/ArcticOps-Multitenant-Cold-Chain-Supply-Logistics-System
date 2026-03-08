import { describe, it, expect, beforeEach } from "vitest"
import { useUIStore } from "../ui-store"

function resetStore() {
  useUIStore.setState({
    sidebarOpen: true,
    commandPaletteOpen: false,
    stressScore: 0,
    stressLevel: "serene",
    theme: "dark",
  })
}

describe("ui-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state", () => {
    it("sidebar starts open", () => {
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it("command palette starts closed", () => {
      expect(useUIStore.getState().commandPaletteOpen).toBe(false)
    })

    it("stress level starts serene", () => {
      expect(useUIStore.getState().stressLevel).toBe("serene")
      expect(useUIStore.getState().stressScore).toBe(0)
    })

    it("theme is always dark", () => {
      expect(useUIStore.getState().theme).toBe("dark")
    })
  })

  describe("sidebar", () => {
    it("toggles sidebar", () => {
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(false)
      useUIStore.getState().toggleSidebar()
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })

    it("sets sidebar state directly", () => {
      useUIStore.getState().setSidebarOpen(false)
      expect(useUIStore.getState().sidebarOpen).toBe(false)
      useUIStore.getState().setSidebarOpen(true)
      expect(useUIStore.getState().sidebarOpen).toBe(true)
    })
  })

  describe("command palette", () => {
    it("toggles command palette", () => {
      useUIStore.getState().toggleCommandPalette()
      expect(useUIStore.getState().commandPaletteOpen).toBe(true)
      useUIStore.getState().toggleCommandPalette()
      expect(useUIStore.getState().commandPaletteOpen).toBe(false)
    })

    it("sets command palette state directly", () => {
      useUIStore.getState().setCommandPaletteOpen(true)
      expect(useUIStore.getState().commandPaletteOpen).toBe(true)
    })
  })

  describe("stress level", () => {
    it("updates to serene for zero issues", () => {
      useUIStore.getState().updateStressLevel({
        tempExcursions: 0,
        delayedShipments: 0,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
      expect(useUIStore.getState().stressLevel).toBe("serene")
      expect(useUIStore.getState().stressScore).toBe(0)
    })

    it("updates to attentive for moderate issues", () => {
      useUIStore.getState().updateStressLevel({
        tempExcursions: 1,
        delayedShipments: 0,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
      expect(useUIStore.getState().stressLevel).toBe("attentive")
      expect(useUIStore.getState().stressScore).toBe(30)
    })

    it("updates to urgent for multiple issues", () => {
      useUIStore.getState().updateStressLevel({
        tempExcursions: 1,
        delayedShipments: 1,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
      expect(useUIStore.getState().stressLevel).toBe("urgent")
      expect(useUIStore.getState().stressScore).toBe(55)
    })

    it("updates to emergency for severe issues", () => {
      useUIStore.getState().updateStressLevel({
        tempExcursions: 2,
        delayedShipments: 1,
        criticalAlerts: 1,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
      expect(useUIStore.getState().stressLevel).toBe("emergency")
      expect(useUIStore.getState().stressScore).toBe(100) // capped
    })
  })
})
