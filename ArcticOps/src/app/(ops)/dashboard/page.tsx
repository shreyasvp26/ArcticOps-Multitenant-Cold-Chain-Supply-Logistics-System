"use client"
import dynamic from "next/dynamic"
import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  Package, Thermometer, Clock, DollarSign
} from "lucide-react"
import { KpiCard } from "@/components/shared/kpi-card"
import { ActivityFeed } from "@/components/shared/activity-feed"
import { LoadingCrystallize } from "@/components/shared/loading-crystallize"
import { useShipmentStore } from "@/lib/store/shipment-store"
import { useTemperatureStore } from "@/lib/store/temperature-store"
import { useNotificationStore } from "@/lib/store/notification-store"
import { useUIStore } from "@/lib/store/ui-store"
import { staggerContainer, staggerChild } from "@/lib/utils/motion"
import { formatCurrency } from "@/lib/utils/format"

const GlobeMap = dynamic(
  () => import("@/components/ops/globe-map").then((m) => ({ default: m.GlobeMap })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><LoadingCrystallize size="lg" /></div> }
)

export default function DashboardPage() {
  const shipments = useShipmentStore((s) => s.shipments)
  const excursions = useTemperatureStore((s) => s.excursions)
  const notifications = useNotificationStore((s) => s.notifications)
  const stressLevel = useUIStore((s) => s.stressLevel)
  const stressScore = useUIStore((s) => s.stressScore)
  const activeExcursions = useMemo(() => excursions.filter((e) => !e.resolved), [excursions])

  // Derived KPI metrics
  const activeShipments = shipments.filter((s) => s.status === "in_transit" || s.status === "at_customs")
  const deliveredThisMonth = shipments.filter((s) => s.status === "delivered").length
  const totalShipments = shipments.filter((s) => s.status !== "cancelled").length
  const onTimeCount = shipments.filter((s) => s.status === "delivered" || (s.status === "in_transit" && s.riskScore < 40)).length
  const onTimePct = totalShipments > 0 ? Math.round((onTimeCount / totalShipments) * 100) : 0

  const revenueAtRisk = shipments
    .filter((s) => s.riskScore > 50 && s.status !== "delivered")
    .reduce((sum, s) => sum + s.materials.reduce((mSum, m) => mSum + m.quantity * 100, 0), 0)

  // Activity feed — filter by stress level
  const feedNotifications = stressLevel === "urgent" || stressLevel === "emergency"
    ? notifications.filter((n) => n.severity === "critical" || n.severity === "emergency" || n.severity === "warning")
    : notifications

  const stressBorderColor = {
    serene: "rgba(30,48,80,0.7)",
    attentive: "rgba(255,165,2,0.2)",
    urgent: "rgba(255,71,87,0.25)",
    emergency: "rgba(255,71,87,0.45)",
  }

  return (
    <div className="flex flex-col h-full p-5 gap-4">
      {/* Section label */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            Live Metrics
          </span>
        </div>
        {stressLevel !== "serene" && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
            style={{
              backgroundColor: stressLevel === "emergency"
                ? "rgba(255,71,87,0.1)"
                : stressLevel === "urgent"
                ? "rgba(255,71,87,0.08)"
                : "rgba(255,165,2,0.08)",
              border: `1px solid ${stressLevel === "emergency" || stressLevel === "urgent" ? "rgba(255,71,87,0.3)" : "rgba(255,165,2,0.25)"}`,
              color: stressLevel === "emergency" || stressLevel === "urgent" ? "#FF4757" : "#FFA502",
              fontFamily: "var(--ao-font-body)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: "currentColor",
                animation: "checkpoint-pulse 1.5s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
            <span style={{ fontFamily: "var(--ao-font-mono)" }}>
              {stressLevel === "emergency" ? "Emergency" : stressLevel === "urgent" ? "Urgent" : "Attentive"} — {stressScore}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards row */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0"
      >
        <motion.div variants={staggerChild}>
          <KpiCard
            label="Active Shipments"
            value={activeShipments.length}
            icon={Package}
            trend={{ direction: "up", percent: 12, label: "vs last week" }}
            sentiment="positive"
            emphasized={stressLevel === "emergency"}
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <KpiCard
            label="Temp Excursions (24h)"
            value={activeExcursions.length}
            icon={Thermometer}
            trend={{ direction: activeExcursions.length > 2 ? "up" : "down", percent: activeExcursions.length > 2 ? 33 : 5, label: "vs yesterday" }}
            sentiment={activeExcursions.length > 2 ? "negative" : activeExcursions.length > 0 ? "warning" : "positive"}
            emphasized={activeExcursions.length > 0}
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <KpiCard
            label="On-Time Delivery"
            value={`${onTimePct}%`}
            icon={Clock}
            trend={{ direction: onTimePct >= 90 ? "up" : "down", percent: 3, label: "vs last month" }}
            sentiment={onTimePct >= 90 ? "positive" : onTimePct >= 75 ? "warning" : "negative"}
          />
        </motion.div>
        <motion.div variants={staggerChild}>
          <KpiCard
            label="Revenue at Risk"
            value={revenueAtRisk > 0 ? formatCurrency(revenueAtRisk) : "$0"}
            icon={DollarSign}
            trend={{ direction: revenueAtRisk > 50000 ? "up" : "down", percent: 8, label: "vs last week" }}
            sentiment={revenueAtRisk > 100000 ? "negative" : revenueAtRisk > 0 ? "warning" : "positive"}
          />
        </motion.div>
      </motion.div>

      {/* Map + Activity Feed */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Map — 70% */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1, transition: { duration: 0.4, delay: 0.15 } }}
          className="flex-[7] rounded-2xl overflow-hidden relative"
          style={{
            border: `1px solid ${stressBorderColor[stressLevel]}`,
            minHeight: "400px",
            transition: "border-color 1.5s ease",
            boxShadow: stressLevel !== "serene"
              ? `0 0 30px ${stressLevel === "emergency" || stressLevel === "urgent" ? "rgba(255,71,87,0.08)" : "rgba(255,165,2,0.05)"}`
              : "none",
          }}
        >
          <GlobeMap />
        </motion.div>

        {/* Activity Feed — 30% */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.4, delay: 0.2 } }}
          className="flex-[3] rounded-2xl overflow-hidden flex flex-col min-w-[280px]"
          style={{
            background: "linear-gradient(180deg, rgba(7,12,25,0.95) 0%, rgba(5,10,19,0.95) 100%)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(30,48,80,0.7)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
          }}
        >
          {/* Feed header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b shrink-0"
            style={{ borderColor: "rgba(30,48,80,0.6)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} aria-hidden="true" />
              <span
                className="text-[13px] font-semibold"
                style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-primary)" }}
              >
                Live Activity
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22E574", animation: "checkpoint-pulse 2s ease-in-out infinite", boxShadow: "0 0 6px rgba(46,213,115,0.5)" }} aria-hidden="true" />
              <span
                className="text-[11px] font-medium"
                style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}
              >
                {feedNotifications.filter((n) => !n.read).length} unread
              </span>
            </div>
          </div>

          {/* Feed content */}
          <div className="flex-1 overflow-y-auto p-2">
            <ActivityFeed
              notifications={feedNotifications}
              maxItems={30}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
