/**
 * Demo State Store
 * 
 * In-memory storage for demo sessions with TTL cleanup.
 * Each session is isolated and tracks modifications as events.
 * 
 * Future: Can be extended to use Redis for multi-instance scalability.
 */

import { 
  DemoSession, 
  DemoSessionNotFoundError, 
  DemoSessionExpiredError 
} from './types';

export class DemoStateStore {
  private sessions: Map<string, DemoSession> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly cleanupIntervalMs = 60000; // Check every minute

  constructor() {
    this.startCleanupTimer();
  }

  /**
   * Store a demo session
   */
  set(sessionId: string, session: DemoSession): void {
    this.sessions.set(sessionId, session);
  }

  /**
   * Retrieve a demo session
   * @throws {DemoSessionNotFoundError} if session doesn't exist
   * @throws {DemoSessionExpiredError} if session has expired
   */
  get(sessionId: string): DemoSession {
    const session = this.sessions.get(sessionId);
    
    if (session === undefined) {
      throw new DemoSessionNotFoundError(sessionId);
    }

    // Check expiration
    if (this.isExpired(session)) {
      this.delete(sessionId);
      throw new DemoSessionExpiredError(sessionId);
    }

    // Update last accessed time
    session.lastAccessedAt = new Date();
    
    return session;
  }

  /**
   * Check if a session exists and is valid
   */
  has(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session === undefined) {
      return false;
    }
    
    if (this.isExpired(session)) {
      this.delete(sessionId);
      return false;
    }
    
    return true;
  }

  /**
   * Delete a demo session
   */
  delete(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions (for debugging/monitoring)
   */
  getAllSessions(): DemoSession[] {
    return Array.from(this.sessions.values()).filter(
      session => !this.isExpired(session)
    );
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clear all sessions (useful for testing)
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Check if session has expired
   */
  private isExpired(session: DemoSession): boolean {
    return new Date() > session.expiresAt;
  }

  /**
   * Start periodic cleanup of expired sessions
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);

    // Don't prevent Node from exiting (only relevant in Node.js, not browser)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison, @typescript-eslint/no-explicit-any
    if (this.cleanupInterval !== null && 'unref' in (this.cleanupInterval as any)) {
      (this.cleanupInterval as any).unref();
    }
  }

  /**
   * Remove expired sessions from memory
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[DemoStateStore] Cleaned up ${cleanedCount} expired session(s)`);
    }
  }

  /**
   * Stop cleanup timer (for graceful shutdown)
   */
  stopCleanup(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get store statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = new Date();
    const activeSessions = sessions.filter(s => s.expiresAt > now);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      oldestSession: sessions.length > 0 
        ? new Date(Math.min(...sessions.map(s => s.createdAt.getTime())))
        : null,
      newestSession: sessions.length > 0
        ? new Date(Math.max(...sessions.map(s => s.createdAt.getTime())))
        : null
    };
  }
}

// Singleton instance
let storeInstance: DemoStateStore | null = null;

/**
 * Get the singleton demo state store instance
 */
export function getDemoStateStore(): DemoStateStore {
  storeInstance ??= new DemoStateStore();
  return storeInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetDemoStateStore(): void {
  if (storeInstance !== null) {
    storeInstance.stopCleanup();
    storeInstance.clear();
  }
  storeInstance = null;
}
