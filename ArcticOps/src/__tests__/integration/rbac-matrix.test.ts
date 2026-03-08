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
} from "@/lib/utils/permissions"
import { DEMO_USERS, ROLE_DASHBOARD, OPS_ROLES, CLIENT_ROLES, DRIVER_ROLES } from "@/lib/constants/roles"
import type { Role } from "@/lib/types/auth"

describe("RBAC matrix validation against PRD section 5", () => {
  describe("role classification is exhaustive", () => {
    const ALL_ROLES: Role[] = ["super_admin", "ops_manager", "compliance_officer", "client_admin", "client_viewer", "driver"]

    it("every role belongs to exactly one group", () => {
      ALL_ROLES.forEach((role) => {
        const groups = [isOpsRole(role), isClientRole(role), isDriverRole(role)]
        const trueCount = groups.filter(Boolean).length
        expect(trueCount).toBe(1)
      })
    })

    it("constants match permission functions", () => {
      OPS_ROLES.forEach((r) => expect(isOpsRole(r)).toBe(true))
      CLIENT_ROLES.forEach((r) => expect(isClientRole(r)).toBe(true))
      DRIVER_ROLES.forEach((r) => expect(isDriverRole(r)).toBe(true))
    })
  })

  describe("PRD section 5 — Command Center access", () => {
    it("super_admin has full access", () => {
      expect(isOpsRole("super_admin")).toBe(true)
      expect(canViewAllTenants("super_admin")).toBe(true)
    })

    it("ops_manager has full access", () => {
      expect(isOpsRole("ops_manager")).toBe(true)
      expect(canViewAllTenants("ops_manager")).toBe(true)
    })

    it("compliance_officer has read access", () => {
      expect(isOpsRole("compliance_officer")).toBe(true)
      expect(canAccessCompliance("compliance_officer")).toBe(true)
    })

    it("client roles cannot access command center", () => {
      expect(isOpsRole("client_admin")).toBe(false)
      expect(isOpsRole("client_viewer")).toBe(false)
    })

    it("driver cannot access command center", () => {
      expect(isOpsRole("driver")).toBe(false)
    })
  })

  describe("PRD section 5 — Procurement permissions", () => {
    it("ops roles can approve/reject procurement", () => {
      expect(canApproveOrders("super_admin")).toBe(true)
      expect(canApproveOrders("ops_manager")).toBe(true)
    })

    it("compliance_officer cannot approve procurement", () => {
      expect(canApproveOrders("compliance_officer")).toBe(false)
    })

    it("client_admin can place orders", () => {
      expect(canPlaceOrders("client_admin")).toBe(true)
    })

    it("client_viewer can view but not place orders", () => {
      expect(canPlaceOrders("client_viewer")).toBe(false)
      expect(canWrite("client_viewer")).toBe(false)
    })
  })

  describe("PRD section 5 — Tenant management", () => {
    it("only super_admin can manage tenants", () => {
      expect(canManageTenants("super_admin")).toBe(true)
      expect(canManageTenants("ops_manager")).toBe(false)
      expect(canManageTenants("compliance_officer")).toBe(false)
      expect(canManageTenants("client_admin")).toBe(false)
    })
  })

  describe("dashboard routing matches PRD section 6.1", () => {
    it("ops roles route to /dashboard", () => {
      expect(getDashboardPath("super_admin")).toBe("/dashboard")
      expect(getDashboardPath("ops_manager")).toBe("/dashboard")
      expect(getDashboardPath("compliance_officer")).toBe("/dashboard")
    })

    it("client roles route to /home", () => {
      expect(getDashboardPath("client_admin")).toBe("/home")
      expect(getDashboardPath("client_viewer")).toBe("/home")
    })

    it("driver routes to /assignment", () => {
      expect(getDashboardPath("driver")).toBe("/assignment")
    })

    it("ROLE_DASHBOARD constant matches getDashboardPath", () => {
      const allRoles: Role[] = ["super_admin", "ops_manager", "compliance_officer", "client_admin", "client_viewer", "driver"]
      allRoles.forEach((role) => {
        expect(ROLE_DASHBOARD[role]).toBe(getDashboardPath(role))
      })
    })
  })

  describe("demo users have correct role assignments", () => {
    it("every demo user has a valid RBAC configuration", () => {
      Object.entries(DEMO_USERS).forEach(([key, user]) => {
        expect(ROLE_DASHBOARD[user.role]).toBeDefined()

        if (isOpsRole(user.role)) {
          expect(user.tenantId).toBeNull()
        }
        if (isClientRole(user.role)) {
          expect(user.tenantId).toBeTruthy()
          expect(user.tenantName).toBeTruthy()
        }
        if (isDriverRole(user.role)) {
          expect(user.tenantId).toBeNull()
        }
      })
    })
  })
})
