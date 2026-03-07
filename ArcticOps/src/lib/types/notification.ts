export type AlertSeverity = "info" | "warning" | "critical" | "emergency"

export interface AlertAction {
  label: string
  href?: string
  action?: string
}

export interface Notification {
  id: string
  tenantId: string | null
  severity: AlertSeverity
  title: string
  message: string
  actions: AlertAction[]
  relatedEntityType?: "shipment" | "material" | "carrier" | "crew" | "document"
  relatedEntityId?: string
  read: boolean
  createdAt: string
  autoExpires?: boolean
}
