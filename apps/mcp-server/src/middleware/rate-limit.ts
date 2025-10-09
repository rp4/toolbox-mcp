/**
 * Rate limiting middleware for AuditToolbox MCP Server
 */

import rateLimit from 'express-rate-limit';
import { RateLimitError } from '../utils/errors.js';
import { logRateLimit } from './logger.js';

/**
 * SSE connection rate limiter (per IP)
 * Prevents connection flooding attacks
 */
export const sseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 SSE connections per IP per window
  message: { error: 'Too many connections, please try again later' },
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  handler: (req, res) => {
    logRateLimit('sse', req.ip || 'unknown');
    res.status(429).json({
      error: 'Too many connections',
      retryAfter: 900, // 15 minutes in seconds
    });
  },
});

/**
 * Session-based rate limiter for tool invocations
 * Prevents rapid-fire abuse within a single session
 */
interface SessionLimit {
  count: number;
  resetAt: number;
  totalCount: number; // Lifetime count for this session
}

export class SessionRateLimiter {
  private sessions = new Map<string, SessionLimit>();

  constructor(
    private maxPerMinute: number = 30,
    private maxPerSession: number = 100
  ) {
    // Cleanup expired sessions every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Check if session can make a request
   * @returns true if allowed, false if rate limited
   */
  check(sessionId: string): boolean {
    const now = Date.now();
    let session = this.sessions.get(sessionId);

    // Create or reset session if needed
    if (!session || now > session.resetAt) {
      session = {
        count: 0,
        resetAt: now + 60000, // Reset in 1 minute
        totalCount: session?.totalCount || 0,
      };
      this.sessions.set(sessionId, session);
    }

    // Check per-minute limit
    if (session.count >= this.maxPerMinute) {
      logRateLimit('tool', sessionId);
      return false;
    }

    // Check session lifetime limit
    if (session.totalCount >= this.maxPerSession) {
      logRateLimit('tool', sessionId);
      return false;
    }

    // Allow request and increment counters
    session.count++;
    session.totalCount++;
    return true;
  }

  /**
   * Get time until rate limit resets for a session
   */
  getRetryAfter(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) return 0;

    const now = Date.now();
    if (now > session.resetAt) return 0;

    return Math.ceil((session.resetAt - now) / 1000); // seconds
  }

  /**
   * Get session statistics
   */
  getSessionStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        currentCount: 0,
        totalCount: 0,
        remaining: this.maxPerMinute,
        resetAt: null,
      };
    }

    const now = Date.now();
    const isExpired = now > session.resetAt;

    return {
      currentCount: isExpired ? 0 : session.count,
      totalCount: session.totalCount,
      remaining: isExpired ? this.maxPerMinute : this.maxPerMinute - session.count,
      resetAt: new Date(session.resetAt),
    };
  }

  /**
   * Cleanup expired sessions
   */
  private cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      // Remove sessions that haven't been used in 1 hour
      if (now > session.resetAt + 60 * 60 * 1000) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.error(`Rate limiter: Cleaned up ${cleaned} expired sessions`);
    }
  }

  /**
   * Remove a session (called when connection closes)
   */
  removeSession(sessionId: string) {
    this.sessions.delete(sessionId);
  }
}

/**
 * Global instance for tool invocation rate limiting
 */
export const toolRateLimiter = new SessionRateLimiter(30, 100);

/**
 * Middleware to check tool invocation rate limit
 */
export function checkToolRateLimit(sessionId: string): void {
  if (!toolRateLimiter.check(sessionId)) {
    const retryAfter = toolRateLimiter.getRetryAfter(sessionId);
    throw new RateLimitError(retryAfter, 'invocation');
  }
}
