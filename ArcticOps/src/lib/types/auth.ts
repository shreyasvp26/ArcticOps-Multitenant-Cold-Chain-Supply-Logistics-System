export type Role =
  | "super_admin"
  | "ops_manager"
  | "compliance_officer"
  | "client_admin"
  | "client_viewer"
  | "driver"

export interface User {
  id: string
  email: string
  name: string
  role: Role
  tenantId: string | null
  tenantName: string | null
  avatarUrl?: string
}

export interface Tenant {
  id: string
  name: string
  logoUrl?: string
  primaryContact: string
  contactEmail: string
  complianceFrameworks: string[]
  activationCode: string
  createdAt: string
}

export interface Session {
  user: User
  token: string
  expiresAt: string
}
