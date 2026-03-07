import type { Material, StockLevel } from "@/lib/types/inventory"

export const MOCK_MATERIALS: Material[] = [
  { id: "mat_001", name: "Insulin Glargine", grade: "USP", certifications: ["USP", "GDP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 4200, unit: "vial", supplier: "SynBio API Ltd" },
  { id: "mat_002", name: "mRNA-1273 Lipid Nanoparticles", grade: "USP", certifications: ["USP", "WHO PQS"], temperatureZone: "ultra_cold", requiredTempMin: -80, requiredTempMax: -60, unitPrice: 18500, unit: "dose-kit", supplier: "NovaCryo Sciences" },
  { id: "mat_003", name: "Polyethylene Glycol 400", grade: "USP", certifications: ["USP", "EP", "BP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 320, unit: "kg", supplier: "ChemPure GmbH" },
  { id: "mat_004", name: "Sodium Chloride 0.9%", grade: "USP", certifications: ["USP", "EP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 85, unit: "L", supplier: "PharmaBase BV" },
  { id: "mat_005", name: "Lactose Monohydrate", grade: "EP", certifications: ["EP", "BP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 240, unit: "kg", supplier: "DairyPharma AG" },
  { id: "mat_006", name: "Human Albumin 20%", grade: "USP", certifications: ["USP", "EP", "GDP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 7800, unit: "vial", supplier: "PlasmaGen Corp" },
  { id: "mat_007", name: "Epoetin Alfa", grade: "USP", certifications: ["USP", "WHO PQS"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 3200, unit: "vial", supplier: "BioHeme Ltd" },
  { id: "mat_008", name: "Freeze-Dried BCG Vaccine", grade: "USP", certifications: ["WHO PQS", "GDP"], temperatureZone: "frozen", requiredTempMin: -25, requiredTempMax: -15, unitPrice: 920, unit: "dose-vial", supplier: "ImmunePath SA" },
  { id: "mat_009", name: "Rituximab 10mg/mL", grade: "USP", certifications: ["USP", "GDP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 28000, unit: "vial", supplier: "OncoBio Inc." },
  { id: "mat_010", name: "DMSO (Dimethyl Sulfoxide)", grade: "USP", certifications: ["USP", "ACS"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 560, unit: "L", supplier: "Solvents Plus Ltd" },
  { id: "mat_011", name: "Trastuzumab 440mg", grade: "USP", certifications: ["USP", "WHO PQS"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 35000, unit: "vial", supplier: "OncoBio Inc." },
  { id: "mat_012", name: "Heparin Sodium 5000 IU/mL", grade: "USP", certifications: ["USP", "EP", "GDP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 980, unit: "vial", supplier: "HemoPharm GmbH" },
  { id: "mat_013", name: "Vancomycin HCl 500mg", grade: "USP", certifications: ["USP", "EP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 1200, unit: "vial", supplier: "AntiMed Corp" },
  { id: "mat_014", name: "Propofol 1% Injectable", grade: "USP", certifications: ["USP", "BP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 780, unit: "vial", supplier: "AnesPharm Ltd" },
  { id: "mat_015", name: "Plasma Fresh Frozen", grade: "USP", certifications: ["USP", "GDP"], temperatureZone: "frozen", requiredTempMin: -25, requiredTempMax: -18, unitPrice: 4500, unit: "unit", supplier: "BloodBank Europe" },
  { id: "mat_016", name: "Tacrolimus 1mg Capsules", grade: "USP", certifications: ["USP", "EP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 2400, unit: "pack-100", supplier: "TransplantMed AG" },
  { id: "mat_017", name: "Adalimumab 40mg/0.8mL", grade: "USP", certifications: ["USP", "WHO PQS", "GDP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 22000, unit: "syringe", supplier: "ImmunoGen Ltd" },
  { id: "mat_018", name: "Cord Blood Stem Cells", grade: "USP", certifications: ["WHO PQS", "GDP"], temperatureZone: "ultra_cold", requiredTempMin: -200, requiredTempMax: -140, unitPrice: 95000, unit: "unit", supplier: "CryoCord Bio" },
  { id: "mat_019", name: "Somatropin 4IU/vial", grade: "USP", certifications: ["USP", "EP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 8900, unit: "vial", supplier: "GrowthBio Inc." },
  { id: "mat_020", name: "Albumin 5% IV Solution", grade: "USP", certifications: ["USP", "GDP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 3400, unit: "bag-250mL", supplier: "PlasmaGen Corp" },
  { id: "mat_021", name: "Cryoprotectant DMEM/F12", grade: "ACS", certifications: ["ACS", "GMP"], temperatureZone: "ultra_cold", requiredTempMin: -80, requiredTempMax: -60, unitPrice: 1800, unit: "L", supplier: "CellTech Media" },
  { id: "mat_022", name: "Methotrexate 25mg/mL", grade: "USP", certifications: ["USP", "BP", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 1650, unit: "vial", supplier: "ChemoPharm BV" },
  { id: "mat_023", name: "Nivolumab 10mg/mL", grade: "USP", certifications: ["USP", "WHO PQS"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 42000, unit: "vial", supplier: "OncoBio Inc." },
  { id: "mat_024", name: "Intravenous Immunoglobulin 5%", grade: "USP", certifications: ["USP", "EP", "GDP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 12500, unit: "bag-100mL", supplier: "PlasmaGen Corp" },
  { id: "mat_025", name: "Granulocyte Colony-Stimulating Factor", grade: "USP", certifications: ["USP", "WHO PQS", "GMP"], temperatureZone: "refrigerated", requiredTempMin: 2, requiredTempMax: 8, unitPrice: 5600, unit: "syringe", supplier: "BioHeme Ltd" },
]

export const MOCK_STOCK_LEVELS: StockLevel[] = MOCK_MATERIALS.map((m, i) => {
  const total = 100 + Math.floor(Math.random() * 900)
  const allocated = Math.floor(total * (0.2 + (i % 5) * 0.1))
  const available = total - allocated
  const minimum = Math.floor(total * 0.2)
  const status = available <= minimum ? "critical" : available <= minimum * 1.5 ? "low" : "healthy"
  return {
    materialId: m.id,
    current: total,
    allocated,
    available,
    minimum,
    restockEta: status !== "healthy" ? new Date(Date.now() + (3 + i % 7) * 24 * 60 * 60 * 1000).toISOString() : undefined,
    status,
  }
})
