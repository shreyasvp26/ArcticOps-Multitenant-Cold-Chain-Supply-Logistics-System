import type { Material, StockLevel } from "@/lib/types/inventory"

export const MOCK_MATERIALS: Material[] = [
  { id: "mat_001", name: "Insulin Glargine", grade: "USP", certifications: ["USP", "GDP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 4200, unit: "vial", supplier: "SynBio API Ltd" },
  { id: "mat_002", name: "mRNA-1273 Lipid Nanoparticles", grade: "USP", certifications: ["USP", "WHO PQS"], temperatureZone: "ultra_cold", requiredTempMin: -80, requiredTempMax: -60, unitPrice: 18500, unit: "dose-kit", supplier: "NovaCryo Sciences" },
  { id: "mat_008", name: "Freeze-Dried BCG Vaccine", grade: "USP", certifications: ["WHO PQS", "GDP"], temperatureZone: "frozen", requiredTempMin: -25, requiredTempMax: -15, unitPrice: 920, unit: "dose-vial", supplier: "ImmunePath SA" },
  { id: "mat_016", name: "Tacrolimus 1mg Capsules", grade: "USP", certifications: ["USP", "EP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 2400, unit: "pack-100", supplier: "TransplantMed AG" },
  { id: "mat_018", name: "Cord Blood Stem Cells", grade: "USP", certifications: ["WHO PQS", "GDP"], temperatureZone: "ultra_cold", requiredTempMin: -200, requiredTempMax: -140, unitPrice: 95000, unit: "unit", supplier: "CryoCord Bio" },
]

export const MOCK_STOCK_LEVELS: StockLevel[] = MOCK_MATERIALS.map((m, i) => {
  const total = 100 + (i + 1) * 80
  const allocated = Math.floor(total * (0.2 + (i % 3) * 0.1))
  const available = total - allocated
  const minimum = Math.floor(total * 0.2)
  const status = available <= minimum ? "critical" : available <= minimum * 1.5 ? "low" : "healthy"
  return {
    materialId: m.id,
    current: total,
    allocated,
    available,
    minimum,
    restockEta: status !== "healthy" ? new Date(Date.now() + (3 + i * 2) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    status,
  }
})
