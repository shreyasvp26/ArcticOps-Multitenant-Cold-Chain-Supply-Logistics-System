"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Role } from "@/lib/types/auth"
import { DEMO_USERS, ROLE_DASHBOARD } from "@/lib/constants/roles"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => { success: boolean; redirectTo?: string; error?: string }
  loginAs: (roleKey: keyof typeof DEMO_USERS) => void
  logout: () => void
  setUser: (user: User, token: string) => void
}

function generateMockToken(user: User): string {
  const payload = btoa(JSON.stringify({ userId: user.id, role: user.role, tenantId: user.tenantId, exp: Date.now() + 24 * 60 * 60 * 1000 }))
  return `mock.${payload}.sig`
}

function syncAuthCookie(token: string | null) {
  if (typeof document === "undefined") return

  if (!token) {
    document.cookie = "ao_token=; Path=/; Max-Age=0; SameSite=Lax"
    return
  }

  document.cookie = `ao_token=${token}; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Lax`
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (email, password) => {
        const match = Object.values(DEMO_USERS).find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        if (!match) return { success: false, error: "Invalid email or password. Check your credentials or use a demo login." }

        const user: User = {
          id: `user_${match.role}`,
          email: match.email,
          name: match.name,
          role: match.role as Role,
          tenantId: match.tenantId,
          tenantName: match.tenantName,
        }
        const token = generateMockToken(user)
        syncAuthCookie(token)
        set({ user, token, isAuthenticated: true })
        return { success: true, redirectTo: ROLE_DASHBOARD[user.role] }
      },

      loginAs: (roleKey) => {
        const match = DEMO_USERS[roleKey]
        if (!match) return
        const user: User = {
          id: `user_${match.role}`,
          email: match.email,
          name: match.name,
          role: match.role as Role,
          tenantId: match.tenantId,
          tenantName: match.tenantName,
        }
        const token = generateMockToken(user)
        syncAuthCookie(token)
        set({ user, token, isAuthenticated: true })
      },

      logout: () => {
        syncAuthCookie(null)
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user, token) => {
        syncAuthCookie(token)
        set({ user, token, isAuthenticated: true })
      },
    }),
    {
      name: "arcticops-auth",
      onRehydrateStorage: () => (state) => {
        syncAuthCookie(state?.token ?? null)
      },
    }
  )
)
