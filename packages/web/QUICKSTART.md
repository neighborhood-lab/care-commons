# Quick Start Guide

Get the Care Commons web UI running in under 5 minutes.

## Prerequisites

Ensure you have:

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL database running (for the backend)

## Step 1: Install Dependencies

From the repository root:

```bash
npm install
```

This installs all dependencies for all workspaces.

## Step 2: Set Up Environment

Create environment file for the web package:

```bash
cd packages/web
cp .env.example .env
```

The default configuration assumes the backend API runs at
`http://localhost:3000`.

## Step 3: Start the Backend API (if not running)

In a separate terminal, start the backend:

```bash
# From repository root
npm run dev:server
```

The backend API will start at `http://localhost:3000`.

## Step 4: Start the Web UI

Start the Vite development server:

```bash
# From repository root
npm run dev:web

# Or from packages/web
cd packages/web
npm run dev
```

The web UI will be available at `http://localhost:5173`.

## Step 5: Login

Open `http://localhost:5173` in your browser.

Use the demo credentials shown on the login page:

- **Admin**: admin@example.com / password123
- **Coordinator**: coordinator@example.com / password123
- **Caregiver**: caregiver@example.com / password123

Note: These are placeholder credentials. You'll need to implement actual
authentication on the backend.

## What's Available

### Implemented Features

- **Authentication Flow**: Login/logout with protected routes
- **Dashboard**: Role-based dashboard with stats and activity feed
- **Clients Module**:
  - Client list with search and filters
  - Client detail view
  - Client cards with contact information
  - Status badges

### Coming Soon

The following modules have placeholder pages ready for implementation:

- Caregivers management
- Scheduling & visits
- Care plans & tasks
- Time tracking (EVV)
- Billing & invoicing
- Settings

## Project Structure

```
packages/web/
├── src/
│   ├── core/          # Shared components, hooks, services
│   ├── verticals/     # Feature modules (clients, etc.)
│   ├── app/          # Application shell (layout, nav)
│   ├── styles/       # Global styles and theme
│   ├── App.tsx       # Root component with routing
│   └── main.tsx      # Entry point
```

## Development Tips

### Hot Reload

Vite provides instant hot module replacement. Changes to components will reflect
immediately without losing state.

### API Proxy

The dev server proxies `/api/*` requests to `http://localhost:3000`
automatically. No CORS issues during development.

### TypeScript

The project uses strict TypeScript. Run type checking:

```bash
npm run typecheck
```

### Linting

Check code style:

```bash
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Component Development

Components are organized by feature:

1. **Core components** (`src/core/components/`) - Reusable across the app
2. **Vertical components** (`src/verticals/*/components/`) - Feature-specific
3. **App components** (`src/app/components/`) - Layout and navigation

### Adding a New Page

1. Create page component in appropriate vertical
2. Add route in `src/App.tsx`
3. Update navigation in `src/app/components/Sidebar.tsx` (if needed)

### State Management

- **Server State**: React Query (TanStack Query)
- **Auth State**: Zustand (persisted to localStorage)
- **Form State**: React Hook Form
- **Local State**: React useState

## Troubleshooting

### Port Already in Use

If port 5173 is in use, Vite will automatically try the next available port.

### API Connection Issues

Ensure the backend is running at `http://localhost:3000`. Check
`VITE_API_BASE_URL` in `.env`.

### TypeScript Errors

Run `npm install` to ensure all types are installed. Check `tsconfig.json` for
path aliases.

### Build Errors

Clear Vite cache:

```bash
rm -rf node_modules/.vite
npm run dev
```

## Next Steps

1. **Implement Backend API**: The frontend expects REST endpoints at `/api/*`
2. **Add Authentication**: Implement actual JWT-based authentication
3. **Create Remaining Verticals**: Build out care plans, scheduling, billing,
   etc.
4. **Add Tests**: Write component and integration tests with Vitest
5. **Deploy**: Build for production with `npm run build`

## Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)

## Getting Help

- Check the main README.md for architecture details
- Review CONTRIBUTING.md for code standards
- Look at existing components for patterns
- The `client-demographics` vertical is a complete reference implementation

Happy coding!
