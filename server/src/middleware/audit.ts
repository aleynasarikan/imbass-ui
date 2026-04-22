import { Request, Response, NextFunction } from 'express';
import { logAction } from '../services/auditLogService';
import { AuthRequest } from '../types';

export const auditMiddleware = (actionName: string, entityType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // We capture the old res.json to log after successful response
    const originalJson = res.json;
    res.json = function (body) {
      // Fire and forget log after responding
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = (req as AuthRequest).user?.id || null;
        // Optionally extract an entityId from params or body
        const entityId = req.params.id || req.params.slug || (body && body.id) || null;
        const ip = req.ip || req.connection.remoteAddress || null;
        logAction(userId, actionName, entityType, entityId, req.body, ip);
      }
      return originalJson.call(this, body);
    };
    next();
  };
};
