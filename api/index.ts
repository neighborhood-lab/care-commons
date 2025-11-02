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

// Import the Express app creator from copied dist files
// These are copied during vercel:build process
// @ts-ignore - This directory is created during build
import { createApp } from './_server/server.js';

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
    console.error('Handler error during initialization:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Environment check:', {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      nodeEnv: process.env.NODE_ENV,
    });
    
    // Return error response
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
}
