import type { RouteOption } from "@/lib/types/route"

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: "route_001_air_direct",
    name: "Air Direct — Fastest",
    legs: [
      { id: "l1", mode: "air", origin: "Mumbai", destination: "Frankfurt", originCoords: [72.8777, 19.0760], destinationCoords: [8.6821, 50.1109], etaHours: 10, distanceKm: 6400, carrierId: "carrier_polaraero" },
    ],
    totalEtaHours: 10,
    totalCostUsd: 28500,
    riskScore: 18,
    co2EstimateKg: 4200,
    tempMaintenanceConfidence: 96,
    isRecommended: true,
  },
  {
    id: "route_001_air_road",
    name: "Air + Road Multimodal",
    legs: [
      { id: "l1", mode: "air", origin: "Mumbai", destination: "Dubai", originCoords: [72.8777, 19.0760], destinationCoords: [55.3647, 25.2532], etaHours: 4, distanceKm: 1900, carrierId: "carrier_arctic_express" },
      { id: "l2", mode: "road", origin: "Dubai", destination: "Frankfurt", originCoords: [55.3647, 25.2532], destinationCoords: [8.6821, 50.1109], etaHours: 8, distanceKm: 4400, carrierId: "carrier_cryolink" },
    ],
    totalEtaHours: 14,
    totalCostUsd: 21200,
    riskScore: 32,
    co2EstimateKg: 2800,
    tempMaintenanceConfidence: 88,
    isRecommended: false,
  },
  {
    id: "route_001_sea",
    name: "Sea Freight — Eco",
    legs: [
      { id: "l1", mode: "sea", origin: "Mumbai", destination: "Rotterdam", originCoords: [72.8777, 19.0760], destinationCoords: [4.4777, 51.9244], etaHours: 384, distanceKm: 11400, carrierId: "carrier_bioship" },
      { id: "l2", mode: "road", origin: "Rotterdam", destination: "Frankfurt", originCoords: [4.4777, 51.9244], destinationCoords: [8.6821, 50.1109], etaHours: 4, distanceKm: 380, carrierId: "carrier_arctic_express" },
    ],
    totalEtaHours: 388,
    totalCostUsd: 8400,
    riskScore: 45,
    co2EstimateKg: 980,
    tempMaintenanceConfidence: 74,
    isRecommended: false,
    notes: "Not recommended for refrigerated pharmaceuticals due to extended duration.",
  },
  {
    id: "route_001_air_rail",
    name: "Air + Rail Combination",
    legs: [
      { id: "l1", mode: "air", origin: "Mumbai", destination: "Warsaw", originCoords: [72.8777, 19.0760], destinationCoords: [21.0122, 52.2297], etaHours: 9, distanceKm: 6000, carrierId: "carrier_arctic_express" },
      { id: "l2", mode: "rail", origin: "Warsaw", destination: "Frankfurt", originCoords: [21.0122, 52.2297], destinationCoords: [8.6821, 50.1109], etaHours: 6, distanceKm: 1200, carrierId: "carrier_frostline" },
    ],
    totalEtaHours: 16,
    totalCostUsd: 18600,
    riskScore: 28,
    co2EstimateKg: 1850,
    tempMaintenanceConfidence: 91,
    isRecommended: false,
  },
]
