import type { DelayPrediction, ExcursionHeatmapData, CostReport, ClientHealthScore } from "@/lib/types/analytics"

export const MOCK_DELAY_PREDICTIONS: DelayPrediction[] = [
  {
    shipmentId: "SH-1204",
    shipmentLabel: "SH-1204",
    clientName: "BioVerde Labs",
    currentStatus: "At Customs",
    predictedDelayHours: 5,
    confidencePercent: 82,
    primaryRiskFactor: "customs",
    riskDetails: "Similar biologics shipments at Nairobi JKIA averaged 4.8h delay in past 90 days",
  },
  {
    shipmentId: "SH-3110",
    shipmentLabel: "SH-3110",
    clientName: "CryoMed Solutions",
    currentStatus: "In Transit",
    predictedDelayHours: 2,
    confidencePercent: 65,
    primaryRiskFactor: "customs",
    riskDetails: "Missing Australian import permit may cause customs hold at Sydney",
  },
  {
    shipmentId: "SH-2788",
    shipmentLabel: "SH-2788",
    clientName: "PharmaAlpha Inc.",
    currentStatus: "In Transit (Sea)",
    predictedDelayHours: 18,
    confidencePercent: 48,
    primaryRiskFactor: "weather",
    riskDetails: "North Pacific storm system may impact ETA by 12–24 hours near Hawaii",
  },
]

export const MOCK_EXCURSION_HEATMAP: ExcursionHeatmapData[] = [
  { routeSegment: "Mumbai → Frankfurt", month: "Jan 2026", excursionCount: 1, carrierId: "carrier_arctic_express" },
  { routeSegment: "Mumbai → Frankfurt", month: "Feb 2026", excursionCount: 2, carrierId: "carrier_arctic_express" },
  { routeSegment: "Mumbai → Frankfurt", month: "Mar 2026", excursionCount: 0, carrierId: "carrier_polaraero" },
  { routeSegment: "Shanghai → New York", month: "Jan 2026", excursionCount: 0, carrierId: "carrier_pharmafreight" },
  { routeSegment: "Shanghai → New York", month: "Feb 2026", excursionCount: 1, carrierId: "carrier_pharmafreight" },
  { routeSegment: "Shanghai → New York", month: "Mar 2026", excursionCount: 0, carrierId: "carrier_pharmafreight" },
  { routeSegment: "Brussels → Nairobi", month: "Jan 2026", excursionCount: 3, carrierId: "carrier_arctic_express" },
  { routeSegment: "Brussels → Nairobi", month: "Feb 2026", excursionCount: 2, carrierId: "carrier_arctic_express" },
  { routeSegment: "Brussels → Nairobi", month: "Mar 2026", excursionCount: 1, carrierId: "carrier_arctic_express" },
  { routeSegment: "London → Sydney", month: "Jan 2026", excursionCount: 1, carrierId: "carrier_polaraero" },
  { routeSegment: "London → Sydney", month: "Feb 2026", excursionCount: 0, carrierId: "carrier_polaraero" },
  { routeSegment: "London → Sydney", month: "Mar 2026", excursionCount: 2, carrierId: "carrier_polaraero" },
  { routeSegment: "Zurich → Toronto", month: "Jan 2026", excursionCount: 0, carrierId: "carrier_polaraero" },
  { routeSegment: "Zurich → Toronto", month: "Feb 2026", excursionCount: 0, carrierId: "carrier_polaraero" },
  { routeSegment: "Zurich → Toronto", month: "Mar 2026", excursionCount: 0, carrierId: "carrier_polaraero" },
]

export const MOCK_COST_REPORTS: CostReport[] = [
  { shipmentId: "SH-2847", clientName: "PharmaAlpha Inc.", estimatedCostUsd: 28000, actualCostUsd: 27400, variance: -600, variancePercent: -2.1, primaryMode: "air" },
  { shipmentId: "SH-1204", clientName: "BioVerde Labs", estimatedCostUsd: 18500, actualCostUsd: 21200, variance: 2700, variancePercent: 14.6, primaryMode: "air" },
  { shipmentId: "SH-3091", clientName: "CryoMed Solutions", estimatedCostUsd: 35000, actualCostUsd: 34100, variance: -900, variancePercent: -2.6, primaryMode: "air" },
  { shipmentId: "SH-2788", clientName: "PharmaAlpha Inc.", estimatedCostUsd: 14200, actualCostUsd: 13800, variance: -400, variancePercent: -2.8, primaryMode: "sea" },
  { shipmentId: "SH-3102", clientName: "BioVerde Labs", estimatedCostUsd: 22400, actualCostUsd: 22400, variance: 0, variancePercent: 0, primaryMode: "air" },
  { shipmentId: "SH-2901", clientName: "CryoMed Solutions", estimatedCostUsd: 19800, actualCostUsd: 19200, variance: -600, variancePercent: -3.0, primaryMode: "air" },
]

export const MOCK_CLIENT_HEALTH: ClientHealthScore[] = [
  {
    tenantId: "tenant_pharma_alpha",
    tenantName: "PharmaAlpha Inc.",
    score: 88,
    orderFrequencyTrend: "up",
    issueCount: 1,
    satisfactionScore: 91,
    trend: [
      { month: "Oct 2025", score: 78 },
      { month: "Nov 2025", score: 82 },
      { month: "Dec 2025", score: 80 },
      { month: "Jan 2026", score: 85 },
      { month: "Feb 2026", score: 87 },
      { month: "Mar 2026", score: 88 },
    ],
  },
  {
    tenantId: "tenant_bioverde",
    tenantName: "BioVerde Labs",
    score: 72,
    orderFrequencyTrend: "stable",
    issueCount: 3,
    satisfactionScore: 74,
    trend: [
      { month: "Oct 2025", score: 76 },
      { month: "Nov 2025", score: 71 },
      { month: "Dec 2025", score: 68 },
      { month: "Jan 2026", score: 70 },
      { month: "Feb 2026", score: 73 },
      { month: "Mar 2026", score: 72 },
    ],
  },
  {
    tenantId: "tenant_cryomed",
    tenantName: "CryoMed Solutions",
    score: 65,
    orderFrequencyTrend: "down",
    issueCount: 4,
    satisfactionScore: 68,
    trend: [
      { month: "Oct 2025", score: 80 },
      { month: "Nov 2025", score: 78 },
      { month: "Dec 2025", score: 74 },
      { month: "Jan 2026", score: 70 },
      { month: "Feb 2026", score: 67 },
      { month: "Mar 2026", score: 65 },
    ],
  },
]
