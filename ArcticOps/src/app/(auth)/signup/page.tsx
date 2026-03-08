"use client"
import { useState, useRef, KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Snowflake, ArrowLeft, ArrowRight, User, Mail, Lock } from "lucide-react"
import Link from "next/link"
import { VALID_ACTIVATION_CODES } from "@/lib/mock-data/clients"
import { pageVariants, cardVariants, stepForwardVariants, stepBackwardVariants } from "@/lib/utils/motion"

type Step = "code" | "details"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("code")
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", "", ""])
  const [codeError, setCodeError] = useState("")
  const [validCode, setValidCode] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [formError, setFormError] = useState("")
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const code = codeDigits.join("")

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const newDigits = [...codeDigits]
    newDigits[index] = digit
    setCodeDigits(newDigits)
    setCodeError("")
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (!digit && index > 0 && value === "") inputRefs.current[index - 1]?.focus()
  }

  const handleDigitKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 6)
    const digits = pasted.split("")
    const newDigits = [...codeDigits]
    digits.forEach((d, i) => { if (i < 6) newDigits[i] = d })
    setCodeDigits(newDigits)
    e.preventDefault()
  }

  const validateCode = () => {
    const upperCode = code.toUpperCase()
    if (!VALID_ACTIVATION_CODES.includes(upperCode)) {
      setCodeError("Activation code not recognized. Please check your email for the correct code, or contact your operations team.")
      return
    }
    setValidCode(upperCode)
    setStep("details")
  }

  const handleDetailsSubmit = () => {
    setFormError("")
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError("All fields are required.")
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Enter a valid email address.")
      return
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.")
      return
    }
    router.push("/setup")
  }

  const cardStyle = {
    background: "rgba(13,22,41,0.88)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(30,48,80,0.8)",
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-[480px] px-4"
    >
      <motion.div
        variants={cardVariants}
        className="relative rounded-2xl overflow-hidden"
        style={cardStyle}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4"
          style={{ background: "linear-gradient(90deg, transparent, var(--ao-accent), transparent)" }}
          aria-hidden="true"
        />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(0,200,168,0.12)" }}>
              <Snowflake className="w-6 h-6" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>ArcticOps</h1>
              <p className="text-[12px]" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>Activate your account</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "code" && (
              <motion.div key="code-step" variants={stepForwardVariants} initial="initial" animate="animate" exit="exit">
                <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                  Enter activation code
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                  Enter the 6-character code sent to your organization&apos;s email
                </p>

                {/* OTP-style code inputs */}
                <div className="flex gap-2 mb-4 justify-center" onPaste={handlePaste}>
                  {codeDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value.toUpperCase())}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all uppercase"
                      style={{
                        backgroundColor: "rgba(26,41,66,0.9)",
                        border: `2px solid ${codeError ? "var(--ao-danger)" : digit ? "var(--ao-accent)" : "var(--ao-border)"}`,
                        color: "var(--ao-text-primary)",
                        fontFamily: "var(--ao-font-mono)",
                        boxShadow: digit ? "0 0 12px rgba(0,200,168,0.12)" : "none",
                      }}
                      aria-label={`Activation code digit ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Demo hint */}
                <p className="text-center text-[11px] mb-4" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-mono)" }}>
                  Demo codes: PA7821 · BV4953 · CM3367
                </p>

                {codeError && (
                  <div
                    className="mb-4 px-4 py-3 rounded-lg text-sm"
                    role="alert"
                    style={{ backgroundColor: "rgba(255,71,87,0.10)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}
                  >
                    {codeError}
                  </div>
                )}

                <button
                  onClick={validateCode}
                  disabled={code.length < 6}
                  className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}
                >
                  Continue <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <p className="mt-4 text-center text-[13px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                  Already have an account?{" "}
                  <Link href="/login" className="transition-colors hover:opacity-80" style={{ color: "var(--ao-accent)" }}>Sign in</Link>
                </p>
              </motion.div>
            )}

            {step === "details" && (
              <motion.div key="details-step" variants={stepForwardVariants} initial="initial" animate="animate" exit="exit">
                <button
                  onClick={() => setStep("code")}
                  className="flex items-center gap-2 mb-6 text-sm transition-opacity hover:opacity-80"
                  style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                </button>

                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{ backgroundColor: "rgba(0,200,168,0.12)", border: "1px solid rgba(0,200,168,0.2)" }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--ao-accent)" }} aria-hidden="true" />
                  <span className="text-[12px] font-medium" style={{ color: "var(--ao-accent)", fontFamily: "var(--ao-font-mono)" }}>
                    Code validated: {validCode}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                  Create your profile
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                  Set up your personal account details
                </p>

                {[
                  { id: "name", label: "Full Name", type: "text", value: name, setter: setName, placeholder: "Dr. Sarah Chen", Icon: User, autoComplete: "name" },
                  { id: "email", label: "Work Email", type: "email", value: email, setter: setEmail, placeholder: "you@company.com", Icon: Mail, autoComplete: "email" },
                  { id: "password", label: "Password", type: "password", value: password, setter: setPassword, placeholder: "Min. 6 characters", Icon: Lock, autoComplete: "new-password" },
                ].map(({ id, label, type, value, setter, placeholder, Icon, autoComplete }) => (
                  <div key={id} className="mb-4">
                    <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                      <input
                        id={id}
                        type={type}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        autoComplete={autoComplete}
                        placeholder={placeholder}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                        style={{
                          backgroundColor: "rgba(26,41,66,0.8)",
                          border: "1px solid var(--ao-border)",
                          color: "var(--ao-text-primary)",
                          fontFamily: "var(--ao-font-body)",
                        }}
                      />
                    </div>
                  </div>
                ))}

                {formError && (
                  <div className="mb-4 px-4 py-3 rounded-lg text-sm" role="alert"
                    style={{ backgroundColor: "rgba(255,71,87,0.10)", border: "1px solid rgba(255,71,87,0.3)", color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>
                    {formError}
                  </div>
                )}

                <button
                  onClick={handleDetailsSubmit}
                  className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                  style={{ backgroundColor: "var(--ao-accent)", color: "#060D1B", fontFamily: "var(--ao-font-body)" }}
                >
                  Set up organization <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}
