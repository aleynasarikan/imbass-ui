/**
 * socket.ts — Sprint 3: Minimal Socket.IO manager
 *
 * Architecture:
 *  - One Socket.IO server wraps the HTTP server.
 *  - Authenticated clients JOIN a personal room keyed by userId.
 *  - Events emitted via `emitTo(userId, event, payload)` arrive only at
 *    that user's browser tab(s) — no broadcast to others.
 *  - Auth: clients must send `?token=<accessToken>` on the WS handshake.
 *    We verify it with the same JWT secret used by the REST layer.
 */

import { Server as HttpServer } from 'http';
import { Server as IOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: IOServer | null = null;

/** Call once during server bootstrap, passing the raw http.Server instance. */
export function initSocket(httpServer: HttpServer): IOServer {
  io = new IOServer(httpServer, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        process.env.FRONTEND_URL ?? '',
      ].filter(Boolean),
      credentials: true,
    },
    // Keep pings aggressive to detect stale connections quickly
    pingTimeout: 10_000,
    pingInterval: 25_000,
  });

  // ── Auth middleware ──────────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth as Record<string, string>)?.token ??
      (socket.handshake.query as Record<string, string>)?.token;

    if (!token) {
      // Allow unauthenticated connections but they get no private room
      (socket as any).userId = null;
      return next();
    }

    try {
      const secret = process.env.JWT_SECRET ?? 'dev-secret';
      const payload = jwt.verify(token, secret) as { id: string };
      (socket as any).userId = payload.id;
      next();
    } catch {
      // Expired or invalid — still allow (just no private room)
      (socket as any).userId = null;
      next();
    }
  });

  // ── Connection handler ───────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const userId: string | null = (socket as any).userId;

    if (userId) {
      // Each user joins their personal room → server can target them by id
      socket.join(`user:${userId}`);
    }

    socket.on('disconnect', () => {
      // Nothing to clean up — Socket.IO handles room membership automatically
    });
  });

  console.log('[socket.io] Server initialised');
  return io;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public emit helpers — call these from services/controllers
// ──────────────────────────────────────────────────────────────────────────────

export type SocketEvent =
  | 'notification'         // new notification pushed to a user
  | 'negotiation:update'   // negotiation status/event changed
  | 'milestone:update';    // milestone status changed

/**
 * Emit an event to all browser tabs belonging to a specific user.
 * No-op when Socket.IO hasn't been initialised (e.g. test environment).
 */
export function emitTo(userId: string, event: SocketEvent, payload: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}
