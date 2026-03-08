import { describe, it, expect, vi, afterEach } from "vitest"
import {
  formatTemp,
  formatCurrency,
  formatNumber,
  formatWeight,
  formatDistance,
  formatEta,
  formatTimestamp,
  formatDate,
  formatDatetime,
  formatPercent,
  formatCO2,
  formatShipmentId,
} from "../format"

describe("formatTemp", () => {
  it("formats positive temperatures with 1 decimal", () => {
    expect(formatTemp(4.2)).toBe("4.2°C")
  })

  it("formats negative temperatures", () => {
    expect(formatTemp(-18.7)).toBe("-18.7°C")
    expect(formatTemp(-68.1)).toBe("-68.1°C")
  })

  it("formats zero", () => {
    expect(formatTemp(0)).toBe("0.0°C")
  })

  it("rounds to 1 decimal place", () => {
    expect(formatTemp(4.256)).toBe("4.3°C")
    expect(formatTemp(4.249)).toBe("4.2°C")
  })

  it("adds decimal to integers", () => {
    expect(formatTemp(5)).toBe("5.0°C")
  })
})

describe("formatCurrency", () => {
  it("formats USD with no decimals", () => {
    expect(formatCurrency(1234)).toBe("$1,234")
  })

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0")
  })

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1234567)).toBe("$1,234,567")
  })
})

describe("formatNumber", () => {
  it("formats integer by default", () => {
    expect(formatNumber(1234)).toBe("1,234")
  })

  it("respects decimal places parameter", () => {
    expect(formatNumber(1234.567, 2)).toBe("1,234.57")
  })

  it("formats zero", () => {
    expect(formatNumber(0)).toBe("0")
  })
})

describe("formatWeight", () => {
  it("returns kg for values under 1000", () => {
    expect(formatWeight(500)).toBe("500kg")
  })

  it("converts to tonnes for 1000+", () => {
    expect(formatWeight(1000)).toBe("1.0t")
    expect(formatWeight(1500)).toBe("1.5t")
    expect(formatWeight(12340)).toBe("12.3t")
  })
})

describe("formatDistance", () => {
  it("returns km for values under 1000", () => {
    expect(formatDistance(500)).toBe("500 km")
  })

  it("converts to thousands for 1000+", () => {
    expect(formatDistance(1000)).toBe("1.0k km")
    expect(formatDistance(5280)).toBe("5.3k km")
  })
})

describe("formatEta", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns 'Overdue' for past dates", () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatEta(past)).toBe("Overdue")
  })

  it("returns minutes for < 1 hour", () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const result = formatEta(soon)
    expect(result).toMatch(/^\d+m$/)
  })

  it("returns hours for < 48 hours", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const result = formatEta(tomorrow)
    expect(result).toMatch(/^\d+h$/)
  })

  it("returns days for 48+ hours", () => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatEta(nextWeek)
    expect(result).toMatch(/^\d+d/)
  })
})

describe("formatTimestamp", () => {
  it("returns relative time for recent events", () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const result = formatTimestamp(recent)
    expect(result).toContain("ago")
  })

  it("returns absolute format for old events", () => {
    const old = new Date("2025-01-15T14:32:00Z").toISOString()
    const result = formatTimestamp(old)
    expect(result).toMatch(/Jan \d{1,2}, 2025 at \d{2}:\d{2}/)
  })
})

describe("formatDate", () => {
  it("formats ISO date to readable format", () => {
    expect(formatDate("2026-03-08T00:00:00Z")).toMatch(/Mar \d{1,2}, 2026/)
  })
})

describe("formatDatetime", () => {
  it("formats ISO datetime with time", () => {
    const result = formatDatetime("2026-03-08T14:30:00Z")
    expect(result).toMatch(/Mar \d{1,2}, 2026 \d{2}:\d{2}/)
  })
})

describe("formatPercent", () => {
  it("formats with no decimals by default", () => {
    expect(formatPercent(95)).toBe("95%")
  })

  it("respects decimal parameter", () => {
    expect(formatPercent(95.67, 1)).toBe("95.7%")
  })
})

describe("formatCO2", () => {
  it("returns kg for values under 1000", () => {
    expect(formatCO2(500)).toBe("500kg CO₂")
  })

  it("converts to tonnes for 1000+", () => {
    expect(formatCO2(1500)).toBe("1.50t CO₂")
    expect(formatCO2(1000)).toBe("1.00t CO₂")
  })
})

describe("formatShipmentId", () => {
  it("uppercases shipment IDs", () => {
    expect(formatShipmentId("sh-2847")).toBe("SH-2847")
    expect(formatShipmentId("SH-1234")).toBe("SH-1234")
  })
})
