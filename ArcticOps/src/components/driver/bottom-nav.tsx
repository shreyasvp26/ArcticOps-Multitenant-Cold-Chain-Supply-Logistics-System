"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, Navigation, Thermometer, PackageCheck, FileText } from "lucide-react"
import { cn } from "@/lib/utils/cn"

const TABS = [
  { label: "Assignment", href: "/assignment", icon: ClipboardList },
  { label: "Navigate", href: "/navigate", icon: Navigation },
  { label: "Monitor", href: "/monitor", icon: Thermometer },
  { label: "Documents", href: "/driver/documents", icon: FileText },
  { label: "Deliver", href: "/deliver", icon: PackageCheck },
]

export function DriverBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="flex items-stretch h-16 border-t shrink-0"
      style={{
        backgroundColor: "rgba(10,22,40,0.98)",
        borderColor: "var(--ao-border)",
        backdropFilter: "blur(20px)",
      }}
      aria-label="Driver navigation"
    >
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-1 transition-all",
              active ? "" : "opacity-50 hover:opacity-75"
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className="w-5 h-5"
              style={{ color: active ? "var(--ao-accent)" : "var(--ao-text-muted)" }}
              aria-hidden="true"
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: active ? "var(--ao-accent)" : "var(--ao-text-muted)",
                fontFamily: "var(--ao-font-body)",
              }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
