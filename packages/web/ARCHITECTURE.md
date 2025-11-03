# Web Architecture

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│                     (http://localhost:5173)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    App Shell Layer                     │ │
│  │  • Routing (React Router)                              │ │
│  │  • Authentication Guards                               │ │
│  │  • Layout (AppShell, Header, Sidebar)                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Vertical Modules                      │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Clients    │  │  Caregivers  │  │ Scheduling  │ │ │
│  │  │              │  │              │  │             │ │ │
│  │  │  • Pages     │  │  • Pages     │  │  • Pages    │ │ │
│  │  │  • Components│  │  • Components│  │  • Components│ │ │
│  │  │  • Hooks     │  │  • Hooks     │  │  • Hooks    │ │ │
│  │  │  • Services  │  │  • Services  │  │  • Services │ │ │
│  │  │  • Types     │  │  • Types     │  │  • Types    │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               Core Infrastructure                      │ │
│  │  • UI Components (Button, Card, Input, etc.)          │ │
│  │  • Hooks (useAuth, usePermissions, useApiClient)      │ │
│  │  • Services (ApiClient, AuthService)                  │ │
│  │  • Types (API, UI, Auth)                              │ │
│  │  • Utilities (formatters, validators, classnames)     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                         HTTP/JSON
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│                  (http://localhost:3000)                     │
│                                                              │
│  • POST /api/auth/login                                     │
│  • GET  /api/clients                                        │
│  • GET  /api/clients/:id                                    │
│  • POST /api/clients                                        │
│  • PATCH /api/clients/:id                                   │
│  • ... (other endpoints)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Interaction → Component

```
User clicks button
    ↓
Component event handler
    ↓
Calls hook function
```

### 2. Component → API (Read)

```
Component renders
    ↓
useQuery hook executes
    ↓
Calls service method (e.g., clientApi.getClients)
    ↓
Service calls ApiClient.get()
    ↓
HTTP GET request to backend
    ↓
Response cached by React Query
    ↓
Component re-renders with data
```

### 3. Component → API (Write)

```
User submits form
    ↓
useMutation hook executes
    ↓
Calls service method (e.g., clientApi.createClient)
    ↓
Service calls ApiClient.post()
    ↓
HTTP POST request to backend
    ↓
On success:
  • Cache invalidated
  • Query refetches
  • Toast notification
  • Navigation (optional)
    ↓
Component re-renders with new data
```

## State Management Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Application State                      │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Server  │   │  Client  │   │   Form   │
    │  State   │   │  State   │   │  State   │
    └──────────┘   └──────────┘   └──────────┘
         │               │               │
         │               │               │
    React Query      Zustand      React Hook Form
         │               │               │
    • Clients       • Auth token    • Field values
    • Caregivers    • User info     • Validation
    • Visits        • UI prefs      • Errors
    • Care plans    (persisted)     (ephemeral)
    (cached)
```

### State Types

1. **Server State** (React Query)
   - Data from API
   - Cached with TTL
   - Automatic refetching
   - Loading/error states
   - Example: Client list, client details

2. **Client State** (Zustand)
   - Global app state
   - Persisted to localStorage
   - Example: Authentication, user preferences

3. **Form State** (React Hook Form)
   - Form-specific state
   - Validation rules
   - Ephemeral (discarded on unmount)
   - Example: Create/edit forms

4. **Local State** (React useState)
   - Component-only state
   - UI toggles
   - Example: Modal open/closed, dropdown expanded

## Component Hierarchy

```
App (Root)
├── QueryClientProvider (React Query)
├── BrowserRouter (React Router)
└── Routes
    ├── Login (Public)
    ├── ProtectedRoute
    │   └── AppShell
    │       ├── Sidebar
    │       │   └── Navigation Links
    │       ├── Header
    │       │   ├── Menu Toggle
    │       │   ├── Notifications
    │       │   └── User Menu
    │       └── Main Content
    │           ├── Dashboard
    │           │   ├── Stats Cards
    │           │   ├── Activity Feed
    │           │   └── Upcoming Visits
    │           ├── ClientList
    │           │   ├── ClientSearch
    │           │   ├── ClientCard[]
    │           │   └── Pagination
    │           └── ClientDetail
    │               ├── Personal Info Card
    │               ├── Contact Info Card
    │               ├── Emergency Contacts Card
    │               └── Quick Actions Card
    └── NotFound (404)
```

## Dependency Flow

```
Verticals
   ↓ (depends on)
Core Infrastructure
   ↓ (depends on)
External Libraries
   ↓ (depends on)
React & Browser APIs
```

### Rules:

- ✅ Verticals can import from Core
- ✅ Core can import from external libraries
- ❌ Core cannot import from Verticals
- ❌ Verticals cannot import from other Verticals
- ✅ App shell can import from both Core and Verticals

## API Client Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Component                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Custom Hook (useClients)                │
│  • Wraps React Query                                     │
│  • Provides loading/error/data states                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│             Service Interface (ClientApiService)         │
│  • getClients(filters)                                   │
│  • getClientById(id)                                     │
│  • createClient(input)                                   │
│  • updateClient(id, input)                               │
│  • deleteClient(id)                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Base ApiClient                          │
│  • get<T>(url, config)                                   │
│  • post<T>(url, data, config)                            │
│  • patch<T>(url, data, config)                           │
│  • delete<T>(url, config)                                │
│  • Injects auth token                                    │
│  • Handles errors                                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Fetch API                             │
│  • HTTP requests to backend                              │
└─────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                     User Login                           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
         POST /api/auth/login {email, password}
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend validates                       │
│  • Check credentials                                     │
│  • Generate JWT token                                    │
│  • Return {user, token}                                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Frontend stores auth state                  │
│  • Zustand store: {user, token, isAuthenticated}        │
│  • Persisted to localStorage                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Redirect to dashboard                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│        All API requests include Authorization            │
│        Authorization: Bearer <token>                     │
└─────────────────────────────────────────────────────────┘
```

## Permission-Based Rendering

```typescript
// In component
const { can } = usePermissions();

// Conditional rendering
{can('clients:write') && <CreateClientButton />}

// In Sidebar - menu items filtered by permission
const filteredNavItems = navItems.filter(
  (item) => !item.permission || can(item.permission)
);
```

## Build Process

```
Source Code (TypeScript + TSX)
         ↓
    TypeScript Compiler
         ↓
    JavaScript (ES2020)
         ↓
      Vite Bundler
         ↓
    Code Splitting
         ↓
    Tree Shaking
         ↓
    Minification
         ↓
    Tailwind CSS Purge
         ↓
   Production Bundle
         ↓
    dist/ directory
```

## Development vs Production

### Development (Vite Dev Server)

- Hot Module Replacement (HMR)
- Source maps
- Proxy to backend API
- Fast rebuild (<100ms)
- No bundling (ES modules)

### Production (Static Build)

- Bundled and minified
- Code split by route
- Tree-shaken
- CSS purged
- Gzipped assets
- Static HTML + JS + CSS

## Error Handling Strategy

```
API Request Error
       │
       ▼
ApiClient catches error
       │
       ▼
Error transformed to ApiError type
       │
       ▼
React Query captures error
       │
       ▼
Hook exposes error to component
       │
       ├──▶ ErrorMessage component displays error
       │
       └──▶ Toast notification (for mutations)
```

## Caching Strategy

```
React Query Cache
       │
       ├─ Fresh Data (< 5 minutes)
       │  • Returned immediately
       │  • No refetch
       │
       ├─ Stale Data (> 5 minutes)
       │  • Returned immediately
       │  • Refetch in background
       │  • Update when complete
       │
       └─ No Data
          • Show loading state
          • Fetch from API
          • Cache result
```

## Testing Strategy (To Be Implemented)

```
Unit Tests (Vitest)
  • Utility functions
  • Validation logic
  • Formatters

Component Tests (Vitest + Testing Library)
  • Component rendering
  • User interactions
  • Props handling

Integration Tests
  • API integration
  • Form submission
  • Navigation flows

E2E Tests (Playwright/Cypress)
  • Complete user journeys
  • Critical paths
  • Cross-browser testing
```

## Performance Optimizations

### Implemented

- ✅ React Query caching
- ✅ Vite's fast dev server
- ✅ Code splitting ready
- ✅ Tailwind CSS purging
- ✅ Tree shaking

### To Implement

- ⚠️ React.lazy() for route-based code splitting
- ⚠️ Virtual scrolling for large lists
- ⚠️ Image optimization
- ⚠️ Service Worker for offline support
- ⚠️ Bundle size analysis

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Browser                               │
│  • HTTPS only                                            │
│  • CSP headers                                           │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                 React Application                        │
│  • Auth token in memory + localStorage                   │
│  • Protected routes                                      │
│  • Permission-based UI                                   │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                   API Client                             │
│  • Authorization header                                  │
│  • CORS handling                                         │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Backend API                             │
│  • JWT validation                                        │
│  • Permission checking                                   │
│  • Rate limiting                                         │
│  • Input validation                                      │
└─────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Current State

- Single page application
- Client-side routing
- REST API integration

### Future Enhancements

- Server-side rendering (SSR)
- GraphQL API option
- Micro-frontends for larger verticals
- Module federation
- Progressive Web App (PWA)
- Native mobile apps (React Native)

## Deployment Architecture (Future)

```
GitHub Repository
       │
       ▼
   CI/CD Pipeline
       │
       ├──▶ Run tests
       ├──▶ Build bundle
       ├──▶ Generate static files
       │
       ▼
   Static Hosting
   (Vercel/Netlify/AWS S3)
       │
       ▼
   CDN Distribution
       │
       ▼
   User's Browser
```
