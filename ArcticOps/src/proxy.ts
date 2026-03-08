import { type NextRequest, NextResponse } from "next/server"

// ── Public paths that never require authentication ─────────────
const PUBLIC_PATHS = ["/login", "/signup", "/setup"]
const STATIC_PREFIXES = ["/_next", "/favicon.ico", "/fonts", "/images"]

// ── Role → allowed path prefixes ──────────────────────────────
const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  super_admin: ["/dashboard", "/shipments", "/inventory", "/route-planner", "/carriers", "/transport", "/compliance", "/analytics", "/settings", "/notifications", "/profile"],
  ops_manager: ["/dashboard", "/shipments", "/inventory", "/route-planner", "/carriers", "/transport", "/compliance", "/analytics", "/settings", "/notifications", "/profile"],
  compliance_officer: ["/dashboard", "/shipments", "/compliance", "/analytics", "/notifications", "/profile"],
  client_admin: ["/home", "/tracker", "/procurement", "/documents", "/communications", "/client/settings", "/client/notifications", "/client/profile"],
  client_viewer: ["/home", "/tracker", "/documents", "/communications", "/client/notifications", "/client/profile"],
  driver: ["/assignment", "/navigate", "/monitor", "/deliver", "/driver", "/notifications", "/profile"],
}

const ROLE_REDIRECT: Record<string, string> = {
  super_admin: "/dashboard",
  ops_manager: "/dashboard",
  compliance_officer: "/dashboard",
  client_admin: "/home",
  client_viewer: "/home",
  driver: "/assignment",
}

function parseMockToken(token: string): { role: string; tenantId: string | null; exp: number } | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3 || parts[0] !== "mock") return null
    const payload = JSON.parse(atob(parts[1]!))
    if (payload.exp && payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function getTokenFromRequest(request: NextRequest): string | null {
  // Check cookie first (persisted auth)
  const cookieToken = request.cookies.get("ao_token")?.value
  if (cookieToken) return cookieToken

  // Check Authorization header as fallback
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7)

  return null
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow static assets and Next.js internals
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  // Always allow public auth pages
  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.next()
  }

  // Root redirect: /  → /login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Try to get and parse the auth token
  const token = getTokenFromRequest(request)

  if (!token) {
    // Not authenticated — redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = parseMockToken(token)

  if (!payload) {
    // Invalid / expired token — redirect to login
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("reason", "session_expired")
    return NextResponse.redirect(loginUrl)
  }

  const { role } = payload
  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] ?? []

  // Check if current path is allowed for this role
  const isAllowed = allowedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )

  if (!isAllowed) {
    // Redirect to the role's canonical dashboard
    const redirectPath = ROLE_REDIRECT[role] ?? "/login"
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
}
