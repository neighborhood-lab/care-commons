/**
 * Cloudflare Worker Entry Point
 * 
 * Adapter that runs Express application on Cloudflare Workers
 * Uses @cloudflare/workers-web-api for Request/Response compatibility
 */

import { createApp } from '../packages/app/dist/src/server.js';
import type { ExecutionContext } from '@cloudflare/workers-types';

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

/**
 * Convert Cloudflare Worker Request to Express-compatible request
 */
function convertRequest(request: Request): any {
  const url = new URL(request.url);
  
  return {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.body,
    get(header: string) {
      return request.headers.get(header);
    }
  };
}

/**
 * Cloudflare Worker fetch handler
 */
export default {
  async fetch(
    request: Request,
    env: Record<string, any>,
    _ctx: ExecutionContext
  ): Promise<Response> {
    try {
      // Inject Cloudflare environment into process.env for compatibility
      // This allows our Express app to access secrets via process.env
      if (env) {
        Object.keys(env).forEach(key => {
          if (typeof env[key] === 'string') {
            process.env[key] = env[key];
          }
        });
      }

      // Get Express app
      const expressApp = await getApp();
      
      // Create a promise to capture Express response
      return new Promise<Response>((resolve, reject) => {
        const chunks: Uint8Array[] = [];
        let statusCode = 200;
        let headers: Record<string, string> = {};
        
        // Mock response object for Express
        const mockRes: any = {
          statusCode: 200,
          statusMessage: 'OK',
          headersSent: false,
          
          status(code: number) {
            statusCode = code;
            return this;
          },
          
          setHeader(name: string, value: string) {
            headers[name.toLowerCase()] = value;
            return this;
          },
          
          getHeader(name: string) {
            return headers[name.toLowerCase()];
          },
          
          removeHeader(name: string) {
            delete headers[name.toLowerCase()];
            return this;
          },
          
          write(chunk: any) {
            if (typeof chunk === 'string') {
              chunks.push(new TextEncoder().encode(chunk));
            } else {
              chunks.push(chunk);
            }
            return true;
          },
          
          end(data?: any) {
            if (data) {
              this.write(data);
            }
            
            // Combine chunks
            let body: Uint8Array | string;
            if (chunks.length > 0) {
              const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
              body = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of chunks) {
                body.set(chunk, offset);
                offset += chunk.length;
              }
            } else {
              body = new Uint8Array(0);
            }
            
            // Create Response
            const response = new Response(body, {
              status: statusCode,
              headers: new Headers(headers)
            });
            
            resolve(response);
          },
          
          json(data: any) {
            this.setHeader('content-type', 'application/json');
            this.end(JSON.stringify(data));
          },
          
          send(data: any) {
            if (typeof data === 'object') {
              this.json(data);
            } else {
              this.end(data);
            }
          }
        };
        
        // Convert Cloudflare request to Express request
        const mockReq = convertRequest(request);
        
        // Call Express handler
        try {
          expressApp(mockReq, mockRes);
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  },
  
  /**
   * Scheduled handler for cron triggers
   * Used for background tasks like EVV submission retries
   */
  async scheduled(
    event: ScheduledEvent,
    _env: Record<string, any>,
    _ctx: ExecutionContext
  ): Promise<void> {
    // TODO: Implement background job processing
    // - EVV submission retries
    // - Data cleanup
    // - Report generation
    console.log('Scheduled event:', event.cron);
  }
};

// Type for Cloudflare scheduled events
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}
