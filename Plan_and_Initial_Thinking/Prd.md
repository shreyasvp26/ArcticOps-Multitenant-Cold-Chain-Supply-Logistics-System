# ArcticOps — Product Requirements Document (PRD)

> **Version**: 1.1
> **Product Name**: ArcticOps — Intelligent Cold-Chain Supply & Logistics Control Tower
> **Document Status**: Final Draft
> **Audience**: Development team, hackathon judges, stakeholders

---

## 1. Vision & Elevator Pitch

ArcticOps is a web-based, multitenant platform that unifies pharmaceutical cold-chain logistics into a single intelligent control tower. It connects raw material sourcing, multimodal route planning, live temperature monitoring, compliance documentation, and client visibility — replacing disconnected systems and manual workflows with one secure, emotionally aware interface. Three distinct dashboards serve operations teams, pharmaceutical clients, and transport crews — each tailored to its users' context, urgency, and decision-making needs.

---

## 2. Problem Statement

Mysha is the CTO of a pharmaceutical logistics company specializing in transporting temperature-sensitive drugs, biologics, vaccines, and clinical materials across global markets. Her company maintains access to certified raw materials required by major pharmaceutical companies and enables clients to procure these materials with fully managed delivery through air, sea, rail, and refrigerated road networks.

**Current pain points:**

- Procurement, shipment tracking, and compliance validation run on disconnected systems with manual workflows
- No unified platform connects raw material sourcing, route planning, live temperature monitoring, and client visibility
- Temperature deviations, customs delays, and poor coordination cause product spoilage and financial loss
- Clients operate in high-risk, highly regulated environments demanding audit-ready records and strict compliance
- No real-time intelligence for proactive risk management — teams react instead of prevent

**What ArcticOps solves:**

A single platform where operations teams orchestrate global shipments with AI-driven risk alerts, clients gain transparent real-time visibility into their orders, and transport crews receive focused, mode-adaptive guidance for every delivery.

---

## 3. User Personas & Roles

ArcticOps serves **6 user roles** across **3 interface groups**.

### 3.1 Operations Interface (CTO/Ops Team)

| Role | Description | Access Level |
|---|---|---|
| **Super Admin** | Mysha / CTO. Full system control — tenant management, global configuration, all operations data | Full read/write across all tenants and modules |
| **Operations Manager** | Day-to-day logistics — shipment management, routing, inventory, carrier coordination | Read/write on shipments, inventory, carriers, route planner. Read on compliance and analytics |
| **Compliance Officer** | Regulatory documentation, audit trails, certification tracking | Full read/write on compliance center and audit trail. Read-only on shipments and inventory |

### 3.2 Client Interface (Pharmaceutical Company Tenant)

| Role | Description | Access Level |
|---|---|---|
| **Client Admin** | Manages their organization's users, places orders, approves documents, views all tenant data | Full read/write within own tenant. Can invite/manage team members |
| **Client Viewer** | Read-only access to dashboards, tracking, and documents | Read-only within own tenant. Cannot place orders or approve documents |

### 3.3 Driver/Transporter Interface

| Role | Description | Access Level |
|---|---|---|
| **Driver/Transporter** | Physical transport operator (driver, pilot, captain, rail operator). Receives assignments, monitors cold-chain health, uploads documents, confirms deliveries | Read/write on assigned shipments only. Can upload documents, update delivery status, trigger emergency alerts |

---

## 4. Multi-tenancy Model

ArcticOps operates as a **multitenant platform** where each pharmaceutical client exists as an isolated tenant.

### Data Isolation

- **Tenant ID** embedded in JWT claims and propagated through all API calls
- **Route-level context**: URL structure includes tenant identifier for client-facing routes
- **UI-level data scoping**: All data queries filter by tenant ID; components receive only scoped data from stores
- **Cross-tenant visibility**: Only Super Admin and Operations team roles can see data across tenants
- **Client roles** are sandboxed — they see only their own organization's orders, shipments, documents, and communications

### Tenant Lifecycle

1. Operations team creates a new tenant (client organization) in the system
2. System generates an activation code (6-digit alphanumeric)
3. Activation code is displayed to ops team and emailed to client's organizational email
4. Client Admin uses the code during signup to claim their tenant
5. Client Admin completes the Organization Setup Wizard (company profile, compliance presets, team invites)
6. Tenant is now active — Client Admin can invite Client Viewers

---

## 5. Role-Based Access Control (RBAC) Matrix

| Module | Super Admin | Ops Manager | Compliance Officer | Client Admin | Client Viewer | Driver |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Command Center (Global) | Full | Full | Read | — | — | — |
| Shipment Hub | Full | Full | Read | Own tenant | Own tenant (read) | Assigned only |
| Procurement & Inventory | Full | Full | Read | Request + view | View | — |
| Route Planner | Full | Full | — | View recommended routes | View | — |
| Carrier Management | Full | Full | Read | — | — | — |
| Transport Assistance | Full | Full | Read | — | — | Own assignments |
| Compliance Center | Full | Read | Full | Own tenant docs | Own tenant (read) | Upload assigned |
| Analytics & Intelligence | Full | Full | Read | Own tenant analytics | Own tenant (read) | — |
| Tenant Management | Full | — | — | Own org settings | — | — |
| User Management | Full (all) | — | — | Own org users | — | — |
| Communication Hub | Full | Full | Read | Own tenant | Own tenant (read) | — |
| Notifications | Full | Full | Full | Own tenant | Own tenant | Own assignments |
| Profile & Settings | Own | Own | Own | Own | Own | Own |
| Data Export | Full | Full | Compliance exports | Own tenant exports | Own tenant exports | — |

---

## 6. Feature Requirements

### 6.1 Authentication & Onboarding

| Feature | Description |
|---|---|
| **Login** | Email + password authentication with role-based redirect to appropriate dashboard |
| **Signup with Activation Code** | New users enter a 6-digit alphanumeric activation code to join the platform. Code displayed on animated frosted-glass card |
| **Organization Setup Wizard** | 3-step guided setup for new client tenants: (1) Company Profile — name, logo, primary contact; (2) Compliance Presets — select regulatory frameworks (GDP, GMP, WHO PQS); (3) Team Invites — invite colleagues with specific roles |
| **Role-Based Redirect** | After authentication, users are routed to their designated dashboard (ops/client/driver) |
| **Session Management** | JWT-based sessions with role and tenant claims |

### 6.2 Operations Control Tower

#### 6.2.1 Command Center (Global Overview / Home)

A full-screen "Mission Control" dashboard inspired by logistics control rooms.

- **Globe/World Map** with live shipment markers, color-coded by status (green = on-track, amber = delayed, red = critical)
- **4 KPI Cards**: Active Shipments, Temp Excursions (24h), On-Time Delivery %, Revenue at Risk
- **Live Activity Feed** (right sidebar): Real-time event log — shipment departed, temp alert, customs cleared, delivery confirmed
- **Weather Overlay** toggle on map — shows storms, extreme heat zones affecting routes
- **Stress-Aware Ambient Background**: Background subtly shifts from calm arctic blue to warm amber as system-wide alerts increase

#### 6.2.2 Shipment Hub

- **Shipment List** with table view + kanban board toggle
  - Table: advanced filters (status, client, route, temp zone, carrier), sortable columns, inline sparklines for temperature trends
  - Kanban: columns for Requested → Preparing → In Transit → At Customs → Delivered
- **Shipment Detail Page** (click into any shipment):
  - Temperature Timeline Chart — continuous line chart with safe zone bands (green = OK, amber = approaching, red = excursion)
  - Route Progress Map — animated route with checkpoints, current position
  - Documents Tab — all compliance docs (CoA, packing list, customs declarations)
  - Communication Log — threaded messages with the client about this shipment
  - Risk Score Badge — AI-calculated 0–100 score based on historical data
  - Cold Chain Confidence Score — radial gauge combining temp stability, on-time probability, compliance completeness

#### 6.2.3 Procurement & Inventory

- **Raw Material Catalog Dashboard**:
  - Cards for each material: current stock, allocated, available, restock ETA
  - Visual Stock Level Bars (battery-style indicators — green/amber/red)
  - Restock Predictions — forecast showing when stock will deplete
- **Procurement Requests Queue**:
  - All client requests with status pipeline: Pending → Approved → Allocated → Dispatched
  - Quick-action buttons: Approve / Reject / Request More Info
  - Estimated sourcing time for unavailable materials

#### 6.2.4 Route Planner & Optimizer

- **Multimodal Route Comparison Panel**:
  - Input: destination, materials, delivery timeline, temperature range
  - System generates 3–5 route options combining air/sea/rail/road
  - Each route displayed as a card with:
    - Visual route map (thin line on dark map)
    - Mode icons (plane, ship, truck, train for each leg)
    - ETA, Cost, Risk Score, CO2 Estimate
    - Temperature Maintenance Confidence — % likelihood of maintaining cold chain
  - "Recommended" badge on AI-picked optimal route
  - Select & customize — ability to tweak individual legs
- **Scenario Simulator**:
  - "What if" tool: What if there's a port strike? What if we switch from air to sea?
  - Adjust variables and see real-time impact on cost, time, and risk

#### 6.2.5 Carrier Management

- **Carrier Directory**: all partner carriers with capacity (available, booked), cold-chain capabilities (temp ranges), reliability score, coverage map
- **Capacity Calendar**: Gantt-like view of carrier availability over next 30 days
- **Performance Analytics**: On-time %, temp excursion incidents, avg transit time per carrier

#### 6.2.6 Transport Assistance (Crew Operations)

Manages the human side of logistics — drivers, pilots, maritime crew, rail operators.

- **Crew Profiles** (mode-adaptive):
  - Unified profile per operator with mode-specific documents (license, vehicle fitness, insurance, medical, training certifications)
  - Document Expiry Tracker — visual timeline with amber (30-day) and red (expired) alerts
  - Verification Status Badges — Verified / Pending / Expired per document
  - Crew Availability Calendar — duty hours, rest periods (compliance with driving/flight/maritime regulations)
  - Performance Score — on-time delivery %, temp maintenance record, incident history
- **Order Documents** (shipment-specific):
  - Mode-adaptive document checklists: tax/customs, permits, cargo docs, route auth, compliance
  - Auto-generated checklist per shipment showing required vs submitted (green/red status)
  - Cross-border alerts — when shipment crosses national boundary, system highlights needed permits for next jurisdiction
- **System Health — Live Cold-Chain Monitoring**:
  - Per-shipment temperature cards: material name, required range, current temp, delta, color-coded status with sparkline
  - Refrigeration unit status: power, compressor, coolant pressure, door open/close log, ambient vs internal temp
  - Multi-compartment view for vehicles carrying drugs at different temp zones
  - Alert escalation: Crew → Ops team → Client
  - Nearest Cold Storage Locator — map with real-time capacity availability

#### 6.2.7 Compliance Center

- **Document Repository**: all compliance docs organized by shipment, client, and type
- **Auto-Validation Engine**: visual checklist per shipment (Certificate of Analysis, Packing Declaration, GDP Compliance Form, Temperature Log — each marked complete/pending/missing)
- **Audit Trail**: immutable log of every action — who, what, when, with what data. Filterable, exportable (PDF/CSV), timestamped
- **Regulatory Calendar**: upcoming compliance deadlines, license renewals

#### 6.2.8 Analytics & Intelligence

- **Predictive Delay Dashboard**: AI forecasts showing shipments likely to be delayed (with confidence %)
- **Temperature Excursion Analytics**: heatmap of excursion hotspots by route, carrier, season
- **Cost Optimization Report**: actual vs estimated costs, inefficiency identification
- **Client Health Scores**: per-client metrics (order frequency, issues, satisfaction signals)
- **Sustainability Dashboard**: carbon footprint per route, cumulative CO2 savings for eco-friendly choices

#### 6.2.9 Operations Settings

- User & Role Management (invite, assign roles, deactivate)
- Tenant Management (create/manage client organizations, activation codes)
- System Configuration (alert thresholds, temperature zones, default preferences)

### 6.3 Client Dashboard

#### 6.3.1 Client Home (Active Orders Overview)

- Active orders summary cards — each with status badge, ETA countdown timer
- Quick Stats: Total Orders | In Transit | Delivered This Month | Pending Approvals
- Recent activity timeline

#### 6.3.2 Live Shipment Tracker

- **Full-Width Map** (top 60% of screen):
  - Animated cargo icon moving along the route
  - Hover details: current temp, speed, next checkpoint, ETA
  - Weather layer toggle
  - Geofence alerts (entering/leaving zones)
- **Checkpoint Journey Flow** (below map):
  - Horizontal stepper/flowchart showing all stops
  - Completed = green + timestamp, Current = pulsing blue dot, Upcoming = gray with ETA, Delayed = amber with reason tooltip
- **Temperature Strip Chart**: continuous mini chart beneath the stepper showing temp over time with safe zone bands
- **Alerts Panel** (collapsible sidebar): issues with this shipment

#### 6.3.3 Procurement Portal

- **Material Catalog**:
  - Searchable/filterable grid of available certified materials
  - Each card: material name, grade, certifications, available quantity, unit price
  - "Request Quote" or "Add to Order" CTA
- **Order Builder** (5-step wizard):
  1. Select Materials — quantities, specifications
  2. Define Cold-Chain Requirements — temperature range selector (2–8°C / -20°C / -70°C), duration tolerance
  3. Set Delivery Preferences — urgency level, preferred transport modes, delivery window
  4. Review Route Options — system-recommended routes with cost/time/risk (simplified view of ops route planner)
  5. Review & Submit — order summary with estimated cost and timeline, generates formal document for approval
- **Order History**: full list with status, tracking links, downloadable invoices/documents

#### 6.3.4 Documents & Compliance

- **Document Center**: organized by shipment, downloadable (CoA, temperature logs, customs forms, compliance certificates)
- **Digital Signature** capability for required approvals
- **Automatic Notifications** when new documents are available
- **Compliance Dashboard**: visual overview of all active orders' compliance status

#### 6.3.5 Communication Hub

- **Threaded Messaging**: per-order chat with the operations team
- **Announcement Feed**: platform-wide announcements (maintenance, new materials, policy changes)
- **Notification Preferences**: configure alerts (email, SMS, in-app) per event type

#### 6.3.6 Client Settings

- Team Members — invite/manage users within own organization
- Notification Preferences — per-event-type alert configuration
- Organization Profile — company details, logo, primary contacts

### 6.4 Driver/Transporter Interface

The driver interface is a **mobile-first responsive web app** served from the same Next.js application as the ops and client dashboards. It is NOT a separate native app or PWA. It uses the `(driver)` route group with its own layout (bottom tab navigation, minimal header). On desktop-width screens (>768px), the driver interface displays centered with a max-width of 480px, maintaining its mobile layout. This ensures the driver interface can be demoed from a desktop browser during the hackathon by simply resizing the browser window.

#### 6.4.1 Current Assignment

- Active shipment card: material name, pickup → destination, required temp range, priority level, ETA
- Shipment details expandable: full cargo manifest, special handling instructions, client name
- Assignment history (past deliveries)

#### 6.4.2 Navigation & Route

- Full-screen map with active route, next checkpoint, turn-by-turn highlights
- Checkpoint list with distances and ETAs
- Alternate route indicator if system detects delay/issue ahead
- Nearest cold storage facility button (emergency)

#### 6.4.3 Temperature Monitoring

- Real-time temperature display for all compartments with color-coded status
- Safe range bands visible at a glance
- Trend sparkline (last 6 hours)
- Alert button to report anomaly to ops team
- Refrigeration unit status: power, compressor, door log

#### 6.4.4 Document Upload & Checklist

- Auto-generated document checklist for current shipment (mode-specific)
- Camera/file upload for each required document
- Status indicators: Submitted / Pending / Missing
- Cross-border notification when approaching jurisdiction change

#### 6.4.5 Delivery Confirmation

- Arrival confirmation button with timestamp
- Proof of delivery: photo capture, recipient signature (canvas)
- Temperature log snapshot at delivery point
- Condition report: any damage or deviation notes

#### 6.4.6 Emergency Actions

- One-tap emergency alert to ops team
- Nearest cold storage locator
- Emergency contact numbers
- Incident report form

---

## 7. Transport Plan Formation Flow

This is the core logistics orchestration workflow that connects operations, clients, and transport.

> **UI Implementation Note**: The Transport Plan Formation flow is not a standalone page but is **orchestrated across existing modules**: (1) Client submits order via Procurement Portal → (2) Ops receives it in Procurement Requests Queue → (3) Ops clicks "Plan Route" to open Route Planner with pre-filled origin/destination/materials → (4) Ops selects route and clicks "Generate Transport Plan" → (5) System generates formal plan document → (6) Document appears in Client's Documents page for approval → (7) Upon approval, shipment is created and appears in Shipment Hub.

```
Client submits order
        ↓
System checks inventory availability
        ↓
    ┌── Available ──────────────────── Not Available ──┐
    ↓                                                   ↓
Check origin station capacity              Calculate sourcing ETA
    ↓                                      Notify client of delay
Evaluate multimodal routing options                ↓
    ↓                                      Source materials
Generate 3–5 route options                         ↓
(air/sea/rail/road combinations)           Rejoin main flow
    ↓                                              ↓
Score each route:                          ←───────┘
  - Risk Score (historical defects, temp spikes, weather)
  - Cost Projection
  - ETA
  - CO2 Estimate
  - Temp Maintenance Confidence
  - Nearby cold storage availability
        ↓
Check for shipment consolidation opportunities
(other orders on overlapping routes within time scope)
        ↓
Recommend optimal route + identify backup routes
(backups at possible delay points: compliance shifts, disasters, geography)
        ↓
Generate formal transport plan document
(route details, cost, timeline, risk assessment, backup routes)
        ↓
Send to Client for approval
        ↓
    ┌── Approved ────────────────── Rejected/Modified ──┐
    ↓                                                     ↓
Allocate carrier capacity                    Revise plan per feedback
Assign transport crew                                ↓
Generate shipment documents                  Regenerate options
Initiate live tracking                               ↓
        ↓                                    Loop back to approval
Shipment in transit
(live temp monitoring, checkpoint updates, alert escalation)
        ↓
Delivery confirmed
(proof of delivery, final temp log, condition report)
        ↓
Archive — compliance docs, audit trail, analytics data
```

---

## 8. Shared Features (Cross-Dashboard)

| Feature | Description |
|---|---|
| **Notification Center** | Centralized bell icon — filterable by type (alerts, updates, approvals). Severity-coded: Info, Warning, Critical, Emergency with increasingly urgent visual treatment. Full-page view accessible via "View All" link |
| **Global Search / Command Palette** | Cmd+K (or Ctrl+K) — search across shipments, materials, carriers, orders, documents, clients. Power-user navigation |
| **Profile & Account** | Personal profile, password change, notification preferences. Accessible from user avatar dropdown |
| **Responsive Design** | Ops and Client: desktop-first with tablet support. Driver: mobile-first with desktop fallback |
| **Data Export** | Export functionality available on key data views: (1) Temperature logs — CSV export with timestamp, reading, zone, excursion flag; (2) Shipment history — CSV/PDF with route, timeline, status changes; (3) Compliance documents — bulk PDF download per shipment; (4) Audit trail — CSV with all columns. Export buttons (Download icon) appear in the header of each relevant data view |

---

## 9. In-Scope vs Out-of-Scope

### In-Scope

- Complete frontend UI/UX for all 3 dashboards (Operations, Client, Driver/Transporter)
- All user flows: authentication, onboarding, procurement, shipment tracking, route planning, compliance, analytics
- Mock data layer simulating real-time temperature telemetry, GPS tracking, alert streams, and inventory changes
- Role-based access control at the UI level
- Tenant data isolation at the UI level
- Emotionally aware design system (stress-adaptive, ambient feedback, human-friendly messaging)
- Dark-mode-first control room aesthetic
- Responsive design (desktop + mobile for Driver interface)
- Accessibility (WCAG 2.1 AA)
- All animations and micro-interactions (frost transitions, crystallization loaders, breath-like hovers)
- Data export (CSV/PDF) on key data views (temperature logs, shipment history, compliance docs, audit trail)

### Out-of-Scope

- Backend APIs or server-side business logic (all data is mocked on the frontend)
- Real database or data persistence (data resets on refresh — unless local storage is used for demo convenience)
- Actual IoT/sensor integration for temperature monitoring
- Real payment processing or billing
- Real email/SMS notification delivery
- Real map routing engines (routes are simulated with mock coordinates)
- Real authentication provider integration (auth is simulated with JWT-like mock tokens)
- Mobile native apps (the Driver interface is a mobile-first web app, not a native app)
- Real-time WebSocket server (simulated with timers and mock event streams on the client)
- AI/ML model training or inference (risk scores and predictions use deterministic mock algorithms)
- Internationalization (i18n) — English only
- Offline support / PWA capabilities
- Light mode / theme toggle (dark mode only for this hackathon build)

---

## 10. Non-Functional Requirements

### Performance

- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Smooth 60fps animations
- Map renders within 2s of page load

### Typography

- Display / Headlines: **Space Grotesk** (700, 600 weights)
- Body text: **IBM Plex Sans** (400, 500 weights)
- Monospace data (temperatures, IDs, scores): **JetBrains Mono** (400, 500 weights)
- Minimum font size: 12px
- See `Ai_rules.md` section 3 for complete typography usage table

### Accessibility

- WCAG 2.1 AA compliance
- All color-coding includes icon/pattern redundancy (never color-only)
- Keyboard-navigable dashboards
- Screen reader support for all data visualizations (text alternatives)
- `prefers-reduced-motion` respected for all animations
- Focus indicators on all interactive elements

### Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Responsive Breakpoints

- Desktop: 1440px+ (primary for Ops and Client)
- Tablet: 768px–1439px
- Mobile: 320px–767px (primary for Driver)

---

## 11. Emotionally Aware Design Requirements

The hackathon theme demands "emotionally aware experiences." ArcticOps implements this at a structural level, not just decorative.

### Stress-Aware Dashboards (Operations)

When the number of critical/red shipments exceeds a threshold:
- Layout tightens — cards condense, less padding, tighter grid
- Visual hierarchy sharpens — critical items elevate, non-essential elements fade to lower opacity
- Color temperature shifts — ambient background moves from cool blue toward warm amber
- Activity feed prioritizes alerts over informational items

When all systems are green:
- Layout breathes — more whitespace, relaxed spacing
- Ambient arctic aurora plays subtly in the background
- Softer, slower animations
- Activity feed shows a balanced mix of events

### Human-Friendly Alert Messaging

Instead of: `TEMPERATURE EXCURSION — SHIPMENT #2847`

Use: `Shipment #2847 needs your attention — temperature is rising in Compartment B. Here are 3 actions you can take.`

Every alert must include:
1. What happened (in plain language)
2. Why it matters
3. What the user can do about it

### Ambient System Health Feedback

- Background color temperature subtly reflects overall system health
- Sound cues for critical alerts (optional, user-configurable)
- Notification toasts use frosted glass aesthetic with severity-coded borders
- Smart Alert Escalation: Info → Warning → Critical → Emergency with progressively urgent visual treatment

### Calm-to-Urgency Spectrum

Each dashboard state maps to a point on the calm-to-urgency spectrum:
- **Serene** (all green): spacious, cool blues, gentle animations
- **Attentive** (some amber): slightly tighter, teal accents, focused layout
- **Urgent** (red alerts): compact, high contrast, prominent action buttons, warm tones
- **Emergency** (system critical): full-screen alert overlay, unmissable, single-action focus

---

## 12. Glossary

| Term | Definition |
|---|---|
| **Cold Chain** | A temperature-controlled supply chain for transporting temperature-sensitive products |
| **Excursion** | A temperature deviation outside the specified safe range |
| **CoA** | Certificate of Analysis — document certifying that a product meets its specification |
| **GDP** | Good Distribution Practice — guidelines for proper distribution of medicinal products |
| **GMP** | Good Manufacturing Practice — quality assurance standards for pharmaceutical manufacturing |
| **WHO PQS** | World Health Organization Performance, Quality and Safety — prequalification standards for cold-chain equipment |
| **Multimodal** | Transport using multiple modes (air, sea, rail, road) in a single journey |
| **Tenant** | An isolated client organization within the multitenant platform |
| **Telemetry** | Remote measurement and transmission of data (temperature, GPS, etc.) from transport vehicles |
| **Risk Score** | A 0–100 AI-calculated score based on historical data indicating the likelihood of issues on a route |
| **Cold Chain Confidence Score** | A composite 0–100 score combining temp stability, on-time probability, and compliance completeness |
