import type { TransportMode } from "./shipment"

export type CrewDocumentStatus = "verified" | "pending" | "expired"

export interface CrewDocument {
  id: string
  type: string
  displayName: string
  status: CrewDocumentStatus
  expiryDate?: string
  issuedDate?: string
  issuingAuthority?: string
}

export interface CrewAvailability {
  crewId: string
  weekSchedule: Array<{
    date: string
    dutyHours: number
    restHours: number
    isAvailable: boolean
    assignmentId?: string
  }>
}

export interface CrewMember {
  id: string
  name: string
  email: string
  phone: string
  transportMode: TransportMode
  licenseNumber: string
  baseLocation: string
  documents: CrewDocument[]
  performanceScore: number
  onTimePercent: number
  tempMaintenanceRecord: number
  incidentCount: number
  status: "available" | "on_duty" | "off_duty"
  currentAssignmentId?: string
  availability?: CrewAvailability
}
