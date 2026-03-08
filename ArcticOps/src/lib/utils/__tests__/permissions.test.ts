import { describe, it, expect } from "vitest"
import {
  isOpsRole,
  isClientRole,
  isDriverRole,
  canWrite,
  canAccessCompliance,
  canManageTenants,
  canApproveOrders,
  canPlaceOrders,
  canViewAllTenants,
  getDashboardPath,
} from "../permissions"
import type { Role } from "@/lib/types/auth"

const ALL_ROLES: Role[] = [
  "super_admin",
  "ops_manager",
  "compliance_officer",
  "client_admin",
  "client_viewer",
  "driver",
]

describe("isOpsRole", () => {
  it("returns true for ops roles", () => {
    expect(isOpsRole("super_admin")).toBe(true)
    expect(isOpsRole("ops_manager")).toBe(true)
    expect(isOpsRole("compliance_officer")).toBe(true)
  })

  it("returns false for non-ops roles", () => {
    expect(isOpsRole("client_admin")).toBe(false)
    expect(isOpsRole("client_viewer")).toBe(false)
    expect(isOpsRole("driver")).toBe(false)
  })
})

describe("isClientRole", () => {
  it("returns true for client roles", () => {
    expect(isClientRole("client_admin")).toBe(true)
    expect(isClientRole("client_viewer")).toBe(true)
  })

  it("returns false for non-client roles", () => {
    expect(isClientRole("super_admin")).toBe(false)
    expect(isClientRole("ops_manager")).toBe(false)
    expect(isClientRole("driver")).toBe(false)
  })
})

describe("isDriverRole", () => {
  it("returns true for driver role", () => {
    expect(isDriverRole("driver")).toBe(true)
  })

  it("returns false for non-driver roles", () => {
    expect(isDriverRole("super_admin")).toBe(false)
    expect(isDriverRole("client_admin")).toBe(false)
  })
})

describe("canWrite", () => {
  it("allows write for all roles except client_viewer", () => {
    ALL_ROLES.forEach((role) => {
      if (role === "client_viewer") {
        expect(canWrite(role)).toBe(false)
      } else {
        expect(canWrite(role)).toBe(true)
      }
    })
  })
})

describe("canAccessCompliance", () => {
  it("allows super_admin, ops_manager, compliance_officer", () => {
    expect(canAccessCompliance("super_admin")).toBe(true)
    expect(canAccessCompliance("ops_manager")).toBe(true)
    expect(canAccessCompliance("compliance_officer")).toBe(true)
  })

  it("denies client and driver roles", () => {
    expect(canAccessCompliance("client_admin")).toBe(false)
    expect(canAccessCompliance("client_viewer")).toBe(false)
    expect(canAccessCompliance("driver")).toBe(false)
  })
})

describe("canManageTenants", () => {
  it("allows only super_admin", () => {
    expect(canManageTenants("super_admin")).toBe(true)
  })

  it("denies all other roles", () => {
    expect(canManageTenants("ops_manager")).toBe(false)
    expect(canManageTenants("compliance_officer")).toBe(false)
    expect(canManageTenants("client_admin")).toBe(false)
    expect(canManageTenants("client_viewer")).toBe(false)
    expect(canManageTenants("driver")).toBe(false)
  })
})

describe("canApproveOrders", () => {
  it("allows super_admin and ops_manager", () => {
    expect(canApproveOrders("super_admin")).toBe(true)
    expect(canApproveOrders("ops_manager")).toBe(true)
  })

  it("denies compliance officer and below", () => {
    expect(canApproveOrders("compliance_officer")).toBe(false)
    expect(canApproveOrders("client_admin")).toBe(false)
    expect(canApproveOrders("driver")).toBe(false)
  })
})

describe("canPlaceOrders", () => {
  it("allows only client_admin", () => {
    expect(canPlaceOrders("client_admin")).toBe(true)
  })

  it("denies client_viewer (read-only) and others", () => {
    expect(canPlaceOrders("client_viewer")).toBe(false)
    expect(canPlaceOrders("super_admin")).toBe(false)
    expect(canPlaceOrders("driver")).toBe(false)
  })
})

describe("canViewAllTenants", () => {
  it("allows all ops roles", () => {
    expect(canViewAllTenants("super_admin")).toBe(true)
    expect(canViewAllTenants("ops_manager")).toBe(true)
    expect(canViewAllTenants("compliance_officer")).toBe(true)
  })

  it("denies client and driver roles", () => {
    expect(canViewAllTenants("client_admin")).toBe(false)
    expect(canViewAllTenants("client_viewer")).toBe(false)
    expect(canViewAllTenants("driver")).toBe(false)
  })
})

describe("getDashboardPath", () => {
  it("routes ops roles to /dashboard", () => {
    expect(getDashboardPath("super_admin")).toBe("/dashboard")
    expect(getDashboardPath("ops_manager")).toBe("/dashboard")
    expect(getDashboardPath("compliance_officer")).toBe("/dashboard")
  })

  it("routes client roles to /home", () => {
    expect(getDashboardPath("client_admin")).toBe("/home")
    expect(getDashboardPath("client_viewer")).toBe("/home")
  })

  it("routes driver to /assignment", () => {
    expect(getDashboardPath("driver")).toBe("/assignment")
  })
})
