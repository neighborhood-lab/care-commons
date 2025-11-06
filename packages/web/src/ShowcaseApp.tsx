/**
 * Showcase App Entry Point
 *
 * This is the entry point for the GitHub Pages showcase demo.
 * It wraps the main App with the ShowcaseApiProvider to enable
 * in-browser demo mode without requiring a backend server.
 */

import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ApiProviderProvider, getApiProviderConfigFromEnv } from './core/providers';
import { ShowcaseControls } from './core/components/showcase';
import { ShowcaseRouter } from './showcase/ShowcaseRouter';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ShowcaseApp() {
  const config = getApiProviderConfigFromEnv();

  return (
    <QueryClientProvider client={queryClient}>
      <ApiProviderProvider config={config}>
        <BrowserRouter basename="/care-commons">
          <ShowcaseControls />
          <ShowcaseRouter />
          <Toaster position="top-right" />
        </BrowserRouter>
      </ApiProviderProvider>
    </QueryClientProvider>
  );
}

export default ShowcaseApp;
