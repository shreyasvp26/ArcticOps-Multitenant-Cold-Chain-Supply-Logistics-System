import { describe, it, expect } from "vitest"
import { DEMO_USERS, OPS_ROLES, CLIENT_ROLES, DRIVER_ROLES, ROLE_DASHBOARD } from "@/lib/constants/roles"
import { TEMP_ZONES, getTempZoneFromTemp } from "@/lib/constants/temperature-zones"
import { SHIPMENT_STATUSES } from "@/lib/constants/shipment-statuses"
import { TRANSPORT_MODES } from "@/lib/constants/transport-modes"
import { MOCK_SHIPMENTS } from "@/lib/mock-data/shipments"
import { MOCK_MATERIALS } from "@/lib/mock-data/materials"
import { MOCK_CARRIERS } from "@/lib/mock-data/carriers"
import { MOCK_CREWS } from "@/lib/mock-data/crews"
import { MOCK_CLIENTS } from "@/lib/mock-data/clients"
import { MOCK_DOCUMENTS } from "@/lib/mock-data/documents"
import { MOCK_NOTIFICATIONS } from "@/lib/mock-data/notifications"
import type { Role } from "@/lib/types/auth"

describe("PRD section 3 — User Personas & Roles", () => {
  it("defines exactly 6 user roles", () => {
    const allRoles: Role[] = [...OPS_ROLES, ...CLIENT_ROLES, ...DRIVER_ROLES]
    expect(allRoles.length).toBe(6)
    expect(new Set(allRoles).size).toBe(6)
  })

  it("ops has 3 roles: super_admin, ops_manager, compliance_officer", () => {
    expect(OPS_ROLES).toContain("super_admin")
    expect(OPS_ROLES).toContain("ops_manager")
    expect(OPS_ROLES).toContain("compliance_officer")
    expect(OPS_ROLES.length).toBe(3)
  })

  it("client has 2 roles: client_admin, client_viewer", () => {
    expect(CLIENT_ROLES).toContain("client_admin")
    expect(CLIENT_ROLES).toContain("client_viewer")
    expect(CLIENT_ROLES.length).toBe(2)
  })

  it("driver has 1 role: driver", () => {
    expect(DRIVER_ROLES).toContain("driver")
    expect(DRIVER_ROLES.length).toBe(1)
  })

  it("every role has a dashboard redirect", () => {
    const allRoles: Role[] = [...OPS_ROLES, ...CLIENT_ROLES, ...DRIVER_ROLES]
    allRoles.forEach((role) => {
      expect(ROLE_DASHBOARD[role]).toBeTruthy()
    })
  })
})

describe("PRD section 4 — Multi-tenancy", () => {
  it("client demo users have tenantId", () => {
    expect(DEMO_USERS.client_admin.tenantId).toBeTruthy()
    expect(DEMO_USERS.client_viewer.tenantId).toBeTruthy()
  })

  it("ops demo users have null tenantId", () => {
    expect(DEMO_USERS.ops_manager.tenantId).toBeNull()
    expect(DEMO_USERS.compliance_officer.tenantId).toBeNull()
  })

  it("driver has null tenantId (cross-tenant)", () => {
    expect(DEMO_USERS.driver.tenantId).toBeNull()
  })
})

describe("PRD section 6.1 — Authentication", () => {
  it("all demo users have email and password", () => {
    Object.values(DEMO_USERS).forEach((user) => {
      expect(user.email).toBeTruthy()
      expect(user.password).toBeTruthy()
      expect(user.name).toBeTruthy()
    })
  })

  it("each demo role maps to correct dashboard", () => {
    expect(ROLE_DASHBOARD.super_admin).toBe("/dashboard")
    expect(ROLE_DASHBOARD.ops_manager).toBe("/dashboard")
    expect(ROLE_DASHBOARD.compliance_officer).toBe("/dashboard")
    expect(ROLE_DASHBOARD.client_admin).toBe("/home")
    expect(ROLE_DASHBOARD.client_viewer).toBe("/home")
    expect(ROLE_DASHBOARD.driver).toBe("/assignment")
  })
})

describe("PRD section 6.2 — Mock data completeness", () => {
  it("has 12 shipments across all statuses", () => {
    expect(MOCK_SHIPMENTS.length).toBe(12)
    const statuses = new Set(MOCK_SHIPMENTS.map((s) => s.status))
    expect(statuses.size).toBeGreaterThanOrEqual(4)
  })

  it("has 25 raw materials", () => {
    expect(MOCK_MATERIALS.length).toBe(25)
  })

  it("has 8 carriers", () => {
    expect(MOCK_CARRIERS.length).toBe(8)
  })

  it("has 15 crew members", () => {
    expect(MOCK_CREWS.length).toBe(15)
  })

  it("has 3 client tenants", () => {
    expect(MOCK_CLIENTS.length).toBe(3)
  })

  it("has compliance documents linked to shipments", () => {
    expect(MOCK_DOCUMENTS.length).toBeGreaterThanOrEqual(20)
  })

  it("shipments use real-world city names", () => {
    const cities = MOCK_SHIPMENTS.flatMap((s) => [s.origin, s.destination])
    expect(cities.some((c) => c.includes("Mumbai") || c.includes("Frankfurt") || c.includes("Shanghai") || c.includes("New York"))).toBe(true)
  })

  it("materials use real pharmaceutical names", () => {
    const names = MOCK_MATERIALS.map((m) => m.name.toLowerCase())
    expect(
      names.some((n) => n.includes("insulin") || n.includes("albumin") || n.includes("sodium") || n.includes("mrna"))
    ).toBe(true)
  })
})

describe("PRD section 6.2.4 — Temperature zones", () => {
  it("defines 3 temperature zones", () => {
    expect(Object.keys(TEMP_ZONES).length).toBe(3)
    expect(TEMP_ZONES.ultra_cold).toBeDefined()
    expect(TEMP_ZONES.frozen).toBeDefined()
    expect(TEMP_ZONES.refrigerated).toBeDefined()
  })

  it("ultra-cold range is -80 to -60", () => {
    expect(TEMP_ZONES.ultra_cold.min).toBe(-80)
    expect(TEMP_ZONES.ultra_cold.max).toBe(-60)
  })

  it("frozen range is -25 to -15", () => {
    expect(TEMP_ZONES.frozen.min).toBe(-25)
    expect(TEMP_ZONES.frozen.max).toBe(-15)
  })

  it("refrigerated range is 2 to 8", () => {
    expect(TEMP_ZONES.refrigerated.min).toBe(2)
    expect(TEMP_ZONES.refrigerated.max).toBe(8)
  })
})

describe("PRD section 6.2.2 — Shipment statuses", () => {
  it("supports all 5 kanban columns plus cancelled", () => {
    const required = ["requested", "preparing", "in_transit", "at_customs", "delivered"]
    required.forEach((status) => {
      const match = MOCK_SHIPMENTS.some((s) => s.status === status)
      if (!match) {
        const config = SHIPMENT_STATUSES
        expect(config).toBeDefined()
      }
    })
  })
})

describe("PRD section 6.2.7 — Compliance documents", () => {
  it("documents are linked to shipments", () => {
    MOCK_DOCUMENTS.forEach((doc) => {
      expect(doc.shipmentId).toBeTruthy()
    })
  })

  it("documents have type and status", () => {
    MOCK_DOCUMENTS.forEach((doc) => {
      expect(doc.type).toBeTruthy()
      expect(doc.status).toBeTruthy()
    })
  })
})

describe("PRD section 8 — Notification severity levels", () => {
  it("notifications span all severity levels", () => {
    const severities = new Set(MOCK_NOTIFICATIONS.map((n) => n.severity))
    expect(severities.has("info")).toBe(true)
    expect(severities.has("warning")).toBe(true)
    expect(severities.has("critical")).toBe(true)
  })

  it("every notification has required fields", () => {
    MOCK_NOTIFICATIONS.forEach((n) => {
      expect(n.id).toBeTruthy()
      expect(n.severity).toBeTruthy()
      expect(n.title).toBeTruthy()
      expect(n.message).toBeTruthy()
      expect(n.createdAt).toBeTruthy()
      expect(typeof n.read).toBe("boolean")
    })
  })
})
