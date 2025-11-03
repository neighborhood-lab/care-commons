/**
 * Vercel Serverless Function Entry Point
 * 
 * Imports from compiled dist/ directories for serverless deployment
 */

import { createApp } from '../packages/app/dist/src/server.js';
import type { Request, Response } from 'express';

// Cache the initialized app across invocations (warm starts)
let app: Awaited<ReturnType<typeof createApp>> | null = null;
let initializationPromise: Promise<Awaited<ReturnType<typeof createApp>>> | null = null;

async function getApp() {
  if (app !== null) return app;
  if (initializationPromise !== null) return initializationPromise;
  
  initializationPromise = createApp();
  app = await initializationPromise;
  initializationPromise = null;
  
  return app;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
