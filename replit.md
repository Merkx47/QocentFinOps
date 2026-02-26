# MultiCloud FinOps Platform

## Overview

A unified multi-cloud FinOps (Financial Operations) platform that supports AWS, Azure, GCP, and Huawei Cloud through one consistent UX. Currently implements a fully functional Huawei Cloud FinOps dashboard with plans to extend to all four providers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 + TypeScript, Vite bundler
- **Routing**: Wouter
- **State**: Zustand (global), TanStack Query (server)
- **UI**: Shadcn UI + Radix UI, Tailwind CSS
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Server**: Express.js + TypeScript on port 5000
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM
- **Build**: esbuild (server), Vite (client)

### Key Directories
- `client/src/pages/` - Page components (dashboard, analytics, resources, etc.)
- `client/src/components/dashboard/` - Dashboard widget components
- `client/src/components/layout/` - Header and sidebar
- `client/src/components/ui/` - Shadcn UI components
- `client/src/lib/` - Store, mock data, utilities
- `server/` - Express server, routes, storage
- `shared/` - Shared TypeScript types and schema

### Current Features
- 4 KPI cards, cost trend chart with forecast, service/region breakdowns
- Budget gauge, resource heatmap, tenant comparison
- Recommendations panel, analytics with tabs, resource inventory
- Multi-currency support (USD, GBP, EUR, JPY)
- Dark/light mode, responsive design, Framer Motion animations
- Collapsible sidebar navigation

### Workflow
- **Start application**: `npm run dev` (port 5000, webview)
