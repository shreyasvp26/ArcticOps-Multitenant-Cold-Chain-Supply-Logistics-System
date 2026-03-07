"use client"
import { motion } from "framer-motion"
import { pageVariants } from "@/lib/utils/motion"

interface FrostTransitionProps {
  children: React.ReactNode
  className?: string
}

export function FrostTransition({ children, className }: FrostTransitionProps) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  )
}
