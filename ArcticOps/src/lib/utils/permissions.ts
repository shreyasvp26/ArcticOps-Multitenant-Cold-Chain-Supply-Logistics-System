import type { Role } from "@/lib/types/auth"
import { OPS_ROLES, CLIENT_ROLES, DRIVER_ROLES } from "@/lib/constants/roles"

export function isOpsRole(role: Role): boolean {
  return OPS_ROLES.includes(role)
}

export function isClientRole(role: Role): boolean {
  return CLIENT_ROLES.includes(role)
}

export function isDriverRole(role: Role): boolean {
  return DRIVER_ROLES.includes(role)
}

export function canWrite(role: Role): boolean {
  return role !== "client_viewer"
}

export function canAccessCompliance(role: Role): boolean {
  return role === "super_admin" || role === "ops_manager" || role === "compliance_officer"
}

export function canManageTenants(role: Role): boolean {
  return role === "super_admin"
}

export function canApproveOrders(role: Role): boolean {
  return role === "super_admin" || role === "ops_manager"
}

export function canPlaceOrders(role: Role): boolean {
  return role === "client_admin"
}

export function canViewAllTenants(role: Role): boolean {
  return isOpsRole(role)
}

export function getDashboardPath(role: Role): string {
  if (isOpsRole(role)) return "/dashboard"
  if (isClientRole(role)) return "/home"
  return "/assignment"
}
