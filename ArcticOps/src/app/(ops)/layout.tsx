import { OpsLayoutShell } from "@/components/ops/layout-shell"

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <OpsLayoutShell>{children}</OpsLayoutShell>
}
