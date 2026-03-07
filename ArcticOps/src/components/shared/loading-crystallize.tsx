"use client"
import { motion } from "framer-motion"
import { Snowflake } from "lucide-react"

interface LoadingCrystallizeProps {
  size?: "sm" | "md" | "lg"
  label?: string
}

const SIZES = { sm: 24, md: 40, lg: 64 }

export function LoadingCrystallize({ size = "md", label }: LoadingCrystallizeProps) {
  const px = SIZES[size]

  return (
    <div className="flex flex-col items-center justify-center gap-3" role="status" aria-label={label ?? "Loading"}>
      <div className="relative" style={{ width: px, height: px }}>
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2"
          style={{ borderColor: "var(--ao-accent)", opacity: 0.3 }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-[4px] rounded-full border"
          style={{ borderColor: "var(--ao-accent)", opacity: 0.5 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        {/* Core icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Snowflake
            style={{ width: px * 0.45, height: px * 0.45, color: "var(--ao-accent)" }}
          />
        </motion.div>
      </div>

      {label && (
        <p className="text-[12px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          {label}
        </p>
      )}
    </div>
  )
}
