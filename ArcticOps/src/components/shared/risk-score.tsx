"use client"
import { cn } from "@/lib/utils/cn"
import { getRiskColor } from "@/lib/utils/risk"

interface RiskScoreProps {
  score: number
  size?: "sm" | "md" | "lg"
  label?: string
  showLabel?: boolean
  className?: string
}

export function RiskScore({ score, size = "md", label, showLabel = true, className }: RiskScoreProps) {
  const clampedScore = Math.max(0, Math.min(100, score))
  const color = getRiskColor(clampedScore)
  const riskLabel = label ?? (clampedScore <= 25 ? "Low" : clampedScore <= 50 ? "Medium" : clampedScore <= 75 ? "High" : "Critical")

  const dimensions = {
    sm: { size: 48, stroke: 4, cx: 24, r: 18, fontSize: "11px", scoreSize: "13px" },
    md: { size: 72, stroke: 5, cx: 36, r: 28, fontSize: "12px", scoreSize: "16px" },
    lg: { size: 96, stroke: 6, cx: 48, r: 38, fontSize: "13px", scoreSize: "20px" },
  }

  const d = dimensions[size]
  const circumference = 2 * Math.PI * d.r
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}
      aria-label={`Risk score: ${clampedScore} out of 100, ${riskLabel} risk`}>
      <svg
        width={d.size}
        height={d.size}
        viewBox={`0 0 ${d.size} ${d.size}`}
        className="rotate-[-90deg]"
        aria-hidden="true"
      >
        {/* Background track */}
        <circle
          cx={d.cx}
          cy={d.cx}
          r={d.r}
          fill="none"
          stroke="var(--ao-border)"
          strokeWidth={d.stroke}
        />
        {/* Score arc */}
        <circle
          cx={d.cx}
          cy={d.cx}
          r={d.r}
          fill="none"
          stroke={color}
          strokeWidth={d.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
        />
        {/* Score text — counter-rotated */}
        <text
          x={d.cx}
          y={d.cx + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={d.scoreSize}
          fontFamily="var(--ao-font-mono)"
          fontWeight="600"
          transform={`rotate(90, ${d.cx}, ${d.cx})`}
        >
          {clampedScore}
        </text>
      </svg>
      {showLabel && (
        <span className="text-[var(--ao-text-muted)]" style={{ fontSize: d.fontSize, fontFamily: "var(--ao-font-body)" }}>
          {riskLabel} Risk
        </span>
      )}
    </div>
  )
}
