"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Snowflake, ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react"
import { Stepper } from "@/components/shared/stepper"
import { pageVariants, stepForwardVariants, stepBackwardVariants } from "@/lib/utils/motion"
import { useAuthStore } from "@/lib/store/auth-store"

const COMPLIANCE_FRAMEWORKS = [
  { id: "GDP", label: "GDP", description: "Good Distribution Practice" },
  { id: "GMP", label: "GMP", description: "Good Manufacturing Practice" },
  { id: "WHO_PQS", label: "WHO PQS", description: "WHO Pre-Qualification" },
  { id: "IATA_DGR", label: "IATA DGR", description: "Dangerous Goods Regulations" },
  { id: "IMDG_CODE", label: "IMDG Code", description: "Marine Dangerous Goods" },
  { id: "ADR", label: "ADR", description: "European Road Transport" },
  { id: "GDP_EU", label: "EU GDP", description: "European Union GDP Annex" },
  { id: "USP", label: "USP 1079", description: "US Pharmacopeia Cold Chain" },
]

const STEPS = [
  { id: "org", label: "Organization" },
  { id: "compliance", label: "Compliance" },
  { id: "invites", label: "Team" },
]

interface Invite { email: string; role: "client_admin" | "client_viewer" }

export default function SetupPage() {
  const router = useRouter()
  const { loginAs } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<"forward" | "back">("forward")

  // Step 1
  const [orgName, setOrgName] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")

  // Step 2
  const [frameworks, setFrameworks] = useState<string[]>([])

  // Step 3
  const [invites, setInvites] = useState<Invite[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [newRole, setNewRole] = useState<"client_admin" | "client_viewer">("client_viewer")
  const [error, setError] = useState("")

  const goNext = () => { setDirection("forward"); setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1)) }
  const goBack = () => { setDirection("back"); setCurrentStep((s) => Math.max(s - 1, 0)) }

  const toggleFramework = (id: string) => {
    setFrameworks((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const addInvite = () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      setError("Enter a valid email address")
      return
    }
    if (invites.some((i) => i.email === newEmail.trim())) {
      setError("Email already added")
      return
    }
    setInvites((prev) => [...prev, { email: newEmail.trim(), role: newRole }])
    setNewEmail("")
    setError("")
  }

  const removeInvite = (email: string) => {
    setInvites((prev) => prev.filter((i) => i.email !== email))
  }

  const handleFinish = () => {
    loginAs("client_admin")
    router.push("/home")
  }

  // Cold-to-warm gradient background based on step
  const stepGradients = [
    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.06) 0%, transparent 70%)",
    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)",
    "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)",
  ]

  const variants = direction === "forward" ? stepForwardVariants : stepBackwardVariants

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full max-w-[560px] px-4"
    >
      {/* Ambient background gradient shifts with step */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none transition-all duration-700"
        style={{ background: stepGradients[currentStep] ?? stepGradients[0] }}
        aria-hidden="true"
      />

      <div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: "rgba(17,29,51,0.88)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(36,51,82,0.8)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 transition-all duration-700"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              currentStep === 0 ? "var(--ao-accent)" : currentStep === 1 ? "#3B82F6" : "#7C3AED"
            }, transparent)`,
          }}
          aria-hidden="true"
        />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(0,212,170,0.12)" }}>
              <Snowflake className="w-5 h-5" style={{ color: "var(--ao-accent)" }} aria-hidden="true" />
            </div>
            <span className="text-sm font-medium" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-muted)" }}>
              ArcticOps Setup
            </span>
          </div>

          {/* Stepper */}
          <Stepper steps={STEPS} currentStep={currentStep} className="mb-8" />

          {/* Step content */}
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step-org" variants={variants} initial="initial" animate="animate" exit="exit">
                <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                  Tell us about your organization
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                  This information will be visible to your ArcticOps operations team
                </p>

                {[
                  { id: "orgName", label: "Company Name", value: orgName, setter: setOrgName, placeholder: "PharmaAlpha Inc." },
                  { id: "contactName", label: "Primary Contact Name", value: contactName, setter: setContactName, placeholder: "Dr. Sarah Chen" },
                  { id: "contactEmail", label: "Primary Contact Email", value: contactEmail, setter: setContactEmail, placeholder: "s.chen@pharmaalpha.com" },
                ].map(({ id, label, value, setter, placeholder }) => (
                  <div key={id} className="mb-4">
                    <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                      {label}
                    </label>
                    <input
                      id={id}
                      type={id === "contactEmail" ? "email" : "text"}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                      style={{
                        backgroundColor: "rgba(26,41,66,0.8)",
                        border: "1px solid var(--ao-border)",
                        color: "var(--ao-text-primary)",
                        fontFamily: "var(--ao-font-body)",
                      }}
                    />
                  </div>
                ))}

                <button
                  onClick={goNext}
                  disabled={!orgName.trim() || !contactName.trim() || !contactEmail.trim()}
                  className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50 mt-6"
                  style={{ backgroundColor: "var(--ao-accent)", color: "#0A1628", fontFamily: "var(--ao-font-body)" }}
                >
                  Next: Compliance <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="step-compliance" variants={variants} initial="initial" animate="animate" exit="exit">
                <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                  Compliance frameworks
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                  Select all frameworks your operations must comply with. This configures your document checklist and audit trail.
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {COMPLIANCE_FRAMEWORKS.map(({ id, label, description }) => {
                    const selected = frameworks.includes(id)
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFramework(id)}
                        className="text-left p-3 rounded-xl transition-all"
                        style={{
                          backgroundColor: selected ? "rgba(59,130,246,0.14)" : "rgba(26,41,66,0.6)",
                          border: `1px solid ${selected ? "rgba(59,130,246,0.5)" : "var(--ao-border)"}`,
                          boxShadow: selected ? "0 0 12px rgba(59,130,246,0.1)" : "none",
                        }}
                        aria-pressed={selected}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[13px] font-semibold" style={{ color: selected ? "#3B82F6" : "var(--ao-text-primary)", fontFamily: "var(--ao-font-mono)" }}>
                            {label}
                          </span>
                          {selected && <Check className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} aria-hidden="true" />}
                        </div>
                        <p className="text-[11px]" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>{description}</p>
                      </button>
                    )
                  })}
                </div>

                {frameworks.length === 0 && (
                  <p className="text-[12px] text-center mb-4" style={{ color: "var(--ao-warning)", fontFamily: "var(--ao-font-body)" }}>
                    Select at least one compliance framework
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
                    style={{ backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                  </button>
                  <button
                    onClick={goNext}
                    disabled={frameworks.length === 0}
                    className="flex-[2] py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ backgroundColor: "#3B82F6", color: "white", fontFamily: "var(--ao-font-body)" }}
                  >
                    Next: Team <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step-team" variants={variants} initial="initial" animate="animate" exit="exit">
                <h2 className="text-2xl font-semibold mb-1" style={{ fontFamily: "var(--ao-font-display)", color: "var(--ao-text-primary)" }}>
                  Invite your team
                </h2>
                <p className="text-sm mb-6" style={{ fontFamily: "var(--ao-font-body)", color: "var(--ao-text-secondary)" }}>
                  Optionally invite team members now — you can always add more later
                </p>

                {/* Add invite */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => { setNewEmail(e.target.value); setError("") }}
                    onKeyDown={(e) => e.key === "Enter" && addInvite()}
                    placeholder="team@company.com"
                    className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "rgba(26,41,66,0.8)",
                      border: `1px solid ${error ? "var(--ao-danger)" : "var(--ao-border)"}`,
                      color: "var(--ao-text-primary)",
                      fontFamily: "var(--ao-font-body)",
                    }}
                    aria-label="Invite email address"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "client_admin" | "client_viewer")}
                    className="px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: "rgba(26,41,66,0.8)",
                      border: "1px solid var(--ao-border)",
                      color: "var(--ao-text-primary)",
                      fontFamily: "var(--ao-font-body)",
                    }}
                    aria-label="Role for invite"
                  >
                    <option value="client_viewer">Viewer</option>
                    <option value="client_admin">Admin</option>
                  </select>
                  <button
                    onClick={addInvite}
                    className="p-2.5 rounded-lg transition-all hover:brightness-110"
                    style={{ backgroundColor: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)", color: "#7C3AED" }}
                    aria-label="Add invite"
                  >
                    <Plus className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {error && (
                  <p className="text-[12px] mb-2" style={{ color: "var(--ao-danger)", fontFamily: "var(--ao-font-body)" }}>{error}</p>
                )}

                {/* Invite list */}
                {invites.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-4 max-h-40 overflow-y-auto">
                    {invites.map((invite) => (
                      <div
                        key={invite.email}
                        className="flex items-center justify-between px-3 py-2 rounded-lg"
                        style={{ backgroundColor: "rgba(26,41,66,0.6)", border: "1px solid var(--ao-border)" }}
                      >
                        <span className="text-sm" style={{ color: "var(--ao-text-primary)", fontFamily: "var(--ao-font-body)" }}>
                          {invite.email}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{
                            backgroundColor: invite.role === "client_admin" ? "rgba(59,130,246,0.12)" : "rgba(100,116,139,0.12)",
                            color: invite.role === "client_admin" ? "#3B82F6" : "#64748B",
                            fontFamily: "var(--ao-font-mono)",
                          }}>
                            {invite.role === "client_admin" ? "Admin" : "Viewer"}
                          </span>
                          <button
                            onClick={() => removeInvite(invite.email)}
                            className="hover:opacity-70 transition-opacity"
                            aria-label={`Remove ${invite.email}`}
                          >
                            <X className="w-3.5 h-3.5" style={{ color: "var(--ao-text-muted)" }} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {invites.length === 0 && (
                  <p className="text-[12px] text-center mb-4" style={{ color: "var(--ao-text-muted)", fontFamily: "var(--ao-font-body)" }}>
                    You can add team members later from Settings
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={goBack}
                    className="flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
                    style={{ backgroundColor: "var(--ao-surface-elevated)", color: "var(--ao-text-secondary)", fontFamily: "var(--ao-font-body)" }}
                  >
                    <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back
                  </button>
                  <button
                    onClick={handleFinish}
                    className="flex-[2] py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:brightness-110"
                    style={{ backgroundColor: "#7C3AED", color: "white", fontFamily: "var(--ao-font-body)" }}
                  >
                    Launch Dashboard <Check className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
