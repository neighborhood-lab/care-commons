import { getCacheService } from '../service/cache.service.js';

export class AccountLockoutService {
  private static MAX_ATTEMPTS = 5;
  private static LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

  static async recordFailedAttempt(email: string): Promise<{ locked: boolean; remaining: number }> {
    const cache = getCacheService();
    const key = `lockout:${email}`;

    const attempts = (await cache.get<number>(key)) ?? 0;
    const newAttempts = attempts + 1;

    await cache.set(key, newAttempts, this.LOCKOUT_DURATION);

    const locked = newAttempts >= this.MAX_ATTEMPTS;

    if (locked) {
      await cache.set(`locked:${email}`, true, this.LOCKOUT_DURATION);
    }

    return {
      locked,
      remaining: Math.max(0, this.MAX_ATTEMPTS - newAttempts),
    };
  }

  static async isLocked(email: string): Promise<boolean> {
    const cache = getCacheService();
    const locked = await cache.get<boolean>(`locked:${email}`);
    return locked === true;
  }

  static async clearAttempts(email: string): Promise<void> {
    const cache = getCacheService();
    await cache.del(`lockout:${email}`);
    await cache.del(`locked:${email}`);
  }
}
