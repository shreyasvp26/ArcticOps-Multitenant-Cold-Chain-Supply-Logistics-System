"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Snowflake, LogIn, Thermometer } from "lucide-react"
import Link from "next/link"
import { useAuthStore } from "@/lib/store/auth-store"
import { pageVariants, cardVariants, staggerContainer, staggerChild } from "@/lib/utils/motion"
import { DEMO_USERS, ROLE_DASHBOARD } from "@/lib/constants/roles"

const DEMO_BUTTONS = [
  { key: "ops_manager" as const, label: "Ops Manager", role: "Operations", color: "#00C8A8", bgColor: "rgba(0,200,168,0.08)" },
  { key: "client_admin" as const, label: "Client Admin", role: "Pharma Client", color: "#4D9EFF", bgColor: "rgba(77,158,255,0.08)" },
  { key: "driver" as const, label: "Driver", role: "Transport", color: "#8B5CF6", bgColor: "rgba(139,92,246,0.08)" },
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
      className="w-full max-w-[440px] px-4 mx-auto"
    >
      <motion.div
        variants={cardVariants}
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(8,14,28,0.94)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(30,48,80,0.65)",
          boxShadow: "0 0 0 1px rgba(0,200,168,0.06), 0 32px 80px rgba(0,0,0,0.55), 0 0 120px rgba(0,200,168,0.02)",
        }}
      >
        {/* Top teal line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: "linear-gradient(90deg, transparent 0%, rgba(0,200,168,0.5) 35%, rgba(0,200,168,0.85) 50%, rgba(0,200,168,0.5) 65%, transparent 100%)" }}
          aria-hidden="true"
        />

        {/* Faint inner glow */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0,200,168,0.05) 0%, transparent 100%)" }}
          aria-hidden="true"
        />

        <div className="p-8">
          {/* Brand header */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{
                background: "radial-gradient(circle at 30% 30%, rgba(0,200,168,0.2) 0%, rgba(0,200,168,0.08) 100%)",
                border: "1px solid rgba(0,200,168,0.2)",
                boxShadow: "0 0 20px rgba(0,200,168,0.1)",
              }}
            >
              <Snowflake className="w-5 h-5" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-[18px] font-bold leading-none" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.02em" }}>
                ArcticOps
              </h1>
              <p className="text-[11px] mt-0.5 tracking-wide uppercase" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
                Cold-Chain Control Tower
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(46,213,115,0.08)", border: "1px solid rgba(46,213,115,0.2)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22E574", boxShadow: "0 0 6px rgba(46,213,115,0.6)" }} aria-hidden="true" />
              <span className="text-[10px] font-medium" style={{ color: "#2ED573", fontFamily: "var(--ao-font-mono)" }}>Online</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-[24px] font-semibold mb-1.5" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)", letterSpacing: "-0.02em" }}>
              Sign in
            </h2>
            <p className="text-sm" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-[12px] font-semibold mb-2 tracking-wide uppercase"
                style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: undefined })) }}
                className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all"
                style={{
                  backgroundColor: "rgba(12,22,42,0.8)",
                  border: `1px solid ${fieldErrors.email ? "rgba(255,71,87,0.6)" : "rgba(30,48,80,0.8)"}`,
                  color: "var(--ao-text-primary)",
                  fontFamily: "var(--ao-font-body)",
                  boxShadow: fieldErrors.email ? "0 0 0 3px rgba(255,71,87,0.08)" : "none",
                }}
                placeholder="you@company.com"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,200,168,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,168,0.08)" }}
                onBlur={(e) => { e.target.style.borderColor = fieldErrors.email ? "rgba(255,71,87,0.6)" : "rgba(30,48,80,0.8)"; e.target.style.boxShadow = fieldErrors.email ? "0 0 0 3px rgba(255,71,87,0.08)" : "none" }}
              />
              {fieldErrors.email && (
                <p id="email-error" className="mt-1.5 text-[12px] flex items-center gap-1" style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>
                  <span aria-hidden="true">↑</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-[12px] font-semibold mb-2 tracking-wide uppercase"
                style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}
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
                  className="w-full px-4 py-3 pr-12 rounded-xl text-[14px] outline-none transition-all"
                  style={{
                    backgroundColor: "rgba(12,22,42,0.8)",
                    border: `1px solid ${fieldErrors.password ? "rgba(255,71,87,0.6)" : "rgba(30,48,80,0.8)"}`,
                    color: "var(--ao-text-primary)",
                    fontFamily: "var(--ao-font-body)",
                    boxShadow: fieldErrors.password ? "0 0 0 3px rgba(255,71,87,0.08)" : "none",
                  }}
                  placeholder="••••••••"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,200,168,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(0,200,168,0.08)" }}
                  onBlur={(e) => { e.target.style.borderColor = fieldErrors.password ? "rgba(255,71,87,0.6)" : "rgba(30,48,80,0.8)"; e.target.style.boxShadow = fieldErrors.password ? "0 0 0 3px rgba(255,71,87,0.08)" : "none" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors hover:opacity-80"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />
                    : <Eye className="w-4 h-4" style={{ color: "var(--ao-text-muted)" }} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p id="password-error" className="mt-1.5 text-[12px]" style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {serverError && (
              <div
                className="px-4 py-3 rounded-xl text-[13px] flex items-start gap-2.5"
                role="alert"
                style={{
                  backgroundColor: "rgba(255,71,87,0.08)",
                  border: "1px solid rgba(255,71,87,0.25)",
                  color: "var(--ao-danger)",
                  fontFamily: "var(--ao-font-body)",
                }}
              >
                <span className="text-[16px] leading-none mt-0.5" aria-hidden="true">⚠</span>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2.5 transition-all"
              style={{
                background: isSubmitting
                  ? "rgba(0,200,168,0.5)"
                  : "linear-gradient(135deg, #00C8A8 0%, #00A88C 100%)",
                color: "#060D1B",
                fontFamily: "var(--ao-font-body)",
                boxShadow: isSubmitting ? "none" : "0 4px 20px rgba(0,200,168,0.25), 0 0 0 1px rgba(0,200,168,0.2)",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <LogIn className="w-4 h-4" aria-hidden="true" />
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(30,48,80,0.8))" }} />
            <span className="text-[10px] uppercase tracking-widest px-1" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
              Demo Access
            </span>
            <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(30,48,80,0.8), transparent)" }} />
          </div>

          {/* Quick-login demo buttons */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-3 gap-2"
          >
            {DEMO_BUTTONS.map(({ key, label, role, color, bgColor }) => (
              <motion.button
                key={key}
                type="button"
                variants={staggerChild}
                onClick={() => handleDemoLogin(key)}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all"
                style={{
                  backgroundColor: bgColor,
                  border: `1px solid ${color}25`,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}50`; (e.currentTarget as HTMLElement).style.backgroundColor = `${color}12` }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}25`; (e.currentTarget as HTMLElement).style.backgroundColor = bgColor }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} aria-hidden="true" />
                <span className="text-[12px] font-semibold leading-none" style={{ color, fontFamily: "var(--ao-font-body)" }}>{label}</span>
                <span className="text-[10px] leading-none" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{role}</span>
              </motion.button>
            ))}
          </motion.div>

          <p className="mt-6 text-center text-[13px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
            New to ArcticOps?{" "}
            <Link href="/signup" className="transition-colors hover:opacity-80 font-medium" style={{ color: "var(--ao-accent)" }}>
              Activate your account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Bottom badge */}
      <div className="flex items-center justify-center gap-2 mt-5">
        <Thermometer className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
        <span className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
          Secure pharmaceutical cold-chain platform
        </span>
      </div>
    </motion.div>
  )
}
