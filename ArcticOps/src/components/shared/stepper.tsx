"use client"
import { cn } from "@/lib/utils/cn"
import { Check } from "lucide-react"

interface Step {
  id: string | number
  label: string
  description?: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div
      className={cn("flex items-center w-full", className)}
      role="list"
      aria-label="Progress steps"
    >
      {steps.map((step, i) => {
        const isCompleted = i < currentStep
        const isCurrent = i === currentStep
        const isUpcoming = i > currentStep

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none" role="listitem">
            {/* Step circle */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  isCompleted && "bg-[var(--ao-success)] text-[#060D1B]",
                  isCurrent && "bg-[var(--ao-accent)] text-[#060D1B] ring-4 ring-[var(--ao-accent-subtle)]",
                  isUpcoming && "border-2 border-[var(--ao-border)] text-[var(--ao-text-muted)]"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <span style={{ fontFamily: "var(--ao-font-mono)" }}>{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 text-[11px] text-center max-w-[80px] leading-tight",
                  isCurrent && "text-[var(--ao-accent)] font-medium",
                  isCompleted && "text-[var(--ao-success)]",
                  isUpcoming && "text-[var(--ao-text-muted)]"
                )}
                style={{ fontFamily: "var(--ao-font-body)" }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300"
                style={{
                  backgroundColor: i < currentStep ? "var(--ao-success)" : "var(--ao-border)",
                }}
                aria-hidden="true"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
