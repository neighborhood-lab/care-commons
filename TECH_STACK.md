# Technology Stack

## Production Runtime

### Frontend
- **Framework**: React 19 with TypeScript 5.9
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4.1
- **Routing**: React Router 6
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI, Framer Motion
- **Charts**: Recharts

### Mobile
- **Framework**: React Native 0.82 with Expo 54
- **Navigation**: React Navigation 7
- **Offline Storage**: WatermelonDB
- **UI Kit**: React Native Paper
- **Native Features**: Expo modules (camera, location, notifications, biometrics, maps)

### Backend
- **Runtime**: Node.js 22.x
- **Framework**: Express 5
- **Language**: TypeScript (ESM)
- **Authentication**: JWT with bcrypt
- **Security**: Helmet, CORS, rate limiting, DOMPurify
- **Logging**: Pino
- **Monitoring**: Sentry, OpenTelemetry, Prometheus

### Database & Caching
- **Primary Database**: PostgreSQL 15
- **Database Provider**: Vercel Postgres
- **Query Builder**: Knex
- **Caching**: Redis
- **Mobile Offline**: WatermelonDB

## Deployment

### Hosting
- **Primary**: Vercel (serverless functions)
- **Secondary**: Cloudflare (edge workers)
- **Regions**: IAD1 (primary)

### CI/CD Pipeline
- **Version Control**: GitHub
- **CI**: GitHub Actions
- **Monorepo**: Turborepo
- **Package Manager**: npm 10.9.4

### Workflows
- **Lint & Type Check**: ESLint, TypeScript (Node 20 + 22)
- **Testing**: Vitest with coverage via Codecov
- **E2E Testing**: Playwright
- **Security**: CodeQL, npm audit, Snyk
- **Build**: Multi-stage with artifact caching
- **Deploy**: Automated on push to production/preview branches

## Development Tooling

### Quality Assurance
- **Testing**: Vitest, Playwright, Testing Library
- **Test Environment**: Happy-DOM, PostgreSQL service
- **Coverage**: Codecov with Vite plugin
- **Code Quality**: ESLint (Promise, SonarJS, Unicorn plugins)
- **SQL Linting**: sql-lint
- **License Compliance**: Automated license checker

### Build System
- **Monorepo**: npm workspaces + Turborepo
- **TypeScript**: Composite builds with tsc-alias
- **Module System**: ESM-first architecture
- **Bundling**: Vite (frontend), tsc (backend)
- **Asset Optimization**: Lightning CSS, Tailwind Oxide

### Developer Experience
- **Hot Reload**: Vite dev server, tsx watch mode
- **Git Hooks**: Husky
- **Scripts**: tsx for TypeScript execution
- **Concurrent Tasks**: Concurrently for multi-process dev
- **Environment**: dotenv-cli for environment management

## Security & Compliance

### Application Security
- **Headers**: Helmet with strict CSP
- **Rate Limiting**: express-rate-limit with Redis
- **Input Validation**: Zod schemas
- **Output Sanitization**: DOMPurify
- **Authentication**: JWT with secure cookie handling
- **Password Hashing**: bcrypt
- **Dependency Scanning**: Snyk, npm audit
- **SAST**: CodeQL (JavaScript/TypeScript)

### Deployment Security
- **HTTPS**: Enforced with HSTS
- **Branch Protection**: Required status checks
- **Migration Safety**: Pre-deployment validation scripts
- **Rollback**: Automated rollback workflows
- **Secrets Management**: GitHub Secrets + Vercel env vars

## Architecture

### Structure
- **Monorepo**: Modular vertical architecture
- **Packages**: Core, web, mobile, shared-components
- **Verticals**: Feature-based modules (11 domains)
- **API**: RESTful with OpenAPI/Swagger docs

### Database
- **Migrations**: Knex with rollback support
- **Seeding**: Demo data scripts
- **Connection**: pg driver with connection pooling
- **Offline Sync**: WatermelonDB for mobile

### Performance
- **Caching**: Redis for API responses
- **CDN**: Vercel Edge Network + Cloudflare
- **Code Splitting**: Vite lazy imports
- **Bundle Analysis**: Codecov bundle stats
- **Metrics**: Prometheus + OpenTelemetry

## Key Dependencies

### Runtime
- express 5.1, react 19, react-native 0.82
- @tanstack/react-query 5.90, zustand 5.0
- knex 3.1, pg 8.16, redis 5.9
- date-fns 4.1, zod 4.1, uuid 13.0

### Build & Test
- typescript 5.9, vite 7.2, vitest 4.0
- @playwright/test 1.56, turbo 2.6
- eslint 9.39, tailwindcss 4.1

### Mobile Specific
- expo ~54, @react-navigation/* 7.x
- @nozbe/watermelondb 0.25
- react-native-maps, expo-location, expo-camera
