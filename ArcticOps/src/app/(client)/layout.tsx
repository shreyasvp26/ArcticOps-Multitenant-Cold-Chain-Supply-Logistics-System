import { ClientLayoutShell } from "@/components/client/layout-shell"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutShell>{children}</ClientLayoutShell>
}
