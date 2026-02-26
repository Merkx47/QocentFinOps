# Huawei Cloud FinOps Dashboard

## Overview

This is a comprehensive cloud cost management and optimization platform designed specifically for Huawei Cloud infrastructure. The application provides enterprise-grade financial operations (FinOps) capabilities including real-time cost analytics, resource utilization monitoring, multi-tenant management, AI-powered optimization recommendations, and budget tracking. The platform is designed to serve organizations across Nigeria, Africa, and globally, helping them optimize their cloud spending through data-driven insights and automated recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for lightweight client-side routing with declarative route definitions.

**State Management**: 
- **Global State**: Zustand store (`useFinOpsStore`) manages application-wide state including currency selection, tenant filtering, date ranges, service/region filters, and sidebar collapse state.
- **Server State**: TanStack Query (React Query) for data fetching, caching, and synchronization with backend APIs.

**UI Component Library**: Shadcn UI with Radix UI primitives, providing accessible, customizable components built on Material Design principles with enterprise dashboard patterns. The design system incorporates Huawei's brand colors (red gradient accents #FF0000 to #C8102E) for primary actions.

**Styling**: Tailwind CSS with custom design tokens, supporting both light and dark modes. Typography uses Inter for UI elements and JetBrains Mono for numerical data and metrics.

**Data Visualization**: Recharts library for charts including area charts, pie charts, bar charts, and composed charts with custom tooltips and animations.

**Animation**: Framer Motion for smooth transitions and micro-interactions throughout the dashboard.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API architecture with all routes prefixed with `/api`. The server is structured to support:
- Route registration through `registerRoutes()` function
- Static file serving for the built frontend
- Development mode with Vite middleware for HMR (Hot Module Replacement)
- Production mode serving pre-built static assets

**Session Management**: Express sessions with support for both PostgreSQL-backed sessions (via `connect-pg-simple`) and in-memory sessions (via `memorystore`).

**Build Process**: Custom build script using esbuild for server bundling and Vite for client bundling. The build process bundles selected dependencies to reduce syscalls and improve cold start times.

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver (`@neondatabase/serverless`) for serverless-friendly database connections.

**ORM**: Drizzle ORM for type-safe database operations with schema-first approach. The schema is defined in `shared/schema.ts` and includes:
- Users table for authentication
- FinOps-specific types for currencies, regions, services, recommendations, and resources
- Comprehensive type definitions for multi-tenant cost analytics

**Storage Interface**: Abstract storage interface (`IStorage`) with in-memory implementation (`MemStorage`) for development and testing. The interface is designed to be easily swappable with a database-backed implementation.

**Migration Strategy**: Drizzle Kit for database migrations with PostgreSQL dialect, storing migration files in the `migrations` directory.

### Key Features & Design Decisions

**Multi-Currency Support**: Built-in support for USD, GBP, EUR, and JPY with conversion rates and formatting utilities. Currency selection persists across user sessions.

**Multi-Tenant Architecture**: The application is designed to manage multiple tenants (organizations) with isolated cost views and consolidated analytics. Each tenant has:
- Individual budgets and efficiency scores
- Contact information and metadata
- Isolated resource tracking
- Comparative analytics across tenants

**Huawei Cloud Integration**: The platform is specifically designed for Huawei Cloud services including:
- 15+ supported services (ECS, RDS, OBS, ELB, VPC, NAT, CDN, etc.)
- 10 global regions from Africa to Asia-Pacific
- Service-specific cost breakdown and utilization tracking

**Mock Data Layer**: Currently implements a comprehensive mock data generation system for demonstration and development. This layer generates realistic:
- Cost trends with forecasting
- Service and region breakdowns
- Resource utilization metrics
- AI-powered recommendations
- Multi-tenant summaries

The mock data architecture is designed to be replaced with actual Huawei Cloud API integrations (BSS for billing, Cloud Eye for metrics).

**Responsive Design**: Mobile-first approach with breakpoints at 768px (md), 1024px (lg), and 1280px (xl). The sidebar collapses on smaller screens and the dashboard layout adapts from single-column to multi-column grids.

**Type Safety**: End-to-end type safety using TypeScript with shared types between frontend and backend via the `@shared` path alias. Zod schemas for runtime validation with `drizzle-zod` integration.

**Development Workflow**: 
- Hot module replacement in development via Vite
- Separate build processes for client and server
- TypeScript compilation checking without emission
- Path aliases for clean imports (@/, @shared/, @assets/)

## External Dependencies

### Core Huawei Cloud Integration (Planned)

**Huawei Cloud APIs**: The application is architected to integrate with:
- **BSS (Business Support System) API**: For billing data, cost records, and invoice information
- **Cloud Eye API**: For resource monitoring, utilization metrics, and performance data
- **IAM API**: For authentication using Access Key (AK) and Secret Key (SK)

These integrations are currently represented by mock data generators but the schema and data models are designed to map directly to Huawei Cloud's API responses.

### Database

**Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL with serverless driver for optimal cold start performance and connection pooling.

### Authentication & Security

**Planned**: Passport.js with local strategy for username/password authentication. The schema includes a users table ready for authentication implementation.

### UI & Design System

**Shadcn UI**: Component library built on Radix UI primitives
**Radix UI**: Accessible component primitives (20+ components imported)
**Tailwind CSS**: Utility-first CSS framework with custom configuration
**Recharts**: Composable charting library built on D3
**Lucide React**: Icon library with 1000+ icons

### Development Tools

**Vite**: Fast development server and build tool with HMR
**Replit Plugins**: Integration plugins for runtime error overlay, cartographer, and dev banner
**Drizzle Kit**: Database migration tool and schema management

### Form Handling & Validation

**React Hook Form**: Form state management with `@hookform/resolvers`
**Zod**: Schema validation library integrated with Drizzle for type-safe database operations

### Utilities

**date-fns**: Date manipulation and formatting
**clsx & class-variance-authority**: Dynamic className management
**nanoid**: Secure unique ID generation
**zustand**: Lightweight state management