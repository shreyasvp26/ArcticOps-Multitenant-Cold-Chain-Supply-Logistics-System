"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Snowflake, LogIn } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/store/auth-store"
import { pageVariants, cardVariants, staggerContainer, staggerChild } from "@/lib/utils/motion"
import { DEMO_USERS, ROLE_DASHBOARD } from "@/lib/constants/roles"

const DEMO_BUTTONS = [
  { key: "ops_manager" as const, label: "Login as Ops Manager", color: "#00D4AA" },
  { key: "client_admin" as const, label: "Login as Client Admin", color: "#3B82F6" },
  { key: "driver" as const, label: "Login as Driver", color: "#7C3AED" },
]

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginAs } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    const errs: { email?: string; password?: string } = {}
    if (!email.trim()) errs.email = "Enter your email"
    else if (!isValidEmail(email)) errs.email = "Enter a valid email address"
    if (!password) errs.password = "Enter your password"
    else if (password.length < 6) errs.password = "Password must be at least 6 characters"
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    const result = login(email.trim(), password)
    if (result.success && result.redirectTo) {
      router.push(result.redirectTo)
    } else {
      setServerError(result.error ?? "Login failed")
      setIsSubmitting(false)
    }
  }

  const handleDemoLogin = (key: keyof typeof DEMO_USERS) => {
    const user = DEMO_USERS[key]
    setEmail(user.email)
    setPassword(user.password)
    setFieldErrors({})
    setServerError("")
    loginAs(key)
    router.push(ROLE_DASHBOARD[user.role])
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-[480px] px-4"
    >
      {/* Glass card */}
      <motion.div
        variants={cardVariants}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17,29,51,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(36,51,82,0.8)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,212,170,0.04)",
        }}
      >
        {/* Top glow accent */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4"
          style={{ background: "linear-gradient(90deg, transparent, var(--ao-accent), transparent)" }}
          aria-hidden="true"
        />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(0,212,170,0.12)" }}>
              <Snowflake className="w-6 h-6" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                ArcticOps
              </h1>
              <p className="text-[12px]" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
                Cold-Chain Control Tower
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
            Sign in
          </h2>
          <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
            Enter your credentials to access your dashboard
          </p>

          {/* Login form */}
          <form onSubmit={onSubmit} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
                style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{
                  backgroundColor: "rgba(26,41,66,0.8)",
                  border: `1px solid ${fieldErrors.email ? "var(--ao-danger)" : "var(--ao-border)"}`,
                  color: "var(--ao-text-primary)",
                  fontFamily: "var(--ao-font-body)",
                }}
                placeholder="you@company.com"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-[12px]" style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
                style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })) }}
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(26,41,66,0.8)",
                    border: `1px solid ${fieldErrors.password ? "var(--ao-danger)" : "var(--ao-border)"}`,
                    color: "var(--ao-text-primary)",
                    fontFamily: "var(--ao-font-body)",
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                    : <Eye className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-[12px]" style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {serverError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm"
                role="alert"
                style={{
                  backgroundColor: "rgba(255,71,87,0.10)",
                  border: "1px solid rgba(255,71,87,0.3)",
                  color: "var(--ao-danger)",
                  fontFamily: "var(--ao-font-body)",
                }}
              >
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
              style={{
                backgroundColor: "var(--ao-accent)",
                color: "#0A1628",
                fontFamily: "var(--ao-font-body)",
              }}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--ao-border)" }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              Demo Access
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "var(--ao-border)" }} />
          </div>

          {/* Quick-login demo buttons */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="flex flex-col gap-2"
          >
            {DEMO_BUTTONS.map(({ key, label, color }) => (
              <motion.button
                key={key}
                type="button"
                variants={staggerChild}
                onClick={() => handleDemoLogin(key)}
                className="w-full py-2.5 px-4 rounded-lg text-sm font-medium text-left flex items-center gap-3 transition-all hover:brightness-110"
                style={{
                  backgroundColor: `${color}14`,
                  border: `1px solid ${color}30`,
                  color,
                  fontFamily: "var(--ao-font-body)",
                }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
                {label}
                <span className="ml-auto text-[11px] opacity-60" style={{ fontFamily: "var(--ao-font-mono)" }}>
                  {DEMO_USERS[key].email}
                </span>
              </motion.button>
            ))}
          </motion.div>

          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            New to ArcticOps?{" "}
            <Link href="/signup" className="transition-colors hover:opacity-80" style={{ color: "var(--ao-accent)" }}>
              Activate your account
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
