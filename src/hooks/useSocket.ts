/**
 * useSocket.ts — Sprint 3: Minimal Socket.IO client hook
 *
 * The socket is authenticated via the JWT access token stored in localStorage.
 * It connects lazily once the user is logged in and disconnects on logout.
 * 
 * Usage:
 *   const socket = useSocket();
 *   useEffect(() => {
 *     if (!socket) return;
 *     socket.on('notification', handler);
 *     return () => { socket.off('notification', handler); };
 *   }, [socket]);
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SERVER_URL = (() => {
  const base = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5002/api';
  // Strip trailing /api so we connect to the root socket path
  return base.replace(/\/api\/?$/, '');
})();

/** Returns a connected Socket.IO socket (null while not authenticated). */
export function useSocket(): Socket | null {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Disconnect if user logged out
    if (!user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      return;
    }

    // Don't reconnect if already connected
    if (socketRef.current?.connected) return;

    const token = localStorage.getItem('accessToken');

    const s = io(SERVER_URL, {
      auth: { token: token ?? '' },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = s;

    s.on('connect', () => setSocket(s));
    s.on('disconnect', () => setSocket(null));

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [user]);

  return socket;
}
