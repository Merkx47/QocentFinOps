# Huawei Cloud FinOps Dashboard - Design Guidelines

## Design Approach
**System**: Material Design with Enterprise Data Dashboard patterns (inspired by Grafana, DataDog, AWS Cost Explorer)
**Rationale**: Information-dense analytics platform requiring consistent data visualization patterns, clear hierarchy, and professional enterprise UI standards.

## Core Design Principles
1. **Data Density with Clarity**: Maximum information with minimal cognitive load
2. **Huawei Brand Integration**: Red gradient accents (#FF0000 to #C8102E) for primary actions and brand elements
3. **Multi-Tenant Hierarchy**: Clear visual separation between tenant-specific and consolidated views
4. **Scannable Analytics**: Grid-based layouts enabling quick pattern recognition

---

## Typography System

**Font Families**:
- Primary: Inter (Google Fonts) - UI elements, labels, body text
- Data/Metrics: JetBrains Mono (Google Fonts) - currency values, numbers, code

**Hierarchy**:
- Dashboard Title: text-3xl font-bold (36px)
- Section Headers: text-xl font-semibold (24px)
- Card Titles: text-lg font-medium (18px)
- Metric Labels: text-sm font-medium uppercase tracking-wide (14px)
- Metric Values: text-4xl font-bold (JetBrains Mono, 48px)
- Body Text: text-base (16px)
- Secondary Text: text-sm text-gray-400 (14px)
- Table Headers: text-xs font-semibold uppercase (12px)

---

## Layout System

**Spacing Scale**: Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mb-8)

**Container Structure**:
```
- Full viewport layout (h-screen flex)
- Sidebar: w-64 fixed left sidebar for navigation
- Main Content: flex-1 with max-w-[1920px] mx-auto
- Content Padding: p-6 to p-8
- Card Spacing: gap-6 for grid layouts
```

**Grid Patterns**:
- KPI Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Analytics Sections: grid-cols-1 lg:grid-cols-2 gap-6 (charts side-by-side)
- Main Dashboard: grid-cols-1 xl:grid-cols-3 gap-6 (2/3 + 1/3 split)
- Service Breakdown: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4

**Vertical Rhythm**: Consistent py-8 between major sections

---

## Component Library

### Navigation & Structure
1. **Top Navigation Bar** (h-16):
   - Huawei logo (left, h-8)
   - Tenant switcher dropdown (center-left)
   - Currency selector, date range picker, user menu (right)
   - Subtle bottom border for separation

2. **Sidebar Navigation** (w-64):
   - Dashboard, Analytics, Resources, Recommendations, Settings sections
   - Active state: Huawei red accent with subtle background
   - Icon + label format
   - Collapsible on mobile

### Data Display Components

3. **KPI Summary Cards**:
   - Glassmorphic background (backdrop-blur-xl bg-white/5)
   - Large metric value (text-4xl JetBrains Mono)
   - Label above (text-sm uppercase tracking-wide)
   - Trend indicator with % change (text-sm with ↑/↓ icon)
   - Subtle border and rounded-xl corners
   - Minimum height: h-32

4. **Chart Containers**:
   - Full-width cards with p-6 padding
   - Chart title (text-xl) + time range indicator (top)
   - Chart legend (bottom or right)
   - Export/download icon (top-right corner)
   - Use Recharts library for: Area charts (cost trends), Pie/Donut charts (service distribution), Bar charts (comparisons), Treemap (hierarchical costs)

5. **Service Breakdown Table**:
   - Sticky header (bg-gray-800)
   - Alternating row backgrounds for readability
   - Right-aligned numeric columns
   - Icon + service name in first column
   - Sortable columns with arrow indicators
   - Row hover state

6. **Recommendation Cards** (in recommendation engine):
   - Warning/Info color-coded left border (4px)
   - Recommendation title (text-lg font-semibold)
   - Description (text-sm)
   - Potential savings badge (text-2xl font-bold with $ prefix)
   - Impact score visual (pill badges: High/Medium/Low)
   - "View Details" link (text-sm with arrow)
   - Grid layout: grid-cols-1 md:grid-cols-2 gap-4

7. **Tenant Comparison Cards**:
   - Horizontal layout with tenant name + key metrics
   - Cost bar visualization showing relative spend
   - Efficiency score badge (0-100 with color gradient)
   - "View Details" action button

### Interactive Elements

8. **Multi-Select Dropdown Filters**:
   - Chip-based selected items display
   - Checkboxes in dropdown menu
   - Search/filter within dropdown for long lists
   - "Apply Filters" button at bottom

9. **Date Range Picker**:
   - Quick presets: "Last 7 Days", "Last 30 Days", "Last 90 Days", "Custom"
   - Calendar popup for custom range
   - Display format: "Jan 1 - Jan 31, 2024"

10. **Currency Switcher**:
    - Dropdown with flags + currency codes (USD 🇺🇸, GBP 🇬🇧, EUR 🇪🇺, JPY 🇯🇵)
    - Persistent selection across session

### Specialized Components

11. **Resource Utilization Heatmap**:
    - Grid of cells representing resources
    - Color gradient from green (efficient) → yellow → red (underutilized)
    - Tooltip on hover with detailed metrics
    - Legend explaining color coding

12. **Cost Forecast Timeline**:
    - Area chart with historical (solid) + projected (dashed line)
    - Budget threshold line (horizontal dashed)
    - Shaded "danger zone" above budget
    - Annotations for anomalies

13. **Budget Progress Gauge**:
    - Circular gauge showing % of budget consumed
    - Color changes: Green (0-70%), Yellow (70-90%), Red (90%+)
    - Center displays actual/budget amounts
    - Small burn rate indicator below

---

## Visual Treatment Notes

**Glassmorphism Implementation**:
- Cards: `bg-gray-900/50 backdrop-blur-xl border border-gray-800`
- Overlays: `bg-black/30 backdrop-blur-md`

**Huawei Brand Integration**:
- Primary CTA buttons: Huawei red gradient background
- Active nav states: Red accent border/background
- Logo: Prominent in header (left-aligned)
- Chart accent colors: Include Huawei red in color palette

**Dark Mode Baseline**:
- Background: Dark gray/black (bg-gray-950)
- Cards: Slightly lighter (bg-gray-900)
- Text: White/gray hierarchy

**Data Visualization Palette**:
- 8-color scale for service categories: Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink (distinct and accessible)

---

## Animation Guidelines
**Use sparingly**:
- Skeleton loading states for data fetching
- Smooth transitions on filter changes (300ms)
- Chart animations on initial load only
- No continuous animations

---

## Images
**Huawei Logo**: Use provided logo in header (h-8 to h-10, auto width). Place left-aligned in top navigation bar with ml-6 spacing.

**No Hero Image**: This is a data dashboard - no marketing hero needed. Jump straight into tenant selector and KPI metrics.