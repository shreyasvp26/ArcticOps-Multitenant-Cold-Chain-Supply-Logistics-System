import { describe, it, expect } from "vitest"
import {
  calculateRiskScore,
  calculateStressLevel,
  getStressLevel,
  getRiskColor,
  getRiskLabel,
} from "../risk"

describe("calculateRiskScore", () => {
  it("returns 0 for a perfectly clean shipment", () => {
    expect(
      calculateRiskScore({
        tempExcursions: 0,
        delayedLegs: 0,
        criticalAlerts: 0,
        overdueDocuments: 0,
        carrierReliability: 100,
      })
    ).toBe(0)
  })

  it("caps at 100 for catastrophic inputs", () => {
    expect(
      calculateRiskScore({
        tempExcursions: 50,
        delayedLegs: 50,
        criticalAlerts: 50,
        overdueDocuments: 50,
        carrierReliability: 0,
      })
    ).toBe(100)
  })

  it("weights temperature excursions correctly (20 pts each, max 40)", () => {
    const scoreWith1 = calculateRiskScore({
      tempExcursions: 1,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    const scoreWith2 = calculateRiskScore({
      tempExcursions: 2,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    const scoreWith5 = calculateRiskScore({
      tempExcursions: 5,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    expect(scoreWith1).toBe(20)
    expect(scoreWith2).toBe(40)
    expect(scoreWith5).toBe(40) // capped
  })

  it("weights delayed legs correctly (15 pts each, max 30)", () => {
    const score = calculateRiskScore({
      tempExcursions: 0,
      delayedLegs: 2,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    expect(score).toBe(30)
  })

  it("weights critical alerts correctly (10 pts each, max 20)", () => {
    const score = calculateRiskScore({
      tempExcursions: 0,
      delayedLegs: 0,
      criticalAlerts: 3,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    expect(score).toBe(20) // capped at 20
  })

  it("weights overdue documents correctly (5 pts each, max 10)", () => {
    const score = calculateRiskScore({
      tempExcursions: 0,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 3,
      carrierReliability: 100,
    })
    expect(score).toBe(10) // capped at 10
  })

  it("factors carrier reliability inversely", () => {
    const lowReliability = calculateRiskScore({
      tempExcursions: 0,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 50,
    })
    const highReliability = calculateRiskScore({
      tempExcursions: 0,
      delayedLegs: 0,
      criticalAlerts: 0,
      overdueDocuments: 0,
      carrierReliability: 100,
    })
    expect(lowReliability).toBeGreaterThan(highReliability)
    expect(lowReliability).toBe(5) // (100-50)/10 = 5
    expect(highReliability).toBe(0)
  })

  it("produces a combined realistic score", () => {
    const score = calculateRiskScore({
      tempExcursions: 1,
      delayedLegs: 1,
      criticalAlerts: 1,
      overdueDocuments: 1,
      carrierReliability: 80,
    })
    // 20 + 15 + 10 + 5 + 2 = 52
    expect(score).toBe(52)
  })
})

describe("calculateStressLevel", () => {
  it("returns 0 for all-clear state", () => {
    expect(
      calculateStressLevel({
        tempExcursions: 0,
        delayedShipments: 0,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
    ).toBe(0)
  })

  it("caps at 100", () => {
    expect(
      calculateStressLevel({
        tempExcursions: 10,
        delayedShipments: 10,
        criticalAlerts: 10,
        overdueDocuments: 10,
        capacityIssues: 10,
      })
    ).toBe(100)
  })

  it("applies correct weight to temp excursions (30x)", () => {
    expect(
      calculateStressLevel({
        tempExcursions: 1,
        delayedShipments: 0,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
    ).toBe(30)
  })

  it("applies correct weight to delayed shipments (25x)", () => {
    expect(
      calculateStressLevel({
        tempExcursions: 0,
        delayedShipments: 1,
        criticalAlerts: 0,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
    ).toBe(25)
  })

  it("applies correct weight to critical alerts (25x)", () => {
    expect(
      calculateStressLevel({
        tempExcursions: 0,
        delayedShipments: 0,
        criticalAlerts: 1,
        overdueDocuments: 0,
        capacityIssues: 0,
      })
    ).toBe(25)
  })
})

describe("getStressLevel", () => {
  it("returns 'serene' for 0-20", () => {
    expect(getStressLevel(0)).toBe("serene")
    expect(getStressLevel(10)).toBe("serene")
    expect(getStressLevel(20)).toBe("serene")
  })

  it("returns 'attentive' for 21-50", () => {
    expect(getStressLevel(21)).toBe("attentive")
    expect(getStressLevel(35)).toBe("attentive")
    expect(getStressLevel(50)).toBe("attentive")
  })

  it("returns 'urgent' for 51-80", () => {
    expect(getStressLevel(51)).toBe("urgent")
    expect(getStressLevel(65)).toBe("urgent")
    expect(getStressLevel(80)).toBe("urgent")
  })

  it("returns 'emergency' for 81-100", () => {
    expect(getStressLevel(81)).toBe("emergency")
    expect(getStressLevel(90)).toBe("emergency")
    expect(getStressLevel(100)).toBe("emergency")
  })

  it("handles exact boundary values", () => {
    expect(getStressLevel(20)).toBe("serene")
    expect(getStressLevel(21)).toBe("attentive")
    expect(getStressLevel(50)).toBe("attentive")
    expect(getStressLevel(51)).toBe("urgent")
    expect(getStressLevel(80)).toBe("urgent")
    expect(getStressLevel(81)).toBe("emergency")
  })
})

describe("getRiskColor", () => {
  it("returns green for low risk (0-25)", () => {
    expect(getRiskColor(0)).toBe("#2ED573")
    expect(getRiskColor(25)).toBe("#2ED573")
  })

  it("returns amber for medium risk (26-50)", () => {
    expect(getRiskColor(26)).toBe("#FFA502")
    expect(getRiskColor(50)).toBe("#FFA502")
  })

  it("returns orange for high risk (51-75)", () => {
    expect(getRiskColor(51)).toBe("#FF6B35")
    expect(getRiskColor(75)).toBe("#FF6B35")
  })

  it("returns red for critical risk (76-100)", () => {
    expect(getRiskColor(76)).toBe("#FF4757")
    expect(getRiskColor(100)).toBe("#FF4757")
  })
})

describe("getRiskLabel", () => {
  it("returns correct labels for each range", () => {
    expect(getRiskLabel(10)).toBe("Low Risk")
    expect(getRiskLabel(35)).toBe("Medium Risk")
    expect(getRiskLabel(60)).toBe("High Risk")
    expect(getRiskLabel(90)).toBe("Critical Risk")
  })

  it("handles boundary values", () => {
    expect(getRiskLabel(25)).toBe("Low Risk")
    expect(getRiskLabel(26)).toBe("Medium Risk")
    expect(getRiskLabel(50)).toBe("Medium Risk")
    expect(getRiskLabel(51)).toBe("High Risk")
    expect(getRiskLabel(75)).toBe("High Risk")
    expect(getRiskLabel(76)).toBe("Critical Risk")
  })
})
