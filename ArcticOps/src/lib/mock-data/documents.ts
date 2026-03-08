import type { ComplianceDocument } from "@/lib/types/compliance"

export const MOCK_DOCUMENTS: ComplianceDocument[] = [
  { id: "doc_001", shipmentId: "SH-2847", tenantId: "tenant_pharma_alpha", type: "certificate_of_analysis", displayName: "Certificate of Analysis — Insulin Glargine Batch IG-2847", status: "complete", uploadedAt: "2026-03-05T16:00:00Z", expiresAt: "2027-03-05T16:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_002", shipmentId: "SH-2847", tenantId: "tenant_pharma_alpha", type: "air_waybill", displayName: "Air Waybill — Polar Aero Med AWB-2847", status: "complete", uploadedAt: "2026-03-07T07:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_003", shipmentId: "SH-1204", tenantId: "tenant_bioverde", type: "certificate_of_analysis", displayName: "Certificate of Analysis — BCG Vaccine Batch BCV-1204", status: "complete", uploadedAt: "2026-03-04T12:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_004", shipmentId: "SH-1204", tenantId: "tenant_bioverde", type: "import_permit", displayName: "Kenya Import Permit — Ministry of Health", status: "pending", uploadedBy: "Dr. Sarah Chen" },
  { id: "doc_005", shipmentId: "SH-3091", tenantId: "tenant_cryomed", type: "certificate_of_analysis", displayName: "Certificate of Analysis — mRNA-1273 Batch MR-3091", status: "complete", uploadedAt: "2026-03-06T10:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_006", shipmentId: "SH-3110", tenantId: "tenant_cryomed", type: "certificate_of_analysis", displayName: "Certificate of Analysis — Cord Blood Batch CB-3110", status: "complete", uploadedAt: "2026-03-06T11:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_007", shipmentId: "SH-2965", tenantId: "tenant_cryomed", type: "certificate_of_analysis", displayName: "Certificate of Analysis — Tacrolimus Batch TC-2965", status: "complete", uploadedAt: "2026-03-06T16:00:00Z", uploadedBy: "Alex Morgan" },
  { id: "doc_008", shipmentId: "SH-3110", tenantId: "tenant_cryomed", type: "import_permit", displayName: "Australian Quarantine Import Permit — DAFF", status: "missing" },
  { id: "doc_009", shipmentId: "SH-2965", tenantId: "tenant_cryomed", type: "customs_declaration", displayName: "India Import Declaration — ICEGATE", status: "pending" },
]
