import type { Role } from "@/lib/types/auth"

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",
  ops_manager: "Operations Manager",
  compliance_officer: "Compliance Officer",
  client_admin: "Client Admin",
  client_viewer: "Client Viewer",
  driver: "Driver / Transporter",
}

export const OPS_ROLES: Role[] = ["super_admin", "ops_manager", "compliance_officer"]
export const CLIENT_ROLES: Role[] = ["client_admin", "client_viewer"]
export const DRIVER_ROLES: Role[] = ["driver"]

export const ROLE_DASHBOARD: Record<Role, string> = {
  super_admin: "/dashboard",
  ops_manager: "/dashboard",
  compliance_officer: "/dashboard",
  client_admin: "/home",
  client_viewer: "/home",
  driver: "/assignment",
}

export const DEMO_USERS: Record<string, { email: string; password: string; role: Role; tenantId: string | null; tenantName: string | null; name: string }> = {
  ops_manager: {
    email: "ops@arcticops.io",
    password: "demo123",
    role: "ops_manager",
    tenantId: null,
    tenantName: null,
    name: "Alex Morgan",
  },
  compliance_officer: {
    email: "compliance@arcticops.io",
    password: "demo123",
    role: "compliance_officer",
    tenantId: null,
    tenantName: null,
    name: "Jordan Ellis",
  },
  client_admin: {
    email: "admin@pharmaalpha.com",
    password: "demo123",
    role: "client_admin",
    tenantId: "tenant_pharma_alpha",
    tenantName: "PharmaAlpha Inc.",
    name: "Dr. Sarah Chen",
  },
  client_viewer: {
    email: "viewer@bioverde.com",
    password: "demo123",
    role: "client_viewer",
    tenantId: "tenant_bioverde",
    tenantName: "BioVerde Labs",
    name: "Marcus Webb",
  },
  driver: {
    email: "driver@arcticops.io",
    password: "demo123",
    role: "driver",
    tenantId: null,
    tenantName: null,
    name: "Ravi Patel",
  },
}
