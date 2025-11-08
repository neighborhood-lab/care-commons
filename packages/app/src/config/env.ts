/**
 * Environment Configuration
 * 
 * Centralized, validated environment variable configuration using Zod.
 * All environment variables are validated at startup to fail fast.
 */

import { z } from 'zod';

/**
 * Environment schema with validation rules
 */
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().positive().default(3000),
  
  // Database - Either DATABASE_URL or individual components required
  DATABASE_URL: z.string().min(1).optional(),
  DB_HOST: z.string().min(1).optional(),
  DB_PORT: z.coerce.number().positive().optional(),
  DB_NAME: z.string().min(1).optional(),
  DB_USER: z.string().min(1).optional(),
  DB_PASSWORD: z.string().min(1).optional(),
  DB_SSL: z.string().optional().transform(val => val === 'true'),
  
  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters for security'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // External Services (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Vercel (automatically set in Vercel environment)
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  VERCEL_URL: z.string().optional(),
}).transform((data) => ({
  ...data,
  CORS_ORIGINS: data.CORS_ORIGINS.split(',').map(origin => origin.trim()),
})).refine(
  (data) => {
    // Either DATABASE_URL or all individual DB variables must be present
    if (data.DATABASE_URL !== null && data.DATABASE_URL !== undefined && data.DATABASE_URL.length > 0) {
      return true;
    }
    return data.DB_HOST !== null && data.DB_HOST !== undefined && data.DB_HOST.length > 0 &&
           data.DB_NAME !== null && data.DB_NAME !== undefined && data.DB_NAME.length > 0 &&
           data.DB_USER !== null && data.DB_USER !== undefined && data.DB_USER.length > 0 &&
           data.DB_PASSWORD !== null && data.DB_PASSWORD !== undefined && data.DB_PASSWORD.length > 0;
  },
  {
    message: 'Either DATABASE_URL or all individual database variables (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) must be provided',
  }
);

/**
 * Validated environment configuration
 * Exported as a typed object for use throughout the application
 */
export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Load and validate environment variables
 * Call this once at application startup
 * 
 * @throws {z.ZodError} If environment validation fails
 */
export function loadEnv(): Env {
  if (validatedEnv !== null && validatedEnv !== undefined) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error('');
      
      for (const issue of error.issues) {
        const path = issue.path.join('.');
        console.error(`  • ${path}: ${issue.message}`);
      }
      
      console.error('');
      console.error('Please check your .env file and ensure all required variables are set correctly.');
      console.error('See .env.example for reference.');
    }
    
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Must call loadEnv() first at application startup
 * 
 * @throws {Error} If loadEnv() has not been called
 */
export function getEnv(): Env {
  if (validatedEnv === null || validatedEnv === undefined) {
    throw new Error('Environment not loaded. Call loadEnv() at application startup.');
  }
  return validatedEnv;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}
