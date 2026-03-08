"use client"
import { motion } from "framer-motion"
import {
  Settings, Bell, Shield, Users, Palette, Globe,
  ChevronRight, Zap, Database, Key
} from "lucide-react"
import { fadeVariants } from "@/lib/utils/motion"

const SETTING_GROUPS = [
  {
    title: "Account & Security",
    icon: Shield,
    color: "#00C8A8",
    items: [
      { label: "Two-Factor Authentication", desc: "Add an extra layer of protection", badge: "Enabled" },
      { label: "Password & Access", desc: "Change password, manage sessions" },
      { label: "API Keys", desc: "Manage integration credentials", icon: Key },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    color: "#FFA502",
    items: [
      { label: "Alert Preferences", desc: "Temperature, delay, compliance alerts" },
      { label: "Email Digests", desc: "Daily or weekly summary reports" },
      { label: "Push Notifications", desc: "Mobile and desktop alerts" },
    ],
  },
  {
    title: "Team & Roles",
    icon: Users,
    color: "#3B82F6",
    items: [
      { label: "User Management", desc: "Invite, remove, manage permissions" },
      { label: "Role Configuration", desc: "Define custom roles and access levels" },
    ],
  },
  {
    title: "Platform",
    icon: Globe,
    color: "#7C3AED",
    items: [
      { label: "Regional Settings", desc: "Timezone, units, language" },
      { label: "Integrations", desc: "Connect ERP, WMS, carrier APIs", icon: Zap },
      { label: "Data Retention", desc: "Archive and purge policies", icon: Database },
    ],
  },
  {
    title: "Appearance",
    icon: Palette,
    color: "#06B6D4",
    items: [
      { label: "Theme & Display", desc: "Density, accent color, font size" },
      { label: "Dashboard Layout", desc: "Customize widget placement" },
    ],
  },
]

export default function SettingsPage() {
  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="p-6 max-w-2xl mx-auto flex flex-col gap-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)", border: "1px solid rgba(0,200,168,0.25)" }}
        >
          <Settings className="w-4.5 h-4.5" style={{ color: "var(--ao-accent)" }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-display)" }}>Settings</h1>
          <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>Configure your workspace and preferences</p>
        </div>
      </div>

      {SETTING_GROUPS.map(({ title, icon: Icon, color, items }) => (
        <div
          key={title}
          className="rounded-xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(11,18,34,0.7) 0%, rgba(6,13,27,0.85) 100%)",
            border: "1px solid var(--ao-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ borderColor: "var(--ao-border)", background: "rgba(0,0,0,0.15)" }}>
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} />
            </div>
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)", letterSpacing: "0.08em" }}>{title}</p>
          </div>
          <div>
            {items.map(({ label, desc, badge, icon: ItemIcon }, i) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] border-b last:border-b-0"
                style={{ borderColor: "var(--ao-border)" }}
              >
                {ItemIcon && (
                  <div className="w-6 h-6 rounded flex items-center justify-center shrink-0"
                    style={{ background: `${color}12` }}>
                    <ItemIcon className="w-3 h-3" style={{ color }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>{label}</p>
                  <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{desc}</p>
                </div>
                {badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold mr-2"
                    style={{ background: "rgba(46,213,115,0.12)", color: "#2ED573", border: "1px solid rgba(46,213,115,0.25)" }}>
                    {badge}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--ao-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
