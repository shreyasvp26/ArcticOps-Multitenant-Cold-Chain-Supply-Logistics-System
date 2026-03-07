export type DocumentStatus = "complete" | "pending" | "missing" | "expired"

export type ComplianceDocType =
  | "certificate_of_analysis"
  | "packing_declaration"
  | "gdp_compliance"
  | "temperature_log"
  | "customs_declaration"
  | "invoice"
  | "bill_of_lading"
  | "air_waybill"
  | "dangerous_goods"
  | "import_permit"
  | "export_permit"
  | "phytosanitary"
  | "health_certificate"

export interface ComplianceDocument {
  id: string
  shipmentId: string
  tenantId: string
  type: ComplianceDocType
  displayName: string
  status: DocumentStatus
  uploadedAt?: string
  expiresAt?: string
  uploadedBy?: string
  fileUrl?: string
  fileSize?: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  userId: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId: string
  details: string
  ipAddress: string
  tenantId?: string
}

export type ValidationStatus = "compliant" | "pending" | "non_compliant"

export interface RegulatoryDeadline {
  id: string
  title: string
  description: string
  dueDate: string
  category: "license" | "certification" | "submission" | "renewal"
  status: "upcoming" | "due_soon" | "overdue"
  tenantId?: string
}
