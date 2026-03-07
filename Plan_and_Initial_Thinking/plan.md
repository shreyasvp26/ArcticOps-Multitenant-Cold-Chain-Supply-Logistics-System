# ArcticOps — Step-by-Step Implementation Roadmap

> **Instructions for AI**: Work on **one step at a time**. Do not move to the next step until the current step is fully complete and verified. Each step lists its deliverables — all must be present before proceeding. Reference `Prd.md`, `architecture.md`, and `Ai_rules.md` constantly during implementation.

---

## Step 1: Project Scaffolding

**Goal**: Set up the Next.js 15 project with all dependencies, configuration files, and the empty folder structure.

**Deliverables**:

1. Initialize a Next.js 15 project with TypeScript in a `coldvault/` directory at the workspace root
   - Use App Router (not Pages Router)
   - Enable `src/` directory
   - Enable Tailwind CSS v4
   - Enable ESLint

2. Install all dependencies:
   - **UI**: `@radix-ui/react-*` primitives (installed via shadcn/ui CLI), `cmdk`, `lucide-react`
   - **State**: `zustand`
   - **Animation**: `framer-motion`
   - **Charts**: `recharts`
   - **Maps**: `react-map-gl`, `mapbox-gl`
   - **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`
   - **Utilities**: `clsx`, `tailwind-merge`, `date-fns`
   - **Dev**: `@types/mapbox-gl`

3. Initialize shadcn/ui with the "new-york" style and configure for dark mode

4. Create the complete folder structure as defined in `architecture.md` section 2 — all directories should exist (with placeholder `.gitkeep` or `index.ts` barrel files where appropriate)

5. Configure `tailwind.config.ts` with the ColdVault theme:
   - All CSS variables from `Ai_rules.md` section 2 (Color System) added to `globals.css`
   - Font families registered (Space Grotesk, IBM Plex Sans, JetBrains Mono)
   - Custom animation keyframes for frost dissolve, crystallization, aurora, pulse

6. Create `src/lib/utils/cn.ts` with the `cn()` utility (clsx + tailwind-merge)

7. Configure `next.config.ts` for any needed image domains (Mapbox tiles)

8. Add a `.env.local` with a placeholder for `NEXT_PUBLIC_MAPBOX_TOKEN`

**Verification**: `npm run dev` starts without errors. Navigating to `localhost:3000` shows the default Next.js page with ColdVault's dark background color.

---

## Step 2: Design System Foundation

**Goal**: Build the core shared UI components and global styles that every dashboard will use.

**Deliverables**:

1. **Global Styles** (`src/app/globals.css`):
   - Full CSS variable system from `Ai_rules.md` section 2
   - Base styles: body background, font defaults, scrollbar styling (thin, dark)
   - Animation keyframes: `frost-dissolve`, `crystallize`, `aurora-shift`, `warm-pulse`, `breath`, `checkpoint-pulse`
   - `prefers-reduced-motion` media query disabling decorative animations

2. **shadcn/ui components** — install and customize for ColdVault's dark theme:
   - `button`, `card`, `badge`, `input`, `select`, `dialog`, `dropdown-menu`, `table`, `tabs`, `toast`, `tooltip`, `command`, `separator`, `skeleton`, `progress`, `avatar`, `popover`, `sheet`, `scroll-area`, `switch`, `label`, `textarea`

3. **Shared components** (`src/components/shared/`):
   - `kpi-card.tsx` — Stat card with icon, label, value (monospace), trend indicator (up/down arrow + percentage), color-coded by sentiment
   - `status-badge.tsx` — Pill badge with icon + label + color, following the status table in `Ai_rules.md` section 6.5
   - `temperature-badge.tsx` — Temperature display with zone coloring, icon, and background, following zone mapping in `Ai_rules.md` section 8
   - `risk-score.tsx` — Radial gauge component (SVG-based) showing 0–100 score with gradient color
   - `sparkline.tsx` — Inline mini line chart (24px tall), accepts data points array, color follows temperature zone
   - `empty-state.tsx` — Centered illustration placeholder + message + optional CTA button
   - `loading-crystallize.tsx` — Crystallization hexagon animation for loading states
   - `frost-transition.tsx` — Framer Motion wrapper implementing frost dissolve page transition
   - `activity-feed.tsx` — Scrollable event list with icon + message + timestamp per entry, severity-coded borders
   - `stepper.tsx` — Horizontal multi-step indicator for wizards (current/completed/upcoming states)
   - `data-table.tsx` — Enhanced wrapper around shadcn Table with sorting, filtering, column controls

4. **Animation Utilities** (`src/styles/animations.css`):
   - All CSS keyframe animations referenced in `Ai_rules.md` section 5
   - Framer Motion variant exports in a shared file (`src/lib/utils/motion.ts`): `pageVariants`, `cardVariants`, `toastVariants`, `staggerContainer`, `staggerChild`

**Verification**: Create a temporary test page (`/test`) that renders every shared component with sample data. Verify they look correct in the dark theme, animations work, and `prefers-reduced-motion` is respected.

---

## Step 3: Mock Data Layer

**Goal**: Create all TypeScript types, mock data fixtures, and simulated real-time data services.

**Deliverables**:

1. **Type Definitions** (`src/lib/types/`):
   - `auth.ts` — `User`, `Role` (enum: super_admin, ops_manager, compliance_officer, client_admin, client_viewer, driver), `Tenant`, `Session`
   - `shipment.ts` — `Shipment`, `ShipmentStatus` (enum: requested, preparing, in_transit, at_customs, delivered, cancelled), `Checkpoint`, `ShipmentLeg`, `TransportMode` (enum: air, sea, rail, road)
   - `inventory.ts` — `Material`, `StockLevel`, `ProcurementRequest`, `ProcurementStatus`
   - `carrier.ts` — `Carrier`, `CarrierCapacity`, `CarrierPerformance`
   - `crew.ts` — `CrewMember`, `CrewDocument`, `DocumentStatus`, `CrewAvailability`
   - `route.ts` — `RouteOption`, `RouteLeg`, `RouteComparison`, `Scenario`
   - `temperature.ts` — `TempReading`, `TempZone` (enum: ultra_cold, frozen, refrigerated), `TempExcursion`, `RefrigerationUnit`
   - `notification.ts` — `Notification`, `AlertSeverity` (enum: info, warning, critical, emergency), `AlertAction`
   - `compliance.ts` — `ComplianceDocument`, `AuditEntry`, `ValidationStatus`, `RegulatoryDeadline`
   - `analytics.ts` — `DelayPrediction`, `ExcursionHeatmapData`, `CostReport`, `ClientHealthScore`

2. **Static Mock Data Fixtures** (`src/lib/mock-data/`):
   - `clients.ts` — 3 client tenants (PharmaAlpha Inc., BioVerde Labs, CryoMed Solutions) with logos, contacts, compliance presets
   - `materials.ts` — 25 raw materials with names, grades, certifications, stock levels, unit prices, temperature zones (use real pharmaceutical raw material names)
   - `shipments.ts` — 12 shipments across all statuses, each with: client, materials, route legs, checkpoints with real-world city coordinates, temperature zone, carrier, assigned crew, risk score, compliance docs
   - `carriers.ts` — 8 carriers with names, capacity, cold-chain capabilities, reliability scores, coverage regions
   - `crews.ts` — 15 crew members across all transport modes (road, air, sea, rail), each with documents, verification status, performance scores
   - `routes.ts` — Pre-computed route options for 4 origin-destination pairs, each with 3–5 multimodal options including cost, ETA, risk score, CO2 estimate
   - `documents.ts` — 40+ compliance documents tied to shipments, with types, statuses, timestamps
   - `notifications.ts` — 20 notification fixtures covering all severity levels and types
   - `analytics.ts` — Mock analytics data (delay predictions, excursion heatmap points, cost reports, client health scores)

3. **Dynamic Simulators** (`src/lib/mock-data/`):
   - `temperature.ts` — `createTemperatureSimulator(shipmentId, zone, startTemp)` that returns a function generating realistic temperature readings with gradual drift, occasional approaching-limit events, and rare excursions
   - `gps.ts` — `createGPSSimulator(routeCoordinates[])` that returns a function interpolating position along a route at configurable speed

4. **Zustand Stores** (`src/lib/store/`):
   - `auth-store.ts` — user, role, tenantId, login/logout actions, mock token generation
   - `shipment-store.ts` — shipments array, selected shipment, filters, view mode (table/kanban), actions: setFilter, selectShipment, updateStatus
   - `inventory-store.ts` — materials, stock levels, procurement requests, actions: updateStock, approveProcurement, rejectProcurement
   - `carrier-store.ts` — carriers, capacity data, actions: getAvailableCarriers
   - `notification-store.ts` — notifications array, unread count, actions: addNotification, markRead, clearAll, getByPriority
   - `temperature-store.ts` — readings per shipmentId (Map), excursions, actions: addReading, getLatest, getHistory
   - `route-store.ts` — route options, selected route, scenario state, actions: generateRoutes, selectRoute, updateScenario
   - `ui-store.ts` — sidebarOpen, commandPaletteOpen, stressLevel, theme, actions: toggleSidebar, toggleCommandPalette, setStressLevel
   - `driver-store.ts` — currentAssignment, deliveryProgress, uploadedDocs, actions: confirmArrival, uploadDoc, submitDelivery

**Verification**: Import and log sample data from each store in the browser console. Temperature simulator generates realistic-looking data over 60 seconds. All types compile without errors.

---

## Step 4: Auth & Onboarding Flow

**Goal**: Build the complete authentication pages with the cold-to-warm visual transition.

**Deliverables**:

1. **Auth Layout** (`src/app/(auth)/layout.tsx`):
   - Centered card layout, max-width 480px
   - Frosted glass background (deep blue gradient with blur)
   - No sidebar, no header — just the card in the center
   - ColdVault logo at top

2. **Login Page** (`src/app/(auth)/login/page.tsx`):
   - Email + password fields
   - "Sign In" button (Cryo Teal)
   - Link to signup page
   - Mock auth: match against predefined users, set auth store, redirect based on role
   - Frosted glass card with frost dissolve entrance animation
   - **Quick-login buttons** for demo: "Login as Ops Manager", "Login as Client Admin", "Login as Driver" — pre-fills credentials and auto-submits. These are for hackathon demo convenience

3. **Signup Page** (`src/app/(auth)/signup/page.tsx`):
   - Activation code input (6 separate digit inputs that auto-focus next, like OTP)
   - Animated frosted glass card that pulses gently
   - On valid code: smooth transition to name + email + password form
   - On submit: redirect to Organization Setup Wizard (if client_admin) or directly to dashboard (if other role)

4. **Organization Setup Wizard** (`src/app/(auth)/setup/page.tsx`):
   - 3-step wizard using the shared `stepper.tsx` component
   - **Step 1 — Company Profile**: Company name, logo upload area, primary contact info. Background: icy blue
   - **Step 2 — Compliance Presets**: Multi-select for regulatory frameworks (GDP, GMP, WHO PQS, IATA DGR, IMDG Code). Background shifts to teal
   - **Step 3 — Team Invites**: Add email addresses for team members with role selector (Client Admin / Client Viewer). Background shifts to warm green
   - **Completion Screen**: "Welcome to ColdVault" with success animation, warm green background, auto-redirect to client dashboard after 3 seconds

5. **Middleware** (`src/middleware.ts`):
   - Check for mock auth token in cookies
   - Extract role and tenant from token
   - Redirect unauthenticated users to `/login`
   - Redirect authenticated users trying to access wrong dashboard to their correct one
   - Allow auth routes for everyone

**Verification**: Full flow works — login with each role type redirects to correct dashboard. Signup with activation code leads to org setup wizard. Cold-to-warm color transition is visible across wizard steps.

---

## Step 5: Shared Layout & Navigation

**Goal**: Build the three dashboard layouts (ops, client, driver) with navigation, header, command palette, and notification center.

**Deliverables**:

1. **Operations Layout** (`src/app/(ops)/layout.tsx`):
   - Collapsible sidebar with navigation items: Dashboard, Shipments, Inventory, Route Planner, Carriers, Transport, Compliance, Analytics, Settings
   - Each nav item has a Lucide icon + label
   - Active item highlighted with Cryo Teal accent
   - Sidebar collapse/expand toggle
   - Header bar with: ColdVault logo, global search trigger (Cmd+K hint), notification bell with unread count badge, user avatar dropdown (profile, logout)
   - Ambient background component (reacts to stress level from `ui-store`)
   - Main content area with page transition wrapper (frost dissolve)

2. **Client Layout** (`src/app/(client)/layout.tsx`):
   - Similar sidebar but cleaner, slightly less dense
   - Nav items: Home, Shipment Tracker, Procurement, Documents, Communications, Settings
   - Header shows tenant name prominently
   - Same search, notifications, profile elements
   - Main content with frost dissolve transitions

3. **Driver Layout** (`src/app/(driver)/layout.tsx`):
   - Minimal header: current assignment name/ID + status indicator dot
   - No sidebar — **bottom tab navigation** with 5 tabs: Assignment (Clipboard icon), Navigate (Navigation icon), Monitor (Thermometer icon), Documents (FileText icon), Deliver (PackageCheck icon)
   - Active tab in Cryo Teal, others muted
   - Main content area takes full remaining height
   - Designed mobile-first

4. **Command Palette** (`src/components/shared/command-palette.tsx`):
   - Uses `cmdk` library integrated with shadcn/ui `Command` component
   - Opens on Cmd+K / Ctrl+K
   - Search input at top
   - Results grouped: Shipments, Materials, Carriers, Actions
   - Results are filtered by role (driver sees minimal entities)
   - Arrow key navigation, Enter to select, Escape to close
   - Recent searches when input is empty
   - Quick actions: "Create New Order", "View Alerts", "Open Route Planner"

5. **Notification Center** (`src/components/shared/notification-center.tsx`):
   - Bell icon button in header with red badge showing unread count
   - Click opens a dropdown panel (not a separate page)
   - List of notifications with: severity icon (colored), message, timestamp, read/unread indicator
   - "Mark all as read" action
   - Click a notification to navigate to relevant page
   - Frosted glass dropdown styling

6. **Ambient Background** (`src/components/shared/ambient-background.tsx`):
   - Reads `stressLevel` from `ui-store`
   - Renders a full-page-width, full-height background behind all content (z-index: -1)
   - Serene: arctic aurora gradient animation (slow, subtle blue/teal shifts)
   - Attentive: slightly warmer tones, aurora slows
   - Urgent: warm undertone, subtle red pulse at edges
   - Emergency: deeper warm tone, visible pulse
   - Smooth CSS transitions between states (2s transition)

**Verification**: Navigate between pages in each dashboard. Sidebar navigation works, command palette opens and filters, notifications appear, ambient background shifts when stress level is changed via dev tools. Driver layout shows bottom tabs on mobile width.

---

## Step 6: Operations — Command Center

**Goal**: Build the main ops dashboard home page — the "Mission Control" global overview.

**Deliverables**:

1. **Command Center Page** (`src/app/(ops)/dashboard/page.tsx`):
   - Full-screen layout divided into: map area (70% width) + activity feed sidebar (30% width)
   - 4 KPI cards above the map: Active Shipments, Temp Excursions (24h), On-Time Delivery %, Revenue at Risk
   - Each KPI uses `kpi-card.tsx` with monospace value, trend indicator, and color
   - KPIs adapt to stress level (critical ones grow, others shrink when stress is high)

2. **Globe/World Map** (`src/components/ops/globe-map.tsx`):
   - Mapbox GL JS with dark theme
   - Show all active shipments as color-coded markers (green/amber/red based on status)
   - Shipment markers have pulse animation for in-transit items
   - Click a marker to open a popup with: shipment ID, client, current temp, ETA, status, risk score
   - Route lines drawn for in-transit shipments (teal glow)
   - Weather overlay toggle button (shows colored zones for storms/heat)
   - Map controls: zoom, rotate, reset view

3. **Live Activity Feed** (`src/components/shared/activity-feed.tsx` adapted for ops):
   - Right sidebar, scrollable
   - Events from `notification-store`, ordered newest first
   - Each event: severity icon + message + relative timestamp
   - Severity-coded left border (green/amber/red/blue)
   - New events slide in from top with animation
   - At serene stress level: shows all event types balanced
   - At urgent/emergency: filters to warnings and criticals only, info events hidden

4. **Real-time data integration**:
   - Temperature simulator runs in the layout, updating temperature store every 5 seconds
   - Notification generator adds new events every 15–30 seconds
   - KPI values update reactively from stores
   - Stress level is calculated from current system state and updates `ui-store`

**Verification**: Map shows shipment markers at real-world coordinates. KPI cards display data from stores. Activity feed populates with simulated events. Stress level changes are reflected in ambient background and KPI emphasis. Weather overlay toggles correctly.

---

## Step 7: Operations — Shipment Hub

**Goal**: Build the shipment list (table + kanban) and the detailed shipment view.

**Deliverables**:

1. **Shipment List Page** (`src/app/(ops)/shipments/page.tsx`):
   - Toggle between Table View and Kanban View (tabs at top)
   - Filter bar: status, client, transport mode, temperature zone, carrier, date range
   - Active filters shown as dismissible chips

2. **Shipment Table** (`src/components/ops/shipment-table.tsx`):
   - Columns: Shipment ID, Client, Materials, Origin → Destination, Status (badge), Temp (badge with sparkline), ETA, Risk Score (colored number), Carrier
   - Sortable by any column
   - Row hover: background highlight + expanded preview tooltip (quick info)
   - Click row: navigate to shipment detail page
   - Inline temperature sparklines (last 24h) in the Temp column
   - Pagination at bottom

3. **Shipment Kanban** (`src/components/ops/shipment-kanban.tsx`):
   - 5 columns: Requested → Preparing → In Transit → At Customs → Delivered
   - Each shipment is a card showing: ID, client, materials summary, ETA, risk score badge
   - Drag-and-drop between columns (updates status in store)
   - Column headers show count of items
   - Cards color-coded by urgency (border accent)

4. **Shipment Detail Page** (`src/app/(ops)/shipments/[id]/page.tsx`):
   - **Header**: Shipment ID, client name, status badge, risk score gauge, Cold Chain Confidence Score gauge
   - **Tab navigation**: Overview | Temperature | Route | Documents | Communication
   - **Overview tab**: Summary card with materials, origin/destination, carrier, crew, ETA countdown, key metrics
   - **Temperature tab** (`src/components/ops/temp-timeline.tsx`): Full-width area chart showing temperature over time with safe zone band (green). Excursion moments marked with red vertical lines. Current temp displayed large with zone badge. Refrigeration unit health indicators below
   - **Route tab** (`src/components/ops/route-map.tsx`): Map showing the route with animated progress, checkpoints with timestamps, mode icons per leg, weather overlay. Checkpoint list below map with status (passed/current/upcoming)
   - **Documents tab**: List of compliance documents with status (complete/pending/missing), download button, upload button for missing docs
   - **Communication tab**: Threaded message feed with the client, input for new messages

**Verification**: Table view with all 12 mock shipments renders correctly with sparklines and sorting. Kanban board shows shipments in correct columns with drag-and-drop. Shipment detail page shows all tabs with real mock data. Temperature chart updates in real-time from simulator.

---

## Step 8: Operations — Procurement & Inventory

**Goal**: Build the raw material catalog and procurement request management.

**Deliverables**:

1. **Inventory Page** (`src/app/(ops)/inventory/page.tsx`):
   - Two sections: Material Catalog (top) and Procurement Requests Queue (bottom)
   - Tab toggle or split view

2. **Material Catalog** section:
   - Grid of material cards (responsive: 4 cols on desktop, 2 on tablet, 1 on mobile)
   - Each card: material name, grade, certifications icons, temperature zone badge
   - `stock-level-bar.tsx` — battery-style horizontal bar (green zone = healthy, amber = low, red = critical)
   - Shows: current stock, allocated, available, restock ETA (if low)
   - Search bar and filter by temperature zone, certification, stock level
   - Click a card for expanded detail panel (not a new page — slide-in panel from right)

3. **Procurement Requests Queue** section (`src/components/ops/procurement-queue.tsx`):
   - Table showing all client procurement requests
   - Columns: Request ID, Client, Material, Quantity, Temp Zone, Status (pipeline badge), Submitted Date, Priority
   - Status pipeline: Pending → Approved → Allocated → Dispatched (each a colored badge)
   - Quick-action buttons per row: Approve (green), Reject (red), Request Info (blue)
   - Clicking a request opens detail panel with full order info and approval controls
   - Estimated sourcing time shown for unavailable materials

**Verification**: All 25 materials display with correct stock levels and color-coded bars. Procurement queue shows requests with working approve/reject actions that update the store. Search and filters work correctly.

---

## Step 9: Operations — Route Planner

**Goal**: Build the multimodal route comparison panel and scenario simulator.

**Deliverables**:

1. **Route Planner Page** (`src/app/(ops)/route-planner/page.tsx`):
   - Split layout: Input panel (left, 35%) + Results area (right, 65%)
   - Input fields: Origin (autocomplete), Destination (autocomplete), Materials (multi-select), Temperature Zone (dropdown), Delivery Timeline (date picker), Urgency Level (radio: Standard / Express / Emergency)
   - "Generate Routes" button triggers route generation from `route-store`

2. **Route Comparison Panel** (`src/components/ops/route-comparison.tsx`):
   - Display 3–5 route option cards vertically or in a scrollable horizontal row
   - Each card includes:
     - Route name / identifier
     - Visual route drawn on a mini map (dark themed, thin teal line)
     - Mode icons for each leg (plane, ship, truck, train) in sequence
     - ETA (monospace, bold)
     - Cost estimate (monospace)
     - Risk Score (0–100, color-coded gauge or number)
     - CO2 Estimate (kg, with leaf icon)
     - Temperature Maintenance Confidence (percentage bar, color-coded)
   - "Recommended" badge on the AI-picked best route
   - "Select" button on each card to choose the route
   - Selected route expands to show detailed leg-by-leg breakdown

3. **Scenario Simulator** (`src/components/ops/scenario-panel.tsx`):
   - Section below route comparison (collapsible)
   - Toggle switches for scenarios: "Port Strike", "Severe Weather", "Carrier Unavailable", "Customs Delay"
   - When a scenario is toggled, route cards re-calculate and visually update (affected metrics flash amber)
   - Impact summary: "Switching to all-air route increases cost by +35% but reduces ETA by 3 days"

**Verification**: Entering criteria and generating routes shows 3–5 route cards with different multimodal combinations. Route cards display all metrics with correct formatting. Scenario toggles cause visible recalculation of route metrics. Recommended route is highlighted.

---

## Step 10: Operations — Carrier Management

**Goal**: Build the carrier directory, capacity calendar, and performance analytics.

**Deliverables**:

1. **Carrier Page** (`src/app/(ops)/carriers/page.tsx`):
   - Three tabs: Directory | Capacity Calendar | Performance

2. **Carrier Directory** tab:
   - Grid of carrier cards (or a searchable table)
   - Each carrier: name, logo placeholder, transport modes supported (icons), cold-chain temp ranges, capacity status (available/total), reliability score (0–100 with color), coverage regions
   - Click for expanded detail panel with full profile
   - Search and filter by mode, temp capability, availability, region

3. **Capacity Calendar** (`src/components/ops/capacity-calendar.tsx`):
   - Gantt-like horizontal timeline view showing next 30 days
   - One row per carrier
   - Colored blocks for booked capacity (dark), available capacity (teal), maintenance windows (gray)
   - Hover on a block to see details (shipment assigned, capacity %, notes)
   - Filter by carrier, mode, or date range

4. **Performance Analytics** tab:
   - Per-carrier metrics cards: On-Time Delivery %, Temp Excursion Incidents (count), Avg Transit Time, Customer Satisfaction Score
   - Comparison bar chart (all carriers side by side) for each metric
   - Trend sparklines showing performance over last 6 months (mock data)

**Verification**: All 8 carriers display with correct data. Capacity calendar renders the Gantt view with 30-day range. Performance tab shows comparative charts. Filters work correctly.

---

## Step 11: Operations — Transport Assistance (Crew Operations)

**Goal**: Build the crew management module with mode-adaptive profiles and live cold-chain monitoring.

**Deliverables**:

1. **Transport Overview Page** (`src/app/(ops)/transport/page.tsx`):
   - Summary cards: Total Active Crew, Crew on Duty, Document Alerts (expiring), System Health Status
   - Two sections: Crew List + System Health Quick View
   - Crew list: table with name, transport mode (icon), current assignment, status (available/on-duty/off-duty), doc compliance (green check / amber warning / red alert)

2. **Crew Profile Detail** (`src/app/(ops)/transport/crew/[id]/page.tsx`):
   - Mode-adaptive layout — detects transport mode and shows relevant fields only
   - **Profile header**: Name, photo placeholder, transport mode badge, performance score gauge, availability status
   - **Documents section**: Table of mode-specific documents (as defined in PRD section 6.2.6). Each row: document type, document status (verified/pending/expired), expiry date, expiry countdown badge
   - **Document Expiry Tracker**: Visual horizontal timeline showing all doc expiry dates, with amber (30-day) and red (expired) markers
   - **Availability Calendar**: Weekly view of duty hours and rest periods
   - **Performance History**: On-time %, temp maintenance record, incident count, trend sparklines

3. **System Health Dashboard** (`src/app/(ops)/transport/system-health/page.tsx`):
   - Live cold-chain monitoring for all active shipments
   - `cold-chain-health.tsx` — Per-shipment temperature cards:
     - Material name, required temp range, current temp (large monospace), delta from safe range
     - Color-coded status: Blue (below) / Green (in range) / Amber (approaching) / Red (excursion)
     - Mini sparkline (last 6 hours)
   - Refrigeration unit status per vehicle/container: power on/off, compressor %, coolant pressure bar, door log, ambient vs internal temp comparison
   - Multi-compartment view for vehicles with different temp zones
   - Alert escalation indicators: shows who has been notified (crew, ops, client) per active alert
   - **Nearest Cold Storage Locator**: Button that opens a map overlay showing nearest cold storage facilities with real-time capacity

**Verification**: Crew list shows all 15 crew members with correct mode badges. Crew profile adapts UI based on transport mode (road vs air vs sea vs rail). System health shows live temp data updating from simulator. Document expiry timeline renders correctly.

---

## Step 12: Operations — Compliance Center

**Goal**: Build the document repository, auto-validation engine, and audit trail.

**Deliverables**:

1. **Compliance Page** (`src/app/(ops)/compliance/page.tsx`):
   - Three tabs: Documents | Audit Trail | Regulatory Calendar

2. **Document Repository** tab:
   - Filterable table: Document Type, Shipment ID, Client, Status (complete/pending/missing), Upload Date, Expiry
   - Organized by shipment — expandable rows that show all docs for a given shipment
   - Status icons with color (green check, amber clock, red X)
   - Download button per document, bulk download for a shipment

3. **Auto-Validation Engine** (`src/components/ops/compliance-checklist.tsx`):
   - Per-shipment checklist panel (accessible from compliance page or shipment detail)
   - Lists all required documents: Certificate of Analysis, Packing Declaration, GDP Compliance Form, Temperature Log, Customs Declaration, etc.
   - Each item: document name, status icon (green check / amber pending / red missing), upload/download action
   - Overall compliance score per shipment (percentage bar)
   - Incomplete documents highlighted with action buttons

4. **Audit Trail** (`src/components/ops/audit-log.tsx`):
   - Immutable event log table: Timestamp, User, Action, Entity (shipment/order/document), Details, IP (mock)
   - Filterable by date range, user, action type, entity
   - Exportable as CSV (generate and download a CSV file from the mock data)
   - Timestamped with relative time for recent, absolute for older entries
   - Designed to look like a real audit log — dense, monospace timestamps, muted styling

5. **Regulatory Calendar** section:
   - Calendar or timeline view of upcoming compliance deadlines
   - Items: license renewals, certification expirations, regulatory submission due dates
   - Color-coded: green (>30 days), amber (7–30 days), red (<7 days or overdue)

**Verification**: Document repository shows all 40+ documents linked to shipments. Auto-validation correctly shows missing vs complete docs. Audit trail renders with 50+ entries, filtering works. CSV export generates a valid file. Regulatory calendar shows upcoming deadlines.

---

## Step 13: Operations — Analytics & Intelligence

**Goal**: Build the analytics dashboards — predictive delays, excursion analytics, cost optimization, client health.

**Deliverables**:

1. **Analytics Page** (`src/app/(ops)/analytics/page.tsx`):
   - Four tabs: Predictive Delays | Excursion Analytics | Cost Optimization | Client Health

2. **Predictive Delay Dashboard** (`src/components/ops/delay-forecast.tsx`):
   - List/grid of shipments predicted to be delayed
   - Each card: Shipment ID, current status, predicted delay (hours/days), confidence % (radial gauge), primary risk factor (weather, customs, carrier, route)
   - Sort by confidence %, ETA, or risk factor
   - Click to navigate to shipment detail

3. **Excursion Analytics** (`src/components/ops/excursion-heatmap.tsx`):
   - Heatmap chart showing temperature excursion hotspots
   - Axes: routes (or route segments) vs time (months). Color intensity = excursion count
   - Filter by carrier, temperature zone, time period
   - Drilldown: click a heatmap cell to see excursion details
   - Summary stats: Total excursions, most affected route, worst carrier, seasonal trends

4. **Cost Optimization Report**:
   - Table/chart comparing estimated vs actual costs per shipment
   - Variance highlighted (green if under budget, red if over)
   - Summary cards: Total savings opportunity, most expensive route, best cost-efficiency carrier
   - Bar chart: costs by transport mode (air vs sea vs rail vs road)

5. **Client Health Scores**:
   - Card per client showing: health score (0–100 radial gauge), order frequency trend, issue count, average satisfaction metric
   - Color-coded: green (healthy), amber (needs attention), red (at risk)
   - Trend sparklines for each metric over time

6. **Sustainability Dashboard** section (can be a tab or section within analytics):
   - CO2 emissions by route, mode, and carrier
   - Cumulative CO2 savings from eco-friendly route selections
   - Chart: emissions trend over time
   - Comparison cards: per-route CO2 estimates

**Verification**: All four analytics tabs render with mock data. Heatmap is interactive. Cost comparison charts show variance correctly. Client health scores display for all 3 tenants. Sustainability section shows CO2 data.

---

## Step 14: Client — Home & Live Tracker

**Goal**: Build the client home page with active orders overview and the live shipment tracker with map + checkpoints.

**Deliverables**:

1. **Client Home Page** (`src/app/(client)/home/page.tsx`):
   - Quick Stats row: Total Orders (all time), In Transit (count), Delivered This Month, Pending Approvals
   - Active Orders grid: cards for each active order using `order-card.tsx`
   - Each card: Order ID, materials summary, status badge, ETA countdown (live ticking), carrier mode icon, temperature zone badge
   - Click a card to navigate to live tracker for that shipment
   - Recent activity timeline at bottom (last 10 events for this tenant)

2. **Live Shipment Tracker** (`src/app/(client)/tracker/[id]/page.tsx`):
   - **Full-Width Map** (top 60% of viewport) using `shipment-map.tsx`:
     - Dark-themed Mapbox map
     - Animated cargo icon moving along the route
     - Route line with completed (green) and remaining (gray) segments
     - Checkpoints marked on the route
     - Hover on cargo icon: current temp, speed, next checkpoint, ETA popup
     - Weather layer toggle
   - **Checkpoint Journey Flow** (below map) using `checkpoint-flow.tsx`:
     - Horizontal stepper showing all checkpoints
     - Completed: green circle + checkmark + timestamp
     - Current: pulsing blue dot + "Current Location" label
     - Upcoming: gray circle + ETA
     - Delayed: amber circle + reason tooltip on hover
     - Each checkpoint shows: location name, arrival time (actual or estimated), dwell time
   - **Temperature Strip Chart** (below checkpoints) using `temp-strip.tsx`:
     - Thin area chart (80px height) showing temperature over the journey duration
     - Safe zone band visible (green)
     - Excursion markers (red dots) if any
   - **Alerts Panel** (collapsible sidebar or section below):
     - Any active alerts for this specific shipment
     - Human-friendly messages with severity indicators

**Verification**: Client home shows active orders with live ETA countdowns. Tracker page shows map with animated cargo on route. Checkpoint flow renders correctly with all states. Temperature strip updates from simulator. Alerts panel shows relevant notifications.

---

## Step 15: Client — Procurement Portal

**Goal**: Build the material catalog, 5-step order builder wizard, and order history.

**Deliverables**:

1. **Procurement Page** (`src/app/(client)/procurement/page.tsx`) — Material Catalog:
   - Searchable grid of available materials
   - `material-card.tsx`: material name, grade, certification badges, temperature zone badge, available quantity, unit price (monospace)
   - Search bar with instant filter
   - Filter chips: temperature zone, certification type, availability
   - "Add to Order" CTA button on each card (adds to a temporary order basket)
   - Floating order basket indicator showing selected items count

2. **Order Builder** (`src/app/(client)/procurement/order/page.tsx`) using `order-wizard.tsx`:
   - Uses shared `stepper.tsx` for progress indicator
   - **Step 1 — Select Materials** (`order-step-materials.tsx`):
     - List of selected materials with quantity inputs
     - Add/remove materials
     - Running subtotal
   - **Step 2 — Cold-Chain Requirements** (`order-step-coldchain.tsx`):
     - Temperature range selector: dropdown or visual picker for 2–8°C / -20°C / -70°C
     - Duration tolerance input (how long can temp deviate before shipment is considered failed)
     - Visual explanation of what each zone means (icons + descriptions)
   - **Step 3 — Delivery Preferences** (`order-step-delivery.tsx`):
     - Urgency level: Standard (7–14 days) / Express (3–5 days) / Emergency (1–2 days) with cost impact indicator
     - Preferred transport modes: multi-select checkboxes (air, sea, rail, road)
     - Delivery window: date range picker for acceptable delivery dates
     - Destination address input
   - **Step 4 — Review Routes** (`order-step-routes.tsx`):
     - System generates 2–3 route options (simplified version of ops route planner)
     - Each option: mode icons, ETA, cost estimate, risk score, temp confidence %
     - "Recommended" badge on best option
     - Select one route
   - **Step 5 — Review & Submit** (`order-step-review.tsx`):
     - Full summary: materials, quantities, temp requirements, delivery preferences, selected route, estimated cost, estimated delivery date
     - Edit links per section (go back to that step)
     - Terms acceptance checkbox
     - "Submit Order" button (large, green, prominent)
     - Post-submit: success animation + "Your order has been submitted. The operations team will review it within 2 hours." message
     - Redirect to order history after 3 seconds

3. **Order History** (`src/app/(client)/procurement/history/page.tsx`):
   - Table of all past orders: Order ID, Date, Materials, Status (pipeline badge), Total Cost, Tracking Link, Download Invoice
   - Click to expand for full details
   - Filter by status, date range

**Verification**: Material catalog shows all 25 materials with search and filters. Order wizard navigates through all 5 steps with validation. Review step shows complete summary. Submit creates a new entry in order history. History page lists all orders with correct statuses.

---

## Step 16: Client — Documents, Compliance & Communications

**Goal**: Build the client-side document center, compliance view, and communication hub.

**Deliverables**:

1. **Documents Page** (`src/app/(client)/documents/page.tsx`):
   - **Document Center**: table organized by shipment
   - Expandable rows: click a shipment to see all its documents
   - Each document row: type, status badge, upload date, download button (PDF icon)
   - Document types: Certificate of Analysis, Temperature Log, Customs Forms, Compliance Certificates, Packing Lists, Invoices
   - Digital signature interface: for documents requiring client approval, show a "Sign & Approve" button that opens a signature dialog (using a simple canvas signature pad)
   - Notification badge on newly available documents
   - **Compliance Dashboard** section (below documents or as a tab):
     - Visual overview of all active orders' compliance status
     - Per-order row: order ID, compliance % (progress bar), missing docs count, status (Compliant/Pending/Non-Compliant badge)

2. **Communication Hub** (`src/app/(client)/communications/page.tsx`):
   - **Threaded Messaging** (`src/components/client/message-thread.tsx`):
     - Left panel: list of conversations (one per order/shipment)
     - Right panel: message thread for selected conversation
     - Messages show: sender name, role badge (ops/client), timestamp, message text
     - Input at bottom: text field + send button
     - Mock messages pre-loaded in each thread
   - **Announcement Feed** section:
     - Platform-wide announcements from ops team
     - Each announcement: title, date, brief text, "Read More" expansion
   - **Notification Preferences** (in client settings but linked from here):
     - Configure which events trigger email, SMS, or in-app notifications
     - Per-event-type toggles

**Verification**: Documents page shows docs grouped by shipment with download functionality. Signature dialog works. Compliance dashboard shows correct status per order. Communication hub shows message threads with pre-loaded conversations. Announcement feed displays mock announcements.

---

## Step 17: Driver/Transporter Interface

**Goal**: Build the complete mobile-first driver interface with all 5 tabs.

**Deliverables**:

1. **Assignment Tab** (`src/app/(driver)/assignment/page.tsx`):
   - `assignment-card.tsx`: Large card showing current assignment
     - Material name, pickup location → destination, required temp range (zone badge), priority level (badge), ETA countdown
     - "Start" button if not yet started, "In Progress" indicator if active
   - Tap card to expand: full cargo manifest, special handling instructions, client name, emergency contacts
   - Below: assignment history list (past 5 deliveries) with status and date

2. **Navigate Tab** (`src/app/(driver)/navigate/page.tsx`):
   - `route-view.tsx`: Full-screen map (dark theme, mobile-optimized)
     - Active route shown with animated progress
     - Next checkpoint highlighted with pulsing marker
     - Turn-by-turn direction hints (simplified — not full GPS nav, but checkpoint-based)
   - Below map: checkpoint list with distances and ETAs
   - Alternate route banner if system detects issue ahead ("Delay detected on current route. Alternate route saves 2 hours.")
   - "Find Nearest Cold Storage" floating action button (opens map with cold storage markers and capacity)

3. **Monitor Tab** (`src/app/(driver)/monitor/page.tsx`):
   - `temp-monitor.tsx`: Real-time temperature display for all compartments
     - Large current temp number (monospace, color-coded)
     - Safe range band shown as a gauge or bar
     - Trend sparkline (last 6 hours)
   - `compartment-card.tsx`: If multi-compartment, show a card per compartment with:
     - Compartment label, material, required range, current temp, status icon
   - Refrigeration unit status section: power (on/off dot), compressor gauge, door status with timestamp
   - **Report Anomaly** button: opens a quick form to alert ops team about temp/equipment issues

4. **Documents Tab** (`src/app/(driver)/documents/page.tsx`):
   - `doc-checklist.tsx`: Auto-generated checklist for current shipment
     - Mode-specific document list (the UI adapts to the driver's transport mode)
     - Each item: document name, status (Submitted green / Pending amber / Missing red), tap to view or upload
   - `doc-upload.tsx`: Camera capture or file picker for uploading documents
     - Preview after capture before confirming upload
   - Cross-border notification banner: "Approaching [Country] border — [Document X] and [Document Y] required"

5. **Deliver Tab** (`src/app/(driver)/deliver/page.tsx`):
   - Step-by-step delivery confirmation flow:
     - **Step 1**: "Confirm Arrival" button with auto-timestamp and GPS location capture
     - **Step 2**: Photo proof of delivery (camera capture with `doc-upload.tsx` variant)
     - **Step 3**: `signature-pad.tsx` — Canvas-based recipient signature capture
     - **Step 4**: Temperature log snapshot at delivery point (read from monitor store)
     - **Step 5**: Condition report — any damage or deviation notes (text area + optional photo)
     - **Submit**: Bundles all proof and submits delivery
   - Post-delivery success screen: "Delivery Complete" with summary, then auto-return to assignment tab

6. **Emergency Panel** (accessible from all tabs via a floating button or long-press):
   - `emergency-panel.tsx`: Full-screen overlay with:
     - One-tap alert button to ops team (sends emergency notification)
     - Nearest cold storage locator map
     - Emergency contact numbers (ops hotline, local emergency)
     - Quick incident report form (text + photo)

**Verification**: All 5 driver tabs work with mobile-width viewport. Assignment shows current job with details. Navigation shows route map with checkpoints. Monitor displays live temp data from simulator. Document checklist adapts to transport mode. Delivery flow completes through all steps with signature capture working. Emergency panel accessible from all tabs.

---

## Step 18: Polish & Emotional Design Pass

**Goal**: Final refinement of animations, stress-aware adaptations, loading states, empty states, page transitions, and micro-interactions across the entire application.

**Deliverables**:

1. **Frost Dissolve Page Transitions**: Verify all page navigations within each dashboard use the frost dissolve animation (blur + opacity + scale). Ensure `AnimatePresence` wraps the main content area in each layout.

2. **Crystallization Loading States**: Replace any default loading spinners or skeleton screens with the crystallization animation. Verify it appears for:
   - Initial page loads
   - Data fetching delays (simulated)
   - Route generation "thinking" state
   - Map tile loading

3. **Stress-Aware Adaptations**: End-to-end verification:
   - Change mock data to create scenarios at each stress level (serene, attentive, urgent, emergency)
   - Verify ambient background shifts correctly
   - Verify KPI card emphasis changes
   - Verify activity feed filtering changes
   - Verify card spacing/padding adapts
   - Verify sidebar auto-collapses at emergency level

4. **Empty States**: All pages/sections with potentially empty data must show the illustrated empty state component:
   - "No active shipments" — serene arctic landscape
   - "No procurement requests" — calm message with CTA
   - "No notifications" — "All clear" message with snowflake icon
   - "No documents" — message with upload CTA
   - Generate or add SVG illustrations for each empty state

5. **Micro-Interactions Audit**: Verify across all components:
   - Card hover: breath pulse (scale 1.0 → 1.015)
   - Button hover: slight brightness increase + lift shadow
   - Badge hover: tooltip appears with full-text context
   - Table row hover: background highlight
   - Navigation item hover: teal underline slide-in
   - Sidebar collapse/expand: smooth width animation
   - Notification toast: slide-in from right with spring physics
   - Number changes: counter roll animation on KPIs and scores
   - Map marker hover: scale up + popup

6. **`prefers-reduced-motion` Audit**: Toggle reduced motion in browser settings and verify:
   - All decorative animations are disabled
   - Page transitions become instant cuts (no blur, no scale)
   - Loading states simplify to a pulsing dot
   - Ambient background becomes static
   - Functional interactions (hover states, focus rings) still work

7. **Alert Escalation Visual**: Implement the cascading priority system visually:
   - Info: subtle, small, auto-dismisses
   - Warning: medium, amber border, stays longer
   - Critical: large, red border, doesn't auto-dismiss, shake animation on entry
   - Emergency: full-width banner at top + toast + sound cue option

8. **Dark Theme Polish**: Final pass on every page:
   - Verify no stark white elements or jarring contrast
   - All backgrounds use the surface/elevated surface variables
   - Borders are subtle, not harsh
   - Focus rings are visible but not glaring
   - Scrollbars are thin and dark-themed

**Verification**: Full walkthrough of every page at every stress level. Reduced motion mode looks clean and functional. Every empty state has appropriate content. All micro-interactions feel smooth and intentional. No visual inconsistencies in the dark theme.

---

## Step 19: Integration Testing & Cross-Dashboard Flows

**Goal**: Verify complete user journeys across all three dashboards and ensure everything works together.

**Deliverables**:

1. **End-to-End User Journeys** — manually verify each:
   - **Journey 1: Client places an order → Ops receives it → Ops approves and plans route → Client sees shipment tracking → Driver receives assignment → Driver delivers → Client gets confirmation**
     - Login as Client Admin → Procurement → Order Builder (all 5 steps) → Submit
     - Login as Ops Manager → Procurement queue shows new request → Approve → Route Planner → Select route → Assign carrier and crew
     - Login as Client Admin → Home shows new active order → Tracker shows map with route
     - Login as Driver → Assignment tab shows the job → Navigate → Monitor → Deliver (all steps)
     - Login as Client Admin → Shipment status updated to Delivered
   - **Journey 2: Temperature excursion alert flow**
     - Simulated excursion triggers alert in ops dashboard
     - Activity feed shows alert, notification toast appears
     - Click through to shipment detail → temp chart shows excursion
     - Alert also visible in client dashboard for that tenant
     - Driver monitor tab shows the excursion alert
   - **Journey 3: Compliance workflow**
     - Ops checks compliance center → finds missing document for a shipment
     - Ops validates document → Compliance status updates to complete
     - Client sees compliance status as green in their documents page

2. **Responsive Testing**:
   - Ops dashboard at 1440px, 1024px, 768px
   - Client dashboard at 1440px, 1024px, 768px
   - Driver interface at 375px (iPhone), 390px (iPhone 14), 768px (tablet)
   - Verify no layout breaks, overlapping elements, or unreadable text

3. **Accessibility Check**:
   - Keyboard navigation through every major flow
   - Screen reader test on at least 3 pages (command center, shipment tracker, driver monitor)
   - Verify all color-only indicators have icon/text alternatives
   - Check contrast ratios on all text elements

4. **Performance Spot Check**:
   - Pages load within target (< 3s TTI)
   - Map renders within 2s
   - Animations run at 60fps (no visible jank)
   - No console errors or warnings

5. **Final Bug Fixes**: Address any issues found during integration testing.

**Verification**: All three cross-dashboard journeys complete successfully. No layout issues at any tested breakpoint. Accessibility checks pass. No console errors. The application feels like a cohesive, production-quality prototype.

---

## Summary Table

| Step | Module | Key Pages/Components | Est. Complexity |
|---|---|---|---|
| 1 | Project Scaffolding | Config, dependencies, folder structure | Low |
| 2 | Design System Foundation | 15+ shared components, animations | Medium |
| 3 | Mock Data Layer | 11 type files, 11 data files, 9 stores | Medium-High |
| 4 | Auth & Onboarding | Login, signup, setup wizard, middleware | Medium |
| 5 | Shared Layout & Navigation | 3 layouts, command palette, notifications, ambient bg | Medium-High |
| 6 | Ops — Command Center | Globe map, KPIs, activity feed | Medium |
| 7 | Ops — Shipment Hub | Table, kanban, detail page (5 tabs) | High |
| 8 | Ops — Procurement & Inventory | Material catalog, procurement queue | Medium |
| 9 | Ops — Route Planner | Route comparison, scenario simulator | High |
| 10 | Ops — Carrier Management | Directory, capacity calendar, performance | Medium |
| 11 | Ops — Transport Assistance | Crew profiles, documents, system health | High |
| 12 | Ops — Compliance Center | Doc repository, audit trail, regulatory calendar | Medium |
| 13 | Ops — Analytics | Predictions, heatmap, cost, client health, sustainability | Medium-High |
| 14 | Client — Home & Tracker | Order overview, live map, checkpoints, temp strip | High |
| 15 | Client — Procurement | Catalog, 5-step wizard, order history | High |
| 16 | Client — Docs & Comms | Document center, messaging, announcements | Medium |
| 17 | Driver Interface | All 5 tabs, emergency panel | High |
| 18 | Polish & Emotional Design | Animations, stress states, empty states, micro-interactions | Medium |
| 19 | Integration Testing | Cross-dashboard flows, responsive, accessibility | Medium |


STEP 1 — Project Setup
Goal:
Expected output:
Files created:
Success criteria:

STEP 2 — Authentication
Goal:
Expected output:
Files created:
Success criteria: