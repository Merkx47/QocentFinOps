# MultiCloud FinOps Platform

## Overview

A unified multi-cloud FinOps (Financial Operations) platform supporting AWS, Azure, GCP, and Huawei Cloud. Users select a provider on a landing page, authenticate via mock SSO, then enter a fully themed dashboard with provider-specific services, regions, colors, terminology, and organizational hierarchy.

## User Preferences

- Preferred communication style: Simple, everyday language
- Default to light mode
- Use real provider SVG logos (AWS, Azure, GCP), not generic icons
- Avoid Lucide React "cloud" icons for provider branding

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript, Vite bundler
- **Routing**: Wouter
- **State**: Zustand (global), TanStack Query (server)
- **UI**: Shadcn UI + Radix UI, Tailwind CSS
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React (for UI controls, not provider logos)

### Backend
- **Server**: Express.js + TypeScript on port 5000
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM
- **Build**: esbuild (server), Vite (client)

### Key Directories
- `client/src/pages/` - Page components (provider-select, login, dashboard, analytics, etc.)
- `client/src/components/dashboard/` - Dashboard widget components (8 widgets)
- `client/src/components/layout/` - Header and sidebar
- `client/src/components/provider-logos.tsx` - Real SVG logo components for AWS/Azure/GCP
- `client/src/components/ui/` - Shadcn UI components (DO NOT MODIFY)
- `client/src/lib/provider-config.ts` - Provider configurations (colors, services, regions, hierarchy, terminology)
- `client/src/lib/finops-store.ts` - Zustand store with multi-provider state
- `client/src/lib/mock-data.ts` - Provider-aware mock data generators
- `server/` - Express server, routes, storage
- `shared/schema.ts` - Shared TypeScript types
- `attached_assets/` - SVG logos (aws-logo.svg, azure-logo.svg, gcp-logo.svg) and Huawei PNG

### Multi-Provider Architecture
- **Provider Config**: `provider-config.ts` defines `CloudProvider` type ('aws'|'azure'|'gcp'|'huawei') and complete configs per provider
- **State**: `selectedProvider` in Zustand store; `selectedOrgUnitId` (renamed from `selectedTenantId`)
- **Mock Data**: All generators accept `(orgUnitId, provider)` params
- **Routing**: `/` = provider select, `/login` = mock SSO, `/dashboard` + others = auth-guarded dashboard
- **Theming**: `applyProviderTheme()` sets CSS `--primary` HSL variable per provider; light mode default

### Current Features
- Provider selection landing page with real SVG logos
- Mock SSO login page per provider
- 4 KPI cards, cost trend chart with forecast, service/region breakdowns
- Budget gauge, resource heatmap, org unit comparison (dynamic labels per provider)
- Recommendations panel with provider-specific recommendation types
- Analytics, resources, budgets, allocation, reports, settings, help pages
- Multi-currency support (USD, GBP, EUR, JPY)
- Dark/light mode (default: light), responsive design, Framer Motion animations
- Collapsible sidebar with dynamic provider terminology

### Workflow
- **Start application**: `npm run dev` (port 5000, webview)