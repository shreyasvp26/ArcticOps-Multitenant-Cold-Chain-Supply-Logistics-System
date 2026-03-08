import { describe, it, expect, beforeEach } from "vitest"
import { useAuthStore } from "../auth-store"
import { DEMO_USERS, ROLE_DASHBOARD } from "@/lib/constants/roles"

function resetStore() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  })
}

describe("auth-store", () => {
  beforeEach(() => {
    resetStore()
  })

  describe("initial state", () => {
    it("starts unauthenticated", () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("login", () => {
    it("logs in with valid ops credentials", () => {
      const result = useAuthStore.getState().login("ops@arcticops.io", "demo123")
      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe("/dashboard")

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).not.toBeNull()
      expect(state.user!.role).toBe("ops_manager")
      expect(state.user!.email).toBe("ops@arcticops.io")
      expect(state.token).toBeTruthy()
    })

    it("logs in with valid client credentials", () => {
      const result = useAuthStore.getState().login("admin@pharmaalpha.com", "demo123")
      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe("/home")

      const state = useAuthStore.getState()
      expect(state.user!.role).toBe("client_admin")
      expect(state.user!.tenantId).toBe("tenant_pharma_alpha")
      expect(state.user!.tenantName).toBe("PharmaAlpha Inc.")
    })

    it("logs in with driver credentials", () => {
      const result = useAuthStore.getState().login("driver@arcticops.io", "demo123")
      expect(result.success).toBe(true)
      expect(result.redirectTo).toBe("/assignment")

      const state = useAuthStore.getState()
      expect(state.user!.role).toBe("driver")
      expect(state.user!.tenantId).toBeNull()
    })

    it("rejects invalid email", () => {
      const result = useAuthStore.getState().login("nonexistent@test.com", "demo123")
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it("rejects invalid password", () => {
      const result = useAuthStore.getState().login("ops@arcticops.io", "wrongpass")
      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it("handles case-insensitive email matching", () => {
      const result = useAuthStore.getState().login("OPS@ARCTICOPS.IO", "demo123")
      expect(result.success).toBe(true)
    })

    it("generates a mock JWT token with correct structure", () => {
      useAuthStore.getState().login("ops@arcticops.io", "demo123")
      const token = useAuthStore.getState().token!
      expect(token).toMatch(/^mock\..+\.sig$/)

      const payload = JSON.parse(atob(token.split(".")[1]))
      expect(payload.role).toBe("ops_manager")
      expect(payload.exp).toBeGreaterThan(Date.now())
    })

    it("redirects each role to the correct dashboard", () => {
      for (const [key, demoUser] of Object.entries(DEMO_USERS)) {
        resetStore()
        const result = useAuthStore.getState().login(demoUser.email, demoUser.password)
        expect(result.success).toBe(true)
        expect(result.redirectTo).toBe(ROLE_DASHBOARD[demoUser.role])
      }
    })
  })

  describe("loginAs", () => {
    it("quick-login as ops_manager", () => {
      useAuthStore.getState().loginAs("ops_manager")
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user!.role).toBe("ops_manager")
    })

    it("quick-login as client_admin with tenant", () => {
      useAuthStore.getState().loginAs("client_admin")
      const state = useAuthStore.getState()
      expect(state.user!.role).toBe("client_admin")
      expect(state.user!.tenantId).toBe("tenant_pharma_alpha")
    })

    it("quick-login as driver", () => {
      useAuthStore.getState().loginAs("driver")
      expect(useAuthStore.getState().user!.role).toBe("driver")
    })

    it("does nothing for invalid role key", () => {
      useAuthStore.getState().loginAs("nonexistent" as keyof typeof DEMO_USERS)
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe("logout", () => {
    it("clears all auth state", () => {
      useAuthStore.getState().login("ops@arcticops.io", "demo123")
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      useAuthStore.getState().logout()
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe("setUser", () => {
    it("sets user and token directly", () => {
      const user = {
        id: "user_test",
        email: "test@test.com",
        name: "Test User",
        role: "client_admin" as const,
        tenantId: "tenant_test",
        tenantName: "Test Corp",
      }
      useAuthStore.getState().setUser(user, "mock.token.sig")
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user).toEqual(user)
      expect(state.token).toBe("mock.token.sig")
    })
  })
})
