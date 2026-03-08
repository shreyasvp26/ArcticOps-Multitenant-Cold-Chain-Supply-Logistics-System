import { describe, it, expect } from "vitest"
import {
  loginSchema,
  signupActivationSchema,
  orgSetupSchema,
  orderMaterialsSchema,
  orderColdChainSchema,
  orderDeliverySchema,
} from "../validation"

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "demo123" })
    expect(result.success).toBe(true)
  })

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "demo123" })
    expect(result.success).toBe(false)
  })

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({ email: "", password: "demo123" })
    expect(result.success).toBe(false)
  })

  it("rejects short password (< 6 chars)", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "abc" })
    expect(result.success).toBe(false)
  })

  it("accepts exactly 6-char password", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "abcdef" })
    expect(result.success).toBe(true)
  })

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false)
    expect(loginSchema.safeParse({ email: "x@y.com" }).success).toBe(false)
  })
})

describe("signupActivationSchema", () => {
  it("accepts 6-character code", () => {
    const result = signupActivationSchema.safeParse({ code: "ABC123" })
    expect(result.success).toBe(true)
  })

  it("rejects shorter code", () => {
    const result = signupActivationSchema.safeParse({ code: "AB12" })
    expect(result.success).toBe(false)
  })

  it("rejects longer code", () => {
    const result = signupActivationSchema.safeParse({ code: "ABCDEFG" })
    expect(result.success).toBe(false)
  })

  it("rejects empty code", () => {
    const result = signupActivationSchema.safeParse({ code: "" })
    expect(result.success).toBe(false)
  })
})

describe("orgSetupSchema", () => {
  const validSetup = {
    companyName: "PharmaAlpha Inc.",
    primaryContact: "Dr. Sarah Chen",
    contactEmail: "sarah@pharmaalpha.com",
    complianceFrameworks: ["GDP"],
  }

  it("accepts valid setup", () => {
    expect(orgSetupSchema.safeParse(validSetup).success).toBe(true)
  })

  it("rejects empty company name", () => {
    expect(orgSetupSchema.safeParse({ ...validSetup, companyName: "" }).success).toBe(false)
  })

  it("rejects single char company name", () => {
    expect(orgSetupSchema.safeParse({ ...validSetup, companyName: "A" }).success).toBe(false)
  })

  it("rejects invalid email", () => {
    expect(orgSetupSchema.safeParse({ ...validSetup, contactEmail: "not-email" }).success).toBe(false)
  })

  it("rejects empty compliance frameworks", () => {
    expect(orgSetupSchema.safeParse({ ...validSetup, complianceFrameworks: [] }).success).toBe(false)
  })

  it("accepts multiple compliance frameworks", () => {
    expect(
      orgSetupSchema.safeParse({ ...validSetup, complianceFrameworks: ["GDP", "GMP", "WHO PQS"] }).success
    ).toBe(true)
  })

  it("allows optional team invites", () => {
    expect(orgSetupSchema.safeParse({ ...validSetup, teamInvites: undefined }).success).toBe(true)
    expect(orgSetupSchema.safeParse(validSetup).success).toBe(true)
  })

  it("validates team invite structure", () => {
    const withInvites = {
      ...validSetup,
      teamInvites: [{ email: "user@test.com", role: "client_admin" }],
    }
    expect(orgSetupSchema.safeParse(withInvites).success).toBe(true)
  })

  it("rejects invalid role in team invites", () => {
    const withBadRole = {
      ...validSetup,
      teamInvites: [{ email: "user@test.com", role: "super_admin" }],
    }
    expect(orgSetupSchema.safeParse(withBadRole).success).toBe(false)
  })
})

describe("orderMaterialsSchema", () => {
  it("accepts valid materials selection", () => {
    const result = orderMaterialsSchema.safeParse({
      items: [{ materialId: "mat_001", quantity: 500 }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty items array", () => {
    expect(orderMaterialsSchema.safeParse({ items: [] }).success).toBe(false)
  })

  it("rejects zero quantity", () => {
    expect(
      orderMaterialsSchema.safeParse({ items: [{ materialId: "mat_001", quantity: 0 }] }).success
    ).toBe(false)
  })

  it("rejects negative quantity", () => {
    expect(
      orderMaterialsSchema.safeParse({ items: [{ materialId: "mat_001", quantity: -5 }] }).success
    ).toBe(false)
  })

  it("accepts multiple materials", () => {
    const result = orderMaterialsSchema.safeParse({
      items: [
        { materialId: "mat_001", quantity: 100 },
        { materialId: "mat_002", quantity: 50 },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe("orderColdChainSchema", () => {
  it("accepts valid cold chain config", () => {
    expect(
      orderColdChainSchema.safeParse({ temperatureZone: "refrigerated", durationToleranceHours: 2 }).success
    ).toBe(true)
  })

  it("accepts all valid zones", () => {
    expect(orderColdChainSchema.safeParse({ temperatureZone: "ultra_cold", durationToleranceHours: 1 }).success).toBe(true)
    expect(orderColdChainSchema.safeParse({ temperatureZone: "frozen", durationToleranceHours: 1 }).success).toBe(true)
    expect(orderColdChainSchema.safeParse({ temperatureZone: "refrigerated", durationToleranceHours: 1 }).success).toBe(true)
  })

  it("rejects invalid zone", () => {
    expect(
      orderColdChainSchema.safeParse({ temperatureZone: "room_temp", durationToleranceHours: 1 }).success
    ).toBe(false)
  })

  it("rejects zero duration tolerance", () => {
    expect(
      orderColdChainSchema.safeParse({ temperatureZone: "refrigerated", durationToleranceHours: 0 }).success
    ).toBe(false)
  })
})

describe("orderDeliverySchema", () => {
  const validDelivery = {
    urgency: "standard" as const,
    preferredModes: ["air" as const],
    deliveryWindowStart: "2026-04-01",
    deliveryWindowEnd: "2026-04-15",
    destinationAddress: "123 Main Street, Frankfurt",
  }

  it("accepts valid delivery preferences", () => {
    expect(orderDeliverySchema.safeParse(validDelivery).success).toBe(true)
  })

  it("accepts all urgency levels", () => {
    expect(orderDeliverySchema.safeParse({ ...validDelivery, urgency: "express" }).success).toBe(true)
    expect(orderDeliverySchema.safeParse({ ...validDelivery, urgency: "emergency" }).success).toBe(true)
  })

  it("rejects invalid urgency", () => {
    expect(orderDeliverySchema.safeParse({ ...validDelivery, urgency: "fast" }).success).toBe(false)
  })

  it("rejects empty transport modes", () => {
    expect(orderDeliverySchema.safeParse({ ...validDelivery, preferredModes: [] }).success).toBe(false)
  })

  it("accepts multiple transport modes", () => {
    expect(
      orderDeliverySchema.safeParse({ ...validDelivery, preferredModes: ["air", "sea", "road"] }).success
    ).toBe(true)
  })

  it("rejects short destination address", () => {
    expect(orderDeliverySchema.safeParse({ ...validDelivery, destinationAddress: "123" }).success).toBe(false)
  })
})
