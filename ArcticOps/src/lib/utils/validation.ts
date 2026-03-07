import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupActivationSchema = z.object({
  code: z.string().length(6, "Activation code must be 6 characters"),
})

export const orgSetupSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  primaryContact: z.string().min(2, "Contact name is required"),
  contactEmail: z.string().email("Enter a valid email address"),
  complianceFrameworks: z.array(z.string()).min(1, "Select at least one compliance framework"),
  teamInvites: z.array(z.object({
    email: z.string().email(),
    role: z.enum(["client_admin", "client_viewer"]),
  })).optional(),
})

export const orderMaterialsSchema = z.object({
  items: z.array(z.object({
    materialId: z.string(),
    quantity: z.number().positive("Quantity must be positive"),
  })).min(1, "Add at least one material"),
})

export const orderColdChainSchema = z.object({
  temperatureZone: z.enum(["ultra_cold", "frozen", "refrigerated"]),
  durationToleranceHours: z.number().min(1),
})

export const orderDeliverySchema = z.object({
  urgency: z.enum(["standard", "express", "emergency"]),
  preferredModes: z.array(z.enum(["air", "sea", "rail", "road"])).min(1),
  deliveryWindowStart: z.string(),
  deliveryWindowEnd: z.string(),
  destinationAddress: z.string().min(5),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type OrgSetupFormData = z.infer<typeof orgSetupSchema>
