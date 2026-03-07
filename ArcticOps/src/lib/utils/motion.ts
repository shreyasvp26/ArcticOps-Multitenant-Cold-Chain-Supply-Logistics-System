import type { Variants } from "framer-motion"

// ── Standard transition configs ────────────────────────────────
export const spring = { type: "spring", stiffness: 300, damping: 30 } as const
export const smooth = { type: "tween", ease: "easeInOut", duration: 0.4 } as const
export const fast = { type: "tween", ease: "easeInOut", duration: 0.2 } as const
export const instant = { type: "tween", ease: "linear", duration: 0.1 } as const

// ── Page transition — frost dissolve ──────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, filter: "blur(8px)", scale: 0.98 },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    filter: "blur(4px)",
    scale: 0.99,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

// ── Card entrance (staggered child) ───────────────────────────
export const cardVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.15, ease: "easeIn" },
  },
}

// ── Toast notification — slide in from right ──────────────────
export const toastVariants: Variants = {
  initial: { opacity: 0, x: 100, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    x: 50,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
}

// ── Stagger container — wraps staggered children ──────────────
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
}

// ── Stagger child — used inside staggerContainer ──────────────
export const staggerChild: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: "easeIn" },
  },
}

// ── Sidebar collapse ──────────────────────────────────────────
export const sidebarVariants: Variants = {
  expanded: { width: 240, transition: { duration: 0.3, ease: "easeInOut" } },
  collapsed: { width: 64, transition: { duration: 0.3, ease: "easeInOut" } },
}

// ── Modal / dropdown condensation fade ───────────────────────
export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.97, y: -8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: 0.15, ease: "easeIn" },
  },
}

// ── Backdrop fade ─────────────────────────────────────────────
export const backdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ── Fade in only ─────────────────────────────────────────────
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// ── Step wizard horizontal slide ─────────────────────────────
export const stepForwardVariants: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease: "easeIn" } },
}

export const stepBackwardVariants: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, x: 40, transition: { duration: 0.2, ease: "easeIn" } },
}
