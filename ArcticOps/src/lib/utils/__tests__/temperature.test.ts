import { describe, it, expect } from "vitest"
import {
  classifyTempZone,
  isTempInRange,
  isTempApproachingLimit,
  isTempExcursion,
  getTempStatusColor,
  getTempStatusLabel,
  getTempZoneColor,
  getTempZoneLabel,
} from "../temperature"

describe("classifyTempZone", () => {
  it("classifies ultra-cold at boundary (-60°C)", () => {
    expect(classifyTempZone(-60)).toBe("ultra_cold")
  })

  it("classifies ultra-cold for deep cryo temperatures", () => {
    expect(classifyTempZone(-80)).toBe("ultra_cold")
    expect(classifyTempZone(-70)).toBe("ultra_cold")
    expect(classifyTempZone(-200)).toBe("ultra_cold")
  })

  it("classifies frozen at boundary (-15°C)", () => {
    expect(classifyTempZone(-15)).toBe("frozen")
  })

  it("classifies frozen range correctly", () => {
    expect(classifyTempZone(-25)).toBe("frozen")
    expect(classifyTempZone(-20)).toBe("frozen")
    expect(classifyTempZone(-16)).toBe("frozen")
  })

  it("classifies frozen just above ultra-cold boundary", () => {
    expect(classifyTempZone(-59)).toBe("frozen")
    expect(classifyTempZone(-59.9)).toBe("frozen")
  })

  it("classifies refrigerated at boundary (8°C)", () => {
    expect(classifyTempZone(8)).toBe("refrigerated")
  })

  it("classifies refrigerated range correctly", () => {
    expect(classifyTempZone(2)).toBe("refrigerated")
    expect(classifyTempZone(5)).toBe("refrigerated")
    expect(classifyTempZone(0)).toBe("refrigerated")
    expect(classifyTempZone(-14)).toBe("refrigerated")
  })

  it("classifies ambient range", () => {
    expect(classifyTempZone(9)).toBe("ambient")
    expect(classifyTempZone(20)).toBe("ambient")
    expect(classifyTempZone(25)).toBe("ambient")
  })

  it("classifies hot above 25°C", () => {
    expect(classifyTempZone(26)).toBe("hot")
    expect(classifyTempZone(40)).toBe("hot")
    expect(classifyTempZone(100)).toBe("hot")
  })

  it("handles zero correctly", () => {
    expect(classifyTempZone(0)).toBe("refrigerated")
  })

  it("handles negative zero", () => {
    expect(classifyTempZone(-0)).toBe("refrigerated")
  })
})

describe("isTempInRange", () => {
  it("returns true when temp is within range", () => {
    expect(isTempInRange(5, 2, 8)).toBe(true)
  })

  it("returns true at lower boundary", () => {
    expect(isTempInRange(2, 2, 8)).toBe(true)
  })

  it("returns true at upper boundary", () => {
    expect(isTempInRange(8, 2, 8)).toBe(true)
  })

  it("returns false when below range", () => {
    expect(isTempInRange(1, 2, 8)).toBe(false)
  })

  it("returns false when above range", () => {
    expect(isTempInRange(9, 2, 8)).toBe(false)
  })

  it("works with negative ranges (frozen)", () => {
    expect(isTempInRange(-20, -25, -15)).toBe(true)
    expect(isTempInRange(-26, -25, -15)).toBe(false)
    expect(isTempInRange(-14, -25, -15)).toBe(false)
  })

  it("works with ultra-cold ranges", () => {
    expect(isTempInRange(-70, -80, -60)).toBe(true)
    expect(isTempInRange(-81, -80, -60)).toBe(false)
  })
})

describe("isTempApproachingLimit", () => {
  const min = 2
  const max = 8

  it("detects approaching lower limit", () => {
    expect(isTempApproachingLimit(1, min, max)).toBe(true)
    expect(isTempApproachingLimit(0, min, max)).toBe(true)
  })

  it("detects approaching upper limit", () => {
    expect(isTempApproachingLimit(9, min, max)).toBe(true)
    expect(isTempApproachingLimit(10, min, max)).toBe(true)
  })

  it("returns false when well within range", () => {
    expect(isTempApproachingLimit(5, min, max)).toBe(false)
  })

  it("returns false when in range at boundaries", () => {
    expect(isTempApproachingLimit(2, min, max)).toBe(false)
    expect(isTempApproachingLimit(8, min, max)).toBe(false)
  })

  it("returns false when far outside range (excursion territory)", () => {
    expect(isTempApproachingLimit(-5, min, max)).toBe(false)
    expect(isTempApproachingLimit(15, min, max)).toBe(false)
  })

  it("respects custom buffer", () => {
    expect(isTempApproachingLimit(-1, min, max, 5)).toBe(true)
    expect(isTempApproachingLimit(-1, min, max, 2)).toBe(false)
  })
})

describe("isTempExcursion", () => {
  it("detects excursion below safe range (with 0.5 buffer)", () => {
    expect(isTempExcursion(1, 2, 8)).toBe(true)
    expect(isTempExcursion(0, 2, 8)).toBe(true)
  })

  it("detects excursion above safe range (with 0.5 buffer)", () => {
    expect(isTempExcursion(9, 2, 8)).toBe(true)
    expect(isTempExcursion(10, 2, 8)).toBe(true)
  })

  it("does not flag within 0.5 buffer as excursion", () => {
    expect(isTempExcursion(1.6, 2, 8)).toBe(false)
    expect(isTempExcursion(8.4, 2, 8)).toBe(false)
  })

  it("does not flag in-range as excursion", () => {
    expect(isTempExcursion(5, 2, 8)).toBe(false)
    expect(isTempExcursion(2, 2, 8)).toBe(false)
    expect(isTempExcursion(8, 2, 8)).toBe(false)
  })

  it("handles frozen zone excursions", () => {
    expect(isTempExcursion(-26, -25, -15)).toBe(true)
    expect(isTempExcursion(-14, -25, -15)).toBe(true)
    expect(isTempExcursion(-20, -25, -15)).toBe(false)
  })
})

describe("getTempStatusColor", () => {
  it("returns green for in-range temperature", () => {
    expect(getTempStatusColor(5, 2, 8)).toBe("#2ED573")
  })

  it("returns amber for approaching limit", () => {
    expect(getTempStatusColor(8.3, 2, 8)).toBe("#F59E0B")
  })

  it("returns red for excursion", () => {
    expect(getTempStatusColor(0, 2, 8)).toBe("#EF4444")
  })
})

describe("getTempStatusLabel", () => {
  it("returns 'In Range' for safe temperature", () => {
    expect(getTempStatusLabel(5, 2, 8)).toBe("In Range")
  })

  it("returns 'Approaching Limit' for near-boundary", () => {
    expect(getTempStatusLabel(8.3, 2, 8)).toBe("Approaching Limit")
  })

  it("returns 'Excursion' for out-of-range", () => {
    expect(getTempStatusLabel(0, 2, 8)).toBe("Excursion")
  })
})

describe("getTempZoneColor", () => {
  it("returns purple for ultra_cold", () => {
    expect(getTempZoneColor("ultra_cold")).toBe("#7C3AED")
  })

  it("returns blue for frozen", () => {
    expect(getTempZoneColor("frozen")).toBe("#3B82F6")
  })

  it("returns cyan for refrigerated", () => {
    expect(getTempZoneColor("refrigerated")).toBe("#06B6D4")
  })
})

describe("getTempZoneLabel", () => {
  it("returns correct label for each zone", () => {
    expect(getTempZoneLabel("ultra_cold")).toBe("Ultra-Cold")
    expect(getTempZoneLabel("frozen")).toBe("Frozen")
    expect(getTempZoneLabel("refrigerated")).toBe("Refrigerated")
  })
})
