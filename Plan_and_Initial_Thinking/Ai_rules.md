# ArcticOps — AI Design & UX Rules

> **Purpose**: This document defines exactly what the AI (and any developer) must follow when building ArcticOps's UI, UX, and application flow. Every component, animation, color choice, and interaction pattern must align with these rules.

---

## 1. Design Philosophy: "Thermal Precision"

ArcticOps's interface embodies the paradox of cold-chain logistics: **warmth in interaction, precision in data**. The design makes the invisible — temperature, risk, time — tangible through visual language.

### Core Principles

1. **Data density without overwhelm** — Operations dashboards show a lot of information, but visual hierarchy, spacing, and progressive disclosure ensure nothing feels cluttered
2. **Emotionally adaptive** — The interface responds to system state. Calm when things are green, focused when things need attention, urgent when things are critical
3. **Cold-chain as visual language** — Temperature, frost, crystallization, condensation, and thermal gradients are woven into the design system — not as decoration, but as functional metaphors
4. **Trust through transparency** — Every number has context. Every alert explains why. Every action shows its consequence
5. **Control room, not consumer app** — The ops dashboard feels like a mission control center. Dense, dark, purposeful. The client dashboard is cleaner and more accessible. The driver interface is stripped to essentials

---

## 2. Color System

### Primary Palette

```css
:root {
  /* Base */
  --color-background:       #0A1628;   /* Deep Arctic Blue — primary background */
  --color-surface:          #111D33;   /* Slightly lighter — cards, panels */
  --color-surface-elevated: #1A2942;   /* Elevated surfaces — dropdowns, modals */
  --color-border:           #243352;   /* Subtle borders */
  --color-border-hover:     #2D4068;   /* Border on hover */

  /* Text */
  --color-text-primary:     #F1F5F9;   /* Primary text — high contrast on dark */
  --color-text-secondary:   #94A3B8;   /* Secondary text — descriptions, labels */
  --color-text-muted:       #64748B;   /* Muted — timestamps, metadata */

  /* Accent */
  --color-accent:           #00D4AA;   /* Cryo Teal — primary accent, CTAs, links */
  --color-accent-hover:     #00E8BC;   /* Teal hover state */
  --color-accent-subtle:    #00D4AA1A; /* 10% opacity — teal backgrounds */

  /* Semantic — Status */
  --color-success:          #2ED573;   /* Bio Green — delivered, compliant, in-range */
  --color-warning:          #FFA502;   /* Amber — delayed, approaching limit, expiring */
  --color-danger:           #FF4757;   /* Thermal Red — excursion, critical, overdue */
  --color-info:             #3B82F6;   /* Blue — informational, in-transit, neutral */

  /* Temperature Zones */
  --color-temp-cryo:        #7C3AED;   /* Deep Purple — ultra-cold (-70°C) */
  --color-temp-frozen:      #3B82F6;   /* Blue — frozen (-20°C) */
  --color-temp-cold:        #06B6D4;   /* Cyan — refrigerated (2-8°C) */
  --color-temp-ambient:     #F59E0B;   /* Amber — approaching warm */
  --color-temp-hot:         #EF4444;   /* Red — excursion / too warm */

  /* Stress-Aware Ambient */
  --color-ambient-calm:     #0A1628;   /* Deep blue — all systems normal */
  --color-ambient-alert:    #1A1A2E;   /* Slight warm shift — some warnings */
  --color-ambient-urgent:   #1F1520;   /* Warm undertone — critical alerts active */
}
```

### Scrollbar Styling

```css
/* Thin dark scrollbars matching ArcticOps theme */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

*::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
```

### Color Rules

1. **Never use color alone to convey information.** Every color-coded status must also have an icon, pattern, or text label. This is a WCAG requirement and non-negotiable for pharmaceutical software.
2. **Temperature zones always use the 5-color gradient**: Cryo Purple → Frozen Blue → Cold Cyan → Ambient Amber → Hot Red. This mapping is consistent across every chart, badge, and indicator in the app.
3. **Status colors are semantic**: Green = good/complete, Amber = attention/warning, Red = bad/critical, Blue = neutral/in-progress. Never swap these meanings.
4. **The accent color (Cryo Teal #00D4AA) is reserved for**: primary CTAs, active navigation items, links, and focus rings. Do not use teal for status indicators.
5. **Dark mode is the default and only theme.** **For this hackathon build, there is NO light mode toggle in the UI.** The application is dark-mode only. The CSS variable system ensures a light theme could be added post-hackathon by defining `:root[data-theme='light']` overrides, but this is out of scope. Do not add any theme toggle button or light mode logic.

---

## 3. Typography

### Font Stack

```css
:root {
  --font-display: 'Space Grotesk', system-ui, sans-serif;
  --font-body:    'IBM Plex Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', monospace;
}
```

### Usage Rules

| Context | Font | Weight | Size |
|---|---|---|---|
| Page titles / H1 | Space Grotesk | 700 (Bold) | 28–32px |
| Section headers / H2 | Space Grotesk | 600 (SemiBold) | 22–24px |
| Card titles / H3 | Space Grotesk | 600 | 18–20px |
| Body text | IBM Plex Sans | 400 (Regular) | 14–16px |
| Labels, captions | IBM Plex Sans | 500 (Medium) | 12–13px |
| Data values (numbers, temps, scores) | JetBrains Mono | 500 | 14–20px (context-dependent) |
| Code, IDs, shipment numbers | JetBrains Mono | 400 | 13–14px |

### Typography Rules

1. **Use monospace (JetBrains Mono) for all numerical data**: temperatures, risk scores, ETAs, costs, shipment IDs, coordinates. Monospace ensures columns align and numbers are instantly scannable.
2. **Headlines always use Space Grotesk.** It has an industrial precision that fits the control-room aesthetic.
3. **Body text always uses IBM Plex Sans.** It was designed for data-heavy interfaces and has excellent readability at small sizes.
4. **Never go below 12px** for any text. Minimum readable size for accessibility.
5. **Line height**: 1.5 for body text, 1.2 for headlines, 1.0 for monospace data values.

---

## 4. Emotionally Aware Design System

This is the core differentiator. The UI structurally adapts to the system's state.

### 4.1 Stress Level System

A global `stressLevel` value (0–100) is computed from system state and drives UI adaptations.

**Inputs to stress calculation:**
- Number of active temperature excursions (weight: 30%)
- Number of delayed shipments (weight: 25%)
- Number of unresolved critical alerts (weight: 25%)
- Number of compliance documents overdue (weight: 10%)
- Number of carrier capacity issues (weight: 10%)

**Stress thresholds:**
- **0–20: Serene** — all systems nominal
- **21–50: Attentive** — some items need attention
- **51–80: Urgent** — multiple issues active
- **81–100: Emergency** — critical system state

### 4.2 UI Adaptations by Stress Level

| UI Property | Serene (0–20) | Attentive (21–50) | Urgent (51–80) | Emergency (81–100) |
|---|---|---|---|---|
| **Background** | Deep arctic blue with subtle aurora shimmer | Slightly warmer undertone | Warm undertone, subtle pulse | Deep warm tone, visible pulse |
| **Card spacing** | Relaxed (gap-6) | Standard (gap-4) | Tight (gap-3) | Compact (gap-2) |
| **Animation speed** | Slow, gentle (0.8s transitions) | Normal (0.4s) | Quick (0.2s) | Instant (0.1s) |
| **Activity feed** | Balanced mix of events | Warnings prioritized | Alerts dominate, info items hidden | Only critical alerts shown |
| **KPI card emphasis** | All equal weight | Warning KPIs slightly larger | Critical KPIs prominent, others recede | Only critical KPIs visible |
| **Sidebar** | Full labels, relaxed spacing | Standard | Icons + text, compact | Auto-collapse to icon-only |
| **Sound** | None | Optional soft chime on new warnings | Alert tone on critical events | Persistent alarm (if enabled) |

**Transition Behavior:**
- CSS transitions between stress states must use `transition: all 2s ease-in-out` to avoid jarring jumps
- Background color change: animated over 2 seconds with CSS transition
- Card spacing change: animated via Framer Motion `layout` prop over 0.5 seconds
- KPI card emphasis: opacity and scale transitions over 0.3 seconds
- Animation speed changes: use CSS `transition-duration` variable that updates smoothly
- Sidebar collapse: animated over 0.3 seconds using Framer Motion width animation
- When stress level oscillates near a threshold (e.g., fluctuating between 49–51), apply a **hysteresis buffer of 5 points** — only transition to the next state when the value is 5 points beyond the threshold. This prevents visual flickering

### 4.3 Human-Friendly Alert Messages

Every alert in ArcticOps follows this structure:

```
[WHAT happened] — [WHY it matters] — [WHAT you can do]
```

**Examples:**

Instead of:
> TEMP EXCURSION — SHIPMENT SH-2847 — COMPARTMENT B — 12.3°C

Write:
> **Shipment SH-2847 needs attention** — Temperature in Compartment B has risen to 12.3°C, exceeding the 2–8°C safe range. This could affect the Insulin Glargine batch.
> **Actions**: View live data · Contact driver · Reroute to nearest cold storage

Instead of:
> DELAY — SHIPMENT SH-1204 — CUSTOMS

Write:
> **Shipment SH-1204 is experiencing a customs delay** at Frankfurt International. Estimated additional wait: 4–6 hours. Current temperature is stable at 4.2°C.
> **Actions**: View details · Notify client · Check alternate clearance

### 4.4 Calm State Design

When `stressLevel` is 0–20 (Serene):

- A subtle **arctic aurora animation** plays in the background (soft gradient shifts across blues and teals, very slow, barely perceptible)
- Cards have slightly more padding and rounded corners
- Transitions are slower and more fluid
- The activity feed shows a "All systems running smoothly" message when no events
- **Empty states use illustrated arctic landscapes** (serene ice formations, calm sea) instead of generic "no data" messages

### 4.5 Emergency State Design

When `stressLevel` is 81–100 (Emergency):

- Background shifts to a deep warm tone with a subtle red pulse at the edges
- A **full-width alert banner** appears at the top of the dashboard summarizing the emergency
- Non-critical UI elements fade to 50% opacity to focus attention
- The command palette auto-suggests emergency actions
- Card borders glow with the severity color of their most critical item

---

## 5. Animation & Motion Rules

### Framework

All animations use **Framer Motion**. CSS animations are only for ambient effects (aurora, pulse) that don't need React lifecycle awareness.

### Animation Catalog

| Animation | Context | Implementation | Duration |
|---|---|---|---|
| **Frost Dissolve** | Page transitions | Blur (8px → 0) + opacity (0 → 1) + slight scale (0.98 → 1) | 400ms |
| **Crystallization** | Loading states | Hexagonal structures forming from center outward (SVG animation) | 800ms loop |
| **Breath Pulse** | Card hover states | Scale 1.0 → 1.015 → 1.0 with ease-in-out | 300ms |
| **Condensation Fade** | Modal/dropdown open | Backdrop blur increases + content fades in from slight Y offset | 250ms |
| **Arctic Aurora** | Background ambient (calm) | CSS gradient keyframe shifting between 3 blue/teal hues | 20s loop |
| **Warm Pulse** | Background ambient (urgent) | CSS radial gradient from edges, subtle opacity pulse | 4s loop |
| **Temp Spike** | Temperature excursion indicator | Quick flash of red + shake (2px) + settle | 600ms |
| **Route Trace** | Route line drawing on map | SVG stroke-dashoffset animation from origin to destination | 2000ms |
| **Checkpoint Pulse** | Active checkpoint on journey flow | Pulsing blue dot (scale 1.0 → 1.3 → 1.0 + opacity ring) | 1500ms loop |
| **Counter Roll** | KPI number changes | Digit-by-digit roll animation (like an odometer) | 500ms |
| **Slide In** | Notification toasts | Slide from right + fade in, with spring physics | 350ms |
| **Frost Glass** | Toast/notification appearance | Background blur + semi-transparent bg + border glow | Combined with slide-in |

### Animation Rules

1. **Always respect `prefers-reduced-motion`.** When enabled: disable all decorative animations, replace transitions with instant cuts, keep only functional animations (loading indicators) but simplified.
2. **No animation should exceed 2 seconds** for user-triggered actions. Only ambient background animations loop.
3. **Use Framer Motion's `layout` prop** for any element that changes position or size — this gives automatic layout animations.
4. **Page transitions use `AnimatePresence`** with the frost dissolve effect. Wrap the main content area (not the sidebar).
5. **Stagger children** when multiple cards or list items appear: 50ms stagger delay per item, max 8 items staggered (items beyond 8 appear instantly to avoid long waits).
6. **Exit animations are shorter than enter animations.** Enter: 400ms. Exit: 200ms. Users want things to go away fast.
7. **Scroll-triggered animations are subtle** — only opacity and slight Y translate (20px), no dramatic reveals.

### Framer Motion Variants (Standard Library)

```typescript
// Standard transition config
const spring = { type: "spring", stiffness: 300, damping: 30 }
const smooth = { type: "tween", ease: "easeInOut", duration: 0.4 }

// Page transition
const pageVariants = {
  initial: { opacity: 0, filter: "blur(8px)", scale: 0.98 },
  animate: { opacity: 1, filter: "blur(0px)", scale: 1 },
  exit: { opacity: 0, filter: "blur(4px)", scale: 0.99 }
}

// Card entrance (staggered)
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

// Toast notification
const toastVariants = {
  initial: { opacity: 0, x: 100, filter: "blur(4px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: 50, filter: "blur(4px)" }
}
```

---

## 6. Component Design Patterns

### 6.1 Cards

Cards are the primary information container across all dashboards.

**Anatomy:**
```
┌──────────────────────────────────────┐
│ [Icon] Title              [Badge]    │  ← Header: icon + title + status badge
│ Subtitle / metadata                  │
├──────────────────────────────────────┤
│                                      │
│         Main content area            │  ← Body: charts, data, descriptions
│                                      │
├──────────────────────────────────────┤
│ [Action 1]  [Action 2]    [Expand]   │  ← Footer: action buttons (optional)
└──────────────────────────────────────┘
```

**Card rules:**
- Background: `var(--color-surface)` with 1px `var(--color-border)` border
- Border radius: 12px (large), 8px (small cards like KPIs)
- Padding: 20px default, 16px compact (high stress), 24px relaxed (calm)
- Hover: subtle border brightening + breath pulse animation
- Cards with critical status get a left border accent in the severity color (4px solid)
- Dark glass effect on elevated cards: `backdrop-filter: blur(16px)` + semi-transparent background

### 6.2 Data Tables

**Rules:**
- Use `shadcn/ui` DataTable as base with custom styling
- Row height: 48px minimum for touch targets
- Alternating row backgrounds: transparent and `var(--color-surface)` at 50% opacity
- Hover row: `var(--color-surface-elevated)` with smooth 150ms transition
- Inline sparklines in table cells for temperature trends (24px height, no axes, just the line)
- Sortable columns: click header to sort, arrow indicator for direction
- Filterable: filter bar above table, chips for active filters
- Expandable rows: click to expand shows detail panel inline (not a separate page)
- Pagination: bottom-right, show "X of Y items", compact page selector

### 6.3 Forms & Wizards

**Single-page forms (login, signup):**
- Center-aligned on page, max-width 420px
- Frosted glass card container
- Labels above inputs, not floating
- Validation errors below input in red with icon
- Submit button full-width at bottom, Cryo Teal

**Multi-step wizards (order builder, org setup):**
- Horizontal stepper at top showing all steps with labels
- Current step highlighted in teal, completed in green with checkmark, upcoming in gray
- "Back" and "Next" buttons at bottom
- Each step validates before allowing progression
- Summary/review step shows all inputs with "Edit" links per section
- Transitions between steps use horizontal slide (Framer Motion)

### 6.4 Notification Toasts

- Position: top-right corner, stacked with 8px gap
- Style: frosted glass (`backdrop-filter: blur(16px)`, semi-transparent background)
- Border: left border in severity color (4px)
- Content: icon + message + timestamp + dismiss button
- Auto-dismiss: Info = 5s, Warning = 10s, Critical = manual dismiss only
- Entrance: slide from right with spring physics
- Max visible: 4 toasts. Additional queue behind, counter badge shows "+N"

### 6.5 Status Badges

Every status has three visual indicators (color + icon + label):

| Status | Color | Icon | Label |
|---|---|---|---|
| On Track | Green | CheckCircle | "On Track" |
| In Transit | Blue | Truck (or mode icon) | "In Transit" |
| Delayed | Amber | Clock | "Delayed" |
| At Risk | Red | AlertTriangle | "At Risk" |
| Delivered | Green | PackageCheck | "Delivered" |
| Pending | Gray | Circle | "Pending" |
| Excursion | Red | Thermometer | "Excursion" |
| Compliant | Green | Shield | "Compliant" |
| Non-Compliant | Red | ShieldAlert | "Non-Compliant" |

Badge styles: pill-shaped, background is 10% opacity of status color, text + icon in full status color.

### 6.6 Empty States

Every page or section that can have zero data must display a styled empty state instead of a blank area or generic "No data" message.

**Anatomy:**
```
┌──────────────────────────────────────┐
│                                      │
│         [Illustration / Icon]        │  ← 120px tall SVG illustration or 48px Lucide icon
│                                      │
│          Primary Message             │  ← Space Grotesk 600, 18px, var(--color-text-primary)
│     Secondary explanation text       │  ← IBM Plex Sans 400, 14px, var(--color-text-secondary)
│                                      │
│          [Optional CTA Button]       │  ← Cryo Teal button if the user can take action
│                                      │
└──────────────────────────────────────┘
```

**Empty State Messages by Context:**

| Page/Section | Primary Message | Secondary Message | CTA |
|---|---|---|---|
| Command Center (no shipments) | "All quiet on the cold front" | "No active shipments right now. When shipments are in transit, they'll appear on the map." | "View Past Shipments" |
| Shipment Hub (no results) | "No shipments match your filters" | "Try adjusting your filters or search criteria." | "Clear Filters" |
| Procurement Queue (no requests) | "No pending requests" | "Client procurement requests will appear here when submitted." | — |
| Notifications (no unread) | "You're all caught up" | "No new notifications. We'll alert you when something needs your attention." | — |
| Client Orders (no active) | "No active orders" | "Ready to move some materials? Start by browsing the catalog." | "Browse Catalog" |
| Client Tracker (no shipment selected) | "Select a shipment to track" | "Choose an active order from your dashboard to see its live progress." | "Go to Dashboard" |
| Driver Assignment (no job) | "No current assignment" | "Sit tight — you'll be notified when a new delivery is assigned to you." | — |
| Documents (no docs) | "No documents yet" | "Documents will appear here once they're generated for your shipments." | — |
| Crew List (no crew) | "No transport crew registered" | "Add crew members to manage their profiles and assignments." | "Add Crew Member" |
| Carrier Directory (no carriers) | "No carriers registered" | "Add partner carriers to manage capacity and track performance." | "Add Carrier" |

### 6.7 Tooltips

- Background: `var(--color-surface-elevated)` with `backdrop-filter: blur(8px)`
- Border: 1px `var(--color-border)`
- Border radius: 8px
- Padding: 8px 12px
- Text: `var(--color-text-primary)`, IBM Plex Sans, 13px
- Shadow: `0 4px 12px rgba(0, 0, 0, 0.3)`
- Arrow: 6px CSS triangle in `var(--color-surface-elevated)`
- Max width: 280px, text wraps
- Delay: 300ms hover before showing
- Position: prefer top, auto-flip if clipped
- Use shadcn/ui `Tooltip` component as base, customized with above styles

---

## 7. Map Design Standards

### Base Map

- **Style**: Mapbox dark theme (custom-styled with ArcticOps colors)
- **Background**: Near-black (#0D1117) with subtle gray landmasses
- **Water**: Dark blue-gray (#0A1628)
- **Labels**: Light gray, minimal — only major cities and countries
- **Roads**: Hidden on global view, shown only at zoom > 8
- **Fallback**: If Mapbox token is unavailable, render `map-fallback.tsx` — a static dark SVG world map with positioned shipment dots

### Route Lines

- **Active route**: 3px solid line in Cryo Teal (#00D4AA) with 8px glow
- **Alternate/backup routes**: 2px dashed line in #64748B (muted)
- **Completed route segments**: 2px solid in Bio Green (#2ED573), no glow
- **Route animation**: stroke-dashoffset from origin to destination when first rendered

### Markers

- **Shipment markers**: 12px circles, color-coded by status, with pulse animation on active shipments
- **Checkpoint markers**: 8px circles on route line, filled when passed, hollow when upcoming
- **Cold storage markers**: Snowflake icon, white, shown only when "nearest cold storage" is activated
- **Origin/destination**: Larger markers (16px) with distinct shapes (circle = origin, diamond = destination)

### Overlays

- **Weather**: Semi-transparent colored zones (red for storms, amber for heat), togglable
- **Geofence**: Dashed circle outlines around zones, with label
- **Temperature zones along route**: Gradient color on route line segments reflecting expected temperature challenges

### Interaction

- **Hover on shipment marker**: popup with shipment ID, current temp, ETA, status
- **Click on shipment marker**: open detail panel or navigate to shipment detail page
- **Scroll to zoom**, drag to pan, double-click to zoom in
- **Fly-to animation** when selecting a specific shipment (smooth camera transition)

---

## 8. Temperature Visualization Standards

Temperature is the most critical data type in ArcticOps. Its visualization must be consistent and immediately readable.

### Temperature Display Format

- Always show unit: `4.2°C`, `-18.7°C`, `-68.1°C`
- Use monospace font (JetBrains Mono) for all temperature values
- Round to 1 decimal place
- Negative sign is always visible (no ambiguity)

### Temperature Zone Color Mapping

| Zone | Range | Color | Icon | Background |
|---|---|---|---|---|
| Ultra-Cold | Below -60°C | Purple (#7C3AED) | Snowflake + double bar | Purple at 10% |
| Frozen | -25°C to -15°C | Blue (#3B82F6) | Snowflake | Blue at 10% |
| Refrigerated | 2°C to 8°C | Cyan (#06B6D4) | Thermometer | Cyan at 10% |
| Approaching Limit | Within 2°C of boundary | Amber (#F59E0B) | ThermometerSun | Amber at 10% |
| Excursion | Outside safe range | Red (#EF4444) | AlertTriangle | Red at 10% |

### Temperature Charts

- **Timeline charts** (shipment detail): continuous area chart with safe zone band (semi-transparent green zone between min and max safe temp)
- **Y-axis**: always visible, labeled in °C, scale adapts to the zone (don't show -80°C to +40°C when tracking a 2–8°C shipment)
- **Excursion markers**: vertical red line at the moment of excursion, with tooltip showing duration and peak deviation
- **Sparklines** (inline in tables/cards): 24px tall, no axes, just the line with color shifting per zone. Last value shown as a dot at the end

### Refrigeration Health Indicators

- **Power status**: Green dot (on) / Red dot (off) with label
- **Compressor**: Circular gauge (0–100%) with color zones
- **Coolant pressure**: Horizontal bar with green/amber/red zones
- **Door status**: Open/Closed icon with last-change timestamp
- **Ambient vs Internal**: Two-line mini chart showing both temperatures for comparison

---

## 9. Responsive Design Rules

### Breakpoints

```css
/* Mobile first for Driver interface */
--breakpoint-sm:  640px;
--breakpoint-md:  768px;
--breakpoint-lg:  1024px;
--breakpoint-xl:  1280px;
--breakpoint-2xl: 1440px;
```

### Per-Dashboard Responsive Strategy

**Operations Dashboard (Desktop-First)**
- Primary: 1440px+ (full layout with sidebar, all panels visible)
- 1024–1439px: sidebar collapses to icons, content area adapts
- 768–1023px: sidebar hidden (hamburger toggle), single-column content
- Below 768px: simplified layout, stacked cards, table becomes card list

**Client Dashboard (Desktop-First)**
- Primary: 1280px+ (sidebar + full map + details)
- 1024–1279px: sidebar collapses, map adjusts
- 768–1023px: sidebar hidden, map takes full width, details below
- Below 768px: map half-height, details scroll below

**Driver Interface (Mobile-First)**
- Primary: 320–767px (bottom tab nav, full-width content, large touch targets)
- 768px+: centered content with max-width 480px (stays mobile layout on larger screens)

### Touch Targets

- Minimum 44x44px for all interactive elements on Driver interface
- Minimum 36x36px for Ops and Client dashboards
- Button padding: 12px vertical, 20px horizontal minimum

---

## 10. Accessibility Rules

These are non-negotiable requirements.

1. **Color is never the only indicator.** Every status, temperature zone, severity level, and interactive state has an icon or text label alongside color.
2. **WCAG 2.1 AA contrast ratios.** All text on dark backgrounds must meet 4.5:1 for normal text, 3:1 for large text. The selected color palette is designed for this — verify when creating new combinations.
3. **Keyboard navigation.** Every interactive element (buttons, links, cards, table rows, form inputs, tabs, dropdowns) must be reachable and operable via keyboard (Tab, Enter, Escape, Arrow keys).
4. **Focus indicators.** Visible focus ring on all focusable elements: 2px solid `var(--color-accent)` with 2px offset. Never remove outline without replacing it.
5. **Screen reader support.** All data visualizations (charts, maps, gauges) must have `aria-label` or `aria-describedby` providing a text summary. Example: a risk score gauge of 73 should have `aria-label="Risk score: 73 out of 100, high risk"`.
6. **`prefers-reduced-motion` respected.** All decorative animations disabled. Functional animations (loading indicators) simplified to opacity fade only. Page transitions become instant cuts.
7. **Semantic HTML.** Use `<nav>`, `<main>`, `<aside>`, `<section>`, `<article>`, `<header>`, `<footer>` appropriately. Tables use `<th>` with `scope`. Forms use `<label>` with `htmlFor`.
8. **Alt text for all images and icons.** Decorative icons use `aria-hidden="true"`. Meaningful icons have `aria-label`.
9. **Live regions for real-time updates.** Temperature changes, new alerts, and status updates use `aria-live="polite"` (or `"assertive"` for critical alerts) so screen readers announce changes.
10. **Skip navigation link.** A hidden "Skip to main content" link visible on focus at the top of every page.

---

## 11. User Flow Rules

### 11.1 Onboarding Flow — "Cold to Warm"

```
Login Page                    Signup Page
(Deep blue, frosted glass)    (Deep blue, activation code entry)
        ↓                              ↓
    Auth succeeds              Code validated
        ↓                              ↓
   Role-based redirect         Org Setup Wizard (3 steps)
        ↓                     Step 1: Company Profile (icy blue)
   Dashboard loads             Step 2: Compliance Presets (teal shift)
   (with frost dissolve)       Step 3: Team Invites (warm green)
                                       ↓
                               Setup complete
                               (Success screen with warm green bg,
                                "Welcome to ArcticOps" message)
                                       ↓
                               Redirect to dashboard
```

**Visual transition**: The background color palette shifts from icy blues (signup) through teals (setup) to warm green (activation complete). This "cold to warm" metaphor reinforces the cold-chain theme and creates an emotional sense of arrival and warmth.

### 11.2 Order Creation Flow — "Guided Confidence"

Each step of the 5-step wizard builds confidence:

- **Step 1 (Select Materials)**: Clean catalog view, no pressure. Search and filter. Visual cues showing availability. The tone is exploratory.
- **Step 2 (Cold-Chain Requirements)**: The UI shifts to precision mode — temperature selector with clear zone indicators, visual confirmation of what each zone means. Reassuring icons and labels.
- **Step 3 (Delivery Preferences)**: Urgency selector with clear tradeoff messaging ("Express delivery: +40% cost, -3 days"). No hidden surprises.
- **Step 4 (Route Options)**: System presents options as recommendation cards, not raw data. "Recommended" badge on the best option. Comparison is visual and immediate — not a dense table.
- **Step 5 (Review & Submit)**: Full summary with edit capability. Estimated cost and timeline prominently displayed. Submit button is large, green, and accompanied by a reassurance message: "Your order will be reviewed by the operations team within 2 hours."

### 11.3 Alert Response Flow — "Calm Urgency"

When a critical alert fires:

1. **Toast notification** slides in from the right with a red left border. Message is human-friendly (see section 4.3).
2. **Clicking the toast** navigates to the relevant shipment/entity detail page.
3. **The detail page highlights the issue** — the affected metric (e.g., temperature chart) has a glowing red accent. The rest of the page dims slightly.
4. **An action panel** is visible immediately — not buried in a menu. "What you can do" section lists 2–3 clear actions with buttons.
5. **After taking action**, the UI provides immediate feedback — a "Resolution in progress" state with a calming blue indicator replaces the red urgency.

### 11.4 Driver Daily Flow — "Clear and Focused"

The driver interface assumes: limited attention, mobile device, possibly in a vehicle (not while driving).

1. **Open app** → Immediately see current assignment (no extra taps)
2. **Tap "Start Navigation"** → Full-screen route map with checkpoint list
3. **At each checkpoint** → Quick tap to confirm arrival, upload any docs
4. **If temperature alert** → Prominent banner at top of screen with one-tap actions (acknowledge, contact ops, find cold storage)
5. **At delivery** → Step-by-step confirmation: confirm arrival → photo proof → signature → condition report → submit
6. **After delivery** → "Delivery Complete" success screen with summary → return to assignment page for next job

### 11.5 Error States

- **404 (Not Found)**: Full-page centered layout with:
  - ArcticOps logo at top
  - Large "404" text in Space Grotesk, using `var(--color-text-muted)`
  - Message: "Route not found. The shipment you're looking for may have been delivered — or it never existed."
  - Button: "Return to Dashboard" (links to role-appropriate home)
  - Background: dark `var(--color-background)` with subtle frost particle animation
- **Error Boundary**: Similar layout with:
  - "Something went wrong" message
  - "Our cold-chain is still running — this is just a display issue."
  - "Try Again" button that reloads the page
  - "Return to Dashboard" link
  - Background: same dark themed layout, no jarring white flash

---

## 12. Global Search / Command Palette

Accessible via **Cmd+K** (Mac) or **Ctrl+K** (Windows) from any page.

### Behavior

- Opens as a centered modal overlay with backdrop blur
- Input field at top with magnifying glass icon
- Results grouped by category: Shipments, Materials, Carriers, Clients, Documents, Crew, Actions
- Each result shows: icon + name + category tag + brief detail
- Arrow keys to navigate, Enter to select, Escape to close
- Recent searches shown when empty
- Quick actions available: "Create new order", "View all alerts", "Open route planner"

### Search Scope by Role

| Role | Searchable Entities |
|---|---|
| Super Admin / Ops | Everything — shipments, materials, carriers, clients, crews, documents, all tenants |
| Client Admin | Own tenant's shipments, orders, documents, team members, materials catalog |
| Client Viewer | Same as Client Admin (read-only) |
| Driver | Current assignment, assigned documents, emergency contacts |

---

## 13. Content & Copy Rules

1. **No jargon without context.** If a term like "GDP compliance" or "CoA" appears, it should be in a context where its meaning is clear, or have a tooltip explaining it.
2. **Use active voice.** "Temperature exceeded the safe range" not "The safe range was exceeded by the temperature."
3. **Be specific with numbers.** "4.2°C" not "around 4°C". "Arriving in 3h 24m" not "arriving soon."
4. **CTAs are action verbs.** "View Shipment", "Approve Order", "Upload Document" — never "Click Here" or "Submit."
5. **Empty states are helpful.** Don't just say "No data." Say what the user can do: "No active shipments. Create your first order to get started." (See section 6.6 for full empty state specifications.)
6. **Error messages explain and suggest.** "Activation code not recognized. Please check your email for the correct code, or contact your operations team." Never just "Invalid code."
7. **Timestamps use relative time** when recent ("3 minutes ago", "2 hours ago") and absolute when old ("Mar 7, 2026 at 14:32").
8. **No emojis in the UI.** Lucide icons only. The aesthetic is professional and precise.

---

## 14. File-Specific AI Instructions

When building each part of ArcticOps, the AI must:

1. **Read relevant sections of this document** before writing any component. Don't guess at colors, animations, or patterns — follow the rules.
2. **Use the exact CSS variables** defined in section 2. Don't hardcode hex values in component files.
3. **Import and use the standard Framer Motion variants** from a shared config (`src/lib/utils/motion.ts`), not redefine them per component.
4. **Test every component at multiple stress levels** — it should look right in both calm and urgent states.
5. **Never skip accessibility.** Every component must have appropriate ARIA attributes before it's considered complete.
6. **Follow the folder structure** defined in architecture.md. If a component doesn't fit an existing folder, discuss before creating a new one.
7. **Keep components focused.** One component, one responsibility. A shipment card doesn't also handle the modal for shipment details.
8. **Use TypeScript strictly.** No `any` types. All props interfaces defined. All mock data typed.


The AI must NEVER modify:

- prd.md
- architecture.md
- plan.md
- ai_rules.md

These files are immutable unless explicitly asked.