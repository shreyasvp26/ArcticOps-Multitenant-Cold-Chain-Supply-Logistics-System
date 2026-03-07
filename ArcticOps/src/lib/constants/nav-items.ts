export interface NavItem {
  label: string
  href: string
  icon: string
  badge?: string
}

export const OPS_NAV_ITEMS: NavItem[] = [
  { label: "Command Center", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Shipments", href: "/shipments", icon: "Package" },
  { label: "Inventory", href: "/inventory", icon: "Boxes" },
  { label: "Route Planner", href: "/route-planner", icon: "Map" },
  { label: "Carriers", href: "/carriers", icon: "Truck" },
  { label: "Transport", href: "/transport", icon: "Users" },
  { label: "Compliance", href: "/compliance", icon: "ShieldCheck" },
  { label: "Analytics", href: "/analytics", icon: "BarChart3" },
  { label: "Settings", href: "/settings", icon: "Settings" },
]

export const CLIENT_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/home", icon: "Home" },
  { label: "Shipment Tracker", href: "/tracker", icon: "MapPin" },
  { label: "Procurement", href: "/procurement", icon: "ShoppingCart" },
  { label: "Documents", href: "/documents", icon: "FileText" },
  { label: "Communications", href: "/communications", icon: "MessageSquare" },
  { label: "Settings", href: "/settings", icon: "Settings" },
]

export const DRIVER_NAV_ITEMS: NavItem[] = [
  { label: "Assignment", href: "/assignment", icon: "ClipboardList" },
  { label: "Navigate", href: "/navigate", icon: "Navigation" },
  { label: "Monitor", href: "/monitor", icon: "Thermometer" },
  { label: "Documents", href: "/deliver", icon: "FileText" },
  { label: "Deliver", href: "/deliver", icon: "PackageCheck" },
]
