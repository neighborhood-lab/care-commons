/**
 * Vercel Serverless Function Entry Point
 * 
 * This handler wraps the Express app to work with Vercel's serverless functions.
 * The Express app is initialized once and reused across requests (warm starts).
 * 
 * Security:
 * - Helmet CSP is properly configured in server.ts (not disabled)
 * - CORS is restricted to allowed origins in production
 * - No wildcard origins in production mode
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Import the Express app creator (will be compiled before deployment)
// @ts-ignore - This file is generated during build
import { createApp } from '../packages/app/dist/server.js';

// Cache the initialized app across invocations
let app: any = null;
let initializationPromise: Promise<any> | null = null;

/**
 * Initialize the Express app (once per cold start)
 */
async function getApp(): Promise<any> {
  // If already initialized, return it
  if (app !== null) {
    return app;
  }

  // If initialization is in progress, wait for it
  if (initializationPromise !== null) {
    return initializationPromise;
  }

  // Initialize the app (which has security middleware configured)
  initializationPromise = createApp();
  app = await initializationPromise;
  initializationPromise = null;

  return app;
}

/**
 * Vercel serverless function handler
 * 
 * Note: Security middleware (Helmet, CORS) is configured in the Express app
 * created by createApp(). This handler simply forwards requests to that app.
 */
export default async function handler(
  req: any,
  res: any
): Promise<void> {
  try {
    // Get or initialize the Express app (with security middleware)
    const expressApp = await getApp();

    // Handle the request with Express
    // Security headers and CORS are applied by the Express app
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    
    // Return error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'An error occurred while processing your request'
    });
  }
}
