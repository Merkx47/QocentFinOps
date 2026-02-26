# MultiCloud FinOps Platform

## Overview

A unified multi-cloud FinOps (Financial Operations) platform supporting AWS, Azure, GCP, and Huawei Cloud. Users select a provider on a landing page, authenticate via mock SSO, then enter a fully themed dashboard with provider-specific services, regions, colors, terminology, and organizational hierarchy. Branded as "Qocent FinOps — One Window, All Cloud."

## User Preferences

- Preferred communication style: Simple, everyday language
- Default to light mode
- Use real provider SVG logos (AWS, Azure, GCP), not generic icons
- Avoid Lucide React "cloud" icons for provider branding
- Icons: Use `@tabler/icons-react` throughout (NOT lucide-react). Do NOT modify `client/src/components/ui/*` files.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript, Vite bundler
- **Routing**: Wouter
- **State**: Zustand (global), TanStack Query (server)
- **UI**: Shadcn UI + Radix UI, Tailwind CSS
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: @tabler/icons-react (migrated from lucide-react)

### Backend
- **Server**: Express.js + TypeScript on port 5000
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM
- **Build**: esbuild (server), Vite (client)

### Key Directories
- `client/src/pages/` - Page components (16 pages total)
- `client/src/components/dashboard/` - Dashboard widget components (8 widgets)
- `client/src/components/layout/` - Header and sidebar
- `client/src/components/provider-logos.tsx` - Real SVG logo components for AWS/Azure/GCP
- `client/src/components/ui/` - Shadcn UI components (DO NOT MODIFY — still uses lucide-react)
- `client/src/lib/provider-config.ts` - Provider configurations (colors, services, regions, hierarchy, terminology)
- `client/src/lib/finops-store.ts` - Zustand store with multi-provider state
- `client/src/lib/mock-data.ts` - Provider-aware mock data generators
- `server/` - Express server, routes, storage
- `shared/schema.ts` - Shared TypeScript types
- `attached_assets/` - SVG logos and Qocent branding

### Multi-Provider Architecture
- **Provider Config**: `provider-config.ts` defines `CloudProvider` type ('aws'|'azure'|'gcp'|'huawei') and complete configs per provider
- **State**: `selectedProvider` in Zustand store; `selectedOrgUnitId` (renamed from `selectedTenantId`)
- **Mock Data**: All generators accept `(orgUnitId, provider)` params
- **Routing**: `/` = provider select, `/login` = mock SSO, `/dashboard` + others = auth-guarded dashboard
- **Theming**: `applyProviderTheme()` sets CSS `--primary` HSL variable per provider; light mode default

### Pages (16 total)
**Core**: provider-select, login, dashboard, analytics, resources, recommendations, tenants
**Financial**: budgets, allocation, reports
**Intelligence**: anomalies (Anomaly Detection), forecasting (Cost Forecasting), savings-plans (Savings Plans / RI Coverage)
**Governance**: tagging (Tag Compliance), unit-economics (Unit Economics), waste (Waste Detection)
**System**: settings, help

### Sidebar Sections
1. **Main** — Overview, Cost Analytics, Resources, Recommendations, [Dynamic Org Units]
2. **Intelligence** — Anomaly Detection, Cost Forecast, Savings Plans
3. **Financial** — Budgets, Cost Allocation, Reports
4. **Governance** — Tag Compliance, Unit Economics, Waste Detection
5. **Bottom** — Settings, Help

### Current Features
- Provider selection landing page with real SVG logos + Qocent branding
- Mock SSO login page per provider
- 4 KPI cards, cost trend chart with forecast, service/region breakdowns
- Budget gauge, resource heatmap, org unit comparison (dynamic labels per provider)
- Recommendations panel with provider-specific recommendation types
- **Anomaly Detection**: AI-powered cost anomaly detection with severity levels, timeline chart, filtering
- **Cost Forecasting**: ML-powered predictions with confidence intervals, 4 scenarios, what-if analysis
- **Savings Plans**: RI/SP/CUD coverage & utilization tracking, expiring commitments alerts
- **Tag Governance**: Tagging compliance scores, per-tag breakdowns, violation tracking
- **Unit Economics**: Cost-per-unit metrics (API call, user, GB, transaction), 30-day trends
- **Waste Detection**: Idle/orphaned/oversized resource detection, category breakdown, actionable list
- Analytics, resources, budgets, allocation, reports, settings, help pages
- Multi-currency support (USD, GBP, EUR, JPY)
- Dark/light mode (default: light), responsive design, Framer Motion animations
- Collapsible sidebar with dynamic provider terminology

### Mock Data Generators (mock-data.ts)
- `generateCostTrend`, `generateServiceBreakdown`, `generateRegionBreakdown`
- `generateKPIs`, `generateRecommendations`, `generateResources`
- `generateOrgUnitSummaries`, `getOrgUnits`
- `generateAnomalies`, `generateSavingsPlans`, `generateForecast`
- `generateTagCompliance`, `generateUnitEconomics`, `generateWasteAnalysis`

### Workflow
- **Start application**: `npm run dev` (port 5000, webview)
