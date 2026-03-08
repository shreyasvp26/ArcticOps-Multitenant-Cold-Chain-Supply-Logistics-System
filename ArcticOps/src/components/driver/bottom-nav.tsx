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
      className="flex items-stretch shrink-0"
      style={{
        background: "linear-gradient(180deg, rgba(7,12,25,0.98) 0%, rgba(5,10,19,0.99) 100%)",
        borderTop: "1px solid rgba(30,48,80,0.7)",
        backdropFilter: "blur(24px)",
        height: "68px",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
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
              "flex-1 flex flex-col items-center justify-center gap-1.5 transition-all relative py-2",
              active ? "" : "hover:opacity-75"
            )}
            aria-current={active ? "page" : undefined}
          >
            {/* Active indicator */}
            {active && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ backgroundColor: "var(--ao-accent)", boxShadow: "0 0 8px rgba(0,200,168,0.6)" }}
                aria-hidden="true"
              />
            )}
            <div
              className="p-1.5 rounded-xl transition-all"
              style={active ? {
                backgroundColor: "rgba(0,200,168,0.1)",
                border: "1px solid rgba(0,200,168,0.15)",
              } : {}}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: active ? "var(--ao-accent)" : "rgba(148,163,184,0.5)" }}
                aria-hidden="true"
              />
            </div>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide"
              style={{
                color: active ? "var(--ao-accent)" : "rgba(100,116,139,0.7)",
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
