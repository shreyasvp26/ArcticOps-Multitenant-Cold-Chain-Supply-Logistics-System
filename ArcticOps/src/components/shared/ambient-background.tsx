"use client"
import { cn } from "@/lib/utils/cn"
import { useUIStore } from "@/lib/store/ui-store"

export function AmbientBackground({ className }: { className?: string }) {
  const stressLevel = useUIStore((s) => s.stressLevel)

  const backgrounds = {
    serene: {
      bg: "#0A1628",
      overlay: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.06) 0%, transparent 60%)",
      animation: "arctic-aurora 20s ease-in-out infinite",
    },
    attentive: {
      bg: "#0D1830",
      overlay: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.04) 0%, transparent 50%)",
      animation: "none",
    },
    urgent: {
      bg: "#1A1520",
      overlay: "radial-gradient(ellipse 60% 40% at 100% 100%, rgba(255,71,87,0.06) 0%, transparent 50%)",
      animation: "none",
    },
    emergency: {
      bg: "#1F1520",
      overlay: "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,71,87,0.12) 0%, transparent 50%)",
      animation: "warm-pulse 4s ease-in-out infinite",
    },
  }

  const config = backgrounds[stressLevel]

  return (
    <div
      className={cn("fixed inset-0 -z-10 pointer-events-none", className)}
      aria-hidden="true"
      style={{ transition: "background-color 2s ease-in-out" }}
    >
      {/* Base color */}
      <div
        className="absolute inset-0 transition-colors duration-[2000ms]"
        style={{ backgroundColor: config.bg }}
      />
      {/* Overlay gradient */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{ background: config.overlay, animation: config.animation }}
      />
      {/* Emergency pulse overlay */}
      {stressLevel === "emergency" && (
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at 0% 50%, rgba(255,71,87,0.04) 0%, transparent 30%), radial-gradient(ellipse at 100% 50%, rgba(255,71,87,0.04) 0%, transparent 30%)",
            animation: "warm-pulse 4s ease-in-out infinite",
          }}
        />
      )}
    </div>
  )
}
