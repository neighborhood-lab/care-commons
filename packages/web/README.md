# Care Commons Web UI

React-based frontend for the Care Commons platform, built with TypeScript, Vite, and Tailwind CSS.

## Architecture

This web application follows the same vertical-based architecture as the backend:

- **`src/core/`** - Shared UI infrastructure (components, hooks, services, types, utilities)
- **`src/app/`** - Application shell (navigation, authentication, layout)
- **`src/verticals/`** - Feature-specific UI modules that mirror backend verticals
- **`src/styles/`** - Global styles and theme configuration

### Design Principles

1. **Vertical Independence** - Each vertical UI module is self-contained and corresponds to a backend vertical
2. **API Abstraction** - All API calls go through service interfaces for testability
3. **Component Composition** - Build complex UIs from small, reusable components
4. **Permission-Based Rendering** - Components adapt based on user permissions
5. **Type Safety** - Full TypeScript integration with backend types

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router v6** for navigation
- **TanStack Query (React Query)** for server state management
- **Zustand** for client state (auth, UI preferences)
- **React Hook Form** for form state management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

From the repository root:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev:web
```

The application will be available at `http://localhost:5173`.

The Vite dev server is configured to proxy API requests to `http://localhost:3000`. Make sure the backend server is running.

### Building

Build for production:

```bash
cd packages/web
npm run build
```

The built files will be in `packages/web/dist/`.

### Preview Production Build

Preview the production build locally:

```bash
cd packages/web
npm run preview
```

## Project Structure

```
packages/web/
├── src/
│   ├── core/                    # Shared infrastructure
│   │   ├── components/          # Reusable UI components
│   │   │   ├── forms/          # Form components (Input, Select, FormField)
│   │   │   ├── feedback/       # Loading, error, empty states
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Badge.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── auth.ts        # Authentication state management
│   │   │   ├── permissions.ts # Permission checking
│   │   │   └── api.ts         # API client hooks
│   │   ├── services/          # API client services
│   │   │   ├── api-client.ts  # Base HTTP client
│   │   │   └── auth-service.ts
│   │   ├── types/             # Shared TypeScript types
│   │   ├── utils/             # Utility functions
│   │   └── index.ts
│   ├── verticals/             # Feature-specific modules
│   │   ├── client-demographics/
│   │   │   ├── components/    # Client-specific components
│   │   │   ├── pages/         # Client list, detail pages
│   │   │   ├── hooks/         # Client data hooks
│   │   │   ├── services/      # Client API service
│   │   │   └── types/         # Client TypeScript types
│   │   └── [other verticals]
│   ├── app/                   # Application shell
│   │   ├── components/
│   │   │   ├── AppShell.tsx   # Main layout wrapper
│   │   │   ├── Header.tsx     # Top navigation bar
│   │   │   └── Sidebar.tsx    # Side navigation menu
│   │   └── pages/
│   │       ├── Dashboard.tsx  # Main dashboard
│   │       ├── Login.tsx      # Login page
│   │       └── NotFound.tsx   # 404 page
│   ├── styles/                # Global styles
│   │   ├── globals.css       # Tailwind and global CSS
│   │   └── theme.ts          # Theme configuration
│   ├── App.tsx               # Root component with routing
│   └── main.tsx              # Application entry point
├── public/                   # Static assets
├── index.html               # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Core Components

### Button
Flexible button component with variants, sizes, and loading states.

```tsx
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
```

### Card
Container component for content sections.

```tsx
<Card padding="md" hover>
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardContent>Content here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>
```

### Form Components
- `Input` - Text input with label, error, and helper text
- `Select` - Dropdown select with options
- `FormField` - Wrapper for consistent form field layout

### Feedback Components
- `LoadingSpinner` - Loading indicator
- `EmptyState` - Empty state with optional action
- `ErrorMessage` - Error display with retry option

## Authentication

Authentication state is managed with Zustand and persisted to localStorage:

```tsx
const { user, isAuthenticated, login, logout } = useAuth();
```

Protected routes require authentication:

```tsx
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

## Permissions

Check permissions before rendering UI elements:

```tsx
const { can, hasRole } = usePermissions();

if (can('clients:write')) {
  return <EditButton />;
}
```

## API Integration

API services are created with dependency injection:

```tsx
// In a vertical's services/
export const createClientApiService = (apiClient: ApiClient): ClientApiService => {
  return {
    async getClients(filters) {
      return apiClient.get('/api/clients', filters);
    },
    // ...
  };
};

// In a vertical's hooks/
export const useClients = (filters) => {
  const clientApi = useClientApi();
  
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => clientApi.getClients(filters),
  });
};
```

## Adding a New Vertical

1. Create directory structure in `src/verticals/your-vertical/`:
   ```
   your-vertical/
   ├── types/
   ├── services/
   ├── hooks/
   ├── components/
   └── pages/
   ```

2. Define types matching your backend vertical
3. Create API service interface
4. Create React Query hooks for data fetching
5. Build UI components
6. Create page components
7. Add routes to `App.tsx`
8. Update navigation in `app/components/Sidebar.tsx`

## Environment Variables

Create a `.env` file in `packages/web/`:

```
VITE_API_BASE_URL=http://localhost:3000
```

Access in code:

```tsx
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run tests (when configured)

## Code Style

- Use TypeScript for all files
- Follow React functional component patterns
- Use hooks for state and side effects
- Prefer composition over inheritance
- Keep components small and focused
- Export types alongside components

## Best Practices

1. **Component Organization**
   - One component per file
   - Export types with components
   - Use named exports

2. **State Management**
   - Use React Query for server state
   - Use Zustand for global client state
   - Use React Hook Form for form state
   - Use local useState for component-only state

3. **Styling**
   - Use Tailwind utility classes
   - Use the `cn()` helper for conditional classes
   - Define custom utilities in `globals.css`

4. **Types**
   - Define API response types matching backend
   - Use strict TypeScript
   - Avoid `any` type

5. **Error Handling**
   - Show user-friendly error messages
   - Provide retry mechanisms
   - Log errors for debugging

## Contributing

Follow the repository's CONTRIBUTING.md guidelines. Key points:

- Write TypeScript with strict mode
- Use two-space indentation
- Follow the existing component patterns
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test with different screen sizes

## License

See the repository root for license information.
