import type { Tenant } from "@/lib/types/auth"

export const MOCK_CLIENTS: Tenant[] = [
  {
    id: "tenant_pharma_alpha",
    name: "PharmaAlpha Inc.",
    primaryContact: "Dr. Sarah Chen",
    contactEmail: "s.chen@pharmaalpha.com",
    complianceFrameworks: ["GDP", "GMP", "WHO PQS"],
    activationCode: "PA7821",
    createdAt: "2025-10-15T09:00:00Z",
  },
  {
    id: "tenant_bioverde",
    name: "BioVerde Labs",
    primaryContact: "Marcus Webb",
    contactEmail: "m.webb@bioverde.com",
    complianceFrameworks: ["GDP", "IATA DGR"],
    activationCode: "BV4953",
    createdAt: "2025-11-03T14:30:00Z",
  },
  {
    id: "tenant_cryomed",
    name: "CryoMed Solutions",
    primaryContact: "Dr. Yuki Tanaka",
    contactEmail: "y.tanaka@cryomed.com",
    complianceFrameworks: ["GDP", "GMP", "WHO PQS", "IMDG Code"],
    activationCode: "CM3367",
    createdAt: "2025-09-20T11:00:00Z",
  },
]

export const VALID_ACTIVATION_CODES = MOCK_CLIENTS.map(c => c.activationCode)
