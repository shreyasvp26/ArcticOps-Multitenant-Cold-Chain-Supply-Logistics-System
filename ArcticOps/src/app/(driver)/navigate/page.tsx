"use client"
import dynamic from "next/dynamic"

const DriverLiveMap = dynamic(
  () => import("@/components/driver/live-map").then((m) => ({ default: m.DriverLiveMap })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#060D1B",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "2.5px solid rgba(0,200,168,0.3)",
            borderTopColor: "#00C8A8",
            animation: "spin 0.9s linear infinite",
          }}
        />
        <p style={{ color: "#64748B", fontSize: 12, fontFamily: "var(--ao-font-body)" }}>
          Loading navigation…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    ),
  }
)

export default function NavigatePage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <DriverLiveMap />
    </div>
  )
}
