# @care-commons/shared-components

Platform-agnostic React components for Care Commons applications.

## Overview

This package provides reusable UI components that work across web (Vite/React) and future mobile (React Native) applications. Components are built with:

- **Platform Independence**: No platform-specific dependencies
- **Type Safety**: Full TypeScript support
- **Accessibility**: WCAG 2.1 AA compliant
- **Flexibility**: Composable and customizable

## Components

### Core Components

- **Button**: Primary UI action component with variants, sizes, and loading states
- **Input**: Text input with label, error, and helper text support
- **Card**: Container component with header, content, and footer sections
- **Badge**: Status and label indicators

### Usage

```tsx
import { Button, Input, Card, Badge } from '@care-commons/shared-components';

function MyComponent() {
  return (
    <Card>
      <Card.Header title="Form Example" />
      <Card.Content>
        <Input label="Name" required />
        <Button variant="primary">Submit</Button>
      </Card.Content>
    </Card>
  );
}
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm run test

# Lint
npm run lint
```

## Architecture

Components follow these principles:

1. **No Platform Dependencies**: Only React and minimal utility libraries
2. **Styling Flexibility**: Accepts className for custom styling
3. **Forward Refs**: All input components support refs
4. **Type Safety**: Comprehensive TypeScript interfaces
5. **Accessibility**: Proper ARIA attributes and semantic HTML

## Integration

### Web (Vite)

The web package already uses TailwindCSS for styling. Shared components accept `className` props that work seamlessly with Tailwind.

### Mobile (Future React Native)

Components are designed to be wrapped with React Native equivalents while maintaining the same API surface.
